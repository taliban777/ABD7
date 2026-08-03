import { CmsOther } from "../types";

const dateOf = (item: CmsOther) => item.date || "";
const titleOf = (item: CmsOther) => (item.title || "").toLocaleLowerCase();

/** Return a new, sorted array. Newest (by CMS date) is the default. */
export function sortOthers(items: CmsOther[], sort: "newest" | "oldest"): CmsOther[] {
  const list = [...items];
  switch (sort) {
    case "oldest":
      return list.sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || titleOf(a).localeCompare(titleOf(b)));
    case "newest":
    default:
      return list.sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || titleOf(b).localeCompare(titleOf(a)));
  }
}
