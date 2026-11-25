"use client";

import { useEffect, useState } from "react";
import type { Equipment, Goal, Profile } from "@/lib/types";
import { bootstrap, getAiKey, loadProfile, resetAll, saveProfile, setAiKey } from "@/lib/store";
import { defaultProfile } from "@/lib/defaults";
import { useAiConnected } from "@/lib/hooks/useAiConnected";
import { Segmented } from "@/components/Segmented";
import { Reveal } from "@/components/Reveal";

const GOAL_LABELS: Record<Goal, string> = {
  tennis: "Tennis performance",
  explosive: "Explosive & fast",
  physique: "Physique",
};

export default function SettingsPage() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile());
  const [saved, setSaved] = useState(false);

  const [keyInput, setKeyInput] = useState("");
  const [connected, setConnected] = useState(false);
  const aiConnected = useAiConnected();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    bootstrap();
    setProfile(loadProfile() ?? defaultProfile(new Date().toISOString()));
    setConnected(Boolean(getAiKey()));
    setReady(true);
  }, []);

  function saveAll(e: React.FormEvent) {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function connect() {
    if (!keyInput.trim()) return;
    setAiKey(keyInput.trim());
    setKeyInput("");
    setConnected(true);
  }

  function disconnect() {
    setAiKey(null);
    setConnected(false);
  }

  function toggleEquipment(item: Equipment) {
    setProfile((p) => ({
      ...p,
      equipment: p.equipment.includes(item)
        ? p.equipment.filter((e) => e !== item)
        : [...p.equipment, item],
    }));
  }

  if (!ready) {
    return <div className="mt-8 h-72 animate-pulse rounded-3xl bg-surface-2" />;
  }

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <p className="kicker">You&apos;re in control</p>
        <h1 className="display mt-1 text-5xl">Settings</h1>
      </header>

      {/* Add AI */}
      <Reveal>
        <section className="card-pop bg-matcha-soft/40 p-5">
          <div className="flex items-center justify-between">
            <p className="kicker text-matcha">Add AI</p>
            {aiConnected && <span className="chip chip-matcha">connected ✓</span>}
          </div>
          <h2 className="display mt-2 text-2xl">Connect your Claude</h2>
          <p className="mt-1 text-sm text-muted">
            The coach uses your Anthropic key from server env (<code>.env.local</code> or Vercel) —
            nothing to paste. You can also paste a key here to keep it on this device instead; it&apos;s
            sent only to Motion Society&apos;s own server, never logged.
          </p>
          {connected ? (
            <button type="button" onClick={disconnect} className="btn btn-ghost mt-4 text-sm">
              Remove saved key
            </button>
          ) : aiConnected ? (
            <p className="mt-4 text-sm text-matcha">Using the key from your server env — you&apos;re all set. 🍵</p>
          ) : (
            <div className="mt-4 flex gap-2">
              <input
                type="password"
                className="field"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                autoComplete="off"
              />
              <button type="button" onClick={connect} className="btn btn-matcha whitespace-nowrap text-sm">
                Connect
              </button>
            </div>
          )}
        </section>
      </Reveal>

      {/* Profile */}
      <form onSubmit={saveAll} className="space-y-5">
        <h2 className="display text-2xl">About you</h2>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Name</span>
          <input className="field" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Date of birth</span>
            <input type="date" className="field" value={profile.dobISO} onChange={(e) => setProfile({ ...profile, dobISO: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Bodyweight (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              className="field"
              value={profile.bodyweightKg ?? ""}
              onChange={(e) => setProfile({ ...profile, bodyweightKg: e.target.value ? Number(e.target.value) : null })}
              placeholder="optional"
            />
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-bold">Equipment</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="seg opacity-70" data-active="true">Bodyweight</span>
            <button type="button" className="seg" data-active={profile.equipment.includes("pullup_bar")} onClick={() => toggleEquipment("pullup_bar")}>
              Pull-up bar
            </button>
            <button type="button" className="seg" data-active={profile.equipment.includes("dumbbell")} onClick={() => toggleEquipment("dumbbell")}>
              Dumbbells
            </button>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-bold">Training days per week</span>
          <Segmented
            value={profile.daysPerWeek}
            onChange={(v) => setProfile({ ...profile, daysPerWeek: v })}
            options={[3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-bold">What matters most?</span>
          <div className="space-y-4">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <label key={g} className="block">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{GOAL_LABELS[g]}</span>
                  <span className="font-mono text-strawberry">{profile.goalWeights[g]}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={profile.goalWeights[g]}
                  onChange={(e) => setProfile({ ...profile, goalWeights: { ...profile.goalWeights, [g]: Number(e.target.value) } })}
                  className="w-full accent-[var(--strawberry)]"
                />
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Injuries or things to avoid</span>
          <textarea
            className="field min-h-20"
            value={profile.injuries}
            onChange={(e) => setProfile({ ...profile, injuries: e.target.value })}
            placeholder="e.g. tender right wrist — optional"
          />
        </label>

        <button type="submit" className="btn btn-primary w-full">
          {saved ? "Saved ✓" : "Save profile"}
        </button>
      </form>

      {/* Danger zone */}
      <section className="card border-strawberry/40 p-5">
        <p className="kicker text-strawberry">Reset</p>
        <p className="mt-1 text-sm text-muted">
          Wipe everything on this device. Motion Society will re-seed the basics next time it loads.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={() => {
                resetAll();
                window.location.href = "/";
              }}
            >
              Really reset everything
            </button>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost mt-3 text-sm" onClick={() => setConfirmReset(true)}>
            Reset all data
          </button>
        )}
      </section>
    </div>
  );
}
