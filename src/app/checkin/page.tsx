"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarEvent, Checkin, SorenessArea } from "@/lib/types";
import {
  loadCheckin,
  loadProfile,
  saveCheckin,
  saveEvents,
  savePlan,
  todayISO,
} from "@/lib/store";
import { generatePlan } from "@/lib/engine";
import { Segmented } from "@/components/Segmented";
import { Reveal } from "@/components/Reveal";

type Tennis = "none" | "practice" | "match";

const AREAS: SorenessArea[] = ["legs", "upper", "core", "shoulders"];

const scale = (n: number) => ({ value: n, label: String(n) });

export default function CheckinPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [tennis, setTennis] = useState<Tennis>("none");
  const [energy, setEnergy] = useState(4);
  const [sleep, setSleep] = useState(4);
  const [soreness, setSoreness] = useState(1);
  const [soreAreas, setSoreAreas] = useState<SorenessArea[]>([]);
  const [minutes, setMinutes] = useState(45);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!loadProfile()) {
      router.replace("/onboarding");
      return;
    }
    const existing = loadCheckin(todayISO());
    if (existing) {
      setEnergy(existing.energy);
      setSleep(existing.sleepQuality);
      setSoreness(existing.soreness);
      setSoreAreas(existing.soreAreas);
      setMinutes(existing.minutesAvailable);
      setNote(existing.note);
    }
    setReady(true);
  }, [router]);

  function toggleArea(area: SorenessArea) {
    setSoreAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const profile = loadProfile();
    if (!profile) return;

    const date = todayISO();
    const now = new Date().toISOString();
    const checkin: Checkin = {
      dateISO: date,
      energy,
      sleepQuality: sleep,
      soreness,
      soreAreas,
      minutesAvailable: minutes,
      note: note.trim(),
      createdAtISO: now,
    };

    const events: CalendarEvent[] =
      tennis === "practice"
        ? [{ title: "Tennis practice", kind: "tennis_practice" }]
        : tennis === "match"
          ? [{ title: "Tennis match", kind: "tennis_match" }]
          : [];

    saveCheckin(checkin);
    saveEvents(date, events);
    savePlan(generatePlan({ dateISO: date, profile, checkin, events }, now));
    router.push("/");
  }

  if (!ready) {
    return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-[var(--surface-2)]" />;
  }

  return (
    <Reveal>
      <form onSubmit={submit} className="mt-2 space-y-6">
        <div>
          <p className="eyebrow">daily check-in</p>
          <h1 className="display mt-1 text-4xl">How&apos;s today?</h1>
          <p className="mt-2 text-sm text-muted">
            Honest answers get you the right session. This tunes today only.
          </p>
        </div>

        <Field label="Tennis today">
          <Segmented
            value={tennis}
            onChange={setTennis}
            options={[
              { value: "none", label: "None" },
              { value: "practice", label: "Practice" },
              { value: "match", label: "Match" },
            ]}
          />
        </Field>

        <Field label="Energy" hint="1 = wiped · 5 = buzzing">
          <Segmented value={energy} onChange={setEnergy} options={[1, 2, 3, 4, 5].map(scale)} />
        </Field>

        <Field label="Sleep last night" hint="1 = terrible · 5 = great">
          <Segmented value={sleep} onChange={setSleep} options={[1, 2, 3, 4, 5].map(scale)} />
        </Field>

        <Field label="Soreness" hint="0 = fresh · 5 = very sore">
          <Segmented
            value={soreness}
            onChange={setSoreness}
            options={[0, 1, 2, 3, 4, 5].map(scale)}
          />
        </Field>

        {soreness > 0 && (
          <Field label="Where?">
            <div className="flex flex-wrap gap-1.5">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="seg text-sm capitalize"
                  data-active={soreAreas.includes(a)}
                  onClick={() => toggleArea(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Time available">
          <Segmented
            value={minutes}
            onChange={setMinutes}
            options={[20, 30, 45, 60, 90].map((n) => ({ value: n, label: `${n}m` }))}
          />
        </Field>

        <Field label="Anything else?">
          <textarea
            className="field min-h-20"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="tight shoulder, big test tomorrow, feeling great… optional"
          />
        </Field>

        <button type="submit" className="btn btn-primary w-full">
          Build today&apos;s session
        </button>
      </form>
    </Reveal>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
