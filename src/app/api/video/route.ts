import Anthropic from "@anthropic-ai/sdk";
import {
  APPLY_TOOL,
  buildVideoPrompt,
  sanitizeUpdates,
  type AgentSnapshot,
  type AgentUpdates,
} from "@/lib/agent/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Matches MAX_FRAMES in lib/video/frames.ts — enforced again here, on the trust boundary. */
const MAX_FRAMES = 8;
const MAX_FRAME_CHARS = 2_000_000; // ~1.5 MB of base64 per frame

interface Body {
  snapshot: AgentSnapshot;
  apiKey?: string;
  model?: string;
  /** Base64 JPEGs, chronological. Present for uploads. */
  frames?: string[];
  /** A video URL. Present for links. */
  link?: string;
  /** What he typed alongside the video. */
  note?: string;
  sourceLabel?: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
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
  if (!apiKey) {
    return Response.json({ error: "No AI key — add your Claude key in Settings." }, { status: 401 });
  }
  if (!body.snapshot?.profile) {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const link = body.link?.trim();
  const frames = (body.frames ?? []).slice(0, MAX_FRAMES);
  const isUpload = frames.length > 0;

  if (!isUpload && !link) {
    return Response.json({ error: "Give me a video file or a link." }, { status: 400 });
  }
  if (link && !isUpload && !isHttpUrl(link)) {
    return Response.json({ error: "That doesn't look like a link." }, { status: 400 });
  }
  if (frames.some((f) => typeof f !== "string" || f.length > MAX_FRAME_CHARS)) {
    return Response.json({ error: "Those frames are too large." }, { status: 413 });
  }

  const note = (body.note ?? "").trim().slice(0, 600);
  const kind = isUpload ? "upload" : "link";

  // Uploads are analyzed from pixels; links are analyzed from whatever the page says.
  const content: Anthropic.MessageParam["content"] = isUpload
    ? [
        ...frames.map((data, i) => [
          { type: "text" as const, text: `Frame ${i + 1} of ${frames.length}:` },
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
          },
        ]).flat(),
        {
          type: "text" as const,
          text: note
            ? `These frames are from my video. What I want: ${note}`
            : "These frames are from my training video. Check my form and add what I should work on.",
        },
      ]
    : [
        {
          type: "text" as const,
          text: note
            ? `Analyze this training video: ${link}\n\nWhat I want: ${note}`
            : `Analyze this training video and add what's useful to my plan: ${link}`,
        },
      ];

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: 2500,
      system: buildVideoPrompt(body.snapshot, kind),
      tools: isUpload
        ? [APPLY_TOOL as never]
        : // web_search is an Anthropic server tool — it fetches the page for us.
          [{ type: "web_search_20250305", name: "web_search", max_uses: 4 } as never, APPLY_TOOL as never],
      messages: [{ role: "user", content }],
    });

    const sources: { title: string; url: string }[] = [];
    let applyInput: AgentUpdates | null = null;
    let textReply = "";

    for (const block of res.content) {
      const b = block as unknown as { type: string; [k: string]: unknown };
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content as { type?: string; url?: string; title?: string }[]) {
          if (r?.type === "web_search_result" && r.url) sources.push({ title: r.title ?? r.url, url: r.url });
        }
      } else if (b.type === "tool_use" && b.name === "apply") {
        applyInput = b.input as AgentUpdates;
      } else if (b.type === "text") {
        textReply += b.text as string;
      }
    }

    // No apply call is a legitimate outcome: the prompt tells it to withhold a
    // workout when the video is unsafe or isn't training at all.
    const updates = applyInput
      ? sanitizeUpdates(applyInput)
      : { reply: textReply.trim() || "I watched it, but couldn't turn it into anything useful — try another clip." };

    const seen = new Set<string>();
    const uniqueSources = sources.filter((s) => !seen.has(s.url) && seen.add(s.url)).slice(0, 6);

    return Response.json({
      ok: true,
      reply: updates.reply,
      updates,
      sources: uniqueSources,
      sourceKind: kind,
      sourceLabel: body.sourceLabel?.slice(0, 120) || link || "video",
    });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    const msg =
      status === 401
        ? "That key didn't work — check Settings."
        : status === 429
          ? "Rate-limited — try again shortly."
          : status === 413
            ? "That video was too big to analyze — try a shorter clip."
            : "Couldn't analyze that video — try again.";
    return Response.json({ error: msg }, { status: 200 });
  }
}
