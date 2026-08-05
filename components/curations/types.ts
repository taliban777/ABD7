import type { CmsProject } from "@/components/archive/types";
import { projectSlug } from "@/components/archive/types";

// ─── Exhibition layout variants ───────────────────────────────────────────────
export type ExhibitionLayoutId =
  | "marquee"          // 01 — horizontal drifting marquee
  | "vertical"         // 02 — vertical architectural composition
  | "glow"             // 03 — white glow on hover
  | "mali"             // 04 — vol 1+2 side-by-side, vol 3 full-width
  | "fragment";        // 05 — fragment shatter on hover

// ─── Which image key to pull from a CmsProject ───────────────────────────────
export type ImageKey =
  | "frontCover"
  | "backCover"
  | { gallery: number };      // gallery[index]

// ─── Slug entry — a CMS slug plus an optional image key override ──────────────
export type SlugEntry =
  | string                   // shorthand — uses frontCover
  | { slug: string; imageKey: ImageKey };

// ─── Static exhibition config ─────────────────────────────────────────────────
export interface ExhibitionConfig {
  id: string;
  number: string;          // e.g. "01"
  title: string;
  subtitle?: string;       // optional secondary line, e.g. "(The Mali Selections)"
  description: string[];   // each element = one paragraph
  /**
   * Ordered list of CMS project slugs to resolve.
   * Each entry may be a plain slug string (uses frontCover)
   * or a { slug, imageKey } object for specific image selection.
   * Never hardcode artwork data — always reference by slug.
   */
  slugs: SlugEntry[];
  layout: ExhibitionLayoutId;
  axisLabels?: string[];   // Exhibition 02 only — one label per artwork
}

// ─── A resolved artwork within an exhibition ─────────────────────────────────
export interface ExhibitionWork {
  project: CmsProject;
  imageUrl: string;        // the resolved image URL for this specific appearance
}

// ─── Resolved exhibition (with CMS projects matched) ─────────────────────────
export interface CurationExhibition extends ExhibitionConfig {
  works: ExhibitionWork[];
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

function resolveImageUrl(project: CmsProject, imageKey: ImageKey): string {
  if (imageKey === "frontCover") return project.frontCover ?? "";
  if (imageKey === "backCover")  return project.backCover  ?? project.frontCover ?? "";
  if (typeof imageKey === "object" && "gallery" in imageKey) {
    const gallery = project.gallery ?? [];
    return gallery[imageKey.gallery] ?? project.frontCover ?? "";
  }
  return project.frontCover ?? "";
}

/**
 * Resolve a static ExhibitionConfig into a CurationExhibition by matching
 * each slug entry against the provided CmsProject array via projectSlug().
 * Order is preserved. Slugs without a CMS match are silently skipped.
 */
export function resolveExhibition(
  config: ExhibitionConfig,
  allProjects: CmsProject[]
): CurationExhibition {
  const works: ExhibitionWork[] = [];

  for (const entry of config.slugs) {
    const slug       = typeof entry === "string" ? entry : entry.slug;
    const imageKey: ImageKey = typeof entry === "string" ? "frontCover" : entry.imageKey;

    const project = allProjects.find((p) => projectSlug(p) === slug);
    if (!project) continue;

    works.push({ project, imageUrl: resolveImageUrl(project, imageKey) });
  }

  return { ...config, works };
}
