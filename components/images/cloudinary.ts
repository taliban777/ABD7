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
 * Props object that can be spread directly onto an <img> element.
 * `srcSet` / `sizes` are omitted (undefined) for non-Cloudinary URLs so the
 * plain `src` still renders correctly.
 */
export interface ResponsiveImgProps {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Build a Cloudinary `srcset` string across a set of candidate widths.
 *
 * @param url         Original Cloudinary URL.
 * @param widths      Candidate widths, ascending.
 * @param square      When true, each candidate is a square c_fill crop.
 * @param quality     Cloudinary quality tier.
 */
function buildSrcSet(
  url: string,
  widths: number[],
  square = false,
  quality = "q_auto:good",
): string {
  return widths
    .map((w) => {
      const transformation = square
        ? `w_${w},h_${w},c_fill,${quality},f_auto`
        : `w_${w},${quality},f_auto`;
      return `${injectTransformation(url, transformation)} ${w}w`;
    })
    .join(", ");
}

/**
 * Assemble a full responsive image descriptor.
 * Falls back to a bare `src` when the URL is not served by Cloudinary.
 */
function responsive(
  url: string,
  fallbackSrc: string,
  widths: number[],
  sizes: string,
  square = false,
  quality = "q_auto:good",
): ResponsiveImgProps {
  if (!url) return { src: "" };
  if (!isCloudinaryUrl(url)) return { src: url };

  return {
    src: fallbackSrc,
    srcSet: buildSrcSet(url, widths, square, quality),
    sizes,
  };
}

/* -----------------------------------------------------------------------------
   `sizes` declarations — these must mirror the CSS grid definitions.
   Archive grid  (archive.module.css): 4 cols → 3 cols @800px → 2 cols @640px,
                                       inside a 24px-padded full-bleed wrapper.
   Others grid   (others.module.css):  1 col → 2 cols @640px → 3 cols @1024px.
   -------------------------------------------------------------------------- */
const ARCHIVE_SIZES = "(max-width: 640px) 46vw, (max-width: 800px) 31vw, 24vw";
const OTHERS_SIZES = "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw";
const RELATED_SIZES = "(max-width: 640px) 40vw, 180px";

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
 * Responsive descriptor for archive grid covers.
 * A phone at 2 columns downloads ~400w instead of the fixed 800w original.
 */
export function getArchiveImageProps(url: string): ResponsiveImgProps {
  return responsive(
    url,
    getArchiveImageUrl(url),
    [200, 300, 400, 600, 800, 1200],
    ARCHIVE_SIZES,
    true,
  );
}

/**
 * Small fixed 64px list-view thumbnail. Serving the 800w archive image here
 * wasted roughly 12× the bytes actually rendered.
 * Parameters: w_128,q_auto:eco,f_auto (128 = 64 CSS px at 2× density)
 */
export function getListThumbUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_128,q_auto:eco,f_auto");
}

/**
 * Floating hover preview on the Index page — rendered at a fixed 180×180.
 * Parameters: w_360,h_360,c_fill,q_auto:eco,f_auto
 */
export function getIndexHoverThumbUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_360,h_360,c_fill,q_auto:eco,f_auto");
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
 * Responsive descriptor for related-project cards.
 */
export function getRelatedImageProps(url: string): ResponsiveImgProps {
  return responsive(
    url,
    getRelatedImageUrl(url),
    [160, 240, 320, 480],
    RELATED_SIZES,
    true,
    "q_auto:eco",
  );
}

/**
 * Get a small square thumbnail for use in the homepage strip wall.
 * Parameters: w_240,h_240,c_fill,q_auto:eco,f_auto
 * - w_240,h_240: tiny square, sufficient for strip wall density
 * - c_fill: fill the square, crop if needed
 * - q_auto:eco: lower quality tier — keeps the page very fast
 * - f_auto: automatic format selection (WebP, AVIF)
 */
export function getStripThumbnailUrl(url: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  return injectTransformation(url, "w_240,h_240,c_fill,q_auto:eco,f_auto");
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
 * Responsive descriptor for the Others collection grid.
 * Aspect ratio is preserved — no square crop.
 */
export function getOthersImageProps(url: string): ResponsiveImgProps {
  return responsive(
    url,
    getOthersImageUrl(url),
    [300, 480, 640, 800, 1200],
    OTHERS_SIZES,
  );
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
