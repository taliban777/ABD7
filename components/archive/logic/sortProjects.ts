import { CmsProject, SortKey } from "../types";

const yearOf = (project: CmsProject) => (typeof project.year === "number" ? project.year : Number(project.year) || 0);
const titleOf = (project: CmsProject) => (project.title || "").toLocaleLowerCase();
const createdOf = (project: CmsProject) => project.createdAt || project.date || "";

/** Return a new, sorted array. Newest is the default archive ordering. */
export function sortProjects(projects: CmsProject[], sort: SortKey): CmsProject[] {
  const list = [...projects];
  switch (sort) {
    case "oldest":
      return list.sort((a, b) => yearOf(a) - yearOf(b) || createdOf(a).localeCompare(createdOf(b)));
    case "az":
      return list.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
    case "za":
      return list.sort((a, b) => titleOf(b).localeCompare(titleOf(a)));
    case "newest":
    default:
      return list.sort((a, b) => yearOf(b) - yearOf(a) || createdOf(b).localeCompare(createdOf(a)));
  }
}
