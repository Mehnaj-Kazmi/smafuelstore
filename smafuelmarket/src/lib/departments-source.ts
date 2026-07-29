import {
  departments as seedDepartments,
  type ArtKey,
  type Department,
  type DepartmentSlug,
} from "./catalog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ApiDepartment = {
  slug: string;
  name: string;
  blurb: string;
  imageUrl: string | null;
  art: string;
  hue: number;
  ageRestricted: boolean;
  sortOrder: number;
};

function toDepartment(d: ApiDepartment): Department {
  return {
    slug: d.slug as DepartmentSlug,
    name: d.name,
    blurb: d.blurb,
    imageUrl: d.imageUrl,
    art: d.art as ArtKey,
    hue: d.hue,
    ageRestricted: d.ageRestricted,
  };
}

/**
 * The departments shown on the home page and the departments index.
 *
 * Read from the API so the artwork, names and running order can be changed in
 * the admin panel. The seed list is the fallback for an unreachable API, so
 * the "Shop by department" row still renders rather than collapsing to
 * nothing — it is the main navigation into the catalogue.
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    const res = await fetch(`${API_URL}/departments`, { cache: "no-store" });
    if (!res.ok) return seedDepartments;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return seedDepartments;

    return (data as ApiDepartment[]).map(toDepartment);
  } catch {
    return seedDepartments;
  }
}
