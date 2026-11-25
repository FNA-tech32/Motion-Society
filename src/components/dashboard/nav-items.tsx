import type { ReactNode } from "react";

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean };

export const NAV: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    href: "/training",
    label: "Training",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <path d="M6.5 9v6M17.5 9v6M4 10.5v3M20 10.5v3M6.5 12h11" />
      </svg>
    ),
  },
  {
    href: "/nutrition",
    label: "Nutrition",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <path d="M12 21c4-1 6-5 6-9 0-3-2-5-4-5-1 0-1.6.5-2 1-.4-.5-1-1-2-1-2 0-4 2-4 5 0 4 2 8 6 9Z" />
        <path d="M12 7c0-2 1-3.5 3-4" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <path d="M4 15l4-4 3 3 5-6 4 4" />
      </svg>
    ),
  },
  {
    href: "/coach",
    label: "Coach",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <path d="M12 3l2.1 4.5L19 8.2l-3.5 3.4.9 4.9L12 14.9 7.6 16.5l.9-4.9L5 8.2l4.9-.7Z" />
      </svg>
    ),
  },
  {
    href: "/memory",
    label: "Memory",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 4 4V4Z" />
        <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-4 4V4Z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
      </svg>
    ),
  },
];
