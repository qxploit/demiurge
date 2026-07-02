// Uniform grid spatial hash for broad-phase neighbour queries and area-of-interest
// culling. Buckets keep insertion order (plain arrays) so queries are deterministic.
export class SpatialHash {
  private readonly cell: number;
  private readonly buckets = new Map<string, number[]>();

  constructor(cellSize: number) {
    this.cell = cellSize;
  }

  private c(v: number): number {
    return Math.floor(v / this.cell);
  }
  private key(cx: number, cy: number): string {
    return cx + ":" + cy;
  }

  clear(): void {
    this.buckets.clear();
  }

  insert(id: number, x: number, y: number): void {
    const k = this.key(this.c(x), this.c(y));
    const b = this.buckets.get(k);
    if (b) b.push(id);
    else this.buckets.set(k, [id]);
  }

  /** append every entity id whose cell overlaps the box into `out`, return `out` */
  queryBox(minx: number, miny: number, maxx: number, maxy: number, out: number[]): number[] {
    const x0 = this.c(minx);
    const x1 = this.c(maxx);
    const y0 = this.c(miny);
    const y1 = this.c(maxy);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const b = this.buckets.get(this.key(cx, cy));
        if (b) for (let i = 0; i < b.length; i++) out.push(b[i]);
      }
    }
    return out;
  }
}
