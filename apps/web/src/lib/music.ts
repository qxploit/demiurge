// Single persistent music instance, stored on window so it survives hot-reload
// (otherwise dev HMR stacks multiple <audio> elements all playing at once).

export function getMusic(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { __demiurgeMusic?: HTMLAudioElement };
  if (!w.__demiurgeMusic) {
    const a = new Audio("/audio/theme.wav");
    a.loop = true;
    a.preload = "auto";
    w.__demiurgeMusic = a;
  }
  return w.__demiurgeMusic;
}
