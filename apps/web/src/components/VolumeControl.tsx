"use client";

import { useEffect, useRef, useState } from "react";
import { Speaker, SpeakerOff } from "./icons";

export function VolumeControl({
  volume,
  onChange,
}: {
  volume: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState(0.22);
  const muted = volume <= 0.001;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 3000);
  };

  useEffect(() => {
    if (open) scheduleClose();
    else if (timer.current) clearTimeout(timer.current);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open]);

  const toggleMute = () => {
    if (muted) onChange(prev > 0 ? prev : 0.22);
    else {
      setPrev(volume);
      onChange(0);
    }
    scheduleClose();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
      {open && (
        <div
          onMouseMove={scheduleClose}
          className="flex items-center gap-3 rounded-full border-2 border-[#7a5a2c] bg-[#e7d3a6]/95 px-4 py-2 shadow-[0_4px_12px_rgba(45,22,6,0.45)] backdrop-blur-sm"
        >
          <button
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={toggleMute}
            className="grid h-6 w-6 place-items-center text-[#5a3d18]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {muted ? <SpeakerOff /> : <Speaker />}
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => {
              onChange(parseFloat(e.target.value));
              scheduleClose();
            }}
            aria-label="Volume"
            className="h-1.5 w-36"
            style={{ accentColor: "#9c6b21" }}
          />
          <span className="w-8 text-right text-sm font-semibold text-[#5a3d18]">
            {Math.round(volume * 100)}
          </span>
        </div>
      )}

      <button
        aria-label="Volume"
        onClick={() => setOpen((o) => !o)}
        className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#7a5a2c] bg-gradient-to-b from-[#f2e4c2] to-[#cdb079] text-[#4a3218] shadow-[0_4px_8px_rgba(45,22,6,0.45)] transition hover:brightness-105 active:translate-y-0.5"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {muted ? <SpeakerOff /> : <Speaker />}
        </svg>
      </button>
    </div>
  );
}
