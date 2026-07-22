import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { ArchivePage } from "@/components/archive/ArchivePage";
import { ArtworkCard } from "@/components/archive/ArtworkCard";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "44bf48cwfgePT5AFUoVrNj",
      token: "CsWgqlOXVBNJRa0UkrVYrJtCSAWEk6Gly5Xd61SJkFLB0cPhEAd4yAwnDB74i0qU7sDb457rolgFlQJVm6ig",
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // project, allowing you to see your designs without publishing.  Please
  // only use this for development, as this is significantly slower.
  preview: false,
});

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And configure your Plasmic project to use the host url pointing at
// the /plasmic-host page of your nextjs app (for example,
// http://localhost:3000/plasmic-host).  See
// https://docs.plasmic.app/learn/app-hosting/#set-a-plasmic-project-to-use-your-app-host

PLASMIC.registerComponent(ArchivePage, {
  name: "ArchivePage",
  displayName: "Archive / Page",
  props: {
    projects: { type: "array", displayName: "CMS projects", defaultValue: [] },
  },
  importPath: "@/components/archive/ArchivePage",
  importName: "ArchivePage",
});

PLASMIC.registerComponent(ArtworkCard, {
  name: "ArtworkCard",
  displayName: "Archive / Artwork Card",
  props: {
    id: "string",
    title: "string",
    slug: "string",
    frontCover: "imageUrl",
    artists: { type: "object", displayName: "Artists", defaultValue: [] },
    categories: { type: "object", displayName: "Categories", defaultValue: [] },
    style: { type: "object", displayName: "Style", defaultValue: [] },
    palette: { type: "object", displayName: "Palette", defaultValue: [] },
    year: "number",
    date: "string",
    createdAt: "string",
    catalogueNumber: { type: "string", displayName: "Catalogue No." },
    href: { type: "string", displayName: "Link URL" },
  },
  importPath: "@/components/archive/ArtworkCard",
  importName: "ArtworkCard",
});
