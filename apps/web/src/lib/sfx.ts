// The signature sword click. New Audio per call so rapid clicks overlap.
export function playClick(): void {
  if (typeof window === "undefined") return;
  try {
    const a = new Audio("/audio/sword-click.wav");
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
