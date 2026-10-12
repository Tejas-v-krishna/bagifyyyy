/**
 * Canonical image-format registry shared by the client upload helpers and the
 * server API routes.
 *
 * Why this file exists: every allow-list used to be duplicated (and drifted)
 * across `studioUpload.ts`, `/api/studio/upload`, `/api/account/avatar` and
 * `/api/studio/blob-upload`. iPhones shoot HEIC/HEIF by default, and some
 * browsers hand the file over with an EMPTY MIME type, so validation here is
 * deliberately lenient: any `image/*` subtype is accepted, plus a known file
 * extension, plus a magic-byte sniff for the truly headerless edge cases.
 */

/** Every image MIME type we accept. */
export const IMAGE_MIME_TYPES: string[] = [
  // Core web formats
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/apng",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  // Apple / iPhone (HEIC & HEIF families)
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  // Other common raster formats
  "image/bmp",
  "image/x-ms-bmp",
  "image/tiff",
  "image/x-tiff",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  // Next-gen / pro formats
  "image/jxl",
  "image/jp2",
  "image/jpx",
  "image/j2k",
  "image/jpm",
];

/** Every image file extension we accept (lower-case, with a leading dot). */
export const IMAGE_FILE_EXTENSIONS: string[] = [
  ".jpg",
  ".jpeg",
  ".jpe",
  ".jfif",
  ".jfi",
  ".png",
  ".apng",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
  ".heic",
  ".heif",
  ".heics",
  ".heifs",
  ".hif",
  ".bmp",
  ".dib",
  ".tif",
  ".tiff",
  ".ico",
  ".cur",
  ".jxl",
  ".jp2",
  ".j2k",
  ".jpf",
  ".jpx",
  ".jpm",
];

/** MIME -> preferred on-disk extension. */
export const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/jfif": ".jpg",
  "image/png": ".png",
  "image/apng": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/heic-sequence": ".heic",
  "image/heif-sequence": ".heif",
  "image/bmp": ".bmp",
  "image/x-ms-bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/x-tiff": ".tiff",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "image/jxl": ".jxl",
  "image/jp2": ".jp2",
  "image/jpx": ".jpx",
  "image/j2k": ".j2k",
  "image/jpm": ".jpm",
};

/**
 * Value for an `<input type="file" accept="...">` attribute.
 * `image/*` lets iOS/Android photo pickers show every photo (including HEIC);
 * the explicit extensions keep desktop file dialogs filtering correctly.
 */
export const IMAGE_ACCEPT_ATTRIBUTE = ["image/*", ...IMAGE_FILE_EXTENSIONS].join(",");

/** Human-readable list used in error messages. */
export const IMAGE_FORMATS_HINT =
  "JPEG, PNG, WebP, AVIF, GIF, HEIC/HEIF, BMP, TIFF, SVG, ICO or JPEG XL";

/** Resolve an extension from a MIME type (returns null when unknown). */
export function extFromMime(mime: string): string | null {
  return IMAGE_MIME_TO_EXT[(mime || "").toLowerCase().trim()] || null;
}

/** Resolve a supported extension from a filename (returns null when unknown). */
export function extFromFilename(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(name || "");
  if (!match) return null;
  const ext = `.${match[1].toLowerCase()}`;
  return IMAGE_FILE_EXTENSIONS.includes(ext) ? ext : null;
}

/**
 * Lenient client-side check: accepts any `image/*` MIME type, a known
 * extension, or (as a last resort) anything whose name looks image-like.
 */
export function isSupportedImageFile(file: File): boolean {
  if (!(file instanceof File)) return false;
  const mime = (file.type || "").toLowerCase().trim();
  if (mime.startsWith("image/")) return true;
  if (IMAGE_MIME_TYPES.includes(mime)) return true;
  return extFromFilename(file.name || "") !== null;
}

/**
 * Magic-byte sniffing for files handed over with no MIME type AND no
 * extension — a surprisingly common iOS / camera-roll edge case.
 * `bytes` should be the first ~32 bytes of the file.
 */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (!bytes || bytes.length < 12) return null;
  const at = (offset: number, signature: string) =>
    signature.split("").every((c, i) => bytes[offset + i] === c.charCodeAt(0));

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && at(1, "PNG")) return "image/png";
  // GIF: "GIF87a" / "GIF89a"
  if (at(0, "GIF8")) return "image/gif";
  // BMP: "BM"
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  // TIFF: little-endian "II*\0" or big-endian "MM\0*"
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00)
  ) {
    return "image/tiff";
  }
  // WebP: "RIFF"…"WEBP"
  if (at(0, "RIFF") && at(8, "WEBP")) return "image/webp";
  // ISO-BMFF container (HEIC / HEIF / AVIF / JXL / JPEG2000): "…ftyp<brand>"
  if (at(4, "ftyp")) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
    if (
      brand.startsWith("heic") ||
      brand.startsWith("heix") ||
      brand.startsWith("hevc") ||
      brand.startsWith("hevx") ||
      brand.startsWith("heim") ||
      brand.startsWith("heis") ||
      brand.startsWith("heif") ||
      brand.startsWith("mif1") ||
      brand.startsWith("msf1")
    ) {
      return "image/heic";
    }
    if (brand.startsWith("jxl")) return "image/jxl";
    if (brand.startsWith("jp2")) return "image/jp2";
  }
  // SVG (text): starts with "<svg" or an XML prologue
  const head = String.fromCharCode(...bytes.slice(0, 16))
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "image/svg+xml";

  return null;
}
