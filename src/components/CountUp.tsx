"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type Props = {
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
};

/** Animated integer count-up (GSAP). Snaps to the value under reduced-motion. */
export function CountUp({ to, duration = 1, suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = `${Math.round(to)}${suffix}`;
      return;
    }
    const state = { v: 0 };
    const tween = gsap.to(state, {
      v: to,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = `${Math.round(state.v)}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [to, duration, suffix]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
