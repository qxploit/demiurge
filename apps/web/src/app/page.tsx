"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../components/Logo";
import { MenuButton } from "../components/MenuButton";
import { Swords, ScrollMap, Trophy, Gear } from "../components/icons";
import { VolumeControl } from "../components/VolumeControl";
import { DEFAULT_LAYOUT, type Layout } from "../components/DevPanel";
import { getMusic } from "../lib/music";
import { me, clearToken } from "../lib/api";

export default function Menu() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [volume, setVolume] = useState(0.22);
  const [layout] = useState<Layout>(DEFAULT_LAYOUT);

  useEffect(() => {
    me().then((u) => {
      if (u) setAuthed(true);
      else router.replace("/signin");
    });
  }, [router]);

  useEffect(() => {
    const m = getMusic();
    if (m) m.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!authed) return;
    const m = getMusic();
    if (!m) return;
    m.volume = volume;
    const play = () => m.play().catch(() => {});
    play();
    const onInteract = () => {
      play();
      window.removeEventListener("pointerdown", onInteract);
    };
    window.addEventListener("pointerdown", onInteract);
    return () => window.removeEventListener("pointerdown", onInteract);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) {
    return (
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#c98a4e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/menu-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div
          className="relative text-xl font-bold tracking-widest text-[#f4e7c6]"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
        >
          entering the sands...
        </div>
      </main>
    );
  }

  const signOut = () => {
    clearToken();
    router.replace("/signin");
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/menu-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" />

      <button
        onClick={signOut}
        className="absolute right-5 top-5 z-40 rounded-lg border-2 border-[#7a5a2c] bg-gradient-to-b from-[#f2e4c2] to-[#cdb079] px-3 py-1.5 text-sm font-semibold text-[#4a3218] shadow-[0_3px_6px_rgba(45,22,6,0.4)] transition hover:brightness-105 active:translate-y-[1px]"
      >
        Sign out
      </button>

      <div className="absolute inset-0 flex flex-col items-center justify-start">
        <div style={{ width: `min(${layout.logoW}px, 92vw)`, marginTop: `${layout.topOffset}vh` }}>
          <Logo />
        </div>
        <div
          className="flex flex-col"
          style={{ width: `min(${layout.btnW}px, 92vw)`, gap: `${layout.gap}vh`, marginTop: `${layout.gap}vh` }}
        >
          <MenuButton label="PLAY" icon={<Swords />} onClick={() => router.push(`/play/${crypto.randomUUID()}`)} />
          <MenuButton label="ADVENTURES" icon={<ScrollMap />} onClick={() => router.push("/adventures")} />
          <MenuButton label="LEADERBOARDS" icon={<Trophy />} onClick={() => router.push("/leaderboards")} />
          <MenuButton label="SETTINGS" icon={<Gear />} onClick={() => router.push("/settings")} />
        </div>
      </div>

      <VolumeControl volume={volume} onChange={setVolume} />
    </main>
  );
}
