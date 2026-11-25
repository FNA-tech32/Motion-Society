"use client";

import { useRef, useState, type DragEvent } from "react";
import { getAiKey } from "@/lib/store";
import { useAiConnected } from "@/lib/hooks/useAiConnected";
import { agentModel, applyUpdates, buildSnapshot } from "@/lib/agent/apply";
import type { AgentUpdates } from "@/lib/agent/schema";
import { MAX_FRAMES, sampleFrames } from "@/lib/video/frames";

type Tab = "upload" | "link";
type Source = { title: string; url: string };

interface VideoResponse {
  error?: string;
  reply?: string;
  updates?: AgentUpdates;
  sources?: Source[];
  sourceKind?: "upload" | "link";
  sourceLabel?: string;
}

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Give the coach a video. Uploads are sampled into frames in the browser and
 * analyzed with vision; links are read by the research agent. Either way, what
 * comes back is an addon block on today's plan plus whatever it learned.
 */
export function VideoCoach({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [changed, setChanged] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const connected = useAiConnected();

  const canRun = !busy && (tab === "upload" ? Boolean(file) : link.trim().length > 0);

  function reset() {
    setError(null);
    setReply(null);
    setChanged([]);
    setSources([]);
  }

  function chooseFile(next: File | null) {
    reset();
    if (next && !next.type.startsWith("video/")) {
      setError("That's not a video file.");
      return;
    }
    setFile(next);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function run() {
    if (!connected) {
      setError("No Claude key found — add it in Settings or your .env.local.");
      return;
    }
    reset();
    setBusy(true);

    try {
      let frames: string[] | undefined;
      let sourceLabel = link.trim();

      if (tab === "upload" && file) {
        setStatus(`Reading ${MAX_FRAMES} frames…`);
        const sampled = await sampleFrames(file);
        frames = sampled.frames;
        sourceLabel = file.name;
      }

      setStatus("Coach is watching…");
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: buildSnapshot(),
          apiKey: getAiKey(),
          model: agentModel(),
          frames,
          link: tab === "link" ? link.trim() : undefined,
          note: note.trim() || undefined,
          sourceLabel,
        }),
      });

      const j = (await res.json()) as VideoResponse;
      if (j.error) {
        setError(j.error);
        return;
      }
      if (j.updates) {
        setChanged(applyUpdates(j.updates, { kind: j.sourceKind ?? tab, label: j.sourceLabel ?? sourceLabel }));
      }
      setReply(j.reply ?? "Done.");
      setSources(j.sources ?? []);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't analyze that video.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-1.5" role="tablist" aria-label="Video source">
        {(["upload", "link"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              reset();
            }}
            className={`chip transition-transform hover:-translate-y-0.5 ${tab === t ? "chip-matcha" : ""}`}
          >
            {t === "upload" ? "Upload" : "Link"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-3 cursor-pointer rounded-3xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? "border-matcha bg-matcha-soft/30" : "border-[var(--line)]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <p className="font-bold">{file.name}</p>
              <p className="mt-1 text-xs text-muted">{fmtSize(file.size)} · click to swap</p>
            </>
          ) : (
            <>
              <p className="font-bold">Drop a training video</p>
              <p className="mt-1 text-xs text-muted">
                It never leaves your device — only {MAX_FRAMES} still frames get sent.
              </p>
            </>
          )}
        </div>
      ) : (
        <input
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            reset();
          }}
          placeholder="https://youtube.com/watch?v=…"
          className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-surface px-4 py-3 text-sm outline-none focus:border-matcha"
        />
      )}

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional — what should it look for?"
        className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-surface px-4 py-3 text-sm outline-none focus:border-matcha"
      />

      <button
        type="button"
        onClick={run}
        disabled={!canRun}
        className="btn btn-primary mt-3 text-sm disabled:opacity-50"
      >
        {busy ? (status ?? "Working…") : "🎥 Analyze"}
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
