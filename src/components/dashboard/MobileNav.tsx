"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav-items";
import { ThemeToggle } from "@/components/ThemeToggle";

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-strawberry text-white">
            <span className="display text-base">M</span>
          </span>
          <span className="display text-base">Motion Society</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold"
              style={{
                color: active ? "#fff" : "var(--muted)",
                backgroundColor: active ? "var(--strawberry)" : "var(--surface-2)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
