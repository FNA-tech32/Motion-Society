import Anthropic from "@anthropic-ai/sdk";
import {
  APPLY_TOOL,
  buildResearchPrompt,
  sanitizeUpdates,
  type AgentSnapshot,
  type AgentUpdates,
} from "@/lib/agent/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  snapshot: AgentSnapshot;
  apiKey?: string;
  model?: string;
  focus?: "all" | "nutrition" | "training";
  message?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  const model = body.model || process.env.BASELINE_MODEL || "claude-sonnet-5";
  const focus = body.focus ?? "all";
  if (!apiKey) return Response.json({ error: "No AI key — add your Claude key in Settings." }, { status: 401 });

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: 2500,
      system: buildResearchPrompt(body.snapshot, focus),
      // web_search is an Anthropic server tool (it runs the search); apply is our tool.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 } as any, APPLY_TOOL as any],
      messages: [
        {
          role: "user",
          content: body.message?.trim() || "Research and update my optimal training and nutrition.",
        },
      ],
    });

    const sources: { title: string; url: string }[] = [];
    let applyInput: AgentUpdates | null = null;
    let textReply = "";

    for (const block of res.content) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = block as any;
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content) {
          if (r?.type === "web_search_result" && r.url) sources.push({ title: r.title ?? r.url, url: r.url });
        }
      } else if (b.type === "tool_use" && b.name === "apply") {
        applyInput = b.input as AgentUpdates;
      } else if (b.type === "text") {
        textReply += b.text;
      }
    }

    const updates = applyInput
      ? sanitizeUpdates(applyInput)
      : { reply: textReply.trim() || "Researched, but couldn't finalize changes — try again." };

    const seen = new Set<string>();
    const uniqueSources = sources.filter((s) => !seen.has(s.url) && seen.add(s.url)).slice(0, 6);

    return Response.json({ ok: true, reply: updates.reply, updates, sources: uniqueSources });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    const msg =
      status === 401
        ? "That key didn't work — check Settings."
        : status === 429
          ? "Rate-limited — try again shortly."
          : "Research failed — try again.";
    return Response.json({ error: msg }, { status: 200 });
  }
}
