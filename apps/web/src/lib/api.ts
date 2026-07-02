export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const TOKEN_KEY = "demiurge_token";

export type UserStatus = "online" | "idle" | "dnd" | "invisible";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  status: UserStatus;
  level: number;
  xp: number;
  prestige: number;
  xpToNext: number;
  vip: boolean;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string): void {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = Array.isArray(json.message) ? json.message[0] : json.message;
    throw new Error(m || "Something went wrong.");
  }
  return json;
}

export async function signup(data: {
  email: string;
  username: string;
  password: string;
}): Promise<AuthUser> {
  const json = await post("/auth/signup", data);
  setToken(json.token);
  return json.user;
}

export async function signin(data: { email: string; password: string }): Promise<AuthUser> {
  const json = await post("/auth/signin", data);
  setToken(json.token);
  return json.user;
}

export async function setStatus(status: UserStatus): Promise<AuthUser> {
  const t = getToken();
  const res = await fetch(`${API_URL}/auth/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Failed to update status.");
  return json;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  createdAt: number;
}

export async function getChat(): Promise<ChatMessage[]> {
  const t = getToken();
  if (!t) return [];
  try {
    const res = await fetch(`${API_URL}/chat`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function sendChat(text: string): Promise<void> {
  const t = getToken();
  if (!t) return;
  await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}

export async function me(): Promise<AuthUser | null> {
  const t = getToken();
  if (!t) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      clearToken();
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

// authed fetch that throws a clean message on failure
async function authed(path: string, options: RequestInit = {}) {
  const t = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const m = Array.isArray(json?.message) ? json.message[0] : json?.message;
    throw new Error(m || "Something went wrong.");
  }
  return json;
}

export const subscribeVip = (): Promise<AuthUser> => authed("/auth/vip", { method: "POST" });

/* ---- friends ---- */
export interface Friend {
  id: string;
  username: string;
  status: UserStatus;
  level: number;
  prestige: number;
  vip: boolean;
}
export const getFriends = (): Promise<Friend[]> => authed("/friends");
export const addFriend = (username: string): Promise<Friend[]> =>
  authed("/friends", { method: "POST", body: JSON.stringify({ username }) });
export const removeFriend = (id: string): Promise<Friend[]> =>
  authed(`/friends/${id}`, { method: "DELETE" });
export const blockUser = (id: string): Promise<Friend[]> =>
  authed("/friends/block", { method: "POST", body: JSON.stringify({ id }) });
export const unblockUser = (id: string): Promise<Friend[]> =>
  authed(`/friends/block/${id}`, { method: "DELETE" });
export const getBlocked = (): Promise<Friend[]> => authed("/friends/blocked/list");

export interface PlayerProfile {
  id: string;
  username: string;
  status: UserStatus;
  level: number;
  prestige: number;
  vip: boolean;
  joined: number;
  isFriend: boolean;
  isBlocked: boolean;
  isSelf: boolean;
}
export const getProfile = (username: string): Promise<PlayerProfile> =>
  authed(`/users/${encodeURIComponent(username)}`);

/* ---- gear / weapons ---- */
export interface WeaponEntry {
  id: string;
  name: string;
  tier: number;
  power: number;
  price: number;
  color: string;
  owned: boolean;
  enchant: number;
  effectivePower: number;
  enchantCost: number;
}
export interface GearState {
  gold: number;
  equipped: string;
  maxEnchant: number;
  weapons: WeaponEntry[];
}
export const getGear = (): Promise<GearState> => authed("/gear");
export const buyWeapon = (weaponId: string): Promise<GearState> =>
  authed("/gear/buy", { method: "POST", body: JSON.stringify({ weaponId }) });
export const equipWeapon = (weaponId: string): Promise<GearState> =>
  authed("/gear/equip", { method: "POST", body: JSON.stringify({ weaponId }) });
export const enchantWeapon = (weaponId: string): Promise<GearState> =>
  authed("/gear/enchant", { method: "POST", body: JSON.stringify({ weaponId }) });

/* ---- clan ---- */
export interface ClanMember {
  id: string;
  username: string;
  status: UserStatus;
  level: number;
  prestige: number;
  vip: boolean;
}
export interface Clan {
  id: string;
  name: string;
  tag: string;
  ownerId: string;
  discord: string;
  isOwner: boolean;
  members: ClanMember[];
  requests: ClanMember[];
}
export interface ClanBrowseItem {
  id: string;
  name: string;
  tag: string;
  members: number;
  discord: string;
  requested: boolean;
}
export const getClan = (): Promise<Clan | null> => authed("/clan");
export const browseClans = (): Promise<ClanBrowseItem[]> => authed("/clan/browse");
export const createClan = (name: string, tag: string): Promise<Clan> =>
  authed("/clan", { method: "POST", body: JSON.stringify({ name, tag }) });
export const requestJoinClan = (clanId: string): Promise<{ requested: boolean }> =>
  authed("/clan/request", { method: "POST", body: JSON.stringify({ clanId }) });
export const cancelClanRequest = (clanId: string): Promise<{ requested: boolean }> =>
  authed("/clan/request/cancel", { method: "POST", body: JSON.stringify({ clanId }) });
export const acceptClanRequest = (userId: string): Promise<Clan> =>
  authed("/clan/requests/accept", { method: "POST", body: JSON.stringify({ userId }) });
export const denyClanRequest = (userId: string): Promise<Clan> =>
  authed("/clan/requests/deny", { method: "POST", body: JSON.stringify({ userId }) });
export const updateClanSettings = (data: { discord?: string; name?: string }): Promise<Clan> =>
  authed("/clan/settings", { method: "PATCH", body: JSON.stringify(data) });
export const kickClanMember = (userId: string): Promise<Clan> =>
  authed("/clan/kick", { method: "POST", body: JSON.stringify({ userId }) });
export const leaveClan = (): Promise<null> => authed("/clan/leave", { method: "POST" });

/* ---- shop ---- */
export interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: string;
  owned: boolean;
}
export interface ShopState {
  gold: number;
  items: ShopItem[];
}
export const getShop = (): Promise<ShopState> => authed("/shop");
export const buyItem = (itemId: string): Promise<ShopState> =>
  authed("/shop/buy", { method: "POST", body: JSON.stringify({ itemId }) });
