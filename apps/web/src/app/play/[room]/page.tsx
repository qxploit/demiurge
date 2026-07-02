"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { me, getChat, sendChat, setStatus, getBlocked, getGear, type AuthUser, type ChatMessage, type UserStatus } from "../../../lib/api";
import { setSwordCursor } from "../../../lib/cursor";
import { playClick } from "../../../lib/sfx";
import { FriendsModal } from "../../../components/modals/FriendsModal";
import { ClanModal } from "../../../components/modals/ClanModal";
import { ShopModal } from "../../../components/modals/ShopModal";
import { PlayerCard } from "../../../components/modals/PlayerCard";
import { VipDiamond } from "../../../components/Avatar";
import { getMusic } from "../../../lib/music";
import { WorldCanvas, type WorldMeta } from "../../../components/WorldCanvas";
import { MiniMap } from "../../../components/MiniMap";
import { MatchmakeModal } from "../../../components/modals/MatchmakeModal";
import { BagModal } from "../../../components/modals/BagModal";

/* ------------------------------------------------------------------ atoms */

function hue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function Portrait({ name, size, ring = true }: { name: string; size: number; ring?: boolean }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className={`shrink-0 rounded-full ${ring ? "p-[2px] ring-2 ring-[#e6b957]/80" : ""}`}>
      <div
        className="flex items-center justify-center rounded-full font-bold text-white"
        style={{ width: size, height: size, background: `hsl(${hue(name)} 52% 44%)`, fontSize: size * 0.44 }}
      >
        {initial}
      </div>
    </div>
  );
}

