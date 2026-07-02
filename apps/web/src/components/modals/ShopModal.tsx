"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { getShop, buyItem, type ShopState } from "../../lib/api";

const CAT_COLOR: Record<string, string> = {
  frame: "#e6b957",
  banner: "#c07a45",
  title: "#a06fd0",
  emote: "#5aa9ff",
  boost: "#3ba55d",
};

const Coin = () => <span className="inline-block h-4 w-4 rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#ffe08a] to-[#c8912f]" />;

export function ShopModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<ShopState | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getShop().then(setState).catch(() => {});
  }, []);

  const buy = async (id: string) => {
    setErr("");
    setBusy(id);
    try {
      setState(await buyItem(id));
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy("");
  };

  return (
    <Modal title="Shop" onClose={onClose} width="w-[38rem]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-[#b39a68]">The Bazaar</span>
        <span className="flex items-center gap-2 rounded-full border border-[#b58a3c]/60 bg-black/40 px-3 py-1 text-sm font-bold">
          <Coin /> {state?.gold ?? "..."}
        </span>
      </div>
      {err && <div className="mb-2 text-xs text-[#e88a6a]">{err}</div>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {state?.items.map((it) => (
          <div key={it.id} className="flex flex-col rounded-md border border-[#b58a3c]/40 bg-black/25 p-2">
            <div className="mb-2 grid h-16 place-items-center rounded" style={{ background: `${CAT_COLOR[it.category] || "#b58a3c"}22` }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CAT_COLOR[it.category] || "#b58a3c" }}>
                {it.category}
              </span>
            </div>
            <div className="truncate text-xs font-bold">{it.name}</div>
            {it.owned ? (
              <div className="mt-1 rounded bg-[#3ba55d]/20 py-1 text-center text-[11px] font-bold uppercase text-[#5fd36a]">Owned</div>
            ) : (
              <button
                disabled={busy === it.id}
                onClick={() => buy(it.id)}
                className="mt-1 flex items-center justify-center gap-1 rounded border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] py-1 text-[11px] font-bold text-[#1e1305] transition hover:brightness-105 disabled:opacity-50"
              >
                <span className="inline-block h-3 w-3 rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#ffe08a] to-[#c8912f]" /> {it.price}
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
