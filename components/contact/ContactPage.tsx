import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./contact.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";
import type { CmsProject } from "@/components/archive/types";
import { asArray, valueLabel } from "@/components/archive/types";
import { getArchiveImageUrl } from "@/components/images/cloudinary";
import { upload } from "@vercel/blob/client";
  const tokenRes = await fetch("/api/upload-reference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, clientPayload: null, multipart: false },
    }),
  });
  if (!tokenRes.ok) throw new Error("Failed to get upload token");
  const { clientToken } = await tokenRes.json();
  if (!clientToken) throw new Error("No upload token returned");

  const params = new URLSearchParams({ pathname });
  const putRes = await fetch(`https://vercel.com/api/blob/?${params.toString()}`, {
    method: "PUT",
    body: file,
    headers: {
      Authorization: `Bearer ${clientToken}`,
      "x-content-type": file.type || "application/octet-stream",
      "x-vercel-blob-access": "public",
    },
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${putRes.status})`);
  }

  const blob = await putRes.json();
  return blob.url as string;
}

export interface ContactPageProps {
  projects?: CmsProject[];
}

type ClientType = "Agency" | "Artist" | "Record Label" | "Brand" | "Business" | "Other";
type ServiceType =
  | "Creative Direction"
  | "Single Art"
  | "Brand Identity"
  | "Print"
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
  "Creative Direction",
  "Single Art",
  "Brand Identity",
  "Print",
  "Other",
];
const DEADLINES: Deadline[] = [
  "Flexible",
  "2 Weeks",
  "1 Month",
  "3 Months",
  "Specific Date",
];

const BUDGET_PRESETS: { label: string; value: number }[] = [
  { label: "$77", value: 77 },
  { label: "$177", value: 177 },
  { label: "$277", value: 277 },
  { label: "$777", value: 777 },
  { label: "$7,777", value: 7777 },
  { label: "$77,777", value: 77777 },
  { label: "$77,777+", value: 777777 },
];

interface FormState {
  clientType: ClientType | "";
  services: ServiceType[];
  vision: string;
  inspirations: CmsProject[];
  budget: BudgetRange | "";
  budgetCustom: number;
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [envelopeStage, setEnvelopeStage] = useState<"idle" | "folding" | "sealed" | "open">("idle");
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const filterFiles = (incoming: File[]): File[] => {
    return incoming.filter((f) => f.type.startsWith("image/"));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = filterFiles(Array.from(e.dataTransfer.files));
    setFiles((prev) => [...prev, ...dropped]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = filterFiles(Array.from(e.target.files ?? []));
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validate = (): boolean => {
    const errors: { name?: string; email?: string } = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.trim().length > 120) errors.name = "Name is too long.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!validate()) return;
    setSubmitError(null);

    let fileUrls: string[] = [];
    if (files.length > 0) {
      setUploadingFiles(true);
      try {
const uploads = await Promise.all(
  files.map(async (file) => {
    const blob = await upload(
      `contact-references/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
        handleUploadUrl: "/api/upload-reference",
      }
    );

    return blob.url;
  })
);

