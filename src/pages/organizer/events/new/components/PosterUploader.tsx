import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/base/ui";
import { cn } from "@/lib/helpers";
import { formatFileSize, POSTER_ACCEPT } from "@/lib/storage";

type Props = {
  file: File | null;
  previewUrl: string | null;
  fallbackUrl?: string;
  onSelect: (file: File) => void;
  onClear: () => void;
  error?: string | null;
};

/**
 * Poster picker used inside the event wizard. The chosen image is uploaded to
 * the `event-posters` bucket and becomes the event background + ticket artwork.
 */
export default function PosterUploader({ file, previewUrl, fallbackUrl, onSelect, onClear, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const shown = previewUrl || fallbackUrl || "";

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onSelect(dropped);
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragging ? "border-primary-500 bg-primary-50" : "border-background-300 bg-background-100"
        )}
      >
        {shown ? (
          <div>
            <div className="relative h-[170px] w-full bg-foreground-950">
              <img
                src={shown}
                alt="Event poster preview"
                title="Event poster preview"
                className="h-full w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-label font-bold uppercase tracking-[0.2em] text-white/70">
                    Poster preview
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-white">
                    {file ? file.name : "Sample poster"}
                  </p>
                  {file && (
                    <p className="text-[10px] text-white/60">{formatFileSize(file.size)} · 16:9 recommended</p>
                  )}
                </div>
                <div className="flex flex-none gap-1.5">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex h-8 cursor-pointer items-center gap-1 rounded-md bg-white/95 px-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black hover:bg-white"
                  >
                    <i className="ri-upload-2-line text-[12px]" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={onClear}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-black/45 text-white hover:bg-black/65"
                    aria-label="Remove poster"
                  >
                    <i className="ri-delete-bin-line text-[12px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-9 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-background-300 bg-background-50 text-foreground-700">
              <i className="ri-image-add-line text-lg" />
            </span>
            <span className="text-xs font-bold text-foreground-950">Upload your event poster</span>
            <span className="max-w-xs text-[10.5px] leading-relaxed text-foreground-500">
              Drag an image here or click to browse. JPG, PNG, WebP or AVIF up to 5 MB — portrait or
              16:9 both work.
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={POSTER_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) onSelect(picked);
          event.target.value = "";
        }}
      />

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-primary-700">
          <i className="ri-error-warning-line text-[13px]" /> {error}
        </p>
      )}

      {!shown && (
        <div className="mt-2">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <i className="ri-upload-cloud-line" /> Choose a file
          </Button>
        </div>
      )}

      <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground-500">
        <i className="ri-information-line mt-px text-[12px]" />
        This one image is used everywhere — the Discover card, the event page background and every
        ticket your guests download.
      </p>
    </div>
  );
}