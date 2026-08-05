import Link from "next/link";
import styles from "./others.module.css";
import { OthersCard } from "./OthersCard";
import type { CmsOther } from "./types";
import { projectLabel } from "./types";

export interface OthersGroupPageProps {
  groupSlug: string;
  items: CmsOther[];
}

/**
 * Displays every "Others" entry that shares a CMS `groupSlug` together on a
 * single page. Reached from the /others index when a card belongs to a group.
 * Individual entries inside the group still link to their own detail pages.
 */
export function OthersGroupPage({ groupSlug, items }: OthersGroupPageProps) {
  const title = projectLabel(groupSlug);

  return (
    <main className={styles.page}>
      {/* Return link */}
      <div className={styles.returnLink}>
        <Link href="/others" className={styles.backButton}>
          ← Return to Others
        </Link>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageSubtitle}>
          {items.length} {items.length === 1 ? "Entry" : "Entries"} in Group
        </p>
      </header>

      {/* Grid */}
      {items.length === 0 ? (
        <p className={styles.empty}>This group is currently empty.</p>
      ) : (
        <section
          className={styles.grid}
          aria-label={`${title} group`}
          style={{ paddingTop: 28 }}
        >
          {items.map((item) => (
            <OthersCard key={item.id} item={item} linkToItem />
          ))}
        </section>
      )}

      {/* Bottom return link */}
      <div className={styles.returnLinkBottom}>
        <Link href="/others" className={styles.backButton}>
          ← Return to Others
        </Link>
      </div>
    </main>
  );
}
