import { CmsProject, SortKey } from "../types";

const yearOf = (project: CmsProject) => (typeof project.year === "number" ? project.year : Number(project.year) || 0);
const titleOf = (project: CmsProject) => (project.title || "").toLocaleLowerCase();
const createdOf = (project: CmsProject) => project.createdAt || project.date || "";
// id used as a final stable tiebreaker — guarantees a consistent order when
// year and createdAt are identical (e.g. all 2026 projects with null createdAt).
const idOf = (project: CmsProject) => project.id || "";

/** Return a new, sorted array. Newest is the default archive ordering. */
export function sortProjects(projects: CmsProject[], sort: SortKey): CmsProject[] {
  const list = [...projects];
  switch (sort) {
    case "oldest":
      // asc year → asc date → asc id (stable unique final key)
      return list.sort(
        (a, b) =>
          yearOf(a) - yearOf(b) ||
          createdOf(a).localeCompare(createdOf(b)) ||
          idOf(a).localeCompare(idOf(b))
      );
    case "az":
      return list.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
    case "za":
      return list.sort((a, b) => titleOf(b).localeCompare(titleOf(a)));
    case "newest":
    default:
      // desc year → desc date → desc id (exact reverse of "oldest" within a year)
      return list.sort(
        (a, b) =>
          yearOf(b) - yearOf(a) ||
          createdOf(b).localeCompare(createdOf(a)) ||
          idOf(b).localeCompare(idOf(a))
      );
  }
}