fileUrls = uploads;
      } catch (err) {
        setUploadingFiles(false);
        setSubmitError(err instanceof Error ? err.message : "File upload failed. Please try again.");
        return;
      }
      setUploadingFiles(false);
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: "",
          name: form.name,
          email: form.email,
          clientType: form.clientType,
          services: form.services,
          vision: form.vision,
          budget: String(form.budgetCustom),
          deadline: form.deadline,
          specificDate: form.specificDate || undefined,
          inspirations: form.inspirations.map((p) => p.title),
          fileUrls,
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!data.ok) {
        setSending(false);
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
    } catch {
      setSending(false);
      setSubmitError("Network error. Please check your connection and try again.");
      return;
    }

    setSending(false);
    setEnvelopeStage("folding");
    
    setTimeout(() => {
      setEnvelopeStage("sealed");
      setSubmitted(true);
    }, 900);
  };

  if (submitted) {
    const summaryRows: { label: string; value: string }[] = [
      { label: "Name", value: form.name || "—" },
      { label: "Email", value: form.email || "—" },
      { label: "Client type", value: form.clientType || "—" },
      { label: "Services", value: form.services.length ? form.services.join(", ") : "—" },
      { label: "Budget", value: form.budgetCustom > 0 ? `$${form.budgetCustom.toLocaleString("en-US")}` : "—" },
      { label: "Deadline", value: form.deadline === "Specific Date" && form.specificDate ? form.specificDate : form.deadline || "—" },
      { label: "Vision", value: form.vision ? (form.vision.length > 120 ? form.vision.slice(0, 120) + "…" : form.vision) : "—" },
    ];

    return (
      <>
        <GlobalNav projects={safeProjects} />
        <main className={styles.page}>
          <div className={styles.envelopeScene}>
            <div
              className={`${styles.envelope} ${envelopeStage === "folding" ? styles.envelopeFolding : ""} ${envelopeStage === "sealed" || envelopeStage === "open" ? styles.envelopeSealed : ""} ${envelopeStage === "open" ? styles.envelopeOpen : ""}`}
              onClick={() => envelopeStage === "sealed" && setEnvelopeStage("open")}
              role={envelopeStage === "sealed" ? "button" : undefined}
              tabIndex={envelopeStage === "sealed" ? 0 : undefined}
              aria-label={envelopeStage === "sealed" ? "Open brief summary" : undefined}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && envelopeStage === "sealed") setEnvelopeStage("open"); }}
            >
              <div className={styles.envelopeBody}>
                <div className={styles.envFlapBottom} />
                <div className={styles.envFlapLeft} />
                <div className={styles.envFlapRight} />
                <div className={styles.envFlapTop} />
                <div className={styles.envSeal} aria-hidden="true">
                  <span>7</span>
                </div>
                {envelopeStage === "sealed" && (
                  <p className={styles.envelopeHint}>tap to open</p>
                )}
              </div>

              <div className={styles.envelopeLetter} aria-hidden={envelopeStage !== "open"}>
                <p className={styles.letterEyebrow}>Your Brief</p>
                <dl className={styles.letterBody}>
                  {summaryRows.map((row) => (
                    <div key={row.label} className={styles.letterRow}>
                      <dt className={styles.letterLabel}>{row.label}</dt>
                      <dd className={styles.letterValue}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className={styles.letterFooter}>
                  Expect a response within 7–77 hours.
                </p>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm(INITIAL);
                    setFiles([]);
                    setSubmitted(false);
                    setEnvelopeStage("idle");
                  }}
                >
                  Start a New Brief
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <GlobalNav projects={safeProjects} />
      <main className={styles.page}>
        <div className={styles.layout}>
          <aside className={styles.contextPanel}>
            <div className={styles.contextInner}>
              <p className={styles.eyebrow}>Contact</p>
              <h1 className={styles.pageTitle}>Begin a Project</h1>
              <p className={styles.pageDesc}>
                Fill out the brief to the right. The more detail you provide,
                the more considered the response. Every enquiry is read and
                answered personally.
              </p>

              <dl className={styles.contextMeta}>
                <div className={styles.metaBlock}>
                  <dt className={styles.metaLabel}>Direct</dt>
                  <dd className={styles.metaValue}>
                    <a
                      href="mailto:info@artbydani7.com"
                      className={styles.metaLink}
                    >
                      info@artbydani7.com
                    </a>
                  </dd>
                </div>
                <div className={styles.metaBlock}>
                  <dt className={styles.metaLabel}>Response time</dt>
                  <dd className={styles.metaValue}>7–77 hours</dd>
                </div>
              </dl>
            </div>
          </aside>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              name="website"
              aria-hidden="true"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
            />

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
                  JPG, PNG, WEBP, GIF — no size limit, multiple files supported
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

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>
                05 — Which ARTBYDANI7 projects inspire you?
              </h2>

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
                    {projectSuggestions.length === 0 && (
                      <li className={styles.suggestionsEmpty}>No results</li>
                    )}
                  </ul>
                )}
              </div>

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

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>07 — How much are you willing to give?</h2>
              <div className={styles.budgetReadout}>
                <span className={styles.budgetAmount}>
                  ${form.budgetCustom.toLocaleString("en-US")}
                </span>
                <span className={styles.budgetCaption}>Estimated budget</span>
              </div>
              <div
                className={styles.budgetTrack}
                style={{
                  ["--fill" as keyof React.CSSProperties]: `${(form.budgetCustom / 1000000) * 100}%`,
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="1000"
                  value={form.budgetCustom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budgetCustom: Number(e.target.value) }))
                  }
                  className={styles.budgetSlider}
                  aria-label="Budget range slider"
                  aria-valuetext={`$${form.budgetCustom.toLocaleString("en-US")}`}
                />
              </div>
              <div className={styles.budgetPresets}>
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`${styles.budgetPreset} ${
                      form.budgetCustom === preset.value ? styles.budgetPresetActive : ""
                    }`}
                    onClick={() =>
                      setForm((f) => ({ ...f, budgetCustom: preset.value }))
                    }
                    aria-pressed={form.budgetCustom === preset.value}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>08 — Contact details</h2>
              <div className={styles.contactFields}>
                <label className={styles.fieldLabel}>
                  <span className={styles.fieldName}>Email</span>
                  <input
                    type="email"
                    className={`${styles.fieldInput} ${fieldErrors.email ? styles.fieldInputError : ""}`}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }));
                      if (attemptedSubmit) setFieldErrors((fe) => ({ ...fe, email: undefined }));
                    }}
                    required
                    aria-required="true"
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    aria-invalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && (
                    <span id="email-error" className={styles.fieldError} role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </label>
                <label className={styles.fieldLabel}>
                  <span className={styles.fieldName}>Name</span>
                  <input
                    type="text"
                    className={`${styles.fieldInput} ${fieldErrors.name ? styles.fieldInputError : ""}`}
                    placeholder="Your name or organisation"
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      if (attemptedSubmit) setFieldErrors((fe) => ({ ...fe, name: undefined }));
                    }}
                    required
                    aria-required="true"
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && (
                    <span id="name-error" className={styles.fieldError} role="alert">
                      {fieldErrors.name}
                    </span>
                  )}
                </label>
              </div>
            </section>

            <div className={styles.submitRow}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={sending || uploadingFiles}
              >
                {uploadingFiles ? "Uploading references…" : sending ? "Sending…" : "Submit Brief"}
              </button>
              {submitError && (
                <p className={styles.submitError} role="alert">
                  {submitError}
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
