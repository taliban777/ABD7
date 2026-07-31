import type { NextApiRequest, NextApiResponse } from "next";
import { PLASMIC } from "@/plasmic-init";

interface SimpleProject {
  id: string;
  title: string;
  frontCover: string;
}

/**
 * Helper: resolve image URL from various CMS field formats
 */
function resolveImageUrl(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return resolveImageUrl(value[0]);
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return resolveImageUrl(o.url ?? o.src ?? o.imageUrl ?? o.uri ?? "");
  }
  return "";
}

/**
 * Walk CMS data tree and collect projects (title + frontCover)
 */
function collectProjects(node: unknown, seen = new Set<object>()): SimpleProject[] {
  const results: SimpleProject[] = [];
  if (!node || typeof node !== "object") return results;
  if (seen.has(node as object)) return results;
  seen.add(node as object);

  const o = node as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const frontCover = resolveImageUrl(o.frontCover);

  if (title && frontCover) {
    results.push({
      id: typeof o.id === "string" ? o.id : title,
      title,
      frontCover,
    });
    return results;
  }

  // Recurse into values
  if (Array.isArray(node)) {
    for (const item of node) results.push(...collectProjects(item, seen));
  } else {
    for (const val of Object.values(o)) {
      results.push(...collectProjects(val, seen));
    }
  }

  return results;
}

/**
 * GET /api/projects — returns minimal project data (id, title, frontCover) for homepage strips
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimpleProject[]>
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  try {
    // Try to fetch pages from Plasmic
    let pages = [];
    try {
      pages = await PLASMIC.fetchPages();
    } catch (pagesError) {
      console.error("[v0] Failed to fetch pages:", pagesError);
      // Return empty array if pages fetch fails
      res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
      res.status(200).json([]);
      return;
    }

    // Look for projects across all pages
    const allProjects: SimpleProject[] = [];
    
    for (const page of pages) {
      try {
        const pageData = await PLASMIC.fetchComponentData(page);
        if (pageData) {
          const projects = collectProjects(pageData);
          allProjects.push(...projects);
        }
      } catch (pageError) {
        // Log but skip pages that fail
        console.debug(`[v0] Failed to fetch page ${page.path}:`, pageError);
        continue;
      }
    }

    // Deduplicate by id
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    );

    // Cache response
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(uniqueProjects);
  } catch (error) {
    console.error("[v0] API /projects error:", error);
    res.status(200).json([]);
  }
}
