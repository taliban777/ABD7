import type { GetServerSideProps } from "next";
import { fetchCmsProjects } from "@/lib/cms";
import { projectSlug } from "@/components/archive/types";

const SITE_URL = "https://artbydani7.com";

// Static routes with their priorities and change frequencies
const STATIC_ROUTES = [
  { path: "/",          priority: "1.0", changefreq: "weekly"  },
  { path: "/collection",priority: "0.9", changefreq: "daily"   },
  { path: "/curations", priority: "0.8", changefreq: "monthly" },
  { path: "/others",    priority: "0.7", changefreq: "weekly"  },
  { path: "/colophon",  priority: "0.4", changefreq: "monthly" },
  { path: "/contact",   priority: "0.5", changefreq: "monthly" },
];

function buildSitemap(slugs: string[]): string {
  const now = new Date().toISOString().split("T")[0];

  const staticEntries = STATIC_ROUTES.map(
    ({ path, priority, changefreq }) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  ).join("");

  const projectEntries = slugs.map(
    (slug) => `
  <url>
    <loc>${SITE_URL}/projects/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${projectEntries}
</urlset>`;
}

export default function SitemapXml() {
  // Component is never rendered — getServerSideProps writes the response directly.
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const projects = await fetchCmsProjects();
  const slugs = projects
    .map((p) => projectSlug(p))
    .filter((s): s is string => Boolean(s));

  const sitemap = buildSitemap(slugs);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.write(sitemap);
  res.end();

  return { props: {} };
};
