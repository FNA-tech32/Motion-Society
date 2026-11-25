import Anthropic from "@anthropic-ai/sdk";
import {
  APPLY_TOOL,
  buildSystemPrompt,
  sanitizeUpdates,
  type AgentSnapshot,
  type AgentUpdates,
} from "@/lib/agent/schema";

export const runtime = "nodejs";

interface Body {
  message: string;
  snapshot: AgentSnapshot;
  apiKey?: string;
  model?: string;
}

const jsonError = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError("Bad request.");
  }

  const message = (body.message ?? "").trim();
  const apiKey = body.apiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  const model = body.model || process.env.BASELINE_MODEL || "claude-sonnet-5";

  if (!message) return jsonError("Say something first.");
  if (!apiKey) return jsonError("No AI key — add your Claude key in Settings.", 401);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        emit({ type: "step", label: "Reading what you said", status: "running" });
        const client = new Anthropic({ apiKey });
        const res = await client.messages.create({
          model,
          max_tokens: 1024,
          system: buildSystemPrompt(body.snapshot),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [APPLY_TOOL as any],
          tool_choice: { type: "tool", name: "apply" },
          messages: [{ role: "user", content: message }],
        });
        emit({ type: "step", label: "Reading what you said", status: "done" });

        const block = res.content.find((b) => b.type === "tool_use");
        if (!block || block.type !== "tool_use") {
          emit({ type: "error", message: "I couldn't parse that — try rephrasing." });
          emit({ type: "done" });
          controller.close();
          return;
        }

        const updates = sanitizeUpdates(block.input as AgentUpdates);
        emit({ type: "updates", updates });
        emit({ type: "answer", text: updates.reply });
        emit({ type: "done" });
      } catch (err) {
        emit({ type: "error", message: friendly(err) });
        emit({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function friendly(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (status === 401) return "That key didn't work — double-check your Claude key in Settings.";
  if (status === 429) return "Claude is rate-limited right now — try again in a moment.";
  return "Something went wrong talking to Claude. Try again.";
}
