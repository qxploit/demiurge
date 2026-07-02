"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { connectGame } from "../lib/gameSocket";

export interface WorldMeta {
  size: number;
  tileSize: number;
  biome: Uint8Array;
  week: number;
  online: number;
}
interface Snap {
  id: number;
  kind: number;
  variant: number;
  owner: number;
  x: number;
  y: number;
  facing: number;
  hp: number;
  max: number;
}

const BIOME = ["#173a5e", "#2f6e93", "#dcc98f", "#5aa04a", "#356a34", "#94a24f", "#d9a441", "#8a7250", "#7c7c82", "#e9eef3"];
const SCALE = 2.6;
const KIND = { HERO: 0, UNIT: 1, BUILDING: 2, RESOURCE: 3, MOB: 4, CHEST: 5 };

const A = "/api/assets";
// ground-fill textures (full-tile sheets). biomes not listed use their flat colour.
const GROUND: Record<number, string> = {
  3: `${A}/MiniWorldSprites/Ground/TexturedGrass.png`, // Grass
  4: `${A}/MiniWorldSprites/Ground/TexturedGrass.png`, // Forest
  5: `${A}/MiniWorldSprites/Ground/DeadGrass.png`, // Savanna
  9: `${A}/MiniWorldSprites/Ground/Winter.png`, // Snow
};
const HERO = `${A}/MiniWorldSprites/Characters/Champions/Arthax.png`; // 16x16 frames
const MON: Record<number, string> = {
  0: `${A}/MiniWorldSprites/Characters/Champions/Grum.png`, // Goblin
  1: `${A}/MiniWorldSprites/Characters/Champions/Okomo.png`, // Wolf (stand-in)
  2: `${A}/MiniWorldSprites/Characters/Champions/Zhinja.png`, // Slime (stand-in)
  3: `${A}/MiniWorldSprites/Characters/Champions/Katan.png`, // Skeleton
  4: `${A}/MiniWorldSprites/Characters/Champions/Gangblanc.png`, // Bandit
  5: `${A}/MiniWorldSprites/Characters/Champions/Borg.png`, // Orc
  6: `${A}/MiniWorldSprites/Characters/Champions/Kanji.png`, // Troll
};
const RES: Record<number, string> = {
  0: `${A}/MiniWorldSprites/Nature/Trees.png`,
  1: `${A}/MiniWorldSprites/Nature/Rocks.png`,
  2: `${A}/MiniWorldSprites/Nature/Rocks.png`,
  3: `${A}/MiniWorldSprites/Nature/Rocks.png`,
  4: `${A}/MiniWorldSprites/Nature/Wheatfield.png`,
  5: `${A}/MiniWorldSprites/Nature/Cactus.png`,
};

