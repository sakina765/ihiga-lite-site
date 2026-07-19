/**
 * Real sector (umurenge) names for all 30 Rwandan districts — 416 sectors
 * total, matching Rwanda's actual administrative count.
 *
 * Source: https://github.com/ngabovictor/Rwanda (data.json) — a public-domain
 * ("use it however you want") structured dataset of Rwanda's provinces,
 * districts, sectors, cells, and villages. District keys here match exactly
 * the district names already used in ../../weather/rwanda-districts.ts and
 * ../../weather/rwanda-provinces.ts.
 *
 * This file has NAMES ONLY — no coordinates. Sector coordinates are not
 * available from this source and are deliberately NOT fabricated here; see
 * seed-sectors.ts, which computes an approximate coordinate for each sector
 * (offset from its district's known centroid) and flags every seeded row
 * with coordinatesApproximated=true so a future real dataset can be
 * distinguished from this approximation.
 */
export const RWANDA_SECTORS_BY_DISTRICT: Record<string, string[]> = {
  Bugesera: ["Gashora", "Juru", "Kamabuye", "Mareba", "Mayange", "Musenyi", "Mwogo", "Ngeruka", "Ntarama", "Nyamata", "Nyarugenge", "Rilima", "Ruhuha", "Rweru", "Shyara"],
  Burera: ["Bungwe", "Butaro", "Cyanika", "Cyeru", "Gahunga", "Gatebe", "Gitovu", "Kagogo", "Kinoni", "Kinyababa", "Kivuye", "Nemba", "Rugarama", "Rugengabari", "Ruhunde", "Rusarabuye", "Rwerere"],
  Gakenke: ["Busengo", "Coko", "Cyabingo", "Gakenke", "Gashenyi", "Janja", "Kamubuga", "Karambo", "Kivuruga", "Mataba", "Minazi", "Mugunga", "Muhondo", "Muyongwe", "Muzo", "Nemba", "Ruli", "Rusasa", "Rushashi"],
  Gasabo: ["Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali", "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", "Ndera", "Nduba", "Remera", "Rusororo", "Rutunga"],
  Gatsibo: ["Gasange", "Gatsibo", "Gitoki", "Kabarore", "Kageyo", "Kiramuruzi", "Kiziguro", "Muhura", "Murambi", "Ngarama", "Nyagihanga", "Remera", "Rugarama", "Rwimbogo"],
  Gicumbi: ["Bukure", "Bwisige", "Byumba", "Cyumba", "Giti", "Kageyo", "Kaniga", "Manyagiro", "Miyove", "Mukarange", "Muko", "Mutete", "Nyamiyaga", "Nyankenke", "Rubaya", "Rukomo", "Rushaki", "Rutare", "Ruvune", "Rwamiko", "Shangasha"],
  Gisagara: ["Gikonko", "Gishubi", "Kansi", "Kibirizi", "Kigembe", "Mamba", "Muganza", "Mugombwa", "Mukindo", "Musha", "Ndora", "Nyanza", "Save"],
  Huye: ["Gishamvu", "Huye", "Karama", "Kigoma", "Kinazi", "Maraba", "Mbazi", "Mukura", "Ngoma", "Ruhashya", "Rusatira", "Rwaniro", "Simbi", "Tumba"],
  Kamonyi: ["Gacurabwenge", "Karama", "Kayenzi", "Kayumbu", "Mugina", "Musambira", "Ngamba", "Nyamiyaga", "Nyarubaka", "Rugarika", "Rukoma", "Runda"],
  Karongi: ["Bwishyura", "Gashari", "Gishyita", "Gitesi", "Mubuga", "Murambi", "Murundi", "Mutuntu", "Rubengera", "Rugabano", "Ruganda", "Rwankuba", "Twumba"],
  Kayonza: ["Gahini", "Kabare", "Kabarondo", "Mukarange", "Murama", "Murundi", "Mwiri", "Ndego", "Nyamirama", "Rukara", "Ruramira", "Rwinkwavu"],
  Kicukiro: ["Gahanga", "Gatenga", "Gikondo", "Kagarama", "Kanombe", "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"],
  Kirehe: ["Gahara", "Gatore", "Kigarama", "Kigina", "Kirehe", "Mahama", "Mpanga", "Musaza", "Mushikiri", "Nasho", "Nyamugari", "Nyarubuye"],
  Muhanga: ["Cyeza", "Kabacuzi", "Kibangu", "Kiyumba", "Muhanga", "Mushishiro", "Nyabinoni", "Nyamabuye", "Nyarusange", "Rongi", "Rugendabari", "Shyogwe"],
  Musanze: ["Busogo", "Cyuve", "Gacaca", "Gashaki", "Gataraga", "Kimonyi", "Kinigi", "Muhoza", "Muko", "Musanze", "Nkotsi", "Nyange", "Remera", "Rwaza", "Shingiro"],
  Ngoma: ["Gashanda", "Jarama", "Karembo", "Kazo", "Kibungo", "Mugesera", "Murama", "Mutenderi", "Remera", "Rukira", "Rukumberi", "Rurenge", "Sake", "Zaza"],
  Ngororero: ["Bwira", "Gatumba", "Hindiro", "Kabaya", "Kageyo", "Kavumu", "Matyazo", "Muhanda", "Muhororo", "Ndaro", "Ngororero", "Nyange", "Sovu"],
  Nyabihu: ["Bigogwe", "Jenda", "Jomba", "Kabatwa", "Karago", "Kintobo", "Mukamira", "Muringa", "Rambura", "Rugera", "Rurembo", "Shyira"],
  Nyagatare: ["Gatunda", "Karama", "Karangazi", "Katabagemu", "Kiyombe", "Matimba", "Mimuri", "Mukama", "Musheri", "Nyagatare", "Rukomo", "Rwempasha", "Rwimiyaga", "Tabagwe"],
  Nyamagabe: ["Buruhukiro", "Cyanika", "Gasaka", "Gatare", "Kaduha", "Kamegeri", "Kibirizi", "Kibumbwe", "Kitabi", "Mbazi", "Mugano", "Musange", "Musebeya", "Mushubi", "Nkomane", "Tare", "Uwinkingi"],
  Nyamasheke: ["Bushekeri", "Bushenge", "Cyato", "Gihombo", "Kagano", "Kanjongo", "Karambi", "Karengera", "Kirimbi", "Macuba", "Mahembe", "Nyabitekeri", "Rangiro", "Ruharambuga", "Shangi"],
  Nyanza: ["Busasamana", "Busoro", "Cyabakamyi", "Kibilizi", "Kigoma", "Mukingo", "Muyira", "Ntyazo", "Nyagisozi", "Rwabicuma"],
  Nyarugenge: ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageregere", "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"],
  Nyaruguru: ["Busanze", "Cyahinda", "Kibeho", "Kivu", "Mata", "Muganza", "Munini", "Ngera", "Ngoma", "Nyabimata", "Nyagisozi", "Ruheru", "Ruramba", "Rusenge"],
  Rubavu: ["Bugeshi", "Busasamana", "Cyanzarwe", "Gisenyi", "Kanama", "Kanzenze", "Mudende", "Nyakiriba", "Nyamyumba", "Nyundo", "Rubavu", "Rugerero"],
  Ruhango: ["Bweramana", "Byimana", "Kabagali", "Kinazi", "Kinihira", "Mbuye", "Mwendo", "Ntongwe", "Ruhango"],
  Rulindo: ["Base", "Burega", "Bushoki", "Buyoga", "Cyinzuzi", "Cyungo", "Kinihira", "Kisaro", "Masoro", "Mbogo", "Murambi", "Ngoma", "Ntarabana", "Rukozo", "Rusiga", "Shyorongi", "Tumba"],
  Rusizi: ["Bugarama", "Butare", "Bweyeye", "Gashonga", "Giheke", "Gihundwe", "Gikundamvura", "Gitambi", "Kamembe", "Muganza", "Mururu", "Nkanka", "Nkombo", "Nkungu", "Nyakabuye", "Nyakarenzo", "Nzahaha", "Rwimbogo"],
  Rutsiro: ["Boneza", "Gihango", "Kigeyo", "Kivumu", "Manihira", "Mukura", "Murunda", "Musasa", "Mushonyi", "Mushubati", "Nyabirasi", "Ruhango", "Rusebeya"],
  Rwamagana: ["Fumbwe", "Gahengeri", "Gishali", "Karenge", "Kigabiro", "Muhazi", "Munyaga", "Munyiginya", "Musha", "Muyumbu", "Mwulire", "Nyakaliro", "Nzige", "Rubona"],
};
