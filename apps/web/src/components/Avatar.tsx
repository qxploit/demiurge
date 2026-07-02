export function hueFromName(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export const STATUS_COLOR: Record<string, string> = {
  online: "#3ba55d",
  idle: "#faa61a",
  dnd: "#ed4245",
  invisible: "#8a8f98",
};

export function VipDiamond({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="inline-block shrink-0" aria-label="VIP">
      <title>VIP</title>
      <path d="M12 2.5 L20 9 L12 21.5 L4 9 Z" fill="#5cc8f2" stroke="#1f6f8f" strokeWidth="1.2" />
      <path d="M4 9 H20" stroke="#ffffff70" strokeWidth="0.9" />
      <path d="M8.5 9 L12 2.8 M15.5 9 L12 2.8" stroke="#ffffff88" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

export function Avatar({ name, size, status }: { name: string; size: number; status?: string }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-bold text-white ring-2 ring-[#e6b957]/70"
        style={{ background: `hsl(${hueFromName(name)} 52% 44%)`, fontSize: size * 0.44 }}
      >
        {initial}
      </div>
      {status && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#1a120a]"
          style={{ background: STATUS_COLOR[status] || "#8a8f98" }}
        />
      )}
    </div>
  );
}
