"use client";

import { useRouter } from "next/navigation";
import { playClick } from "../lib/sfx";

export function ComingSoon({ title }: { title: string }) {
  const router = useRouter();
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/menu-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover brightness-[0.55]" />
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative text-center">
        <h1
          className="font-black tracking-[0.2em] text-[#f4e7c6]"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", textShadow: "0 3px 12px rgba(0,0,0,0.65)" }}
        >
          {title}
        </h1>
        <p className="mt-3 text-lg tracking-widest text-[#f0dca8]/70">coming soon</p>
        <button
          onClick={() => {
            playClick();
            router.push("/");
          }}
          className="mt-8 rounded-lg border-2 border-[#5a3d18] bg-gradient-to-b from-[#e8c98a] to-[#b98a45] px-8 py-3 text-lg font-bold tracking-widest text-[#3c2a16] shadow-md transition hover:brightness-105 active:translate-y-[2px]"
        >
          BACK TO MENU
        </button>
      </div>
    </main>
  );
}