export function WorldCanvas({ onMeta, onHero }: { onMeta?: (m: WorldMeta) => void; onHero?: (x: number, y: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sockRef = useRef<Socket | null>(null);
  const mapRef = useRef<{ size: number; tileSize: number; biome: Uint8Array } | null>(null);
  const entsRef = useRef<Snap[]>([]);
  const prevRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const youRef = useRef(0);
  const camRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<Map<string, HTMLImageElement>>(new Map());

  function img(src: string): HTMLImageElement | null {
    const cache = imgRef.current;
    let im = cache.get(src);
    if (!im) {
      im = new Image();
      im.src = src;
      cache.set(src, im);
    }
    return im.complete && im.naturalWidth > 0 ? im : null;
  }

  useEffect(() => {
    [HERO, ...Object.values(MON), ...Object.values(RES), ...Object.values(GROUND)].forEach((s) => img(s));

    let raf = 0;
    let alive = true;
    let lastHero = 0;

    const sock = connectGame();
    sockRef.current = sock;
    sock.on("welcome", (d: { size: number; tileSize: number; biome: string; season: { week: number }; online: number; you: { heroId: number; x: number; y: number } }) => {
      const bin = atob(d.biome);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      mapRef.current = { size: d.size, tileSize: d.tileSize, biome: arr };
      camRef.current = { x: d.you.x, y: d.you.y };
      youRef.current = d.you.heroId;
      onMeta?.({ size: d.size, tileSize: d.tileSize, biome: arr, week: d.season.week, online: d.online });
    });
    sock.on("snap", (d: { hero: number; ents: Snap[] }) => {
      youRef.current = d.hero;
      entsRef.current = d.ents;
    });

    const loop = (ts: number) => {
      if (!alive) return;
      draw();
      const hero = entsRef.current.find((e) => e.id === youRef.current);
      if (hero && ts - lastHero > 200) {
        lastHero = ts;
        onHero?.(Math.round(hero.x), Math.round(hero.y));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      sock.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = canvas.clientHeight);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#07070c";
    ctx.fillRect(0, 0, W, H);

    const ents = entsRef.current;
    const hero = ents.find((e) => e.id === youRef.current);
    if (hero) {
      camRef.current.x += (hero.x - camRef.current.x) * 0.18;
      camRef.current.y += (hero.y - camRef.current.y) * 0.18;
    }
    const cam = camRef.current;
    const sx = (wx: number) => (wx - cam.x) * SCALE + W / 2;
    const sy = (wy: number) => (wy - cam.y) * SCALE + H / 2;
    const walkFrame = Math.floor(performance.now() / 150) % 4;

    const map = mapRef.current;
    if (map) {
      const tsz = map.tileSize;
      const hw = W / 2 / SCALE;
      const hh = H / 2 / SCALE;
      const tx0 = Math.max(0, Math.floor((cam.x - hw) / tsz));
      const tx1 = Math.min(map.size - 1, Math.ceil((cam.x + hw) / tsz));
      const ty0 = Math.max(0, Math.floor((cam.y - hh) / tsz));
      const ty1 = Math.min(map.size - 1, Math.ceil((cam.y + hh) / tsz));
      const px = tsz * SCALE + 1;
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          const b = map.biome[ty * map.size + tx];
          const dx = Math.floor(sx(tx * tsz));
          const dy = Math.floor(sy(ty * tsz));
          ctx.fillStyle = BIOME[b] || "#000";
          ctx.fillRect(dx, dy, px, px);
          const g = GROUND[b];
          if (g) {
            const im = img(g);
            if (im) ctx.drawImage(im, 0, 0, 16, 16, dx, dy, px, px);
          }
        }
      }
    }

    const now = new Map<number, { x: number; y: number }>();
    const spriteAt = (src: string, x: number, y: number, size: number, frame: number) => {
      const im = img(src);
      if (im) {
        const fx = (frame * 16) % im.naturalWidth;
        ctx.drawImage(im, fx, 0, 16, 16, Math.round(x - size / 2), Math.round(y - size), size, size);
        return true;
      }
      return false;
    };

    for (const e of ents) {
      now.set(e.id, { x: e.x, y: e.y });
      const x = sx(e.x);
      const y = sy(e.y);
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      const prev = prevRef.current.get(e.id);
      const moving = prev ? Math.abs(prev.x - e.x) + Math.abs(prev.y - e.y) > 0.25 : false;
      const frame = moving ? walkFrame : 0;

      switch (e.kind) {
        case KIND.RESOURCE:
          if (!spriteAt(RES[e.variant] || RES[0], x, y + 4, 28, 0)) {
            ctx.fillStyle = "#4b7a2f";
            ctx.fillRect(x - 4, y - 4, 8, 8);
          }
          break;
        case KIND.CHEST:
          ctx.fillStyle = "#e6b34a";
          ctx.strokeStyle = "#7a4e12";
          ctx.beginPath();
          ctx.moveTo(x, y - 7);
          ctx.lineTo(x + 7, y);
          ctx.lineTo(x, y + 7);
          ctx.lineTo(x - 7, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case KIND.MOB:
          if (!spriteAt(MON[e.variant] || MON[0], x, y, 28, frame)) {
            ctx.fillStyle = "#d24b4b";
            ctx.beginPath();
            ctx.arc(x, y - 8, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          hpBar(ctx, x, y - 30, e);
          break;
        case KIND.HERO: {
          const you = e.id === youRef.current;
          if (you) {
            ctx.strokeStyle = "#39d7de";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y - 3, 11, 5, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (!spriteAt(HERO, x, y, 32, frame)) {
            ctx.fillStyle = you ? "#39d7de" : "#c07adf";
            ctx.beginPath();
            ctx.arc(x, y - 8, 7, 0, Math.PI * 2);
            ctx.fill();
          }
          hpBar(ctx, x, y - 36, e);
          break;
        }
        default:
          break;
      }
    }
    prevRef.current = now;
  }

  function hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, e: Snap) {
    if (!e.max || e.hp >= e.max) return;
    const w = 22;
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(x - w / 2, y, w, 3);
    ctx.fillStyle = e.hp / e.max > 0.3 ? "#5fd36a" : "#e05050";
    ctx.fillRect(x - w / 2, y, w * Math.max(0, e.hp / e.max), 3);
  }

  // click an enemy to attack it, click ground to walk there
  function onClick(ev: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const sock = sockRef.current;
    if (!canvas || !sock) return;
    const r = canvas.getBoundingClientRect();
    const wx = (ev.clientX - r.left - canvas.clientWidth / 2) / SCALE + camRef.current.x;
    const wy = (ev.clientY - r.top - canvas.clientHeight / 2) / SCALE + camRef.current.y;
    let hit = 0;
    let hitD = 30 * 30;
    for (const e of entsRef.current) {
      if (e.kind !== KIND.MOB && !(e.kind === KIND.HERO && e.id !== youRef.current)) continue;
      const dd = (e.x - wx) ** 2 + (e.y - wy) ** 2;
      if (dd < hitD) {
        hitD = dd;
        hit = e.id;
      }
    }
    if (hit) sock.emit("attack", { targetId: hit });
    else sock.emit("move", { x: wx, y: wy });
  }

  return <canvas ref={canvasRef} onClick={onClick} className="absolute inset-0 h-full w-full cursor-crosshair" />;
}
