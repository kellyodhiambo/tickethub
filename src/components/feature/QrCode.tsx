import { useMemo } from "react";
import { cn } from "@/lib/helpers";

const GRID = 25;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function QrCode({
  value,
  size = 200,
  className,
  tone = "dark",
}: {
  value: string;
  size?: number;
  className?: string;
  tone?: "dark" | "light";
}) {
  const cells = useMemo(() => {
    const random = mulberry32(hashSeed(value));
    const matrix: boolean[][] = [];
    for (let row = 0; row < GRID; row += 1) {
      const line: boolean[] = [];
      for (let col = 0; col < GRID; col += 1) {
        const inFinder =
          (row < 8 && col < 8) || (row < 8 && col > GRID - 9) || (row > GRID - 9 && col < 8);
        line.push(inFinder ? false : random() > 0.47);
      }
      matrix.push(line);
    }
    return matrix;
  }, [value]);

  const dark = tone === "dark" ? "bg-black" : "bg-neutral-300";

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg bg-white p-2", className)}
      style={{ width: size, height: size }}
      aria-label={`QR code for ticket ${value}`}
      role="img"
    >
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`, gap: "1px" }}
      >
        {cells.flatMap((row, rowIndex) =>
          row.map((filled, colIndex) => (
            <span
              key={`${rowIndex}-${colIndex}`}
              className={filled ? dark : "bg-transparent"}
              style={{ aspectRatio: "1 / 1" }}
            />
          ))
        )}
      </div>

      <Finder position="left-2 top-2" dark={dark} />
      <Finder position="right-2 top-2" dark={dark} />
      <Finder position="bottom-2 left-2" dark={dark} />
    </div>
  );
}

function Finder({ position, dark }: { position: string; dark: string }) {
  return (
    <span
      className={cn(
        "absolute flex items-center justify-center rounded-[3px] border-[3px] border-black bg-white",
        position
      )}
      style={{ width: "24%", height: "24%" }}
    >
      <span className={cn("block", dark)} style={{ width: "62%", height: "62%", borderRadius: 2 }} />
    </span>
  );
}