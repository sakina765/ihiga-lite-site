import { RWANDA_DISTRICT_COORDINATES } from "./rwanda-districts";

// Rwanda's 30 official districts (Kigali City: 3, Northern: 5, Southern: 8,
// Eastern: 7, Western: 7) — locks in full coverage as a regression check.
const OFFICIAL_DISTRICTS = [
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Musanze",
  "Gicumbi",
  "Rulindo",
  "Burera",
  "Gakenke",
  "Huye",
  "Nyanza",
  "Gisagara",
  "Nyaruguru",
  "Muhanga",
  "Kamonyi",
  "Ruhango",
  "Nyamagabe",
  "Rwamagana",
  "Nyagatare",
  "Gatsibo",
  "Kayonza",
  "Kirehe",
  "Ngoma",
  "Bugesera",
  "Rubavu",
  "Rusizi",
  "Nyabihu",
  "Karongi",
  "Rutsiro",
  "Ngororero",
  "Nyamasheke",
];

describe("RWANDA_DISTRICT_COORDINATES", () => {
  it("covers all 30 official Rwandan districts", () => {
    expect(OFFICIAL_DISTRICTS).toHaveLength(30);
    for (const district of OFFICIAL_DISTRICTS) {
      expect(RWANDA_DISTRICT_COORDINATES[district]).toBeDefined();
    }
  });

  it("also keeps the 'Kigali' convenience alias for the whole city", () => {
    expect(RWANDA_DISTRICT_COORDINATES.Kigali).toBeDefined();
  });

  it("gives every entry a plausible lat/lon within Rwanda's borders", () => {
    for (const [district, coords] of Object.entries(RWANDA_DISTRICT_COORDINATES)) {
      expect(coords.lat).toBeGreaterThan(-3);
      expect(coords.lat).toBeLessThan(-1);
      expect(coords.lon).toBeGreaterThan(28);
      expect(coords.lon).toBeLessThan(31);
      // (loop var used only for assertion messages via jest's default output)
      void district;
    }
  });
});
