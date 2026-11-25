"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

type Props = { value: number; size?: number };

/** Circular readiness gauge (0..1). Sweeps in with anime.js; static under reduced-motion. */
export function ReadinessDial({ value, size = 92 }: Props) {
  const [pct, setPct] = useState(0);
  const circleRef = useRef<SVGCircleElement>(null);

  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    const el = circleRef.current;
    const setOffset = (v: number) => {
      if (el) el.style.strokeDashoffset = String(circumference * (1 - v));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPct(Math.round(value * 100));
      setOffset(value);
      return;
    }
    const state = { v: 0 };
    const anim = animate(state, {
      v: value,
      duration: 1000,
      ease: "outExpo",
      onUpdate: () => {
        setPct(Math.round(state.v * 100));
        setOffset(state.v);
      },
    });
    return () => {
      anim.pause();
    };
  }, [value, circumference]);

  const color = pct >= 66 ? "var(--matcha)" : pct >= 40 ? "var(--peach)" : "var(--strawberry)";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={7} />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="absolute grid place-items-center text-center leading-none">
        <span className="display text-2xl" style={{ color }}>
          {pct}
        </span>
        <span className="eyebrow mt-0.5 text-[0.6rem]">ready</span>
      </div>
    </div>
  );
}
