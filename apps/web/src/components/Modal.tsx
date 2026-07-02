"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
  width = "w-[30rem]",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative ${width} flex max-h-[82vh] flex-col overflow-hidden rounded-lg border-2 border-[#b58a3c] bg-gradient-to-b from-[#241a0e] to-[#150d06] text-[#f0e2c0] shadow-[0_20px_60px_rgba(0,0,0,0.7)]`}
      >
        <div className="flex items-center justify-between border-b-2 border-[#b58a3c]/50 bg-black/30 px-4 py-3">
          <h2 className="text-lg font-black uppercase tracking-widest text-[#e6b957]">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded text-[#e6cf9a] transition hover:bg-[#c0392b]/30 hover:text-[#e88a6a]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
