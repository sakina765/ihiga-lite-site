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
 *
 * factTextRw is now populated for all rows (Phase 6 — it was left null in
 * Phase 1). There's still no factTextFr column: French output relies on
 * Groq's own live translation of factText/factTextRw at generation time,
 * which is reliable for French (a comparatively high-resource language for
 * LLMs) — unlike Kinyarwanda, where a validated native translation
 * meaningfully improves accuracy over on-the-fly translation. Adding a
 * French column is a reasonable future step but isn't a "genuine gap" the
 * same way the empty factTextRw column was.
 */
export const KNOWLEDGE_FACT_SEEDS: KnowledgeFactSeed[] = [
  {
    cropSlug: "maize",
    topic: "spacing",
    factText: "Plant maize at about 75cm between rows and 25-30cm between plants within a row for optimal yield.",
    factTextRw:
      "Tera ibigori ku ntera ya cm 75 hagati y'imirongo na cm 25-30 hagati y'ibimera kugira ngo ubone umusaruro mwiza.",
    source: SOURCE,
    tags: ["spacing", "maize", "planting"],
  },
  {
    cropSlug: "maize",
    topic: "fertilizer",
    factText:
      "Apply DAP or NPK fertilizer at planting, then top-dress with urea 4-6 weeks after emergence once maize is knee-high.",
    factTextRw:
      "Shyira ifumbire ya DAP cyangwa NPK igihe utera, hanyuma wongereho ifumbire ya urea nyuma y'ibyumweru 4-6, igihe ibigori bimaze gukura bigeze ku vi.",
    source: SOURCE,
    tags: ["fertilizer", "maize", "topdressing"],
  },
  {
    cropSlug: "maize",
    topic: "pest",
    factText:
      "Fall armyworm (Spodoptera frugiperda) is a major maize pest in Rwanda; scout weekly for 'window-pane' feeding damage on young leaves and treat early.",
    factTextRw:
      "Umuswa w'ibigori (Fall armyworm) ni kamwe mu dukoko dukomeye dwangiza ibigori mu Rwanda; genzura buri cyumweru amababi mato yerekana ibimenyetso by'uko yariwe, uvure hakiri kare.",
    source: SOURCE,
    tags: ["pest", "maize", "fall armyworm"],
  },
  {
    cropSlug: "maize",
    topic: "harvest",
    factText: "Maize is ready for harvest when husks turn brown and dry and kernels are hard, generally 16-18 weeks after planting.",
    factTextRw:
      "Ibigori biba byiteguye gusarurwa igihe amakoba yahindutse ibara ry'ikawa kandi yumye, n'imbuto zikaba zikomeye, mu gihe cy'ibyumweru 16-18 nyuma yo gutera.",
    source: SOURCE,
    tags: ["harvest", "maize"],
  },
  {
    cropSlug: "maize",
    topic: "irrigation",
    factText: "Maize is most sensitive to water stress during tasseling, flowering, and grain filling — prioritize irrigation in these stages if rainfall is low.",
    factTextRw:
      "Ibigori bikeneye cyane amazi mu gihe cyo gutanga indabo, kubyara, no kwuzuza imbuto — banza kuhira muri iki gihe iyo imvura idahagije.",
    source: SOURCE,
    tags: ["irrigation", "maize"],
  },
  {
    cropSlug: "beans",
    topic: "spacing",
    factText: "Plant bush beans at about 40cm between rows and 10cm between plants for good airflow and yield.",
    factTextRw:
      "Tera ibishyimbo ku ntera ya cm 40 hagati y'imirongo na cm 10 hagati y'ibimera kugira ngo umuyaga unyure neza kandi ubone umusaruro mwiza.",
    source: SOURCE,
    tags: ["spacing", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "fertilizer",
    factText:
      "Beans fix their own nitrogen via root nodules; favor a phosphorus-rich fertilizer (e.g. DAP) at planting rather than heavy nitrogen application.",
    factTextRw:
      "Ibishyimbo bifite ubushobozi bwo gukora azote ubwabyo binyuze mu mizi; koresha ifumbire ifite fosifora nyinshi (nka DAP) igihe utera, aho gushyiramo azote nyinshi.",
    source: SOURCE,
    tags: ["fertilizer", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "pest",
    factText: "Bean weevils and aphids are common bean pests; rotate crops and inspect pods regularly to reduce infestation.",
    factTextRw:
      "Ibinyugunyugu n'udukoko duto (aphids) ni udukoko dukunze kwangiza ibishyimbo; hindura ibihingwa mu murima kandi ugenzure ibinyampeke buri gihe kugira ngo ugabanye ibyago byo kwandura.",
    source: SOURCE,
    tags: ["pest", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "harvest",
    factText: "Bush beans are ready to harvest when pods turn yellow/brown and rattle when shaken, roughly 10-11 weeks after planting.",
    factTextRw:
      "Ibishyimbo biba byiteguye gusarurwa igihe ibinyampeke byahindutse umuhondo cyangwa ibara ry'ikawa kandi bikagira urusaku iyo bivunaguwe, mu gihe cy'ibyumweru 10-11 nyuma yo gutera.",
    source: SOURCE,
    tags: ["harvest", "beans"],
  },
  {
    cropSlug: "beans",
    topic: "irrigation",
    factText: "Beans need consistent moisture during flowering and pod-filling; avoid waterlogging, which promotes root rot.",
    factTextRw:
      "Ibishyimbo bikeneye ubuhehere buhoraho mu gihe cyo kubyara no kwuzuza ibinyampeke; irinde ubutaka bubitse amazi menshi kuko bitera kubora kw'imizi.",
    source: SOURCE,
    tags: ["irrigation", "beans"],
  },
  {
    cropSlug: "irish-potato",
    topic: "spacing",
    factText: "Plant Irish potato seed tubers about 30cm apart within rows spaced 75cm apart, at a planting depth of roughly 10cm.",
    factTextRw:
      "Tera imbuto z'ibirayi ku ntera ya cm 30 hagati yazo mu murongo, imirongo ikaba hagati ya cm 75, mu bujyakuzimu bwa cm 10.",
    source: SOURCE,
    tags: ["spacing", "potato", "irish potato"],
  },
  {
    cropSlug: "irish-potato",
    topic: "fertilizer",
    factText:
      "Apply a balanced NPK fertilizer at planting, then hill up soil around the stems during tuber initiation to support tuber development.",
    factTextRw:
      "Shyira ifumbire ya NPK yuzuye igihe utera, hanyuma uzamure ubutaka hafi y'ibihingwa igihe ibirayi bitangira kwera kugira ngo bikure neza.",
    source: SOURCE,
    tags: ["fertilizer", "potato", "irish potato"],
  },
  {
    cropSlug: "irish-potato",
    topic: "pest",
    factText:
      "Late blight (Phytophthora infestans) is the most destructive potato disease, especially in cool, wet conditions; use certified disease-free seed and approved fungicides.",
    factTextRw:
      "Indwara ya late blight (Phytophthora infestans) ni yo ikomeye cyane yangiza ibirayi, cyane cyane mu gihe cy'ubukonje n'ubuhehere; koresha imbuto zemewe kandi zidafite indwara, hamwe n'imiti yemewe.",
    source: SOURCE,
    tags: ["pest", "disease", "potato", "late blight"],
  },
  {
    cropSlug: "irish-potato",
    topic: "pest",
    factText: "Potato tuber moth can damage stored tubers; hill soil well at growth and store harvested tubers in a dry, well-ventilated space.",
    factTextRw:
      "Ikinyugunyugu cy'ibirayi (potato tuber moth) gishobora kwangiza ibirayi bibitswe; zamura neza ubutaka igihe bikura kandi ubike ibirayi byasaruwe ahantu hakonje kandi hafite umwuka mwiza.",
    source: SOURCE,
    tags: ["pest", "potato", "storage"],
  },
  {
    cropSlug: "irish-potato",
    topic: "harvest",
    factText: "Irish potato is ready for harvest when the vines yellow and die back, typically 13-15 weeks after planting.",
    factTextRw:
      "Ibirayi biba byiteguye gusarurwa igihe amashami yahindutse umuhondo kandi yumye, mu gihe cy'ibyumweru 13-15 nyuma yo gutera.",
    source: SOURCE,
    tags: ["harvest", "potato", "irish potato"],
  },
  {
    cropSlug: null,
    topic: "irrigation",
    factText:
      "During Impeshyi (Season C), the dry season, crops depend on irrigation or marshland moisture — ensure consistent watering for vegetables and off-season crops.",
    factTextRw:
      "Mu gihe cy'Impeshyi (Season C), igihe cy'izuba, ibihingwa bikenera kuhirwa cyangwa ubuhehere bw'ibiraro — reba ko imboga n'ibindi bihingwa byo hanze y'igihe cyabyo bihiriwe neza buri gihe.",
    source: SOURCE,
    tags: ["irrigation", "season c", "impeshyi"],
  },
  {
    cropSlug: null,
    topic: "soil",
    factText: "Test and amend soil pH before planting — most common food crops prefer slightly acidic to neutral soil (pH 5.5-6.5).",
    factTextRw:
      "Suzuma kandi unonosore urugero rwa pH y'ubutaka mbere yo gutera — ibihingwa byinshi bikunda ubutaka bufite asidi nke kugeza ku butaka busanzwe (pH 5.5-6.5).",
    source: SOURCE,
    tags: ["soil", "general", "ph"],
  },
  {
    cropSlug: null,
    topic: "rotation",
    factText: "Rotate cereals (like maize) with legumes (like beans) to improve soil nitrogen and break pest and disease cycles.",
    factTextRw:
      "Hindura ibinyampeke (nk'ibigori) n'ibihingwa by'imbuto (nk'ibishyimbo) kugira ngo wongere azote mu butaka no guhagarika ubuzunguruke bw'udukoko n'indwara.",
    source: SOURCE,
    tags: ["rotation", "general", "soil health"],
  },
  {
    cropSlug: null,
    topic: "storage",
    factText: "Dry harvested grain to a safe moisture level (around 13-14%) before storage to prevent mold and pest damage.",
    factTextRw:
      "Umisha imbuto zasaruwe kugeza ku rugero rw'ubuhehere bwizewe (hafi 13-14%) mbere yo kuzibika kugira ngo wirinde ubwoya n'udukoko.",
    source: SOURCE,
    tags: ["storage", "general", "post-harvest"],
  },
  {
    cropSlug: null,
    topic: "planting",
    factText:
      "In Rwanda, Season A (Urugaryi) planting typically begins with the onset of rains around mid-September; Season B (Itumba) planting begins around mid-February.",
    factTextRw:
      "Mu Rwanda, gutera muri Season A (Urugaryi) bitangira igihe imvura itangiye, hafi hagati ya Nzeri; gutera muri Season B (Itumba) bitangira hafi hagati ya Gashyantare.",
    source: SOURCE,
    tags: ["season", "planting", "timing"],
  },
];
