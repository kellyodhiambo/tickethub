import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/helpers";

export default function QrCode({
  value,
  size = 200,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
  tone?: "dark" | "light";
}) {
  const [source, setSource] = useState("");

  useEffect(() => {
    let active = true;
    setSource("");
    if (!value) return () => { active = false; };

    void QRCode.toDataURL(value, {
      width: Math.max(256, size * 2),
      margin: 3,
      errorCorrectionLevel: "Q",
      color: { dark: "#000000", light: "#ffffff" },
    }).then((dataUrl) => {
      if (active) setSource(dataUrl);
    }).catch(() => {
      if (active) setSource("");
    });

    return () => { active = false; };
  }, [size, value]);

  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden rounded-md bg-white", className)}
      style={{ width: size, height: size, padding: Math.max(4, Math.round(size * 0.04)) }}
      aria-label={`QR code for ticket ${value}`}
      role="img"
    >
      {source ? (
        <img src={source} alt={`Scannable ticket QR code ${value}`} className="block h-full w-full" style={{ imageRendering: "pixelated" }} />
      ) : (
        <span className="text-center text-[10px] font-semibold text-black/50">Creating secure QR…</span>
      )}
    </div>
  );
}
