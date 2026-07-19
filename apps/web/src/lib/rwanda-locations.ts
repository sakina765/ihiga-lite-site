/**
 * Mirrors apps/api/src/weather/rwanda-provinces.ts — province -> district
 * names, kept in lockstep with the backend's RWANDA_PROVINCE_DISTRICTS (same
 * convention already used for the old flat DISTRICTS list in
 * OnboardingScreen.tsx). Keep this in sync if the backend list ever changes.
 */
export const RWANDA_PROVINCE_DISTRICTS: Record<string, string[]> = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  Northern: ["Musanze", "Gicumbi", "Rulindo", "Burera", "Gakenke"],
  Southern: ["Huye", "Nyanza", "Gisagara", "Nyaruguru", "Muhanga", "Kamonyi", "Ruhango", "Nyamagabe"],
  Eastern: ["Rwamagana", "Nyagatare", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Bugesera"],
  Western: ["Rubavu", "Rusizi", "Nyabihu", "Karongi", "Rutsiro", "Ngororero", "Nyamasheke"],
};

/**
 * Which province a district belongs to — used to auto-fill the province
 * select after a GPS-resolved sector. Mirrors the same "Kigali" alias
 * handling as the backend's districtToProvince (rwanda-provinces.ts) — kept
 * for parity even though GPS resolution always returns one of Gasabo/
 * Kicukiro/Nyarugenge, never the bare alias, so this branch mainly matters
 * for consistency with the backend, not a code path this frontend copy hits.
 */
export function districtToProvince(district: string): string | undefined {
  if (district === "Kigali") {
    return "Kigali City";
  }
  return Object.entries(RWANDA_PROVINCE_DISTRICTS).find(([, districts]) => districts.includes(district))?.[0];
}
