import { useMemo, useState } from "react";
import styles from "./chromatic-distribution.module.css";
import type { CmsProject } from "@/components/archive/types";
import { asArray, paletteValue } from "@/components/archive/types";

export interface ChromaticDistributionProps {
  projects?: CmsProject[];
}

interface SegmentData {
  project: CmsProject;
  colors: string[];
  startPercent: number;
  endPercent: number;
}

export function ChromaticDistribution({ projects = [] }: ChromaticDistributionProps) {
  const safeProjects = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort projects chronologically (oldest first)
  const sortedProjects = useMemo(() => {
    return [...safeProjects].sort((a, b) => {
      // Try year first
      const aYear = a.year ?? null;
      const bYear = b.year ?? null;
      if (aYear !== null && bYear !== null) {
        if (aYear !== bYear) return aYear - bYear;
      }
      // Fall back to date string if available
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // Fall back to creation date
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // Otherwise preserve order
      return 0;
    });
  }, [safeProjects]);

  // Build segments with color data and positioning
  const segments: SegmentData[] = useMemo(() => {
    const result: SegmentData[] = [];
    let totalColors = 0;

    // First pass: count total colors
    for (const project of sortedProjects) {
      const colors = asArray(project.palette)
        .map((c) => paletteValue(c))
        .filter((hex): hex is string => !!hex);
      totalColors += colors.length;
    }

    if (totalColors === 0) return [];

    // Second pass: build segments with percentages
    let colorsSoFar = 0;
    for (const project of sortedProjects) {
      const colors = asArray(project.palette)
        .map((c) => paletteValue(c))
        .filter((hex): hex is string => !!hex);

      if (colors.length > 0) {
        const segmentStart = colorsSoFar;
        colorsSoFar += colors.length;

        result.push({
          project,
          colors,
          startPercent: (segmentStart / totalColors) * 100,
          endPercent: (colorsSoFar / totalColors) * 100,
        });
      }
    }

    return result;
  }, [sortedProjects]);

  if (segments.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>CHROMATIC DISTRIBUTION</h2>
        <div className={styles.empty}>No projects with palette data available</div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>CHROMATIC DISTRIBUTION</h2>

      {/* Timeline labels */}
      <div className={styles.timelineLabels}>
        <span className={styles.label}>EARLIEST</span>
        <span className={styles.label}>LATEST</span>
      </div>

      {/* Chromatic strip */}
      <div className={styles.stripContainer}>
        <div className={styles.strip}>
          {segments.map((segment, index) => {
            const isHovered = hoveredIndex === index;
            const segmentWidth = segment.endPercent - segment.startPercent;

            return (
              <div
                key={segment.project.id}
                className={`${styles.segment} ${isHovered ? styles.segmentHovered : ""}`}
                style={{
                  width: `${segmentWidth}%`,
                  opacity: hoveredIndex === null ? 1 : isHovered ? 1 : 0.6,
                  transition: hoveredIndex === null ? "opacity 0.3s ease" : "opacity 0.2s ease",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                role="button"
                tabIndex={0}
                aria-label={`${segment.project.title} palette`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setHoveredIndex(hoveredIndex === index ? null : index);
                  }
                }}
              >
                {/* Individual color blocks */}
                <div className={styles.colors}>
                  {segment.colors.map((hex, colorIndex) => (
                    <div
                      key={colorIndex}
                      className={styles.colorBlock}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>

                {/* Hover tooltip */}
                {isHovered && (
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipTitle}>
                      {segment.project.title}
                    </div>
                    {segment.project.year && (
                      <div className={styles.tooltipMeta}>{segment.project.year}</div>
                    )}
                    <div className={styles.tooltipColors}>
                      {segment.colors.map((hex, i) => (
                        <div key={i} className={styles.tooltipColorRow}>
                          <span className={styles.tooltipColorCode}>{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend: Project count and span */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendLabel}>Projects:</span>
          <span className={styles.legendValue}>{segments.length}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendLabel}>Timeline:</span>
          <span className={styles.legendValue}>
            {segments[0]?.project.year ?? "—"} – {segments[segments.length - 1]?.project.year ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
