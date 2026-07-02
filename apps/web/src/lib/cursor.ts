"use client";

// The equipped sword IS the cursor. We tint the base sword cursor to the
// weapon's colour and set it as a CSS variable that globals.css reads.
let base: HTMLImageElement | null = null;

export function setSwordCursor(color: string): void {
  if (typeof window === "undefined") return;
  const apply = () => {
    if (!base) return;
    const s = 30;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0, s, s);
    // tint the blade
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    document.documentElement.style.setProperty("--game-cursor", `url(${c.toDataURL()}) 3 3, auto`);
  };
  if (base && base.complete) apply();
  else {
    base = new Image();
    base.onload = apply;
    base.src = "/sword-cursor.png";
  }
}
