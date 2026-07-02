"use client";

import { useState } from "react";

export type Layout = { logoW: number; btnW: number; gap: number; topOffset: number };

export const DEFAULT_LAYOUT: Layout = { logoW: 620, btnW: 460, gap: 1.7, topOffset: 10 };

function Row({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px] text-amber-200/80">
        <span>{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: "#e0a94a" }}
      />
    </label>
  );
}

export function DevPanel({
  layout,
  setLayout,
}: {
  layout: Layout;
  setLayout: (l: Layout) => void;
}) {
  const [open, setOpen] = useState(true);
  const set = (k: keyof Layout) => (v: number) => setLayout({ ...layout, [k]: v });

  return (
    <div className="fixed left-4 top-4 z-50 w-56 select-none font-mono">
      <button
        onClick={() => setOpen((o) => !o)}
        className="mb-2 rounded border border-amber-700/50 bg-black/70 px-3 py-1 text-xs tracking-widest text-amber-300"
      >
        {open ? "DEV  (hide)" : "DEV  (show)"}
      </button>
      {open && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-800/50 bg-black/75 p-3 backdrop-blur">
          <Row label="Logo size" value={layout.logoW} min={300} max={960} step={5} unit="px" onChange={set("logoW")} />
          <Row label="Button size" value={layout.btnW} min={260} max={760} step={5} unit="px" onChange={set("btnW")} />
          <Row label="Gap" value={layout.gap} min={0} max={6} step={0.1} unit="vh" onChange={set("gap")} />
          <Row label="Top offset" value={layout.topOffset} min={0} max={22} step={0.5} unit="vh" onChange={set("topOffset")} />
          <button
            onClick={() => setLayout(DEFAULT_LAYOUT)}
            className="mt-1 rounded border border-amber-700/50 bg-amber-900/40 px-3 py-1 text-xs tracking-widest text-amber-200 hover:bg-amber-800/50"
          >
            RESET
          </button>
        </div>
      )}
    </div>
  );
}
