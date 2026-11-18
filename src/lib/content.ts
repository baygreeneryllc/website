import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type Service = CollectionEntry<'services'>;
export type Area = CollectionEntry<'areas'>;

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', (p) => p.data.published);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getServices(): Promise<Service[]> {
  const all = await getCollection('services');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/* Area IDs a project counts toward: its own areas plus their parents
   (an Almaden Valley project also counts toward San Jose). */
export function projectAreaIds(project: Project, areas: Area[]): Set<string> {
  const ids = new Set<string>();
  for (const ref of project.data.areas) {
    let current = areas.find((a) => a.id === ref.id);
    while (current) {
      ids.add(current.id);
      current = current.data.parent ? areas.find((a) => a.id === current!.data.parent!.id) : undefined;
    }
  }
  return ids;
}

export async function getAllAreas(): Promise<Area[]> {
  const all = await getCollection('areas');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/* Only areas with at least one published project get a page. */
export async function getPublishedAreas(): Promise<Area[]> {
  const [areas, projects] = await Promise.all([getAllAreas(), getProjects()]);
  return areas.filter((area) => projects.some((p) => projectAreaIds(p, areas).has(area.id)));
}

export function projectsInArea(area: Area, projects: Project[], areas: Area[]): Project[] {
  return projects.filter((p) => projectAreaIds(p, areas).has(area.id));
}

export function projectsForService(service: Service, projects: Project[]): Project[] {
  return projects.filter((p) => p.data.services.some((s) => s.id === service.id));
}

export const coverOf = (p: Project) => p.data.photos[p.data.coverPhoto] ?? p.data.photos[0];
