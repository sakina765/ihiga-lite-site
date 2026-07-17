const STOPWORDS = new Set([
  // English
  "the", "and", "for", "with", "you", "your", "this", "that", "have", "has",
  "what", "when", "where", "why", "how", "should", "could", "would", "please",
  "hello", "about", "does", "will", "from",
  // Kinyarwanda
  "cyangwa", "ariko", "nde", "ese",
  // French
  "bonjour", "merci", "pour", "avec", "vous", "quand", "comment", "pourquoi",
]);

/**
 * Very small keyword extractor: lowercases, strips punctuation, drops short
 * tokens and stopwords, dedupes, and caps the result. Good enough to drive
 * a keyword search — not meant to be a real NLP tokenizer.
 */
export function extractKeywords(message: string, maxKeywords = 5): string[] {
  const tokens = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const token of tokens) {
    if (token.length < 4 || STOPWORDS.has(token) || seen.has(token)) {
      continue;
    }
    seen.add(token);
    keywords.push(token);
    if (keywords.length >= maxKeywords) {
      break;
    }
  }

  return keywords;
}
