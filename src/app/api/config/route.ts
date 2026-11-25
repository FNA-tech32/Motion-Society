// Tells the client what the server already has configured, so the UI can treat
// the coach as "connected" when the Claude key lives in env (.env.local / Vercel)
// instead of being pasted in the app. Never returns the keys themselves.

export const runtime = "nodejs";

export async function GET() {
  const ai = Boolean(process.env.ANTHROPIC_API_KEY);
  const sync = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
  return Response.json({ ai, sync });
}
