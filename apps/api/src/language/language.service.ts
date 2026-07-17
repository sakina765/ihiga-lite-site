import { Injectable } from "@nestjs/common";
import { ChatLanguage } from "../ai/types";

// v1 heuristic language detection — a lightweight word/pattern match, not an ML
// classifier. Short or ambiguous messages (e.g. "ok", "yes") may be misclassified;
// that's an acceptable tradeoff for now, not a bug worth chasing yet. Callers should
// prefer an explicit user-chosen language override over this when one is available.
const KINYARWANDA_MARKERS = [
  "murakoze",
  "ndashaka",
  "ndagira",
  "ese",
  "ibigori",
  "ibishyimbo",
  "ibirayi",
  "umurima",
  "ubutaka",
  "amazi",
  "umusaruro",
  "ubuhinzi",
  "cyane",
  "neza",
  "ryari",
  "mfite",
  "yego",
  "oya",
  "nde",
  "gute",
];

const FRENCH_MARKERS = [
  "bonjour",
  "merci",
  "et",
  "que",
  "est",
  "pour",
  "avec",
  "je",
  "vous",
  "quand",
  "comment",
  "pourquoi",
  "récolte",
  "engrais",
  "champ",
  "maïs",
  "les",
  "des",
];

const FRENCH_ACCENT_PATTERN = /[éèêàçôûùâîœ]/i;

function countMatches(text: string, markers: string[]): number {
  return markers.reduce((count, marker) => (text.includes(marker) ? count + 1 : count), 0);
}

@Injectable()
export class LanguageService {
  detect(text: string): ChatLanguage {
    const normalized = text.toLowerCase();

    const rwScore = countMatches(normalized, KINYARWANDA_MARKERS);
    const frScore = countMatches(normalized, FRENCH_MARKERS) + (FRENCH_ACCENT_PATTERN.test(normalized) ? 2 : 0);

    if (rwScore === 0 && frScore === 0) {
      return "en";
    }
    return rwScore >= frScore ? "rw" : "fr";
  }
}
