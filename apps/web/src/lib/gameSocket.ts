"use client";

import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

// Connect to the same origin on a custom path that the Next server proxies to
// the game backend. This way a single Cloudflare tunnel (web origin) serves the
// world socket too - no separate API tunnel needed.
export function connectGame(): Socket {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return io(origin, {
    path: "/gamesock",
    addTrailingSlash: false,
    transports: ["polling", "websocket"],
    auth: { token: getToken() },
    reconnection: true,
  });
}
