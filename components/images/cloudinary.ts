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
 * Prioritizes artwork quality while optimizing delivery.
 * Parameters: w_700,h_700,c_fill,q_auto:good,f_auto
 * - w_700,h_700: 700x700 square (larger size preserves texture and detail)
 * - c_fill: fill the entire area, crop if needed
 * - q_auto:good: balanced quality tier (preserves gradients, print details)
 * - f_auto: automatic format selection (WebP, AVIF, etc.)
 */
export function getArchiveImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_700,h_700,c_fill,q_auto:good,f_auto");
}

/**
 * Get project detail page URL with higher resolution.
 * Emphasizes artwork quality at larger display sizes.
 * Parameters: w_1800,q_auto:good,f_auto
 * - w_1800: up to 1800px width, maintains aspect ratio (larger for detail viewing)
 * - q_auto:good: balanced quality tier for artwork preservation
 * - f_auto: automatic format selection
 */
export function getProjectImageUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_1800,q_auto:good,f_auto");
}
