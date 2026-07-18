export interface CropSuggestion {
  name: string;
  localName?: string;
  note?: string;
}

/**
 * Best-effort seed of regional crop specialization from public sources —
 * NOT a single MINAGRI-issued season×district×crop table (no such single
 * table was found; these describe general regional patterns, combined with
 * the national season A/B/C crop lists, not exact per-district data).
 *
 * Sources:
 * - africa-press.net, "How farming seasons drive decisions in fields,
 *   offices - Rwanda" — RAB (Rwanda Agriculture and Animal Resources
 *   Development Board) commentary on regional specialization and the
 *   national Season A/B/C crop lists.
 * - MINAGRI "Season A Overview" (minagri.gov.rw) — season/crop pairing.
 *
 * Keyed by season code × province (not district — the sourced data doesn't
 * support district-level granularity; see rwanda-provinces.ts for the
 * district→province mapping used to resolve a farmer's province).
 *
 * Season A (Sept 15–Feb 14) and B (Feb 15–Jun 15) are both rain-fed seasons
 * with the same national crop set (maize, beans, cassava, Irish potatoes,
 * soybeans, vegetables, wheat) per the sources above. Season C (Jun 16–Sep
 * 14) is the dry season, viable mainly in marshland/irrigated zones, with a
 * narrower sourced crop set (beans, soybeans, Irish potatoes, vegetables) —
 * perennial cash crops (tea, coffee) are listed across all three seasons
 * since they're harvested from standing bushes, not re-planted per season.
 */
export const CROP_SUGGESTIONS: Record<"A" | "B" | "C", Record<string, CropSuggestion[]>> = {
  A: {
    // Musanze etc. — near year-round rainfall; beans/potatoes/fruits per source.
    Northern: [
      { name: "Irish potatoes", localName: "Ibirayi" },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Maize", localName: "Ibigori" },
      { name: "Vegetables", localName: "Imboga" },
    ],
    // Tea, coffee, root crops per source.
    Western: [
      { name: "Coffee", localName: "Ikawa", note: "Perennial cash crop — harvested from standing bushes, not planted per season." },
      { name: "Tea", localName: "Icyayi", note: "Perennial cash crop — harvested from standing bushes, not planted per season." },
      { name: "Cassava", localName: "Imyumbati" },
      { name: "Beans", localName: "Ibishyimbo" },
    ],
    // Cereals and pulses per source.
    Eastern: [
      { name: "Maize", localName: "Ibigori" },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Soybeans" },
    ],
    // Irish potatoes and maize per source.
    Southern: [
      { name: "Irish potatoes", localName: "Ibirayi" },
      { name: "Maize", localName: "Ibigori" },
      { name: "Beans", localName: "Ibishyimbo" },
    ],
    "Kigali City": [
      { name: "Vegetables", localName: "Imboga", note: "No specific sourced data for Kigali City — general peri-urban vegetable growing." },
    ],
  },
  B: {
    Northern: [
      { name: "Irish potatoes", localName: "Ibirayi" },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Maize", localName: "Ibigori" },
      { name: "Vegetables", localName: "Imboga" },
    ],
    Western: [
      { name: "Coffee", localName: "Ikawa", note: "Perennial cash crop — harvested from standing bushes, not planted per season." },
      { name: "Tea", localName: "Icyayi", note: "Perennial cash crop — harvested from standing bushes, not planted per season." },
      { name: "Cassava", localName: "Imyumbati" },
      { name: "Beans", localName: "Ibishyimbo" },
    ],
    Eastern: [
      { name: "Maize", localName: "Ibigori" },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Soybeans" },
    ],
    Southern: [
      { name: "Irish potatoes", localName: "Ibirayi" },
      { name: "Maize", localName: "Ibigori" },
      { name: "Beans", localName: "Ibishyimbo" },
    ],
    "Kigali City": [
      { name: "Vegetables", localName: "Imboga", note: "No specific sourced data for Kigali City — general peri-urban vegetable growing." },
    ],
  },
  C: {
    // Season C's sourced crop set is narrower (marshland/irrigated dry-season
    // farming) — maize and wheat drop out; perennial tea/coffee stay.
    Northern: [
      { name: "Irish potatoes", localName: "Ibirayi" },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Vegetables", localName: "Imboga" },
    ],
    Western: [
      { name: "Coffee", localName: "Ikawa", note: "Perennial cash crop — harvested from standing bushes, not planted per season." },
      { name: "Tea", localName: "Icyayi", note: "Perennial cash crop — harvested from standing bushes, not planted per season." },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Soybeans" },
    ],
    Eastern: [
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Soybeans" },
      { name: "Vegetables", localName: "Imboga" },
    ],
    Southern: [
      { name: "Irish potatoes", localName: "Ibirayi" },
      { name: "Beans", localName: "Ibishyimbo" },
      { name: "Vegetables", localName: "Imboga" },
    ],
    "Kigali City": [
      { name: "Vegetables", localName: "Imboga", note: "No specific sourced data for Kigali City — general peri-urban vegetable growing." },
    ],
  },
};
