/**
 * Exhibition 05 — Build or Destroy
 *
 * Hovering an artwork causes it to fragment into geometric pieces
 * that drift apart in a controlled, architectural manner.
 * Leaving hover reconstructs. Pure CSS clip-path transitions — no JS per-frame.
 *
 * Implementation:
 * - Base image sits at z-index 0, always visible.
 * - A fixed set of fragment <div>s overlay it, each showing the SAME image
 *   via background-image + background-position, clipped to a polygon region.
 * - On hover the fragment container receives data-hovered, triggering each
 *   fragment's CSS custom-property-driven transform transition.
 * - All motion vars (--dx, --dy, --rot) are set via inline style on each fragment.
 */

import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

// ── Fragment definitions ───────────────────────────────────────────────────────
// clip-path polygons are defined as percentages of the image bounding box.
// Eight fragments per artwork — feels intentional, not random.
interface FragmentDef {
  clip: string;   // CSS polygon()
  dx: string;     // translateX drift on hover
  dy: string;     // translateY drift on hover
  rot: string;    // rotate drift on hover
}

const FRAGMENTS: FragmentDef[] = [
  { clip: "polygon(0% 0%, 45% 0%, 38% 38%, 0% 42%)",          dx: "-22px",  dy: "-18px",  rot: "-3.5deg"  },
  { clip: "polygon(45% 0%, 100% 0%, 100% 35%, 60% 28%)",       dx: "20px",   dy: "-16px",  rot: "4deg"     },
  { clip: "polygon(38% 38%, 60% 28%, 55% 62%, 32% 58%)",       dx: "4px",    dy: "-24px",  rot: "-2deg"    },
  { clip: "polygon(0% 42%, 38% 38%, 32% 58%, 0% 65%)",         dx: "-26px",  dy: "8px",    rot: "5deg"     },
  { clip: "polygon(60% 28%, 100% 35%, 100% 62%, 55% 62%)",     dx: "28px",   dy: "12px",   rot: "-4.5deg"  },
  { clip: "polygon(0% 65%, 32% 58%, 30% 80%, 0% 100%)",        dx: "-18px",  dy: "22px",   rot: "3deg"     },
  { clip: "polygon(32% 58%, 55% 62%, 52% 100%, 30% 100%)",     dx: "6px",    dy: "26px",   rot: "-6deg"    },
  { clip: "polygon(55% 62%, 100% 62%, 100% 100%, 52% 100%)",   dx: "24px",   dy: "20px",   rot: "4.5deg"   },
];

interface Props {
  exhibition: CurationExhibition;
}

export function ExhibitionLayout05({ exhibition }: Props) {
  const { works } = exhibition;

  if (works.length === 0) return null;

  return (
    <section
      className={styles.fragmentSection}
      aria-label={`Artworks from ${exhibition.title}`}
    >
      {works.map((work, i) => {
        const src = getProjectImageUrl(work.frontCover);

        return (
          <div key={work.id} className={styles.fragmentItem}>
            {/* Base image — always visible, provides the reconstructed state */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={work.title}
              className={styles.fragmentBase}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
            />

            {/* Fragment overlay — absolutely positioned over the base */}
            <div className={styles.fragmentOverlay} aria-hidden="true">
              {FRAGMENTS.map((frag, fi) => (
                <div
                  key={fi}
                  className={styles.fragment}
                  style={{
                    backgroundImage: `url("${src}")`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    clipPath: frag.clip,
                    "--dx": frag.dx,
                    "--dy": frag.dy,
                    "--rot": frag.rot,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
