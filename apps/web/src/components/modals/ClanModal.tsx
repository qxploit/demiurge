"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { Avatar, VipDiamond } from "../Avatar";
import {
  getClan,
  browseClans,
  createClan,
  requestJoinClan,
  cancelClanRequest,
  acceptClanRequest,
  denyClanRequest,
  updateClanSettings,
  kickClanMember,
  leaveClan,
  type Clan,
  type ClanBrowseItem,
} from "../../lib/api";

const DiscordIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.24.5a18 18 0 0 1 4.3 1.4 15.7 15.7 0 0 0-13.9 0A18 18 0 0 1 9.8 3.5L9.6 3a19.8 19.8 0 0 0-4.9 1.4C1.7 8.9 1 13.3 1.3 17.6a20 20 0 0 0 6 3l.6-.9c-.9-.3-1.7-.7-2.5-1.2l.6-.5a14.3 14.3 0 0 0 12 0l.6.5c-.8.5-1.6.9-2.5 1.2l.6.9a20 20 0 0 0 6-3c.4-5-.7-9.4-3.5-13.2ZM8.4 15c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
  </svg>
);
const GearIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export function ClanModal({ onClose }: { onClose: () => void }) {
  const [clan, setClan] = useState<Clan | null>(null);
  const [browse, setBrowse] = useState<ClanBrowseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [discord, setDiscord] = useState("");
  const [rename, setRename] = useState("");
  const [err, setErr] = useState("");

  const refresh = async () => {
    try {
      const c = await getClan();
      setClan(c);
      if (c) {
        setDiscord(c.discord);
        setRename(c.name);
      } else {
        setBrowse(await browseClans());
      }
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const run = async (fn: () => Promise<unknown>) => {
    setErr("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const fieldCls = "w-full rounded-md border border-[#b58a3c]/50 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-[#7a6640] focus:border-[#e6b957]";
  const primaryBtn = "rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] px-4 py-2 text-sm font-bold text-[#1e1305]";

  return (
    <Modal title="Clan" onClose={onClose} width="w-[32rem]">
      {loading ? (
        <div className="py-10 text-center text-sm text-[#7a6640]">loading...</div>
      ) : clan && settings ? (
        /* ---- SETTINGS (owner) ---- */
        <div className="flex flex-col gap-3">
          <button onClick={() => setSettings(false)} className="self-start text-xs text-[#b39a68] hover:text-[#e6cf9a]">&lt; Back</button>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#e0b45a]">Clan name</div>
            <input value={rename} onChange={(e) => setRename(e.target.value)} maxLength={24} className={fieldCls} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#e0b45a]">Discord invite link</div>
            <input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="https://discord.gg/..." className={fieldCls} />
          </div>
          <button onClick={() => run(() => updateClanSettings({ discord, name: rename }))} className={primaryBtn}>Save settings</button>
          <button onClick={() => run(() => leaveClan())} className="rounded-md border border-[#c0503c]/70 py-2 text-sm font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25">
            Disband / leave clan
          </button>
        </div>
      ) : clan ? (
        /* ---- MY CLAN ---- */
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-black text-[#e6b957]">{clan.name}</div>
              <div className="text-xs text-[#b39a68]">
                [{clan.tag}] - {clan.members.length} members
              </div>
            </div>
            <div className="flex items-center gap-2">
              {clan.discord && (
                <a href={clan.discord} target="_blank" rel="noreferrer" title="Join Discord" className="grid h-9 w-9 place-items-center rounded-md border border-[#5865F2]/70 bg-[#5865F2]/15 text-[#8b93f5] transition hover:bg-[#5865F2]/30">
                  <DiscordIcon size={18} />
                </a>
              )}
              {clan.isOwner && (
                <button onClick={() => setSettings(true)} title="Clan settings" className="grid h-9 w-9 place-items-center rounded-md border border-[#b58a3c]/70 text-[#e6cf9a] transition hover:bg-black/40">
                  <GearIcon size={18} />
                </button>
              )}
              {!clan.isOwner && (
                <button onClick={() => run(() => leaveClan())} className="rounded-md border border-[#c0503c]/70 px-3 py-1.5 text-xs font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25">
                  Leave
                </button>
              )}
            </div>
          </div>

          {clan.isOwner && clan.requests.length > 0 && (
            <div className="mb-3 rounded-md border border-[#e6b957]/40 bg-[#e6b957]/5 p-2">
              <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#e0b45a]">Join requests ({clan.requests.length})</div>
              <div className="flex flex-col gap-1.5">
                {clan.requests.map((rq) => (
                  <div key={rq.id} className="flex items-center gap-2 rounded-md bg-black/25 p-1.5">
                    <Avatar name={rq.username} size={28} status={rq.status} />
                    <span className="flex items-center gap-1 truncate text-sm font-semibold">
                      {rq.username}
                      {rq.vip && <VipDiamond size={11} />}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      <button onClick={() => run(() => acceptClanRequest(rq.id))} className="rounded border border-[#3ba55d]/60 bg-[#3ba55d]/15 px-2 py-1 text-xs font-bold text-[#7fe08a]">Accept</button>
                      <button onClick={() => run(() => denyClanRequest(rq.id))} className="rounded border border-[#c0503c]/60 px-2 py-1 text-xs font-semibold text-[#e88a6a]">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a734a]">Members</div>
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {clan.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-md bg-black/25 p-2">
                <Avatar name={m.username} size={32} status={m.status} />
                <span className="flex items-center gap-1 truncate text-sm font-bold">
                  {m.username}
                  {m.vip && <VipDiamond size={12} />}
                </span>
                {m.id === clan.ownerId ? (
                  <span className="ml-auto rounded bg-[#e6b957]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#e6b957]">Leader</span>
                ) : (
                  clan.isOwner && (
                    <button onClick={() => run(() => kickClanMember(m.id))} className="ml-auto rounded px-2 py-1 text-xs font-semibold text-[#e88a6a] transition hover:bg-[#c0392b]/25">
                      Kick
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ---- NO CLAN: create + browse ---- */
        <div className="flex flex-col gap-4">
          <form onSubmit={(e) => { e.preventDefault(); run(() => createClan(name, tag)); }} className="rounded-md border border-[#b58a3c]/40 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#e0b45a]">
              <span>Create a clan</span>
              <span className="flex items-center gap-1 text-[#e6b957]">
                <span className="inline-block h-3 w-3 rounded-full border border-[#7a4e12] bg-gradient-to-b from-[#ffe08a] to-[#c8912f]" />
                5,000
              </span>
            </div>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Clan name" maxLength={24} className={`min-w-0 flex-1 ${fieldCls}`} />
              <input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} placeholder="TAG" maxLength={5} className="w-20 rounded-md border border-[#b58a3c]/50 bg-black/40 px-2 py-2 text-center text-sm uppercase outline-none placeholder:text-[#7a6640] focus:border-[#e6b957]" />
            </div>
            <button type="submit" className={`mt-2 w-full ${primaryBtn}`}>Create</button>
          </form>

          <div>
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[#e0b45a]">Browse clans</div>
            {browse.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#8a734a]">No clans yet. Be the first to found one.</div>
            ) : (
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                {browse.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-md bg-black/25 p-2">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#b58a3c]/20 text-xs font-black text-[#e6b957]">{c.tag.slice(0, 3)}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{c.name}</div>
                      <div className="text-[11px] text-[#b39a68]">[{c.tag}] - {c.members} members</div>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      {c.discord && (
                        <a href={c.discord} target="_blank" rel="noreferrer" title="Discord" className="grid h-8 w-8 place-items-center rounded-md border border-[#5865F2]/70 bg-[#5865F2]/15 text-[#8b93f5] transition hover:bg-[#5865F2]/30">
                          <DiscordIcon size={15} />
                        </a>
                      )}
                      {c.requested ? (
                        <button onClick={() => run(() => cancelClanRequest(c.id))} className="rounded-md border border-[#b58a3c]/50 px-3 py-1.5 text-xs font-semibold text-[#b39a68] transition hover:bg-black/30">
                          Requested
                        </button>
                      ) : (
                        <button onClick={() => run(() => requestJoinClan(c.id))} className="rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] px-3 py-1.5 text-xs font-bold text-[#1e1305]">
                          Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {err && <div className="mt-2 text-center text-xs text-[#e88a6a]">{err}</div>}
    </Modal>
  );
}
