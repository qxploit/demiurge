"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { Avatar, VipDiamond } from "../Avatar";
import { getProfile, addFriend, removeFriend, blockUser, unblockUser, type PlayerProfile } from "../../lib/api";

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  invisible: "Offline",
};

function joinedText(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function PlayerCard({
  username,
  onClose,
  onInviteToParty,
  onChanged,
}: {
  username: string;
  onClose: () => void;
  onInviteToParty?: (name: string) => void;
  onChanged?: () => void;
}) {
  const [p, setP] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProfile(username)
      .then(setP)
      .catch((e) => setErr((e as Error).message))
      .finally(() => setLoading(false));
  }, [username]);

  const act = async (fn: () => Promise<unknown>, patch: Partial<PlayerProfile>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
      setP((cur) => (cur ? { ...cur, ...patch } : cur));
      onChanged?.();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <Modal title="Player" onClose={onClose} width="w-[26rem]">
      {loading ? (
        <div className="py-10 text-center text-sm text-[#7a6640]">loading...</div>
      ) : !p ? (
        <div className="py-10 text-center text-sm text-[#e88a6a]">{err || "Player not found."}</div>
      ) : (
        <div>
          <div className="flex items-center gap-4">
            <Avatar name={p.username} size={64} status={p.status} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-lg font-black">
                {p.username}
                {p.vip && <VipDiamond size={16} />}
              </div>
              <div className="text-xs capitalize text-[#b39a68]">{STATUS_LABEL[p.status] || p.status}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded bg-[#b58a3c]/25 px-1.5 py-0.5 text-[10px] font-bold text-[#e6b957] ring-1 ring-[#b58a3c]/60">LV {p.level}</span>
                {p.prestige > 0 && (
                  <span className="rounded bg-[#7a3ca0]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#d8a6ff] ring-1 ring-[#a06fd0]/60">P{p.prestige}</span>
                )}
                {p.vip && (
                  <span className="rounded bg-[#2b8fd6]/25 px-1.5 py-0.5 text-[10px] font-bold text-[#7fd3f5] ring-1 ring-[#2b8fd6]/60">VIP</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {([["Matches", "—"], ["Wins", "—"], ["Win %", "—"]] as const).map(([k, v]) => (
              <div key={k} className="rounded-md border border-[#b58a3c]/30 bg-black/25 p-2 text-center">
                <div className="text-lg font-black text-[#e6cf9a]">{v}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#8a734a]">{k}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-[11px] text-[#7a6640]">Joined {joinedText(p.joined)}</div>

          {err && <div className="mt-2 text-center text-xs text-[#e88a6a]">{err}</div>}

          {p.isSelf ? (
            <div className="mt-4 rounded-md bg-black/25 py-2 text-center text-sm text-[#b39a68]">This is you.</div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {!p.isBlocked && !p.isFriend && (
                <button disabled={busy} onClick={() => act(() => addFriend(p.username), { isFriend: true })} className="flex-1 rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] py-2 text-sm font-bold text-[#1e1305] disabled:opacity-50">
                  Add friend
                </button>
              )}
              {p.isFriend && (
                <button disabled={busy} onClick={() => act(() => removeFriend(p.id), { isFriend: false })} className="flex-1 rounded-md border border-[#b58a3c]/70 py-2 text-sm font-semibold text-[#e6cf9a] transition hover:bg-black/40 disabled:opacity-50">
                  Remove friend
                </button>
              )}
              {onInviteToParty && !p.isBlocked && (
                <button disabled={busy} onClick={() => { onInviteToParty(p.username); onClose(); }} className="flex-1 rounded-md border border-[#3ba55d]/60 bg-[#3ba55d]/15 py-2 text-sm font-bold text-[#7fe08a] transition hover:bg-[#3ba55d]/25 disabled:opacity-50">
                  Invite to party
                </button>
              )}
              {!p.isBlocked ? (
                <button disabled={busy} onClick={() => act(() => blockUser(p.id), { isBlocked: true, isFriend: false })} className="rounded-md border border-[#c0503c]/70 px-4 py-2 text-sm font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25 disabled:opacity-50">
                  Block
                </button>
              ) : (
                <button disabled={busy} onClick={() => act(() => unblockUser(p.id), { isBlocked: false })} className="flex-1 rounded-md border border-[#c0503c]/70 py-2 text-sm font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25 disabled:opacity-50">
                  Unblock
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
