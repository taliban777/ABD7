import Link from "next/link";
import type { CurationExhibition } from "./types";
import { ExhibitionLayout01 } from "./ExhibitionLayout01";
import { ExhibitionLayout02 } from "./ExhibitionLayout02";
import { ExhibitionLayout03 } from "./ExhibitionLayout03";
import { ExhibitionLayout04 } from "./ExhibitionLayout04";
import { ExhibitionLayout05 } from "./ExhibitionLayout05";
import styles from "./curations.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";
import type { CmsProject } from "@/components/archive/types";

interface ExhibitionPageProps {
  exhibition: CurationExhibition;
  projects?: CmsProject[];
}

export function ExhibitionPage({ exhibition, projects = [] }: ExhibitionPageProps) {
  return (
    <>
    <GlobalNav projects={projects} />
    <main className={styles.exhibitionPage}>
      {/* Back to curations */}
      <Link href="/curations" className={styles.backLink}>
        ← Curations
      </Link>

      {/* Header: number + title + description */}
      <header className={styles.exhibitionHeader}>
        <span className={styles.exhibitionHeaderNumber} aria-hidden="true">
          {exhibition.number}
        </span>
        <div className={styles.exhibitionHeaderText}>
          <h1 className={styles.exhibitionHeaderTitle}>{exhibition.title}</h1>
          {exhibition.subtitle && (
            <p className={styles.exhibitionHeaderSubtitle}>{exhibition.subtitle}</p>
          )}
          <div className={styles.exhibitionHeaderDesc}>
            {exhibition.description.map((para, i) => (
              <p key={i} className={styles.exhibitionHeaderDescP}>
                {para}
              </p>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.exhibitionHeaderRule} aria-hidden="true" />

      {/* Layout-specific artwork rendering */}
      {exhibition.layout === "marquee"  && <ExhibitionLayout01 exhibition={exhibition} />}
      {exhibition.layout === "vertical" && <ExhibitionLayout02 exhibition={exhibition} />}
      {exhibition.layout === "glow"     && <ExhibitionLayout03 exhibition={exhibition} />}
      {exhibition.layout === "mali"     && <ExhibitionLayout04 exhibition={exhibition} />}
      {exhibition.layout === "fragment" && <ExhibitionLayout05 exhibition={exhibition} />}
    </main>
    </>
  );
}
