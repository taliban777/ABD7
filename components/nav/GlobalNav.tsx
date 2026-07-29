import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./nav.module.css";
import type { CmsProject } from "@/components/archive/types";

export interface GlobalNavProps {
  /** All CMS projects — used to derive the dynamic year list for the PROJECTS dropdown. */
  projects?: CmsProject[];
}

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "COLLECTION", href: "/test" },
  { label: "INDEX", href: "/index" },
  { label: "CURATIONS", href: "/curations" },
] as const;

const NAV_LINKS_RIGHT = [
  { label: "COLOPHON", href: "/colophon" },
  { label: "CONTACT", href: "/contact" },
] as const;

function getUniqueYears(projects: CmsProject[]): number[] {
  const years = new Set<number>();
  for (const p of projects) {
    if (typeof p.year === "number" && !isNaN(p.year)) years.add(p.year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function GlobalNav({ projects = [] }: GlobalNavProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const years = getUniqueYears(projects);

  // Close dropdown on route change
  useEffect(() => {
    const handleRouteChange = () => setDropdownOpen(false);
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Close on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dropdownOpen]);

  const isActive = (href: string) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  return (
    <nav className={styles.nav} aria-label="Site navigation">
      <div className={styles.navInner}>
        {/* Wordmark */}
        <Link href="/" className={styles.wordmark} aria-label="ARTBYDANI7 — Home">
          ARTBYDANI7
        </Link>

        {/* Centre links */}
        <ul className={styles.navLinks} role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.navLink} ${isActive(href) ? styles.navLinkActive : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}

          {/* PROJECTS dropdown */}
          <li className={styles.dropdownItem}>
            <button
              ref={triggerRef}
              type="button"
              className={`${styles.navLink} ${styles.navLinkBtn} ${isActive("/projects") ? styles.navLinkActive : ""}`}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((v) => !v)}
            >
              PROJECTS
              <span className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ""}`} aria-hidden="true">
                ▾
              </span>
            </button>

            {dropdownOpen && (
              <div
                ref={dropdownRef}
                className={styles.dropdown}
                role="listbox"
                aria-label="Filter projects by year"
              >
                <Link
                  href="/test"
                  className={styles.dropdownLink}
                  role="option"
                  aria-selected={false}
                  onClick={() => setDropdownOpen(false)}
                >
                  ALL YEARS
                </Link>
                {years.length === 0 ? (
                  <span className={styles.dropdownEmpty}>No years available</span>
                ) : (
                  years.map((year) => (
                    <Link
                      key={year}
                      href={`/test?year=${year}`}
                      className={styles.dropdownLink}
                      role="option"
                      aria-selected={router.query.year === String(year)}
                      onClick={() => setDropdownOpen(false)}
                    >
                      {year}
                    </Link>
                  ))
                )}
              </div>
            )}
          </li>

          {NAV_LINKS_RIGHT.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.navLink} ${isActive(href) ? styles.navLinkActive : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
