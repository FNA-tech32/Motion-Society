"use client";

import { useEffect, useRef, useState } from "react";
import { isAiConnected } from "@/lib/store";

/**
 * True when a Claude key is available EITHER pasted in the app (localStorage)
 * OR present in server env (.env.local / Vercel via /api/config). Lets you skip
 * the in-app key step and just use `ANTHROPIC_API_KEY`.
 */
export function useAiConnected(): boolean {
  const [connected, setConnected] = useState(false);
  const serverAi = useRef(false);

  useEffect(() => {
    let alive = true;
    const recompute = () => {
      if (alive) setConnected(isAiConnected() || serverAi.current);
    };
    (async () => {
      try {
        const res = await fetch("/api/config", { cache: "no-store" });
        const json = (await res.json()) as { ai?: boolean };
        serverAi.current = Boolean(json.ai);
      } catch {
        // ignore — fall back to local key only
      }
      recompute();
    })();
    window.addEventListener("baseline:change", recompute);
    return () => {
      alive = false;
      window.removeEventListener("baseline:change", recompute);
    };
  }, []);

  return connected;
}
