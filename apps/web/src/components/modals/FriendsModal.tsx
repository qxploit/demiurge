"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { Avatar, VipDiamond } from "../Avatar";
import { getFriends, addFriend, removeFriend, type Friend } from "../../lib/api";

export function FriendsModal({
  onClose,
  onInviteToParty,
  onJoinFriend,
  partyNames = [],
  partyFull = false,
}: {
  onClose: () => void;
  onInviteToParty?: (name: string) => void;
  onJoinFriend?: (friend: Friend) => void;
  partyMode?: "public" | "private";
  partyNames?: string[];
  partyFull?: boolean;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getFriends()
      .then((f) => setFriends(f))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setErr("");
    try {
      setFriends(await addFriend(n));
      setName("");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    try {
      setFriends(await removeFriend(id));
    } catch {}
  };

  return (
    <Modal title="Friends" onClose={onClose} width="w-[30rem]">
      <form onSubmit={add} className="mb-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add friend by username"
          maxLength={24}
          className="min-w-0 flex-1 rounded-md border border-[#b58a3c]/50 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-[#7a6640] focus:border-[#e6b957]"
        />
        <button type="submit" className="rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] px-4 text-sm font-bold text-[#1e1305]">
          Add
        </button>
      </form>
      {err && <div className="mb-2 text-xs text-[#e88a6a]">{err}</div>}

      {loading ? (
        <div className="py-8 text-center text-sm text-[#7a6640]">loading...</div>
      ) : friends.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#8a734a]">No friends yet. Add someone by their username above.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {friends.map((f) => {
            const inParty = partyNames.some((n) => n.toLowerCase() === f.username.toLowerCase());
            const open = expanded === f.id;
            return (
              <div key={f.id} className="overflow-hidden rounded-md bg-black/25">
                <button onClick={() => setExpanded(open ? null : f.id)} className="flex w-full items-center gap-3 p-2 text-left transition hover:bg-black/20">
                  <Avatar name={f.username} size={36} status={f.status} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate text-sm font-bold">
                      {f.username}
                      {f.vip && <VipDiamond size={12} />}
                    </div>
                    <div className="text-[11px] capitalize text-[#b39a68]">
                      {f.status} - Lv {f.level}
                      {f.prestige ? ` - P${f.prestige}` : ""}
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8a734a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`ml-auto transition ${open ? "rotate-90" : ""}`}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                {open && (
                  <div className="flex flex-wrap gap-2 border-t border-[#b58a3c]/20 p-2">
                    {onJoinFriend && (
                      <button
                        onClick={() => onJoinFriend(f)}
                        className="flex-1 rounded-md border border-[#3ba55d]/60 bg-[#3ba55d]/15 px-3 py-1.5 text-xs font-bold text-[#7fe08a] transition hover:bg-[#3ba55d]/25"
                      >
                        Join {f.username}
                      </button>
                    )}
                    {onInviteToParty && (
                      <button
                        disabled={inParty || partyFull}
                        onClick={() => onInviteToParty(f.username)}
                        className="flex-1 rounded-md border border-[#b58a3c]/70 px-3 py-1.5 text-xs font-semibold text-[#e6cf9a] transition enabled:hover:bg-black/40 disabled:opacity-40"
                      >
                        {inParty ? "In your party" : "Invite to party"}
                      </button>
                    )}
                    <button
                      onClick={() => remove(f.id)}
                      className="rounded-md border border-[#c0503c]/60 px-3 py-1.5 text-xs font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
