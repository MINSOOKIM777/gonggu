"use client";

import { useEffect, useState } from "react";

type Props = {
  endAt: string;
  className?: string;
};

function format(endAtMs: number): { label: string; ended: boolean } {
  const ms = endAtMs - Date.now();
  if (ms <= 0) return { label: "마감", ended: true };
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    label: `D-${days} · ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    ended: false,
  };
}

export function GroupBuyCountdown({ endAt, className }: Props) {
  const endAtMs = new Date(endAt).getTime();
  const [state, setState] = useState(() => format(endAtMs));

  useEffect(() => {
    setState(format(endAtMs));
    const id = setInterval(() => {
      setState(format(endAtMs));
    }, 1000);
    return () => clearInterval(id);
  }, [endAtMs]);

  return (
    <span
      className={
        className ??
        "inline-flex items-center font-mono text-sm font-semibold text-[var(--brand)]"
      }
    >
      {state.label}
    </span>
  );
}
