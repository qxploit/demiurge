"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { getGear, buyWeapon, equipWeapon, enchantWeapon, type GearState } from "../../lib/api";
import { setSwordCursor } from "../../lib/cursor";

function SwordIcon({ color, size = 30 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0">
      <path d="M14.5 3 L18 6.5 L9 15.5 L6.5 15.5 L6.5 13 Z" fill={color} stroke="#00000055" strokeWidth="0.6" />
      <path d="M5 15 L9 19 M4 17 L7 20" stroke="#6b4a1e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="3.5" cy="20.5" r="1.4" fill="#e6b957" />
    </svg>
  );
}
const Coin = () => <span className="inline-block h-3 w-3 rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#ffe08a] to-[#c8912f]" />;

export function BagModal({ onClose, onEquip }: { onClose: () => void; onEquip?: (color: string) => void }) {
  const [gear, setGear] = useState<GearState | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getGear().then(setGear).catch(() => {});
  }, []);

  const run = async (fn: () => Promise<GearState>, key: string, cursorColor?: string) => {
    setBusy(key);
    setErr("");
    try {
      setGear(await fn());
      if (cursorColor) {
        setSwordCursor(cursorColor);
        onEquip?.(cursorColor);
      }
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy("");
  };

  return (
    <Modal title="Bag & Arsenal" onClose={onClose} width="w-[34rem]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-[#b39a68]">Equip a sword - it becomes your cursor. Enchant it for more power.</span>
        <span className="flex items-center gap-2 rounded-full border border-[#b58a3c]/60 bg-black/40 px-3 py-1 text-sm font-bold">
          <Coin /> {gear?.gold ?? "..."}
        </span>
      </div>
      {err && <div className="mb-2 text-xs text-[#e88a6a]">{err}</div>}
      <div className="flex flex-col gap-2">
        {gear?.weapons.map((w) => {
          const equipped = gear.equipped === w.id;
          return (
            <div
              key={w.id}
              className={`flex items-center gap-3 rounded-md border p-2.5 ${equipped ? "border-[#e6b957] bg-[#e6b957]/10" : "border-[#b58a3c]/40 bg-black/25"}`}
            >
              <SwordIcon color={w.color} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-bold">
                  {w.name}
                  {w.enchant > 0 && <span className="text-xs font-bold text-[#7fd3f5]">+{w.enchant}</span>}
                  {equipped && <span className="rounded bg-[#e6b957]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#e6b957]">Equipped</span>}
                </div>
                <div className="text-[11px] text-[#b39a68]">
                  Tier {w.tier} - <span className="font-bold text-[#e6cf9a]">{w.effectivePower} PWR</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {!w.owned ? (
                  <button
                    disabled={busy === w.id}
                    onClick={() => run(() => buyWeapon(w.id), w.id)}
                    className="flex items-center gap-1 rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] px-3 py-1.5 text-xs font-bold text-[#1e1305] disabled:opacity-50"
                  >
                    <Coin /> {w.price}
                  </button>
                ) : (
                  <>
                    {!equipped && (
                      <button
                        disabled={busy === w.id}
                        onClick={() => run(() => equipWeapon(w.id), w.id, w.color)}
                        className="rounded-md border border-[#b58a3c]/70 px-3 py-1.5 text-xs font-semibold text-[#e6cf9a] transition hover:bg-black/40 disabled:opacity-50"
                      >
                        Equip
                      </button>
                    )}
                    {w.enchant < gear.maxEnchant && (
                      <button
                        disabled={busy === w.id}
                        onClick={() => run(() => enchantWeapon(w.id), w.id)}
                        className="flex items-center gap-1 rounded-md border border-[#7fd3f5]/60 bg-[#2b8fd6]/15 px-2.5 py-1.5 text-xs font-bold text-[#7fd3f5] disabled:opacity-50"
                      >
                        Enchant <Coin /> {w.enchantCost}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
