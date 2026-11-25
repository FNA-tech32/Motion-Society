"use client";

import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/store";

export function Greeting() {
  const [name, setName] = useState("Matthew");

  useEffect(() => {
    const sync = () => {
      const p = loadProfile();
      if (p?.name) setName(p.name);
    };
    sync();
    window.addEventListener("baseline:change", sync);
    return () => window.removeEventListener("baseline:change", sync);
  }, []);

  return (
    <span className="text-sm text-muted">
      Hey, <span className="font-extrabold text-ink">{name}</span> 🍓
    </span>
  );
}
