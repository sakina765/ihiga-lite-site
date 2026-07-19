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

/**
 * Looks up which province a district belongs to (case-sensitive, matches the
 * exact keys above). The "Kigali" whole-city alias isn't a key in
 * RWANDA_PROVINCE_DISTRICTS (see the comment above), but it still needs to
 * resolve to a real province here — farmers who registered before the
 * cascading location picker existed (or via the API directly) can have
 * district="Kigali" stored, and without this they'd get working weather
 * (RWANDA_DISTRICT_COORDINATES does have a "Kigali" entry) but permanently
 * empty crop suggestions, since CropSuggestionsService keys off province.
 */
export function districtToProvince(district: string): string | undefined {
  if (district === "Kigali") {
    return "Kigali City";
  }
  return Object.entries(RWANDA_PROVINCE_DISTRICTS).find(([, districts]) => districts.includes(district))?.[0];
}
