"use client";

import { useState } from "react";
import { Modal } from "../Modal";

export function MatchmakeModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<null | "1v1" | "clan">(null);

  return (
    <Modal title="Find Match" onClose={onClose} width="w-[28rem]">
      {!mode ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-[#b39a68]">Pick a mode — matchmaking pairs you into an instanced battle.</div>
          <button
            onClick={() => setMode("1v1")}
            className="rounded-md border-2 border-[#b58a3c] bg-gradient-to-b from-[#2a1e10] to-[#160e07] p-4 text-left transition hover:border-[#e6b957]"
          >
            <div className="text-lg font-black text-[#e6b957]">1 vs 1</div>
            <div className="text-xs text-[#b39a68]">Duel another player. Fastest queue.</div>
          </button>
          <button
            onClick={() => setMode("clan")}
            className="rounded-md border-2 border-[#b58a3c] bg-gradient-to-b from-[#2a1e10] to-[#160e07] p-4 text-left transition hover:border-[#e6b957]"
          >
            <div className="text-lg font-black text-[#e6b957]">Clan vs Clan</div>
            <div className="text-xs text-[#b39a68]">Your clan fights another for territory and glory.</div>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-lg font-black text-[#e6b957]">{mode === "1v1" ? "1 vs 1" : "Clan vs Clan"}</div>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b58a3c]/30 border-t-[#e6b957]" />
          <div className="text-sm text-[#b39a68]">Searching for opponents…</div>
          <button
            onClick={() => setMode(null)}
            className="rounded-md border border-[#c0503c]/70 px-4 py-2 text-sm font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25"
          >
            Cancel
          </button>
        </div>
      )}
    </Modal>
  );
}
