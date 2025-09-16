import * as db from "velite";

export type Project = typeof db.projects.$infer;
export function allProjects() {
	return db.projects.sort((a, b) => (a.date > b.date ? -1 : 1));
}
