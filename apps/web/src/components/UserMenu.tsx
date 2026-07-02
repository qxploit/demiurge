"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthUser, UserStatus } from "../lib/api";

const STATUSES: { key: UserStatus; label: string; color: string }[] = [
  { key: "online", label: "Online", color: "#3ba55d" },
  { key: "idle", label: "Idle", color: "#faa61a" },
  { key: "dnd", label: "Do Not Disturb", color: "#ed4245" },
  { key: "invisible", label: "Invisible", color: "#8a8f98" },
];

function hueFromName(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function Avatar({
  name,
  size,
  statusColor,
  ring,
}: {
  name: string;
  size: number;
  statusColor: string;
  ring: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const h = hueFromName(name);
  const dot = Math.max(10, size * 0.32);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
        style={{ background: `hsl(${h} 52% 44%)`, fontSize: size * 0.45 }}
      >
        {initial}
      </div>
      <span
        className="absolute bottom-0 right-0 rounded-full"
        style={{
          width: dot,
          height: dot,
          background: statusColor,
          boxShadow: `0 0 0 ${Math.max(2, size * 0.07)}px ${ring}`,
        }}
      />
    </div>
  );
}

export function UserMenu({
  user,
  status,
  onChangeStatus,
  onSignOut,
}: {
  user: AuthUser;
  status: UserStatus;
  onChangeStatus: (s: UserStatus) => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [statusHover, setStatusHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (s: UserStatus) => {
    setStatusHover(false);
    setOpen(false);
    onChangeStatus(s);
  };

  const current = STATUSES.find((s) => s.key === status) ?? STATUSES[0];

  return (
    <div ref={ref} className="absolute right-5 top-5 z-40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border-2 border-[#7a5a2c] bg-gradient-to-b from-[#f2e4c2] to-[#cdb079] py-1 pl-1 pr-3 shadow-[0_3px_6px_rgba(45,22,6,0.4)] transition hover:brightness-105"
      >
        <Avatar name={user.username} size={34} statusColor={current.color} ring="#e0c88f" />
        <span className="max-w-[140px] truncate text-sm font-semibold text-[#4a3218]">{user.username}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a3218" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border-2 border-[#7a5a2c] bg-[#e7d3a6] shadow-[0_14px_34px_rgba(30,15,4,0.5)]">
          <div className="flex items-center gap-3 border-b border-[#b79a67] p-3">
            <Avatar name={user.username} size={44} statusColor={current.color} ring="#e7d3a6" />
            <div className="min-w-0">
              <div className="truncate font-bold text-[#3c2a16]">{user.username}</div>
              <div className="truncate text-xs text-[#6b5028]">{user.email}</div>
            </div>
          </div>

          <div className="p-2">
            <div
              className="relative"
              onMouseEnter={() => setStatusHover(true)}
              onMouseLeave={() => setStatusHover(false)}
            >
              <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[#3c2a16] transition hover:bg-[#d8be86]">
                <span className="h-3 w-3 rounded-full" style={{ background: current.color }} />
                <span>Status</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-[#6b5028]">
                  {current.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </span>
              </button>

              {statusHover && (
                <div className="absolute right-full top-0 w-52 rounded-xl border-2 border-[#7a5a2c] bg-[#e7d3a6] p-2 shadow-[0_14px_34px_rgba(30,15,4,0.5)]">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a6f42]">
                    Set status
                  </div>
                  {STATUSES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => choose(s.key)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-[#3c2a16] transition hover:bg-[#d8be86] ${
                        status === s.key ? "bg-[#d8be86]" : ""
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-1 border-t border-[#b79a67] pt-2">
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-semibold text-[#9a2b2b] transition hover:bg-[#dfae9e]/50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
