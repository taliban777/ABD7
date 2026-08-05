import type { CmsProject } from "@/components/archive/types";

// ─── Exhibition layout variants ───────────────────────────────────────────────
export type ExhibitionLayoutId =
  | "marquee"          // 01 — horizontal drifting marquee
  | "vertical"         // 02 — vertical architectural composition
  | "glow"             // 03 — white glow on hover
  | "mali"             // 04 — vol 1+2 side-by-side, vol 3 full-width
  | "fragment";        // 05 — fragment shatter on hover

// ─── Static exhibition config ─────────────────────────────────────────────────
export interface ExhibitionConfig {
  id: string;
  number: string;          // e.g. "01"
  title: string;
  subtitle?: string;       // optional secondary line, e.g. "(The Mali Selections)"
  description: string[];   // each element = one paragraph
  workTitles: string[];    // ordered list of CMS project titles to resolve
  layout: ExhibitionLayoutId;
  axisLabels?: string[];   // Exhibition 02 only — one label per artwork
}

// ─── Resolved exhibition (with CMS projects matched) ─────────────────────────
export interface CurationExhibition extends ExhibitionConfig {
  works: CmsProject[];
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Resolve a static ExhibitionConfig into a CurationExhibition by matching
 * each workTitle (case-insensitive trim) against the provided CmsProject array.
 * Order is preserved. Works without a CMS match are silently omitted.
 */
export function resolveExhibition(
  config: ExhibitionConfig,
  allProjects: CmsProject[]
): CurationExhibition {
  const works: CmsProject[] = [];
  for (const title of config.workTitles) {
    const match = allProjects.find(
      (p) => p.title.trim().toLowerCase() === title.trim().toLowerCase()
    );
    if (match) works.push(match);
  }
  return { ...config, works };
}
