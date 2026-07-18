/**
 * Rwanda's 5 provinces mapped to their official districts, using the exact
 * same district name strings as RWANDA_DISTRICT_COORDINATES (see
 * rwanda-districts.ts) so both files stay in lockstep. Deliberately excludes
 * the "Kigali" whole-city convenience alias from that file — it isn't a real
 * district, so including it here would double-count Gasabo/Kicukiro/Nyarugenge
 * in a province rollup.
 */
export const RWANDA_PROVINCE_DISTRICTS: Record<string, string[]> = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  Northern: ["Musanze", "Gicumbi", "Rulindo", "Burera", "Gakenke"],
  Southern: ["Huye", "Nyanza", "Gisagara", "Nyaruguru", "Muhanga", "Kamonyi", "Ruhango", "Nyamagabe"],
  Eastern: ["Rwamagana", "Nyagatare", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Bugesera"],
  Western: ["Rubavu", "Rusizi", "Nyabihu", "Karongi", "Rutsiro", "Ngororero", "Nyamasheke"],
};

/** Looks up which province a district belongs to (case-sensitive, matches the exact keys above). */
export function districtToProvince(district: string): string | undefined {
  return Object.entries(RWANDA_PROVINCE_DISTRICTS).find(([, districts]) => districts.includes(district))?.[0];
}
