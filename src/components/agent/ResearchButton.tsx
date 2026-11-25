"use client";

import { useState } from "react";
import { getAiKey } from "@/lib/store";
import { useAiConnected } from "@/lib/hooks/useAiConnected";
import { agentModel, applyUpdates, buildSnapshot } from "@/lib/agent/apply";
import type { AgentUpdates } from "@/lib/agent/schema";

type Props = {
  focus?: "all" | "nutrition" | "training";
  label?: string;
  className?: string;
};

/** Kicks off a deep web-research pass (Phase D). Applies what it finds + shows sources. */
export function ResearchButton({ focus = "all", label = "🔬 Research my optimal plan", className }: Props) {
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [changed, setChanged] = useState<string[]>([]);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const connected = useAiConnected();

  async function run() {
    if (!connected) {
      setError("No Claude key found — add it in Settings or your .env.local.");
      return;
    }
    setBusy(true);
    setError(null);
    setReply(null);
    setChanged([]);
    setSources([]);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: buildSnapshot(), apiKey: getAiKey(), model: agentModel(), focus }),
      });
      const j = (await res.json()) as { error?: string; reply?: string; updates?: AgentUpdates; sources?: { title: string; url: string }[] };
      if (j.error) {
        setError(j.error);
        return;
      }
      if (j.updates) setChanged(applyUpdates(j.updates));
      setReply(j.reply ?? "Done.");
      setSources(j.sources ?? []);
    } catch {
      setError("Couldn't reach research. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button type="button" onClick={run} disabled={busy} className="btn btn-matcha text-sm disabled:opacity-70">
        {busy ? "Researching the web…" : label}
      </button>

      {reply && <p className="mt-3 text-sm font-medium text-ink">{reply}</p>}

      {changed.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {changed.map((c) => (
            <span key={c} className="chip chip-matcha">{c}</span>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-3">
          <p className="kicker mb-1.5">Sources</p>
          <ul className="space-y-1">
            {sources.map((s) => (
              <li key={s.url} className="truncate text-xs">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-strawberry underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-strawberry">{error}</p>}
    </div>
  );
}
