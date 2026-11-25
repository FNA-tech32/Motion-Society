"use client";

import { useEffect, useRef } from "react";
import { bootstrap, exportState, importState } from "@/lib/store";

/**
 * Keeps the local snapshot in sync with the Supabase row when cloud sync is
 * configured. On boot it hydrates from the cloud (so your phone shows what your
 * laptop last saved), then debounce-pushes on every local change. With no
 * Supabase env, it just seeds locally and does nothing else.
 */
export function SyncProvider() {
  const suppress = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const push = async () => {
      try {
        await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: exportState() }),
        });
      } catch {
        // offline — local snapshot is the source of truth until we reconnect
      }
    };

    const schedulePush = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(push, 900);
    };

    const onChange = () => {
      if (suppress.current) return;
      schedulePush();
    };

    (async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        const json = (await res.json()) as { configured?: boolean; data?: unknown };
        if (!active) return;
        if (json.configured && json.data && Object.keys(json.data as object).length) {
          suppress.current = true;
          importState(json.data);
          bootstrap();
          window.setTimeout(() => {
            suppress.current = false;
          }, 0);
        } else {
          bootstrap();
          if (json.configured) void push();
        }
      } catch {
        bootstrap();
      }
    })();

    window.addEventListener("baseline:change", onChange);
    return () => {
      active = false;
      window.removeEventListener("baseline:change", onChange);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return null;
}
