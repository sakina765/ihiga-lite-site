const SOURCE = "RICA (placeholder — replace with validated source)";

export interface KnowledgeFactSeed {
  cropSlug: string | null;
  topic: string;
  factText: string;
  factTextRw: string | null;
  source: string;
  tags: string[];
}

/**
 * Placeholder agronomy facts based on general knowledge, not yet sourced from
 * a validated dataset — hence the placeholder `source` value on every row.
 */
export const KNOWLEDGE_FACT_SEEDS: KnowledgeFactSeed[] = [
  {
    cropSlug: "maize",
    topic: "spacing",
    factText: "Plant maize at about 75cm between rows and 25-30cm between plants within a row for optimal yield.",
    factTextRw: null,
    source: SOURCE,
    tags: ["spacing", "maize", "planting"],
  },
  {
    cropSlug: "maize",
    topic: "fertilizer",
    factText:
      "Apply DAP or NPK fertilizer at planting, then top-dress with urea 4-6 weeks after emergence once maize is knee-high.",
    factTextRw: null,
    source: SOURCE,
    tags: ["fertilizer", "maize", "topdressing"],
  },
  {
    cropSlug: "maize",
    topic: "pest",
    factText:
      "Fall armyworm (Spodoptera frugiperda) is a major maize pest in Rwanda; scout weekly for 'window-pane' feeding damage on young leaves and treat early.",
    factTextRw: null,
    source: SOURCE,
    tags: ["pest", "maize", "fall armyworm"],
  },
  {
    cropSlug: "maize",
    topic: "harvest",
    factText: "Maize is ready for harvest when husks turn brown and dry and kernels are hard, generally 16-18 weeks after planting.",
    factTextRw: null,
    source: SOURCE,
    tags: ["harvest", "maize"],
  },
  {
    cropSlug: "maize",
    topic: "irrigation",
    factText: "Maize is most sensitive to water stress during tasseling, flowering, and grain filling — prioritize irrigation in these stages if rainfall is low.",
    factTextRw: null,
    source: SOURCE,
    tags: ["irrigation", "maize"],
  },
  {
    cropSlug: "beans",
    topic: "spacing",
    factText: "Plant bush beans at about 40cm between rows and 10cm between plants for good airflow and yield.",
    factTextRw: null,
    source: SOURCE,
    tags: ["spacing", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "fertilizer",
    factText:
      "Beans fix their own nitrogen via root nodules; favor a phosphorus-rich fertilizer (e.g. DAP) at planting rather than heavy nitrogen application.",
    factTextRw: null,
    source: SOURCE,
    tags: ["fertilizer", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "pest",
    factText: "Bean weevils and aphids are common bean pests; rotate crops and inspect pods regularly to reduce infestation.",
    factTextRw: null,
    source: SOURCE,
    tags: ["pest", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "harvest",
    factText: "Bush beans are ready to harvest when pods turn yellow/brown and rattle when shaken, roughly 10-11 weeks after planting.",
    factTextRw: null,
    source: SOURCE,
    tags: ["harvest", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "irrigation",
    factText: "Beans need consistent moisture during flowering and pod-filling; avoid waterlogging, which promotes root rot.",
    factTextRw: null,
    source: SOURCE,
    tags: ["irrigation", "beans"],
  },
  {
    cropSlug: "irish-potato",
    topic: "spacing",
    factText: "Plant Irish potato seed tubers about 30cm apart within rows spaced 75cm apart, at a planting depth of roughly 10cm.",
    factTextRw: null,
    source: SOURCE,
    tags: ["spacing", "potato", "irish potato"],
  },
  {
    cropSlug: "irish-potato",
    topic: "fertilizer",
    factText:
      "Apply a balanced NPK fertilizer at planting, then hill up soil around the stems during tuber initiation to support tuber development.",
    factTextRw: null,
    source: SOURCE,
    tags: ["fertilizer", "potato", "irish potato"],
  },
  {
    cropSlug: "irish-potato",
    topic: "pest",
    factText:
      "Late blight (Phytophthora infestans) is the most destructive potato disease, especially in cool, wet conditions; use certified disease-free seed and approved fungicides.",
    factTextRw: null,
    source: SOURCE,
    tags: ["pest", "disease", "potato", "late blight"],
  },
  {
    cropSlug: "irish-potato",
    topic: "pest",
    factText: "Potato tuber moth can damage stored tubers; hill soil well at growth and store harvested tubers in a dry, well-ventilated space.",
    factTextRw: null,
    source: SOURCE,
    tags: ["pest", "potato", "storage"],
  },
  {
    cropSlug: "irish-potato",
    topic: "harvest",
    factText: "Irish potato is ready for harvest when the vines yellow and die back, typically 13-15 weeks after planting.",
    factTextRw: null,
    source: SOURCE,
    tags: ["harvest", "potato", "irish potato"],
  },
  {
    cropSlug: null,
    topic: "irrigation",
    factText:
      "During Impeshyi (Season C), the dry season, crops depend on irrigation or marshland moisture — ensure consistent watering for vegetables and off-season crops.",
    factTextRw: null,
    source: SOURCE,
    tags: ["irrigation", "season c", "impeshyi"],
  },
  {
    cropSlug: null,
    topic: "soil",
    factText: "Test and amend soil pH before planting — most common food crops prefer slightly acidic to neutral soil (pH 5.5-6.5).",
    factTextRw: null,
    source: SOURCE,
    tags: ["soil", "general", "ph"],
  },
  {
    cropSlug: null,
    topic: "rotation",
    factText: "Rotate cereals (like maize) with legumes (like beans) to improve soil nitrogen and break pest and disease cycles.",
    factTextRw: null,
    source: SOURCE,
    tags: ["rotation", "general", "soil health"],
  },
  {
    cropSlug: null,
    topic: "storage",
    factText: "Dry harvested grain to a safe moisture level (around 13-14%) before storage to prevent mold and pest damage.",
    factTextRw: null,
    source: SOURCE,
    tags: ["storage", "general", "post-harvest"],
  },
  {
    cropSlug: null,
    topic: "planting",
    factText:
      "In Rwanda, Season A (Urugaryi) planting typically begins with the onset of rains around mid-September; Season B (Itumba) planting begins around mid-February.",
    factTextRw: null,
    source: SOURCE,
    tags: ["season", "planting", "timing"],
  },
];