function Bar({ pct, color, className = "" }: { pct: number; color: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-black/50 ring-1 ring-black/40 ${className}`}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}
const GOLD = "linear-gradient(90deg,#f0d27a,#c8912f)";

function Frame({ className = "", style, children }: { className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return (
    <div style={style} className={`rounded-md border-2 border-[#b58a3c]/80 bg-gradient-to-b from-[#241a0e]/94 to-[#130c06]/94 shadow-[0_6px_22px_rgba(0,0,0,0.55)] ${className}`}>
      {children}
    </div>
  );
}

function I({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const GearIcon = () => <I><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></I>;
const LeaveIcon = () => <I><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></I>;
const ShopIcon = () => <I><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></I>;
const BagIcon = () => <I><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></I>;
const HeroIcon = () => <I><path d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></I>;
const UsersIcon = () => <I><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></I>;
const EventIcon = () => <I><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></I>;
const FriendIcon = () => <I><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></I>;
const HomeIcon = () => <I><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></I>;
const LockIcon = ({ size = 14 }: { size?: number }) => <I size={size}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></I>;
const UnlockIcon = ({ size = 14 }: { size?: number }) => <I size={size}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-1.5" /></I>;

function IconBtn({ children, title, onClick, danger }: { children: ReactNode; title: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-md border bg-black/30 transition hover:bg-black/50 hover:brightness-110 ${
        danger ? "border-[#c0503c]/80 text-[#e88a6a]" : "border-[#b58a3c]/70 text-[#e6cf9a]"
      }`}
    >
      {children}
    </button>
  );
}

function CommandSlot({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center">
      <div className="grid h-12 w-12 place-items-center rounded-md border-2 border-[#b58a3c]/70 bg-gradient-to-b from-[#2a1e10] to-[#160e07] text-[#e6cf9a] transition group-hover:border-[#e6b957] group-hover:brightness-110">
        {icon}
      </div>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-[#b39a68]">{label}</span>
    </button>
  );
}

const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const DUNGEONS = [
  { key: "sunken-bazaar", name: "Sunken Bazaar", tier: "I" },
  { key: "dune-catacombs", name: "Dune Catacombs", tier: "II" },
  { key: "obsidian-spire", name: "Obsidian Spire", tier: "III" },
];
// Set NEXT_PUBLIC_AADS_UNIT to your A-ADS unit id to serve real banners.
const AADS_UNIT = process.env.NEXT_PUBLIC_AADS_UNIT ?? "";

const STATUSES: { key: UserStatus; label: string; color: string }[] = [
  { key: "online", label: "Online", color: "#3ba55d" },
  { key: "idle", label: "Idle", color: "#faa61a" },
  { key: "dnd", label: "Do Not Disturb", color: "#ed4245" },
  { key: "invisible", label: "Invisible", color: "#8a8f98" },
];
const STATUS_COLOR: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.key, s.color]));

/* -------------------------------------------------------------------- page */

export default function Room() {
  const router = useRouter();
  const params = useParams<{ room: string }>();
  const roomCode = (params.room || "").slice(0, 8).toUpperCase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const feed = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [party, setParty] = useState<{ name: string; you?: boolean }[]>([]);
  const [modal, setModal] = useState<null | "friends" | "clan" | "shop" | "bag">(null);
  const [statusMenu, setStatusMenu] = useState(false);
  const [sub, setSub] = useState<null | "status" | "party">(null);
  const [partyMode, setPartyMode] = useState<"public" | "private">("public");
  const [roomMenu, setRoomMenu] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [blockedNames, setBlockedNames] = useState<Set<string>>(new Set());
  const [worldMeta, setWorldMeta] = useState<WorldMeta | null>(null);
  const [heroPos, setHeroPos] = useState<{ x: number; y: number } | null>(null);
  const [matchmaking, setMatchmaking] = useState(false);

  useEffect(() => {
    me().then((u) => (u ? setUser(u) : router.replace("/signin")));
  }, [router]);

  useEffect(() => {
    if (user) setParty([{ name: user.username, you: true }]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = () => getChat().then((m) => alive && setMessages(m));
    load();
    const iv = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [user]);

  useEffect(() => {
    const el = feed.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const m = getMusic();
    if (!m) return;
    const play = () => m.play().catch(() => {});
    play();
    const onInteract = () => {
      play();
      window.removeEventListener("pointerdown", onInteract);
    };
    window.addEventListener("pointerdown", onInteract);
    return () => window.removeEventListener("pointerdown", onInteract);
  }, []);

  const loadBlocked = () =>
    getBlocked()
      .then((b) => setBlockedNames(new Set(b.map((x) => x.username.toLowerCase()))))
      .catch(() => {});
  useEffect(() => {
    if (user) loadBlocked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getGear()
      .then((g) => {
        const w = g.weapons.find((x) => x.id === g.equipped);
        if (w) setSwordCursor(w.color);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return <main className="fixed inset-0 grid place-items-center bg-[#150d05] text-[#e6cf9a]">loading lobby...</main>;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    setInput("");
    await sendChat(t);
    setMessages(await getChat());
  };

  const onScroll = () => {
    const el = feed.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const visibleMessages = messages.filter(
    (m) => m.username === "System" || !blockedNames.has(m.username.toLowerCase()),
  );

  const inviteToParty = (name: string) => {
    setParty((p) =>
      p.length >= 4 || p.some((m) => m.name.toLowerCase() === name.toLowerCase()) ? p : [...p, { name }],
    );
    playClick();
  };
  const kick = (name: string) => setParty((p) => p.filter((m) => m.you || m.name !== name));
  const openModal = (m: "friends" | "clan" | "shop" | "bag") => {
    playClick();
    setModal(m);
  };
  const changeStatus = async (s: UserStatus) => {
    setStatusMenu(false);
    setSub(null);
    try {
      setUser(await setStatus(s));
    } catch {}
  };
  const selectPartyMode = (m: "public" | "private") => {
    setPartyMode(m);
    setStatusMenu(false);
    setSub(null);
  };
  const joinFriend = (friend: { id: string }) => {
    setModal(null);
    router.push(`/play/${friend.id}`);
  };
  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) return;
    setRoomMenu(false);
    setJoinId("");
    router.push(`/play/${encodeURIComponent(id)}`);
  };
  const goDungeon = (key: string) => {
    setRoomMenu(false);
    router.push(`/play/${key}`);
  };

  return (
    <main className="fixed inset-0 overflow-hidden text-[#f0e2c0]">
      <WorldCanvas onMeta={setWorldMeta} onHero={(x, y) => setHeroPos({ x, y })} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_160px_60px_rgba(0,0,0,0.5)]" />

      {/* ===== TOP BAR ===== */}
      <div className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between gap-4 border-b-2 border-[#b58a3c]/60 bg-gradient-to-b from-[#1c130a]/95 to-[#120b05]/85 px-4 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        {/* player + level + xp */}
        <div className="relative flex items-center gap-3">
          <button onClick={() => setStatusMenu((v) => !v)} title="Set status" className="relative shrink-0">
            <Portrait name={user.username} size={36} />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#161009]"
              style={{ background: STATUS_COLOR[user.status] || "#8a8f98" }}
            />
          </button>
          {statusMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setStatusMenu(false); setSub(null); }} />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border-2 border-[#b58a3c] bg-gradient-to-b from-[#241a0e] to-[#150d06] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                {/* Status -> submenu */}
                <div className="relative">
                  <button onClick={() => setSub(sub === "status" ? null : "status")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-[#f0e2c0] transition hover:bg-black/40">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[user.status] || "#8a8f98" }} />
                    Status
                    <span className="ml-auto text-xs capitalize text-[#b39a68]">{user.status}</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#8a734a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                  {sub === "status" && (
                    <div className="absolute left-full -top-2 z-50 ml-1 w-52 rounded-lg border-2 border-[#b58a3c] bg-gradient-to-b from-[#241a0e] to-[#150d06] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                      {STATUSES.map((s) => (
                        <button key={s.key} onClick={() => changeStatus(s.key)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#f0e2c0] transition hover:bg-black/40">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                          {s.label}
                          {user.status === s.key && (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e6b957" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><path d="M20 6 9 17l-5-5" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Party Mode -> submenu */}
                <div className="relative">
                  <button onClick={() => setSub(sub === "party" ? null : "party")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-[#f0e2c0] transition hover:bg-black/40">
                    {partyMode === "private" ? <LockIcon size={15} /> : <UnlockIcon size={15} />}
                    Party Mode
                    <span className="ml-auto text-xs capitalize text-[#b39a68]">{partyMode}</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#8a734a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                  {sub === "party" && (
                    <div className="absolute left-full top-0 z-50 ml-1 w-48 rounded-lg border-2 border-[#b58a3c] bg-gradient-to-b from-[#241a0e] to-[#150d06] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                      <button onClick={() => selectPartyMode("public")} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#f0e2c0] transition hover:bg-black/40">
                        <UnlockIcon size={15} /> Public Party
                        {partyMode === "public" && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e6b957" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><path d="M20 6 9 17l-5-5" /></svg>}
                      </button>
                      <button onClick={() => selectPartyMode("private")} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#f0e2c0] transition hover:bg-black/40">
                        <LockIcon size={15} /> Private Party
                        {partyMode === "private" && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e6b957" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><path d="M20 6 9 17l-5-5" /></svg>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-bold">
                {user.username}
                {user.vip && <VipDiamond size={13} />}
              </span>
              <span className="rounded bg-[#b58a3c]/25 px-1.5 py-0.5 text-[10px] font-bold text-[#e6b957] ring-1 ring-[#b58a3c]/60">LV {user.level}</span>
              {user.prestige > 0 && (
                <span className="rounded bg-[#7a3ca0]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#d8a6ff] ring-1 ring-[#a06fd0]/60">P{user.prestige}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Bar pct={(user.xp / Math.max(1, user.xpToNext)) * 100} color={GOLD} className="h-1.5 w-44" />
              <span className="text-[10px] text-[#b39a68]">{user.xp} / {user.xpToNext} XP</span>
            </div>
          </div>
        </div>
        {/* room switcher */}
        <div className="absolute left-1/2 z-30 -translate-x-1/2">
          <button
            onClick={() => setRoomMenu((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-[#b58a3c]/50 bg-black/30 px-3 py-1 text-xs font-semibold tracking-wider text-[#e6cf9a] transition hover:border-[#e6b957]"
          >
            LOBBY <span className="text-[#b39a68]">#{roomCode}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {roomMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setRoomMenu(false)} />
              <div className="absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2 rounded-lg border-2 border-[#b58a3c] bg-gradient-to-b from-[#241a0e] to-[#150d06] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#e0b45a]">Join a room</div>
                <form onSubmit={joinRoom} className="flex gap-1.5">
                  <div className="flex min-w-0 flex-1 items-center rounded-md border border-[#b58a3c]/50 bg-black/40 px-2">
                    <span className="text-sm text-[#7a6640]">#</span>
                    <input
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      placeholder="room id"
                      className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-[#f0e2c0] outline-none placeholder:text-[#7a6640]"
                    />
                  </div>
                  <button type="submit" className="rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] px-3 text-sm font-bold text-[#1e1305]">Join</button>
                </form>
                <div className="my-2 border-t border-[#b58a3c]/25" />
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#e0b45a]">Dungeons</div>
                <div className="flex flex-col gap-1">
                  {DUNGEONS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => goDungeon(d.key)}
                      className="flex items-center justify-between rounded-md bg-black/25 px-2.5 py-2 text-left text-sm text-[#f0e2c0] transition hover:bg-black/40"
                    >
                      <span className="font-semibold">{d.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#b39a68]">Tier {d.tier}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {/* controls */}
        <div className="flex items-center gap-2">
          <IconBtn title="Settings" onClick={() => { playClick(); router.push("/settings"); }}><GearIcon /></IconBtn>
          <IconBtn title="Leave to menu" danger onClick={() => { playClick(); router.push("/"); }}><LeaveIcon /></IconBtn>
        </div>
      </div>

      {/* ===== PARTY (top-left) ===== */}
      <Frame className="absolute left-3 top-[4.75rem] z-10 w-64 p-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#e0b45a]">
            Party
            <span className="flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-[8px] normal-case tracking-normal text-[#b39a68]">
              {partyMode === "private" ? <LockIcon size={10} /> : <UnlockIcon size={10} />}
              {partyMode === "private" ? "Private" : "Public"}
            </span>
          </span>
          <span className="text-[10px] text-[#b39a68]">{party.length} / 4</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {party.map((m) => (
            <div key={m.name} className="flex items-center gap-2 rounded-md bg-black/25 p-1.5">
              <Portrait name={m.name} size={30} />
              <span className="flex items-center gap-1 truncate text-sm font-bold">
                {m.name}
                {m.you && user.vip && <VipDiamond size={12} />}
              </span>
              {m.you ? (
                <span className="ml-auto rounded bg-[#e6b957]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#e6b957]">You</span>
              ) : (
                <button
                  onClick={() => kick(m.name)}
                  title={`Kick ${m.name}`}
                  className="ml-auto grid h-6 w-6 place-items-center rounded text-[#e88a6a] transition hover:bg-[#c0392b]/30"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {party.length < 4 && (
          <button
            onClick={() => openModal("friends")}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[#b58a3c]/45 py-1.5 text-xs text-[#b39a68] transition hover:bg-black/20 hover:text-[#e6cf9a]"
          >
            <span className="text-base leading-none">+</span> Invite to party
          </button>
        )}
      </Frame>

      {/* ===== MINIMAP (top-right) ===== */}
      <Frame className="absolute right-3 top-[4.75rem] z-10 w-48 p-2">
        <div className="mb-1 flex items-center justify-between px-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e0b45a]">
          <span>World{worldMeta ? ` - W${worldMeta.week}` : ""}</span>
          <span className="text-[#b39a68]">{worldMeta ? `${worldMeta.online}` : "..."}</span>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded bg-[#0e0a05] ring-1 ring-[#b58a3c]/40">
          <MiniMap meta={worldMeta} hero={heroPos} />
        </div>
        <div className="mt-1 px-0.5 text-[9px] text-[#7a6640]">{heroPos ? `x ${heroPos.x} - y ${heroPos.y}` : "entering world..."}</div>
      </Frame>

      {/* ===== AD BANNER (bottom-right, fills the gap right of the command bar) ===== */}
      <Frame style={{ width: "min(40rem, calc(50vw - 26rem))" }} className="absolute bottom-3 right-3 z-10 flex items-center p-2">
        <div className="relative h-16 w-full overflow-hidden rounded bg-[#0e0a05] ring-1 ring-[#b58a3c]/30">
          <span className="absolute left-1.5 top-1 z-10 text-[8px] font-semibold uppercase tracking-wider text-[#8a734a]">Sponsored</span>
          {AADS_UNIT ? (
            <iframe
              title="sponsored"
              data-aa={AADS_UNIT}
              src={`//acceptable.a-ads.com/${AADS_UNIT}`}
              className="h-full w-full border-0"
              style={{ background: "transparent" }}
            />
          ) : (
            <div className="grid h-full place-items-center text-center text-[10px] text-[#7a6640]">A-ADS banner (set unit id)</div>
          )}
        </div>
      </Frame>

      {/* ===== GLOBAL CHAT (bottom-left) ===== */}
      <Frame className="absolute bottom-3 left-3 z-10 flex h-72 w-[22rem] flex-col p-2">
        <div className="flex items-center gap-2 border-b border-[#b58a3c]/25 px-1 pb-1.5">
          <span className="h-2 w-2 rounded-full bg-[#3ba55d]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e6b957]">Global Chat</span>
        </div>
        <div ref={feed} onScroll={onScroll} className="scroll flex-1 space-y-1.5 overflow-y-auto px-1 py-1.5 text-sm">
          {visibleMessages.length === 0 && <div className="text-[#7a6640]">No messages yet. Say hello.</div>}
          {visibleMessages.map((m) => (
            <div key={m.id} className="leading-snug">
              <span className="mr-1 text-[10px] text-[#7a6640]">{hhmm(m.createdAt)}</span>
              {m.username === "System" ? (
                <span className="font-bold text-[#8a6f42]">System</span>
              ) : (
                <button onClick={() => setProfileName(m.username)} className={`font-bold hover:underline ${m.username === user.username ? "text-[#e6b957]" : "text-[#e0b45a]"}`}>
                  {m.username}
                </button>
              )}
              <span className="text-[#b39a68]">: </span>
              <span className="text-[#f0e2c0]">{m.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Message the world..."
            className="min-w-0 flex-1 rounded-md border border-[#b58a3c]/50 bg-black/40 px-3 py-1.5 text-sm text-[#f0e2c0] outline-none placeholder:text-[#7a6640] focus:border-[#e6b957]"
          />
          <button type="submit" className="rounded-md border border-[#b58a3c] bg-gradient-to-b from-[#c99a4a] to-[#9a6f28] px-3 text-sm font-bold text-[#1e1305]">
            Send
          </button>
        </form>
      </Frame>

      {/* ===== COMMAND BAR (centered between chat and ad) ===== */}
      <Frame style={{ left: "calc(25vw + 384px)" }} className="absolute bottom-3 z-10 flex -translate-x-1/2 items-center gap-4 px-4 py-2">
        <CommandSlot icon={<ShopIcon />} label="Shop" onClick={() => openModal("shop")} />
        <CommandSlot icon={<HomeIcon />} label="Home" onClick={() => { playClick(); router.push("/"); }} />
        <CommandSlot icon={<BagIcon />} label="Bag" onClick={() => openModal("bag")} />
        <CommandSlot icon={<HeroIcon />} label="Heroes" onClick={playClick} />
        <div className="h-12 w-px bg-[#b58a3c]/40" />
        <button
          onClick={() => { playClick(); setMatchmaking(true); }}
          className="rounded-lg border-2 border-[#e6b957] bg-gradient-to-b from-[#f0c374] to-[#c08a3a] px-10 py-3 text-2xl font-black tracking-widest text-[#2a1a08] shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition hover:brightness-110 active:translate-y-[2px]"
        >
          FIND MATCH
        </button>
        <div className="h-12 w-px bg-[#b58a3c]/40" />
        <CommandSlot icon={<UsersIcon />} label="Clan" onClick={() => openModal("clan")} />
        <CommandSlot icon={<FriendIcon />} label="Friends" onClick={() => openModal("friends")} />
        <CommandSlot icon={<EventIcon />} label="Events" onClick={playClick} />
      </Frame>

      {modal === "friends" && (
        <FriendsModal
          onClose={() => setModal(null)}
          onInviteToParty={inviteToParty}
          onJoinFriend={joinFriend}
          partyMode={partyMode}
          partyNames={party.map((m) => m.name)}
          partyFull={party.length >= 4}
        />
      )}
      {modal === "clan" && <ClanModal onClose={() => setModal(null)} />}
      {modal === "shop" && <ShopModal onClose={() => setModal(null)} />}
      {modal === "bag" && <BagModal onClose={() => setModal(null)} />}
      {matchmaking && <MatchmakeModal onClose={() => setMatchmaking(false)} />}
      {profileName && (
        <PlayerCard
          username={profileName}
          onClose={() => setProfileName(null)}
          onInviteToParty={inviteToParty}
          onChanged={loadBlocked}
        />
      )}
    </main>
  );
}
