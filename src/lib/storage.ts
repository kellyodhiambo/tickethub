import { supabase } from "@/lib/supabase";

/** Public bucket that holds every event poster uploaded by organizers. */
export const POSTER_BUCKET = "event-posters";
export const POSTER_MAX_BYTES = 5 * 1024 * 1024;
export const POSTER_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const extensionFor = (file: File): string => {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^(jpe?g|png|webp|avif)$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return byType[file.type] ?? "jpg";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Returns a human readable problem, or null when the poster is usable. */
export function validatePoster(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "That file type is not supported. Upload a JPG, PNG, WebP or AVIF image.";
  }
  if (file.size > POSTER_MAX_BYTES) {
    return `That poster is ${formatFileSize(file.size)}. Please keep it under 5 MB.`;
  }
  return null;
}

/**
 * Uploads a poster into the public `event-posters` bucket under the organizer's
 * own folder and returns the public URL that is stored on the event.
 */
export async function uploadEventPoster(file: File, userId: string): Promise<string> {
  const problem = validatePoster(file);
  if (problem) throw new Error(problem);

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;

  const { error } = await supabase.storage.from(POSTER_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(POSTER_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("The poster uploaded but no link came back. Please try again.");
  return data.publicUrl;
}

/** Best effort cleanup when an organizer swaps a poster out before publishing. */
export async function removeEventPoster(publicUrl: string): Promise<void> {
  const marker = `/object/public/${POSTER_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  if (!path) return;
  await supabase.storage.from(POSTER_BUCKET).remove([path]);
}