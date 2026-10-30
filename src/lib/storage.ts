import { supabase } from "@/lib/supabase";

/** Public bucket that holds every event poster uploaded by organizers. */
export const POSTER_BUCKET = "event-posters";
export const POSTER_MAX_BYTES = 2 * 1024 * 1024;
const POSTER_MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const POSTER_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

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
  if (file.size > POSTER_MAX_INPUT_BYTES) {
    return `That source image is ${formatFileSize(file.size)}. Please choose an image under 25 MB so your browser can optimize it.`;
  }
  return null;
}

const POSTER_MAX_DIMENSION = 1920;
const POSTER_TARGET_BYTES = POSTER_MAX_BYTES;

/** Resize and re-encode uploaded posters in the browser before they reach Storage. */
async function compressPoster(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image could not be opened. Please save it as JPG, PNG or WebP and try again.");
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the poster for upload.");

    let compressed: Blob | null = null;
    let scale = Math.min(1, POSTER_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    for (let resizePass = 0; resizePass < 6; resizePass += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32]) {
        compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (compressed && compressed.size <= POSTER_TARGET_BYTES) break;
      }
      if (compressed && compressed.size <= POSTER_TARGET_BYTES) break;
      scale *= 0.8;
    }
    if (!compressed) throw new Error("Your browser could not compress this poster. Try a JPG or WebP image.");
    if (compressed.size > POSTER_MAX_BYTES) throw new Error("Your browser could not reduce this poster enough to upload. Please try another image.");

    const baseName = file.name.replace(/\.[^.]+$/, "") || "event-poster";
    return new File([compressed], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

/**
 * Uploads a poster into the public `event-posters` bucket under the organizer's
 * own folder and returns the public URL that is stored on the event.
 */
export async function uploadEventPoster(file: File, userId: string): Promise<string> {
  const problem = validatePoster(file);
  if (problem) throw new Error(problem);

  const optimizedFile = await compressPoster(file);

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase.storage.from(POSTER_BUCKET).upload(path, optimizedFile, {
    cacheControl: "31536000",
    upsert: false,
    contentType: "image/webp",
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
