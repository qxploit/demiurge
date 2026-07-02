"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { me } from "../../lib/api";
import { connectGame } from "../../lib/gameSocket";

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

// biome index -> colour (DeepWater..Snow)
const BIOME = ["#173a5e", "#2f6e93", "#dcc98f", "#5aa04a", "#356a34", "#94a24f", "#d9a441", "#8a7250", "#7c7c82", "#e9eef3"];
// resource variant -> colour (Wood, Stone, Ore, Gold, Food, Crystal)
const RES = ["#4b7a2f", "#9298a2", "#a06a3a", "#e6b34a", "#c0503c", "#5cc8f2"];
const SCALE = 2.2;

const KIND = { HERO: 0, UNIT: 1, BUILDING: 2, RESOURCE: 3, MOB: 4, CHEST: 5 };

export default function WorldPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sockRef = useRef<Socket | null>(null);
  const mapRef = useRef<{ size: number; tileSize: number; biome: Uint8Array } | null>(null);
  const entsRef = useRef<Snap[]>([]);
  const youRef = useRef<number>(0);
  const camRef = useRef({ x: 0, y: 0 });
  const [status, setStatus] = useState("connecting…");
  const [hud, setHud] = useState<{ week: number; online: number } | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    let alive = true;

    me().then((u) => {
      if (!u) {
        router.replace("/signin");
        return;
      }
      const sock = connectGame();
      sockRef.current = sock;
      sock.on("connect", () => setStatus("authenticating…"));
      sock.on("welcome", (d: { size: number; tileSize: number; biome: string; season: { week: number }; online: number; you: { heroId: number; x: number; y: number } }) => {
        const bin = atob(d.biome);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        mapRef.current = { size: d.size, tileSize: d.tileSize, biome: arr };
        camRef.current = { x: d.you.x, y: d.you.y };
        youRef.current = d.you.heroId;
        setHud({ week: d.season.week, online: d.online });
        setStatus("");
      });
      sock.on("snap", (d: { hero: number; ents: Snap[] }) => {
        youRef.current = d.hero;
        entsRef.current = d.ents;
      });
      sock.on("kick", () => setStatus("kicked - refresh"));
      sock.on("disconnect", () => setStatus("disconnected…"));
    });

    const loop = () => {
      if (!alive) return;
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const hudTimer = setInterval(() => {
      const hero = entsRef.current.find((e) => e.id === youRef.current);
      if (hero) setCoords({ x: Math.round(hero.x), y: Math.round(hero.y) });
    }, 250);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearInterval(hudTimer);
      sockRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = canvas.clientHeight);
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

    const map = mapRef.current;
    if (map) {
      const ts = map.tileSize;
      const halfW = W / 2 / SCALE;
      const halfH = H / 2 / SCALE;
      const tx0 = Math.max(0, Math.floor((cam.x - halfW) / ts));
      const tx1 = Math.min(map.size - 1, Math.ceil((cam.x + halfW) / ts));
      const ty0 = Math.max(0, Math.floor((cam.y - halfH) / ts));
      const ty1 = Math.min(map.size - 1, Math.ceil((cam.y + halfH) / ts));
      const px = ts * SCALE + 1;
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          ctx.fillStyle = BIOME[map.biome[ty * map.size + tx]] || "#000";
          ctx.fillRect(Math.floor(sx(tx * ts)), Math.floor(sy(ty * ts)), px, px);
        }
      }
    }

    for (const e of ents) {
      const x = sx(e.x);
      const y = sy(e.y);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const mine = e.owner !== 0 && e.owner !== 999;
      const factionHue = e.owner % 360;
      switch (e.kind) {
        case KIND.RESOURCE:
          ctx.fillStyle = RES[e.variant] || "#4b7a2f";
          ctx.fillRect(x - 4, y - 4, 8, 8);
          break;
        case KIND.CHEST:
          ctx.fillStyle = "#e6b34a";
          ctx.beginPath();
          ctx.moveTo(x, y - 6);
          ctx.lineTo(x + 6, y);
          ctx.lineTo(x, y + 6);
          ctx.lineTo(x - 6, y);
          ctx.closePath();
          ctx.fill();
          break;
        case KIND.MOB:
          ctx.fillStyle = "#d24b4b";
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          hpBar(ctx, x, y - 9, e);
          break;
        case KIND.BUILDING:
          ctx.fillStyle = `hsl(${factionHue} 55% 50%)`;
          ctx.fillRect(x - 9, y - 9, 18, 18);
          break;
        case KIND.UNIT:
          ctx.fillStyle = `hsl(${factionHue} 60% 55%)`;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        case KIND.HERO: {
          const you = e.id === youRef.current;
          ctx.fillStyle = you ? "#39d7de" : mine ? `hsl(${factionHue} 60% 55%)` : "#c07adf";
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          if (you) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          hpBar(ctx, x, y - 12, e);
          break;
        }
      }
    }
  }

  function hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, e: Snap) {
    if (!e.max || e.hp >= e.max) return;
    const w = 16;
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(x - w / 2, y, w, 3);
    ctx.fillStyle = "#5fd36a";
    ctx.fillRect(x - w / 2, y, w * Math.max(0, e.hp / e.max), 3);
  }

  function onClick(ev: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const sock = sockRef.current;
    if (!canvas || !sock) return;
    const r = canvas.getBoundingClientRect();
    const px = ev.clientX - r.left;
    const py = ev.clientY - r.top;
    const wx = (px - canvas.clientWidth / 2) / SCALE + camRef.current.x;
    const wy = (py - canvas.clientHeight / 2) / SCALE + camRef.current.y;
    sock.emit("move", { x: wx, y: wy });
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#07070c] text-[#f0e2c0]">
      <canvas ref={canvasRef} onClick={onClick} className="absolute inset-0 h-full w-full cursor-crosshair" />

      {/* HUD */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-md border-2 border-[#b58a3c]/80 bg-gradient-to-b from-[#241a0e]/94 to-[#130c06]/94 px-3 py-2 text-xs shadow-lg">
        <div className="font-black uppercase tracking-widest text-[#e6b957]">Demiurge · Open World</div>
        <div className="mt-1 text-[#b39a68]">
          {hud ? `Season - Week ${hud.week} · ${hud.online} online` : "loading…"}
        </div>
        <div className="text-[#7a6640]">
          x {coords.x} · y {coords.y}
        </div>
      </div>

      {status && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-[#b58a3c]/80 bg-black/70 px-6 py-3 text-sm font-semibold text-[#e6cf9a]">
          {status}
        </div>
      )}

      <button
        onClick={() => router.push("/play/" + crypto.randomUUID())}
        className="absolute right-3 top-3 rounded-md border-2 border-[#9a2b2b] bg-gradient-to-b from-[#e8b48a] to-[#c07a45] px-3 py-1.5 text-sm font-bold text-[#5a1f1f] shadow-lg transition hover:brightness-105"
      >
        Leave world
      </button>

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border border-[#b58a3c]/50 bg-black/50 px-4 py-1.5 text-xs text-[#b39a68]">
        click anywhere to walk · red = monsters · gold = chests · squares = resources
      </div>
    </main>
  );
}
