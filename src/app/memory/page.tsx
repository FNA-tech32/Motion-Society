"use client";

import { useEffect, useState } from "react";
import type { MemoryCategory, MemoryFact, MemorySource } from "@/lib/types";
import { addMemory, bootstrap, deleteMemory, listMemory } from "@/lib/store";
import { Segmented } from "@/components/Segmented";
import { Reveal } from "@/components/Reveal";

const CATS: MemoryCategory[] = ["training", "nutrition", "schedule", "body", "preference", "general"];

const SRC_LABEL: Record<MemorySource, string> = { seed: "known", you: "you", ai: "AI" };
const SRC_CLASS: Record<MemorySource, string> = { seed: "chip", you: "chip chip-strawberry", ai: "chip chip-matcha" };

export default function MemoryPage() {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [text, setText] = useState("");
  const [cat, setCat] = useState<MemoryCategory>("general");

  useEffect(() => {
    bootstrap();
    setFacts(listMemory());
  }, []);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addMemory(text, cat, "you");
    setText("");
    setFacts(listMemory());
  }

  function remove(id: string) {
    deleteMemory(id);
    setFacts(listMemory());
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="kicker">What I know about you</p>
        <h1 className="display mt-1 text-5xl">Memory</h1>
        <p className="mt-2 text-sm text-muted">
          Everything here shapes your plans. Add facts anytime — or tell the AI and it writes them
          here automatically. Nothing is shared; it lives on your device.
        </p>
      </header>

      <form onSubmit={add} className="card space-y-3 p-4">
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I train best in the morning · my left wrist gets sore · I'm vegetarian"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c }))} />
          <button type="submit" className="btn btn-primary text-sm">
            Remember
          </button>
        </div>
      </form>

      <div className="space-y-2.5">
        {facts.map((f, i) => (
          <Reveal key={f.id} delay={i * 0.02}>
            <div className="card bouncy group flex items-center gap-3 px-4 py-3">
              <span className="chip chip-matcha shrink-0 capitalize">{f.category}</span>
              <span className="min-w-0 flex-1 text-sm">{f.text}</span>
              <span className={`${SRC_CLASS[f.source]} shrink-0`}>{SRC_LABEL[f.source]}</span>
              <button
                type="button"
                onClick={() => remove(f.id)}
                aria-label="Forget this"
                className="shrink-0 text-muted opacity-0 transition-opacity hover:text-strawberry group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </Reveal>
        ))}
        {facts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Nothing remembered yet.</p>
        )}
      </div>
    </div>
  );
}
