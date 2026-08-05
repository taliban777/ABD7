/**
 * Exhibition 05 — Build or Destroy
 *
 * Hovering an artwork causes it to fragment into geometric pieces
 * that drift apart. Leaving hover reconstructs. Pure CSS clip-path transitions.
 */

import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

interface FragmentDef {
  clip: string;
  dx: string;
  dy: string;
  rot: string;
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
        const src = getProjectImageUrl(work.imageUrl);

        return (
          <div key={`${work.project.id}-${i}`} className={styles.fragmentItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={work.project.title}
              className={styles.fragmentBase}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
            />
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
