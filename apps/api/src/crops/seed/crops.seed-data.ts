export interface CropStageSeed {
  name: string;
  orderIndex: number;
  weekStart: number;
  weekEnd: number;
  taskDescription: string;
  taskDescriptionRw: string;
}

export interface CropSeed {
  name: string;
  localName: string;
  slug: string;
  description: string;
  stages: CropStageSeed[];
}

/**
 * Placeholder agronomic timelines based on general knowledge of these crops
 * in the Rwandan context — not sourced from a validated dataset yet. Weeks
 * are relative to the planting date and are non-overlapping/consecutive.
 */
export const CROP_SEEDS: CropSeed[] = [
  {
    name: "Maize",
    localName: "Ibigori",
    slug: "maize",
    description: "Staple cereal grown across all three seasons where rainfall/irrigation allows.",
    stages: [
      {
        name: "Land preparation",
        orderIndex: 1,
        weekStart: 0,
        weekEnd: 1,
        taskDescription: "Clear the field, plough, and apply basal manure or fertilizer before planting.",
        taskDescriptionRw: "Tegura umurima, rime, kandi ushyireho ifumbire mbere yo gutera.",
      },
      {
        name: "Planting",
        orderIndex: 2,
        weekStart: 2,
        weekEnd: 2,
        taskDescription: "Sow seeds at recommended spacing and depth, ideally right after the first good rains.",
        taskDescriptionRw: "Tera imbuto ku ntera igenwe n'ubujyakuzimu bukwiye, byaba byiza nyuma y'imvura ya mbere nziza.",
      },
      {
        name: "Germination & early vegetative growth",
        orderIndex: 3,
        weekStart: 3,
        weekEnd: 5,
        taskDescription: "Monitor emergence, gap-fill missing stands, and control early weeds.",
        taskDescriptionRw: "Kurikirana imera, usimbuze aho ntiyameze, kandi urandure ibyatsi bibi hakiri kare.",
      },
      {
        name: "Vegetative growth",
        orderIndex: 4,
        weekStart: 6,
        weekEnd: 8,
        taskDescription: "Top-dress with nitrogen fertilizer and scout for fall armyworm and other leaf pests.",
        taskDescriptionRw: "Ongeraho ifumbire ya azote kandi ukurikirane udukoko nka fall armyworm.",
      },
      {
        name: "Tasseling & flowering",
        orderIndex: 5,
        weekStart: 9,
        weekEnd: 10,
        taskDescription: "Ensure adequate moisture — this is the growth stage most sensitive to water stress.",
        taskDescriptionRw: "Reba neza ko hari amazi ahagije, kuko iki ni cyo gihe kibi cyane iyo umera ubuze amazi.",
      },
      {
        name: "Grain filling & maturation",
        orderIndex: 6,
        weekStart: 11,
        weekEnd: 15,
        taskDescription: "Continue pest monitoring; reduce watering as kernels begin to harden.",
        taskDescriptionRw: "Komeza gukurikirana udukoko; gabanya amazi mu gihe imbuto zitangira gukomera.",
      },
      {
        name: "Harvest",
        orderIndex: 7,
        weekStart: 16,
        weekEnd: 18,
        taskDescription: "Harvest once husks are brown and dry and kernels are hard; dry grain to a safe moisture level before storage.",
        taskDescriptionRw: "Sarura igihe amakoba yumye kandi ari umuhondo, hanyuma umishe imbuto neza mbere yo kuzibika.",
      },
    ],
  },
  {
    name: "Beans",
    localName: "Ibishyimbo",
    slug: "beans",
    description: "Fast-cycling legume commonly intercropped with maize; fixes nitrogen in the soil.",
    stages: [
      {
        name: "Land preparation",
        orderIndex: 1,
        weekStart: 0,
        weekEnd: 1,
        taskDescription: "Prepare a well-drained bed; beans dislike waterlogged soil.",
        taskDescriptionRw: "Tegura umurima wemera amazi neza, kuko ibishyimbo bitakunda ubutaka bubitse amazi.",
      },
      {
        name: "Planting",
        orderIndex: 2,
        weekStart: 2,
        weekEnd: 2,
        taskDescription: "Sow seeds at recommended spacing; apply a phosphorus-rich starter fertilizer.",
        taskDescriptionRw: "Tera imbuto ku ntera igenwe, ushyireho n'ifumbire ifite fosifora.",
      },
      {
        name: "Germination & vegetative growth",
        orderIndex: 3,
        weekStart: 3,
        weekEnd: 5,
        taskDescription: "Weed regularly and watch for aphids and bean weevils on young leaves.",
        taskDescriptionRw: "Sarura ibyatsi bibi kenshi kandi ukurikirane udukoko nk'inzige n'ibindi.",
      },
      {
        name: "Flowering",
        orderIndex: 4,
        weekStart: 6,
        weekEnd: 7,
        taskDescription: "Maintain consistent soil moisture — flowering and pod-set are the most water-sensitive stages.",
        taskDescriptionRw: "Komeza kubona ubuhehere buhagije mu butaka, kuko iki ari igihe cy'ingenzi cyo kubyara indabo n'ibinyampeke.",
      },
      {
        name: "Pod filling & maturation",
        orderIndex: 5,
        weekStart: 8,
        weekEnd: 9,
        taskDescription: "Reduce watering as pods begin to dry; inspect for pod-boring pests.",
        taskDescriptionRw: "Gabanya amazi mu gihe ibinyampeke bitangira kuma; genzura udukoko dutobora ibinyampeke.",
      },
      {
        name: "Harvest",
        orderIndex: 6,
        weekStart: 10,
        weekEnd: 11,
        taskDescription: "Harvest when pods are yellow/brown and rattle when shaken; dry thoroughly before storage.",
        taskDescriptionRw: "Sarura igihe ibinyampeke byahindutse umuhondo cyangwa umukara kandi bikagira urusaku iyo bihinduwe; umishe neza mbere yo kubibika.",
      },
    ],
  },
  {
    name: "Irish Potato",
    localName: "Ibirayi",
    slug: "irish-potato",
    description: "High-value tuber crop grown mainly in Rwanda's cooler, higher-altitude zones.",
    stages: [
      {
        name: "Land preparation",
        orderIndex: 1,
        weekStart: 0,
        weekEnd: 1,
        taskDescription: "Plough and ridge the field; select certified, disease-free seed tubers.",
        taskDescriptionRw: "Rima kandi ukore imisego; hitamo imbuto z'ibirayi zemewe kandi zidafite indwara.",
      },
      {
        name: "Planting",
        orderIndex: 2,
        weekStart: 2,
        weekEnd: 2,
        taskDescription: "Plant seed tubers at recommended spacing and depth, with basal NPK fertilizer.",
        taskDescriptionRw: "Tera imbuto z'ibirayi ku ntera n'ubujyakuzimu bikwiye, hamwe n'ifumbire ya NPK.",
      },
      {
        name: "Sprouting & vegetative growth",
        orderIndex: 3,
        weekStart: 3,
        weekEnd: 6,
        taskDescription: "Hill up soil around emerging stems and control weeds.",
        taskDescriptionRw: "Zamura ubutaka hafi y'ibihingwa bimaze gusohoka kandi urandure ibyatsi bibi.",
      },
      {
        name: "Tuber initiation",
        orderIndex: 4,
        weekStart: 7,
        weekEnd: 9,
        taskDescription: "Continue hilling and watch closely for late blight, especially in cool, wet weather.",
        taskDescriptionRw: "Komeza kuzamura ubutaka kandi ukurikirane indwara ya late blight, cyane cyane mu gihe cy'imvura n'ubukonje.",
      },
      {
        name: "Tuber bulking",
        orderIndex: 5,
        weekStart: 10,
        weekEnd: 12,
        taskDescription: "Ensure steady moisture — this stage determines final tuber size and yield.",
        taskDescriptionRw: "Reba ko ubutaka bugira ubuhehere buhagije, kuko iki gihe aricyo gitera ubunini n'umusaruro w'ibirayi.",
      },
      {
        name: "Maturation & harvest",
        orderIndex: 6,
        weekStart: 13,
        weekEnd: 15,
        taskDescription: "Harvest once the vines yellow and die back; cure tubers in a dry, ventilated space before storage.",
        taskDescriptionRw: "Sarura igihe amashami yahindutse umuhondo kandi yumye; bike ibirayi ahantu hakonje kandi hafite umwuka mwiza mbere yo kubibika.",
      },
    ],
  },
];
