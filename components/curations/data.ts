import type { ExhibitionConfig } from "./types";

/**
 * Static exhibition configurations for the Curations section.
 *
 * IMPORTANT: Artwork is NEVER hardcoded here.
 * Every curation references CMS projects exclusively by slug.
 * At build time the resolver filters the full CMS project collection
 * to the listed slugs and pulls the correct image field from each project.
 * If a slug is not found it is silently skipped — no crash.
 * Exhibitions automatically update whenever the CMS project changes.
 *
 * To add a new exhibition, append an entry here — no other file changes needed.
 */
export const EXHIBITIONS: ExhibitionConfig[] = [
  // ── 01 — Can You See the Colour? ──────────────────────────────────────────
  {
    id: "01",
    number: "01",
    title: "Can You See the Colour?",
    description: [
      "Monochrome is the ultimate color of discernment. It is the precise state where complex hues collapse into a singular spectrum, establishing a baseline that forces perception toward what actually endures beneath the surface.",
      "Darkness functions as an essential canvas providing the structural depth necessary for light to register with clarity. Stripped of chromatic distraction, texture and contrast become the sole conductors of presence.",
      "Can you see the colour?",
    ],
    slugs: [
      "river-of-january-2",
      "river-of-january",
      "6am-rio",
      "hungry-since-birth",
      "traptivist",
      "history-repeats",
      "time-immemorial",
      "remix-tape",
      "respectfully",
    ],
    layout: "marquee",
  },

  // ── 02 — Change How You Perceive Space. ───────────────────────────────────
  {
    id: "02",
    number: "02",
    title: "Change How You Perceive Space.",
    description: [
      '"And he dreamed, and behold a ladder set up on the earth, and the top of it reached to heaven."',
      "The vertical axis; the structure anchored to the earth yet aspiring toward an absolute horizon.",
      "Change how you perceive space.",
    ],
    slugs: [
      "angels-with-filthy-souls",
      "the-void",
      "the-spoils-of-babylon",
    ],
    layout: "vertical",
    axisLabels: [
      "[AXIS // 01: THRESHOLD]",
      "[AXIS // 02: REPOSE]",
      "[AXIS // 03: MONUMENT]",
    ],
  },

  // ── 03 — Bearers of the Beacon ────────────────────────────────────────────
  {
    id: "03",
    number: "03",
    title: "Bearers of the Beacon",
    description: [
      "They move through the crowd unheralded, yet remain impossible to ignore. Where a countenance should be, pure light erupts, blinding in its clarity.",
      "This luminosity carries the absolute weight of righteousness. Falsehood is bound to vanish when the dawn arrives. Stand as a bearer of the beacon, or ensure total alignment within their proximity.",
    ],
    slugs: [
      { slug: "plans-of-the-diligent", imageKey: "frontCover" },
      { slug: "right-over-left",        imageKey: "frontCover" },
      // right-over-left-2: both covers (front first, then back)
      { slug: "right-over-left-2",      imageKey: "frontCover" },
      { slug: "right-over-left-2",      imageKey: "backCover"  },
      { slug: "right-over-left-3",      imageKey: "frontCover"  },
    ],
    layout: "glow",
  },

  // ── 04 — Vessels of the Unseen (The Mali Selections) ──────────────────────
  {
    id: "04",
    number: "04",
    title: "Vessels of the Unseen",
    subtitle: "(The Mali Selections)",
    description: [
      "No idol carved, but wood in flight,\nGuiding the soul that meets the grave.\nAll earthly forms fade into night;\nOnly the Maker stays to save.",
    ],
    slugs: [
      { slug: "the-mali-selections-1", imageKey: "frontCover" },
      { slug: "the-mali-selections-2", imageKey: "frontCover" },
      { slug: "the-mali-selections-3", imageKey: "frontCover" },
    ],
    layout: "mali",
  },

  // ── 05 — Build or Destroy ─────────────────────────────────────────────────
  {
    id: "05",
    number: "05",
    title: "Build or Destroy",
    description: ["Out of destruction comes the urge to cultivate."],
    slugs: [
      "2-foul",
      "camouflage-giants",
      "magnum-opus",
      "skums-and-roses",
    ],
    layout: "fragment",
  },
];
