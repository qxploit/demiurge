"use client";

import { ReactNode } from "react";
import { cinzel } from "../app/fonts";
import { playClick } from "../lib/sfx";

function Corner({ x, y, sx, sy }: { x: number; y: number; sx: number; sy: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path
        d="M0 26 L0 8 Q0 0 8 0 L26 0 L26 9 L12 9 Q9 9 9 12 L9 26 Z"
        fill="url(#mbMetal)"
        stroke="#241a0c"
        strokeWidth="1"
      />
      <circle cx="7" cy="7" r="2.6" fill="url(#mbBolt)" stroke="#241a0c" strokeWidth="0.6" />
    </g>
  );
}

export function MenuButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const long = label.length > 8;
  return (
    <button
      onClick={() => {
        playClick();
        onClick?.();
      }}
      aria-label={label}
      className="block w-full select-none border-0 bg-transparent p-0
                 transition-[transform,filter] duration-150 ease-out
                 [filter:drop-shadow(0_7px_6px_rgba(45,22,6,0.5))]
                 hover:-translate-y-[2px] hover:[filter:drop-shadow(0_11px_10px_rgba(45,22,6,0.5))_brightness(1.05)]
                 active:translate-y-[5px] active:scale-[0.992] active:[filter:drop-shadow(0_1px_2px_rgba(45,22,6,0.6))_brightness(0.9)]"
    >
      <svg viewBox="0 0 600 128" className="block h-auto w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mbFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4e7c6" />
            <stop offset="0.5" stopColor="#e6d0a2" />
            <stop offset="1" stopColor="#cdb079" />
          </linearGradient>
          <linearGradient id="mbEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c7ab74" />
            <stop offset="1" stopColor="#836a3f" />
          </linearGradient>
          <linearGradient id="mbMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a7048" />
            <stop offset="0.5" stopColor="#4a3a1e" />
            <stop offset="1" stopColor="#2e2412" />
          </linearGradient>
          <radialGradient id="mbBolt" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#c1a468" />
            <stop offset="1" stopColor="#3a2c15" />
          </radialGradient>
          <filter id="mbStone" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.9" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.34  0 0 0 0 0.25  0 0 0 0 0.11  0 0 0 0.10 0" />
          </filter>
        </defs>

        <rect x="3" y="3" width="594" height="122" rx="16" fill="url(#mbEdge)" />
        <rect x="11" y="10" width="578" height="108" rx="11" fill="url(#mbFace)" />
        <rect x="11" y="10" width="578" height="108" rx="11" filter="url(#mbStone)" />
        <rect x="22" y="20" width="556" height="88" rx="7" fill="none" stroke="#9c7f4f" strokeWidth="1.5" opacity="0.55" />

        <g fill="#6f5732">
          <rect x="293" y="3" width="14" height="14" rx="2" transform="rotate(45 300 10)" />
          <rect x="293" y="111" width="14" height="14" rx="2" transform="rotate(45 300 118)" />
        </g>

        <Corner x={12} y={11} sx={1} sy={1} />
        <Corner x={588} y={11} sx={-1} sy={1} />
        <Corner x={12} y={117} sx={1} sy={-1} />
        <Corner x={588} y={117} sx={-1} sy={-1} />

        <line x1="150" y1="30" x2="150" y2="98" stroke="#8a6f42" strokeWidth="2" opacity="0.7" />
        <g fill="#6f5732">
          <rect x="145" y="27" width="10" height="10" transform="rotate(45 150 32)" />
          <rect x="145" y="91" width="10" height="10" transform="rotate(45 150 96)" />
        </g>

        <g transform="translate(58 39) scale(2.15)" fill="none" stroke="#3c2a16" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </g>

        <text x="182" y="77" textAnchor="start" fontFamily={cinzel.style.fontFamily} fontWeight={700} fontSize="46" letterSpacing="2" fill="#f6ecd0" opacity="0.45" {...(long ? { textLength: 384, lengthAdjust: "spacingAndGlyphs" as const } : {})}>
          {label}
        </text>
        <text x="182" y="75" textAnchor="start" fontFamily={cinzel.style.fontFamily} fontWeight={700} fontSize="46" letterSpacing="2" fill="#3c2a16" {...(long ? { textLength: 384, lengthAdjust: "spacingAndGlyphs" as const } : {})}>
          {label}
        </text>
      </svg>
    </button>
  );
}
