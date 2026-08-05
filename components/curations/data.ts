import type { ExhibitionConfig } from "./types";

/**
 * Static exhibition configurations for the Curations section.
 * Add new exhibitions here — no code changes elsewhere needed.
 * workTitles are matched case-insensitively against CMS project titles at build time.
 */
export const EXHIBITIONS: ExhibitionConfig[] = [
  {
    id: "01",
    number: "01",
    title: "Can You See the Colour?",
    description: [
      "Monochrome is the ultimate color of discernment. It is the precise state where complex hues collapse into a singular spectrum, establishing a baseline that forces perception toward what actually endures beneath the surface.",
      "Darkness functions as an essential canvas providing the structural depth necessary for light to register with clarity. Stripped of chromatic distraction, texture and contrast become the sole conductors of presence.",
      "Can you see the colour?",
    ],
    workTitles: [
      "River of January 2",
      "River of January",
      "6AM in Rio",
      "Hungry $ince Birth",
      "Traptivist",
      "History Repeats",
      "Time Immemorial",
      "The Remix Mixtape",
      "Respectfully",
    ],
    layout: "marquee",
  },
  {
    id: "02",
    number: "02",
    title: "Change How You Perceive Space.",
    description: [
      '"And he dreamed, and behold a ladder set up on the earth, and the top of it reached to heaven."',
      "The vertical axis; the structure anchored to the earth yet aspiring toward an absolute horizon.",
      "Change how you perceive space.",
    ],
    workTitles: [
      "Angels With Filthy Souls",
      "The Void",
      "The Spoils of Babylon",
    ],
    layout: "vertical",
    axisLabels: [
      "[AXIS // 01: THRESHOLD]",
      "[AXIS // 02: REPOSE]",
      "[AXIS // 03: MONUMENT]",
    ],
  },
  {
    id: "03",
    number: "03",
    title: "Bearers of the Beacon",
    description: [
      "They move through the crowd unheralded, yet remain impossible to ignore. Where a countenance should be, pure light erupts, blinding in its clarity.",
      "This luminosity carries the absolute weight of righteousness. Falsehood is bound to vanish when the dawn arrives. Stand as a bearer of the beacon, or ensure total alignment within their proximity.",
    ],
    workTitles: [
      "Plans of the Diligent",
      "Right Over Left",
      "Right Over Left 2",
      "Right Over Left 2 (Back)",
    ],
    layout: "glow",
  },
  {
    id: "04",
    number: "04",
    title: "Vessels of the Unseen",
    subtitle: "(The Mali Selections)",
    description: [
      "No idol carved, but wood in flight,\nGuiding the soul that meets the grave.\nAll earthly forms fade into night;\nOnly the Maker stays to save.",
    ],
    workTitles: [
      "Mali Selection Vol.1",
      "Mali Selection Vol.2",
      "Mali Selection Vol.3",
    ],
    layout: "mali",
  },
  {
    id: "05",
    number: "05",
    title: "Build or Destroy",
    description: ["Out of destruction comes the urge to cultivate."],
    workTitles: ["2Foul", "Camouflage Giants", "Magnum Opus", "Skums and Roses"],
    layout: "fragment",
  },
];
