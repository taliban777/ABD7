import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./nav.module.css";
import type { CmsProject } from "@/components/archive/types";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useTheme } from "@/context/ThemeContext";

export interface GlobalNavProps {
  /** All CMS projects — used to derive the dynamic year list for the PROJECTS dropdown. */
  projects?: CmsProject[];
}

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "OTHERS", href: "/others" },
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

function getProjectsByYear(projects: CmsProject[], year: number): CmsProject[] {
  return projects
    .filter((p) => p.year === year)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

export function GlobalNav({ projects = [] }: GlobalNavProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileYear, setMobileYear] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const years = getUniqueYears(projects);
  const albumsInYear = selectedYear ? getProjectsByYear(projects, selectedYear) : [];
  const mobileAlbumsInYear = mobileYear ? getProjectsByYear(projects, mobileYear) : [];
  const { progress, scrolled } = useScrollProgress();
  const { theme, toggleTheme } = useTheme();
  // Trap focus within the mobile menu dialog while open; restore on close.
  const mobileMenuRef = useFocusTrap<HTMLDivElement>(mobileOpen);

  // Close menus on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setDropdownOpen(false);
      setMobileOpen(false);
    };
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);

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
    <nav
      className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}
      aria-label="Site navigation"
    >
      {/* Scroll progress indicator — 2px line across the bottom of the nav */}
      <div
        className={styles.scrollProgress}
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
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
              className={`${styles.navLink} ${styles.navLinkBtn} ${isActive("/projects") || isActive("/collection") ? styles.navLinkActive : ""}`}
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
                aria-label="Browse projects by year"
              >
                {/* Primary level: ALL YEARS or year list */}
                {selectedYear === null ? (
                  <>
                    <Link
                      href="/collection"
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
                        <button
                          key={year}
                          type="button"
                          className={styles.dropdownLink}
                          role="option"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedYear(year);
                          }}
                          aria-selected={false}
                        >
                          {year}
                          <span className={styles.chevronRight} aria-hidden="true">→</span>
                        </button>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.dropdownLink}
                      role="option"
                      aria-selected={selectedYear === null}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedYear(null);
                      }}
                    >
                      <span className={styles.chevronLeft} aria-hidden="true">←</span> Back
                    </button>
                    <div className={styles.dropdownDivider} />
                    {albumsInYear.length === 0 ? (
                      <span className={styles.dropdownEmpty}>No projects in {selectedYear}</span>
                    ) : (
                      albumsInYear.map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.slug ?? project.title.toLowerCase().replace(/\s+/g, "-")}`}
                          className={styles.dropdownLink}
                          role="option"
                          aria-selected={false}
                          onClick={() => setDropdownOpen(false)}
                        >
                          {project.title}
                        </Link>
                      ))
                    )}
                  </>
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

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            // Sun icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 6.34l-1.41 1.41M6.34 17.66l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            // Moon icon
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          className={styles.mobileToggle}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className={styles.mobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          tabIndex={-1}
        >
          <ul className={styles.mobileLinks} role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.mobileLink} ${isActive(href) ? styles.mobileLinkActive : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}


            {/* PROJECTS — expandable by year */}
            <li className={styles.mobileGroup}>
              <button
                type="button"
                className={styles.mobileLink}
                aria-expanded={mobileYear !== null}
                onClick={() => setMobileYear((y) => (y === null ? (years[0] ?? null) : null))}
              >
                PROJECTS
              </button>

              {years.length === 0 ? (
                <span className={styles.mobileEmpty}>No years available</span>
              ) : (
                <div className={styles.mobileYears}>
                  <Link
                    href="/collection"
                    className={styles.mobileSubLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    ALL YEARS
                  </Link>
                  <div className={styles.mobileYearTabs} role="tablist" aria-label="Filter projects by year">
                    {years.map((year) => (
                      <button
                        key={year}
                        type="button"
                        role="tab"
                        aria-selected={mobileYear === year}
                        className={`${styles.mobileYearTab} ${mobileYear === year ? styles.mobileYearTabActive : ""}`}
                        onClick={() => setMobileYear(year)}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                  {mobileYear !== null && (
                    mobileAlbumsInYear.length === 0 ? (
                      <span className={styles.mobileEmpty}>No projects in {mobileYear}</span>
                    ) : (
                      <ul className={styles.mobileProjectList} role="list">
                        {mobileAlbumsInYear.map((project) => (
                          <li key={project.id}>
                            <Link
                              href={`/projects/${project.slug ?? project.title.toLowerCase().replace(/\s+/g, "-")}`}
                              className={styles.mobileSubLink}
                              onClick={() => setMobileOpen(false)}
                            >
                              {project.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              )}
            </li>

            {NAV_LINKS_RIGHT.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.mobileLink} ${isActive(href) ? styles.mobileLinkActive : ""}`}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
