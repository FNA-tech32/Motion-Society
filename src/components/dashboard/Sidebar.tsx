"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav-items";

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-3 py-5 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-strawberry text-white">
          <span className="display text-lg">M</span>
        </span>
        <span className="display text-lg leading-none text-ink">Motion Society</span>
        <span className="h-1.5 w-1.5 rounded-full bg-matcha" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-transform duration-200 hover:translate-x-0.5"
              style={{
                color: active ? "var(--strawberry)" : "var(--muted)",
                backgroundColor: active ? "var(--strawberry-soft)" : "transparent",
              }}
            >
              <span className="transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </span>
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-strawberry" />}
            </Link>
          );
        })}
      </nav>

      <Link href="/settings" className="btn btn-matcha mt-4 text-sm">
        + Add AI
      </Link>
    </aside>
  );
}
