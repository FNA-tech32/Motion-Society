"use client";

import { useState } from "react";
import Link from "next/link";
import { addMemory, getAiKey } from "@/lib/store";
import { useAiConnected } from "@/lib/hooks/useAiConnected";
import { agentModel, applyUpdates, buildSnapshot } from "@/lib/agent/apply";
import type { AgentUpdates } from "@/lib/agent/schema";

type Step = { label: string; done: boolean };

/**
 * "Tell me anything" bar.
 *  - Not connected: whatever you type is saved to Memory immediately.
 *  - Connected: streams the Claude agent, which remembers AND auto-fills
 *    metrics / nutrition / profile / today's check-in across the app.
 */
export function CommandBar() {
  const [text, setText] = useState("");
  const connected = useAiConnected();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [reply, setReply] = useState<string | null>(null);
  const [changed, setChanged] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSteps([]);
    setReply(null);
    setChanged([]);
    setError(null);
  }

  function handleEvent(ev: { type: string; label?: string; status?: string; text?: string; message?: string; updates?: AgentUpdates }) {
    switch (ev.type) {
      case "step":
        setSteps((prev) => {
          if (ev.status === "done") return prev.map((s) => (s.label === ev.label ? { ...s, done: true } : s));
          return [...prev, { label: ev.label ?? "…", done: false }];
        });
        break;
      case "updates":
        if (ev.updates) setChanged(applyUpdates(ev.updates));
        break;
      case "answer":
        if (ev.text) setReply(ev.text);
        break;
      case "error":
        if (ev.message) setError(ev.message);
        break;
    }
  }

  async function runAgent(message: string) {
    setBusy(true);
    reset();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, snapshot: buildSnapshot(), apiKey: getAiKey(), model: agentModel() }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: "Something went wrong." }));
        setError(j.error ?? "Something went wrong.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line));
        }
      }
    } catch {
      setError("Couldn't reach the coach. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    if (connected) {
      void runAgent(t);
    } else {
      addMemory(t, "general", "you");
      reset();
      setReply("Saved to Memory ✓");
    }
  }

  return (
    <section className="card-pop bg-strawberry-soft/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="kicker flex items-center gap-2 text-strawberry">
          <Sparkle /> Tell me anything
        </span>
        {connected && <span className="chip chip-matcha">Claude connected</span>}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 pl-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          placeholder="I did 14 pull-ups today · I'm sore every Monday · plan my meals…"
          className="min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-muted disabled:opacity-60"
        />
        <button type="submit" disabled={busy} className="btn btn-primary shrink-0 !px-4 !py-2 text-sm disabled:opacity-60">
          {busy ? "…" : "Enter"}
        </button>
      </form>

      {(busy || steps.length > 0 || reply || error) && (
        <div className="mt-3 space-y-1.5 text-sm">
          {steps.map((s) => (
            <p key={s.label} className="font-mono text-xs text-muted">
              {s.done ? "✓" : "•"} {s.label}
            </p>
          ))}
          {reply && <p className="font-medium text-ink">{reply}</p>}
          {changed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {changed.map((c) => (
                <span key={c} className="chip chip-matcha">{c}</span>
              ))}
            </div>
          )}
          {error && <p className="text-strawberry">{error}</p>}
        </div>
      )}

      {!connected && !reply && !busy && (
        <p className="mt-3 text-xs text-muted">
          Saved to{" "}
          <Link href="/memory" className="font-bold text-strawberry underline">Memory</Link>.{" "}
          <Link href="/settings" className="font-bold text-strawberry underline">Add AI</Link>{" "}
          so it can auto-fill your whole dashboard from what you tell it.
        </p>
      )}
    </section>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
    </svg>
  );
}
