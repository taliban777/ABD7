import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./contact.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";
import type { CmsProject } from "@/components/archive/types";
import { asArray, valueLabel } from "@/components/archive/types";
import { getArchiveImageUrl } from "@/components/images/cloudinary";

export interface ContactPageProps {
  projects?: CmsProject[];
}

type ClientType = "Agency" | "Artist" | "Record Label" | "Brand" | "Business" | "Other";
type ServiceType =
  | "Album Cover"
  | "EP"
  | "Single"
  | "Brand Identity"
  | "Print"
  | "Creative Direction"
  | "Other";
type BudgetRange =
  | "Under $500"
  | "$500 – $1,500"
  | "$1,500 – $5,000"
  | "$5,000 – $15,000"
  | "$15,000+";
type Deadline =
  | "Flexible"
  | "2 Weeks"
  | "1 Month"
  | "3 Months"
  | "Specific Date";

const CLIENT_TYPES: ClientType[] = [
  "Agency",
  "Artist",
  "Record Label",
  "Brand",
  "Business",
  "Other",
];
const SERVICE_TYPES: ServiceType[] = [
  "Album Cover",
  "EP",
  "Single",
  "Brand Identity",
  "Print",
  "Creative Direction",
  "Other",
];
const DEADLINES: Deadline[] = [
  "Flexible",
  "2 Weeks",
  "1 Month",
  "3 Months",
  "Specific Date",
];

interface FormState {
  clientType: ClientType | "";
  services: ServiceType[];
  vision: string;
  inspirations: CmsProject[];
  budget: BudgetRange | "";
  budgetCustom: number; // 0 to 1000000
  deadline: Deadline | "";
  specificDate: string;
  email: string;
  name: string;
}

const INITIAL: FormState = {
  clientType: "",
  services: [],
  vision: "",
  inspirations: [],
  budget: "",
  budgetCustom: 0,
  deadline: "",
  specificDate: "",
  email: "",
  name: "",
};

