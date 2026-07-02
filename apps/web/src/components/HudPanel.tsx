import type { ReactNode } from "react";

export function HudPanel({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-xl border-2 border-[#7a5a2c] bg-gradient-to-b from-[#efe0bd]/95 to-[#cdb079]/95 shadow-[0_6px_18px_rgba(30,15,4,0.45)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
