"use client";

import { useEffect } from "react";
import Link from "next/link";
import { bootstrap } from "@/lib/store";
import { useAiConnected } from "@/lib/hooks/useAiConnected";
import { CommandBar } from "@/components/agent/CommandBar";
import { ResearchButton } from "@/components/agent/ResearchButton";
import { VideoCoach } from "@/components/agent/VideoCoach";
import { Reveal } from "@/components/Reveal";

export default function CoachPage() {
  const connected = useAiConnected();

  useEffect(() => {
    bootstrap();
  }, []);

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="kicker">Your AI coach</p>
        <h1 className="display mt-1 text-5xl">Coach</h1>
        <p className="mt-2 text-sm text-muted">
          Tell it anything — a result, how you feel, a goal, a change. It remembers and updates
          your whole dashboard. Or send it to research your optimal plan from the web.
        </p>
      </header>

      {!connected && (
        <Reveal>
          <div className="card flex items-center justify-between gap-3 border-l-4 border-strawberry px-4 py-3">
            <p className="text-sm text-muted">Connect your Claude key to unlock the coach + research.</p>
            <Link href="/settings" className="btn btn-primary text-sm">Add AI</Link>
          </div>
        </Reveal>
      )}

      <Reveal>
        <CommandBar />
      </Reveal>

      <Reveal delay={0.05}>
        <section className="card-pop bg-surface-2/50 p-5">
          <p className="kicker text-blueberry">Film room</p>
          <h2 className="display mt-2 text-2xl">Show it a video</h2>
          <p className="mt-1 text-sm text-muted">
            Upload a clip of yourself and it checks your form, or paste a link to something you want
            to learn. Either way it adds the work to today&apos;s training and remembers what it saw.
          </p>
          <div className="mt-4">
            <VideoCoach />
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="card-pop bg-matcha-soft/40 p-5">
          <p className="kicker text-matcha">Deep research</p>
          <h2 className="display mt-2 text-2xl">Find my optimal plan</h2>
          <p className="mt-1 text-sm text-muted">
            The coach searches the web for current, youth-safe sport-science on training and fuel
            for a teen tennis player, then updates your targets and memory — with sources. Takes a
            few seconds.
          </p>
          <div className="mt-4">
            <ResearchButton focus="all" />
          </div>
        </section>
      </Reveal>
    </div>
  );
}
