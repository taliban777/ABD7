/**
 * Cloudinary image transformation utilities.
 * Dynamically injects optimization parameters into Cloudinary URLs.
 */

const CLOUDINARY_DOMAIN = "res.cloudinary.com";

/**
 * Check if a URL is a Cloudinary URL.
 */
function isCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes(CLOUDINARY_DOMAIN);
  } catch {
    return false;
  }
}

/**
 * Inject transformation parameters into a Cloudinary URL.
 * Example: https://res.cloudinary.com/account/image/upload/v1234/file.jpg
 * Becomes: https://res.cloudinary.com/account/image/upload/w_500,h_500,c_fill,q_auto,f_auto/v1234/file.jpg
 */
function injectTransformation(url: string, transformation: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;

    // Cloudinary URLs follow: /account/image/upload/[transformations]/[public-id]
    // We need to inject transformations after /upload/
    const uploadMatch = pathname.match(/^(\/[^/]+\/image\/upload\/)(.*?)$/);

    if (!uploadMatch) {
      return url;
    }

    const [, prefix, suffix] = uploadMatch;

    // If transformation already exists, replace it; otherwise add it
    const newPathname = `${prefix}${transformation}/${suffix}`;
    u.pathname = newPathname;

    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Get archive thumbnail URL with optimization.
 * Preserves the artwork's natural aspect ratio — no forced square crop.
 * Parameters: w_800,q_auto:good,f_auto
 * - w_800: wide enough for 4-column grid at 2× pixel density
 * - q_auto:good: balanced quality tier (preserves gradients, print details)
 * - f_auto: automatic format selection (WebP, AVIF, etc.)
 * No height or crop parameter — natural proportions are honoured.
 */
export function getArchiveImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_800,q_auto:good,f_auto");
}

/**
 * Get project detail hero image URL — LCP image, loaded eagerly at high res.
 * Parameters: w_1400,q_auto:good,f_auto
 * - w_1400: enough for any 2x display up to ~700px CSS wide
 * - q_auto:good: artwork-safe quality tier
 * - f_auto: WebP/AVIF automatic format selection
 */
export function getProjectImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_1400,q_auto:good,f_auto");
}

/**
 * Get gallery thumbnail URL — smaller images used in the horizontal strip.
 * Parameters: w_600,h_600,c_fill,q_auto:good,f_auto
 */
export function getGalleryThumbUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_600,h_600,c_fill,q_auto:good,f_auto");
}

/**
 * Get related-projects card URL — compact cards, lower bandwidth needed.
 * Parameters: w_400,h_400,c_fill,q_auto:eco,f_auto
 */
export function getRelatedImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_400,h_400,c_fill,q_auto:eco,f_auto");
}

/**
 * Get a small square thumbnail for use in the homepage strip wall.
 * Parameters: w_140,h_140,c_fill,q_auto:eco,f_auto
 * - w_140,h_140: tiles are displayed at exactly 140 × 140 px (TILE_SIZE),
 *   so 240 px was delivering ~70% more data than required.
 * - c_fill: fill the square, crop if needed
 * - q_auto:eco: lower quality tier — keeps the page very fast
 * - f_auto: automatic format selection (WebP, AVIF)
 */
export function getStripThumbnailUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_140,h_140,c_fill,q_auto:eco,f_auto");
}

/**
 * Get a collection-grid image URL for the "Others" page — preserves aspect ratio.
 * Parameters: w_800,q_auto:good,f_auto
 * - w_800: wide enough for 3-column masonry grid
 * - q_auto:good: artwork-safe quality tier
 * - f_auto: WebP/AVIF automatic format selection
 * No height or crop — images keep their natural aspect ratio.
 */
export function getOthersImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_800,q_auto:good,f_auto");
}

/**
 * Get an Open Graph image URL — 1200×630 crop for social sharing previews.
 * Crawlers (Facebook, Twitter, Slack, iMessage) time out on large originals.
 * Parameters: w_1200,h_630,c_fill,g_auto,q_auto:good,f_jpg
 * - c_fill + g_auto: smart centre crop to OG dimensions
 * - f_jpg: force JPEG — PNG is blocked by some crawlers, WebP by others
 */
export function getOgImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_1200,h_630,c_fill,g_auto,q_auto:good,f_jpg");
}

/**
 * Get a hero image URL for the Others detail page — high res, aspect-ratio preserved.
 */
export function getOthersHeroImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_1400,q_auto:good,f_auto");
}

/**
 * Get a gallery thumbnail URL for the Others detail page — preserves aspect ratio.
 */
export function getOthersGalleryThumbUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_600,q_auto:good,f_auto");
}