export function ContactPage({ projects = [] }: ContactPageProps) {
  const safeProjects = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );
  const [form, setForm] = useState<FormState>(INITIAL);
  const [projectSearch, setProjectSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered project suggestions from CMS search — only show results when typing
  const projectSuggestions = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return [];
    return safeProjects
      .filter((p) => {
        const haystack = [
          p.title,
          ...asArray(p.artists).map(valueLabel),
          p.year ? String(p.year) : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 12);
  }, [safeProjects, projectSearch]);

  const toggleService = (s: ServiceType) =>
    setForm((f) => ({
      ...f,
      services: f.services.includes(s)
        ? f.services.filter((x) => x !== s)
        : [...f.services, s],
    }));

  const addInspiration = (project: CmsProject) => {
    setForm((f) =>
      f.inspirations.find((p) => p.id === project.id)
        ? f
        : { ...f, inspirations: [...f.inspirations, project] }
    );
    setProjectSearch("");
  };

  const removeInspiration = (id: string) =>
    setForm((f) => ({
      ...f,
      inspirations: f.inspirations.filter((p) => p.id !== id),
    }));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <GlobalNav projects={safeProjects} />
        <main className={styles.page}>
          <div className={styles.confirmationWrap}>
            <h1 className={styles.confirmationTitle}>Brief Received</h1>
            <p className={styles.confirmationBody}>
              Thank you, {form.name || "for reaching out"}. Your project brief
              has been received. Expect a response within 2–3 business days.
            </p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setForm(INITIAL);
                setFiles([]);
                setSubmitted(false);
              }}
            >
              Start a New Brief
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <GlobalNav projects={safeProjects} />
      <main className={styles.page}>
        {/* Page header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Begin a Project</h1>
          <p className={styles.pageDesc}>
            Fill out the brief below. The more detail you provide, the more
            considered the response.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* ─── 1. Who are you? ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>01 — Who are you?</h2>
            <div className={styles.chipGrid}>
              {CLIENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.chip} ${form.clientType === type ? styles.chipActive : ""}`}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      clientType: f.clientType === type ? "" : type,
                    }))
                  }
                  aria-pressed={form.clientType === type}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {/* ─── 2. What do you need? ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>02 — What do you need?</h2>
            <div className={styles.chipGrid}>
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.chip} ${form.services.includes(type) ? styles.chipActive : ""}`}
                  onClick={() => toggleService(type)}
                  aria-pressed={form.services.includes(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {/* ─── 3. Describe your vision ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>03 — Describe your vision</h2>
            <textarea
              className={styles.textarea}
              placeholder="Describe the concept, mood, references, and any direction you have in mind…"
              value={form.vision}
              onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
              rows={7}
              aria-label="Vision description"
            />
          </section>

          {/* ─── 4. Upload references �����── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>04 — Upload references</h2>
            <div
              className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
              onDragEnter={() => setDragActive(true)}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload reference images"
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            >
              <span className={styles.dropzoneText}>
                Drag &amp; drop images, or click to browse
              </span>
              <span className={styles.dropzoneHint}>
                JPG, PNG, WEBP, GIF — multiple files supported
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.srOnly}
                onChange={handleFileInput}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>

            {files.length > 0 && (
              <ul className={styles.fileList} aria-label="Uploaded references">
                {files.map((file, i) => (
                  <li key={i} className={styles.fileItem}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      className={styles.fileRemove}
                      onClick={() => removeFile(i)}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ─── 5. Inspirations from archive ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              05 — Which ARTBYDANI7 projects inspire you?
            </h2>

            {/* Search input */}
            <div className={styles.inspirationSearch}>
              <input
                type="search"
                className={styles.inspirationInput}
                placeholder="Search archive…"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-label="Search archive projects"
              />

              {projectSearch.length > 0 && (
                <ul className={styles.suggestions} role="listbox" aria-label="Archive suggestions">
                  {projectSuggestions.map((p) => {
                    const isAdded = form.inspirations.some((x) => x.id === p.id);
                    const thumbUrl = getArchiveImageUrl(p.frontCover);
                    return (
                      <li key={p.id} role="option" aria-selected={isAdded}>
                        <button
                          type="button"
                          className={`${styles.suggestionItem} ${isAdded ? styles.suggestionAdded : ""}`}
                          onClick={() => addInspiration(p)}
                          disabled={isAdded}
                        >
                          {thumbUrl && (
                            <Image
                              src={thumbUrl}
                              alt={`${p.title} thumbnail`}
                              className={styles.suggestionThumb}
                              width={80}
                              height={80}
                            />
                          )}
                          <span className={styles.suggestionContent}>
                            <span className={styles.suggestionTitle}>
                              {p.title}
                            </span>
                            <span className={styles.suggestionMeta}>
                              {asArray(p.artists).map(valueLabel).filter(Boolean)[0] ?? ""}
                              {p.year ? ` · ${p.year}` : ""}
                            </span>
                          </span>
                          {isAdded && (
                            <span className={styles.suggestionCheck} aria-hidden="true">
                              ✓
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {projectSuggestions.length === 0 && projectSearch.length > 0 && (
                    <li className={styles.suggestionsEmpty}>No results</li>
                  )}
                </ul>
              )}
            </div>

            {/* Selected chips */}
            {form.inspirations.length > 0 && (
              <ul className={styles.inspirationChips} aria-label="Selected inspirations">
                {form.inspirations.map((p) => (
                  <li key={p.id}>
                    <span className={styles.inspirationChip}>
                      <span className={styles.inspirationCheckmark} aria-hidden="true">
                        ✓
                      </span>
                      {p.title}
                      <button
                        type="button"
                        className={styles.inspirationRemove}
                        onClick={() => removeInspiration(p.id)}
                        aria-label={`Remove ${p.title}`}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ─── 6. Deadline ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>06 — Deadline</h2>
            <div className={styles.chipGrid}>
              {DEADLINES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.chip} ${form.deadline === d ? styles.chipActive : ""}`}
                  onClick={() =>
                    setForm((f) => ({ ...f, deadline: f.deadline === d ? "" : d }))
                  }
                  aria-pressed={form.deadline === d}
                >
                  {d}
                </button>
              ))}
            </div>
            {form.deadline === "Specific Date" && (
              <input
                type="date"
                className={styles.dateInput}
                value={form.specificDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specificDate: e.target.value }))
                }
                aria-label="Specific deadline date"
              />
            )}
          </section>

          {/* ─── 7. Budget willingness ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>07 — How much are you willing to give?</h2>
            <div className={styles.budgetSliderContainer}>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={form.budgetCustom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, budgetCustom: Number(e.target.value) }))
                }
                className={styles.budgetSlider}
                aria-label="Budget range slider"
              />
              <div className={styles.budgetPreview}>
                ${form.budgetCustom.toLocaleString("en-US")}
              </div>
            </div>
          </section>

          {/* ─── 8. Contact details ─── */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>08 — Contact details</h2>
            <div className={styles.contactFields}>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldName}>Email</span>
                <input
                  type="email"
                  className={styles.fieldInput}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                  aria-required="true"
                />
              </label>
              <label className={styles.fieldLabel}>
                <span className={styles.fieldName}>Name</span>
                <input
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Your name or organisation"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  aria-required="true"
                />
              </label>
            </div>
          </section>

          {/* ─── Submit ─── */}
          <div className={styles.submitRow}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!form.email || !form.name}
            >
              Submit Brief
            </button>
            <span className={styles.submitNote}>
              Response within 2–3 business days.
            </span>
          </div>
        </form>
      </main>
    </>
  );
}
