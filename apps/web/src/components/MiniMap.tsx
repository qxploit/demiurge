"use client";

import { useEffect, useRef } from "react";
import type { WorldMeta } from "./WorldCanvas";

const BIOME = ["#173a5e", "#2f6e93", "#dcc98f", "#5aa04a", "#356a34", "#94a24f", "#d9a441", "#8a7250", "#7c7c82", "#e9eef3"];

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function MiniMap({ meta, hero }: { meta: WorldMeta | null; hero: { x: number; y: number } | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);

  // build a downscaled biome image once per world
  useEffect(() => {
    if (!meta) return;
    const N = 128;
    const off = document.createElement("canvas");
    off.width = N;
    off.height = N;
    const octx = off.getContext("2d");
    if (!octx) return;
    const data = octx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const tx = Math.floor((x / N) * meta.size);
        const ty = Math.floor((y / N) * meta.size);
        const [r, g, b] = rgb(BIOME[meta.biome[ty * meta.size + tx]] || "#000");
        const i = (y * N + x) * 4;
        data.data[i] = r;
        data.data[i + 1] = g;
        data.data[i + 2] = b;
        data.data[i + 3] = 255;
      }
    }
    octx.putImageData(data, 0, 0);
    baseRef.current = off;
  }, [meta]);

  useEffect(() => {
    const canvas = ref.current;
    const base = baseRef.current;
    if (!canvas || !base || !meta) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.clientWidth || 160);
    const H = (canvas.height = canvas.clientHeight || 160);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0, W, H);
    if (hero) {
      const worldPx = meta.size * meta.tileSize;
      const px = (hero.x / worldPx) * W;
      const py = (hero.y / worldPx) * H;
      ctx.fillStyle = "#39d7de";
      ctx.strokeStyle = "#00000088";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [meta, hero]);

  return <canvas ref={ref} className="h-full w-full" />;
}
