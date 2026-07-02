"use client";

import { cinzelDecorative } from "../app/fonts";

const RAYS = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);

export function Logo() {
  return (
    <svg viewBox="0 0 640 232" className="pointer-events-none block h-auto w-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e488" />
          <stop offset="0.45" stopColor="#d9a441" />
          <stop offset="1" stopColor="#8a5c1e" />
        </linearGradient>
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2a1606" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* sun sigil */}
      <g transform="translate(320 42)" filter="url(#logoShadow)">
        <g fill="url(#gold)" stroke="#5c3c12" strokeWidth="0.8">
          {RAYS.map((a, i) => (
            <path key={i} d="M0 -27 L3.4 -15 L-3.4 -15 Z" transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r="15" fill="url(#gold)" stroke="#5c3c12" strokeWidth="1.2" />
        <path
          d="M0 -1 a4 4 0 1 1 -4 4 a8 8 0 1 0 8 -8 a11 11 0 1 1 -11 11"
          fill="none"
          stroke="#5c3c12"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* top flourishes */}
      <g filter="url(#logoShadow)">
        <g stroke="url(#gold)" strokeWidth="3" strokeLinecap="round">
          <line x1="118" y1="42" x2="252" y2="42" />
          <line x1="388" y1="42" x2="522" y2="42" />
        </g>
        <g fill="url(#gold)">
          <rect x="247" y="37" width="10" height="10" transform="rotate(45 252 42)" />
          <rect x="383" y="37" width="10" height="10" transform="rotate(45 388 42)" />
        </g>
      </g>

      {/* wordmark */}
      <text
        x="320"
        y="152"
        textAnchor="middle"
        fontFamily={cinzelDecorative.style.fontFamily}
        fontWeight={900}
        fontSize="98"
        letterSpacing="1"
        textLength="576"
        lengthAdjust="spacingAndGlyphs"
        fill="url(#gold)"
        stroke="#4a2f0e"
        strokeWidth="1.6"
        filter="url(#logoShadow)"
      >
        DEMIURGE
      </text>

      {/* bottom flourish */}
      <g filter="url(#logoShadow)">
        <g stroke="url(#gold)" strokeWidth="2.5" strokeLinecap="round">
          <line x1="180" y1="192" x2="302" y2="192" />
          <line x1="338" y1="192" x2="460" y2="192" />
        </g>
        <rect x="314" y="186" width="12" height="12" transform="rotate(45 320 192)" fill="url(#gold)" />
      </g>
    </svg>
  );
}
