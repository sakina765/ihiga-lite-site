/**
 * Approximate lat/long for Rwanda's district capitals/towns, used to query
 * Open-Meteo (which needs coordinates, not place names) — precise enough for
 * a regional weather forecast, not survey-grade.
 *
 * Full coverage of all 30 official districts (Kigali City: 3, Northern: 5,
 * Southern: 8, Eastern: 7, Western: 7), PLUS "Kigali" as a convenience alias
 * for the whole city — most farmers (and the onboarding district dropdown)
 * think in terms of "Kigali" rather than picking Gasabo/Kicukiro/Nyarugenge
 * specifically, and this app's audience skews rural anyway. That's 31 entries
 * total, not 30 — the extra one is intentional, not a miscount.
 *
 * The original 7 entries (Kigali, Musanze, Huye, Rubavu, Nyagatare, Rusizi,
 * Muhanga) are left exactly as they were seeded in Phase 5 and already
 * verified against real Open-Meteo calls — not touched here to avoid
 * needless churn on values that work.
 */
export const RWANDA_DISTRICT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Convenience alias for Kigali City as a whole.
  Kigali: { lat: -1.9441, lon: 30.0619 },
  // Kigali City's 3 official districts.
  Gasabo: { lat: -1.883, lon: 30.133 },
  Kicukiro: { lat: -2.0, lon: 30.15 },
  Nyarugenge: { lat: -1.983, lon: 30.017 },
  // Northern Province.
  Musanze: { lat: -1.4995, lon: 29.6335 },
  Gicumbi: { lat: -1.617, lon: 30.117 },
  Rulindo: { lat: -1.733, lon: 30.0 },
  Burera: { lat: -1.491, lon: 29.81 },
  Gakenke: { lat: -1.7, lon: 29.783 },
  // Southern Province.
  Huye: { lat: -2.5967, lon: 29.7392 },
  Nyanza: { lat: -2.5, lon: 29.5 },
  Gisagara: { lat: -2.617, lon: 29.85 },
  Nyaruguru: { lat: -2.7, lon: 29.517 },
  Muhanga: { lat: -2.0836, lon: 29.7566 },
  Kamonyi: { lat: -2.0, lon: 29.9 },
  Ruhango: { lat: -2.2, lon: 29.767 },
  Nyamagabe: { lat: -2.4, lon: 29.467 },
  // Eastern Province.
  Rwamagana: { lat: -1.967, lon: 30.35 },
  Nyagatare: { lat: -1.2943, lon: 30.3251 },
  Gatsibo: { lat: -1.6, lon: 30.45 },
  Kayonza: { lat: -1.85, lon: 30.65 },
  Kirehe: { lat: -2.25, lon: 30.733 },
  Ngoma: { lat: -2.183, lon: 30.467 },
  Bugesera: { lat: -2.205, lon: 30.145 },
  // Western Province.
  Rubavu: { lat: -1.6787, lon: 29.2586 },
  Rusizi: { lat: -2.4846, lon: 28.9075 },
  Nyabihu: { lat: -1.65, lon: 29.5 },
  Karongi: { lat: -2.151, lon: 29.395 },
  Rutsiro: { lat: -1.917, lon: 29.317 },
  Ngororero: { lat: -1.867, lon: 29.65 },
  Nyamasheke: { lat: -2.367, lon: 29.15 },
};
