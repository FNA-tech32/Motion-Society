/**
 * Single-user cloud persistence. The client mirrors its whole local snapshot to
 * one key/row in whatever free backend is configured. The app state is just one
 * JSON blob, so this is backend-agnostic — it auto-detects, in order:
 *
 *   1. Upstash Redis  (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)  ← recommended, free
 *   2. Supabase       (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   3. none           → { configured: false }, app stays local-only
 *
 * All calls are server-only over REST (no client deps). Keys are never logged.
 */

export const runtime = "nodejs";

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ID = process.env.BASELINE_USER_ID || "me";
const REDIS_KEY = `baseline:${ID}`;

function backend(): "upstash" | "supabase" | null {
  if (UP_URL && UP_TOKEN) return "upstash";
  if (SB_URL && SB_KEY) return "supabase";
  return null;
}

// --- Upstash Redis (REST) --------------------------------------------------

async function upstashGet(): Promise<unknown> {
  const res = await fetch(`${UP_URL}/get/${encodeURIComponent(REDIS_KEY)}`, {
    headers: { Authorization: `Bearer ${UP_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: string | null };
  if (!json.result) return null;
  try {
    return JSON.parse(json.result);
  } catch {
    return null;
  }
}

async function upstashSet(data: unknown): Promise<boolean> {
  const res = await fetch(`${UP_URL}/set/${encodeURIComponent(REDIS_KEY)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  return res.ok;
}

// --- Supabase (PostgREST) --------------------------------------------------

function sbHeaders(): Record<string, string> {
  return { apikey: SB_KEY as string, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
}

async function supabaseGet(): Promise<unknown> {
  const res = await fetch(`${SB_URL}/rest/v1/baseline_state?id=eq.${ID}&select=data`, {
    headers: sbHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { data?: unknown }[];
  return rows?.[0]?.data ?? null;
}

async function supabaseSet(data: unknown): Promise<boolean> {
  const res = await fetch(`${SB_URL}/rest/v1/baseline_state`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id: ID, data: data ?? {}, updated_at: new Date().toISOString() }]),
  });
  return res.ok;
}

// --- handlers --------------------------------------------------------------

export async function GET() {
  const b = backend();
  if (!b) return Response.json({ configured: false, data: null });
  try {
    const data = b === "upstash" ? await upstashGet() : await supabaseGet();
    return Response.json({ configured: true, data });
  } catch {
    return Response.json({ configured: true, data: null });
  }
}

export async function PUT(req: Request) {
  const b = backend();
  if (!b) return Response.json({ configured: false });
  let body: { data?: unknown };
  try {
    body = (await req.json()) as { data?: unknown };
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  try {
    const ok = b === "upstash" ? await upstashSet(body.data) : await supabaseSet(body.data);
    return Response.json({ ok });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
