"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: Item[] = [
  {
    href: "/",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M12 13l4-4" />
        <circle cx="12" cy="13" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/checkin",
    label: "Check-in",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    href: "/week",
    label: "Week",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
        <path d="M4 15l4-4 3 3 5-6 4 4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[34rem] px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-3 flex items-stretch justify-between gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-1.5 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] backdrop-blur">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[0.7rem] font-semibold transition-colors"
              style={{ color: active ? "var(--court)" : "var(--muted)" }}
            >
              {active && (
                <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-[var(--ball)]" />
              )}
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
