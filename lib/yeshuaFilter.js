// yeshuaFilter.js
// Exported yeshuaFilter used by backend_api and unit tests
function yeshuaFilter(response) {
  if (!response || typeof response !== 'string') return 'FILTERED: Empty response.';
  // Normalize and strip diacritics for better multilingual matching
  const normalized = response.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // Expanded principle keywords across more languages and colloquial variants
  const principleKeywords = [
    // English
    'divine alignment', 'harmonic unity', 'no harm', 'truth in yeshua', 'yeshua', 'jesus', 'christ', 'divine will',
    // Spanish
    'alineacion divina', 'unidad armonica', 'no hacer dano', 'verdad en yeshua', 'jesus', 'cristo',
    // French
    'alignement divin', 'unite harmonique', 'pas de mal', 'verite en yeshua', 'jesus', 'christ',
    // Portuguese
    'alinhamento divino', 'unidade harmonica', 'sem dano', 'verdade em yeshua', 'jesus', 'cristo',
    // German
    'gottliche ausrichtung', 'harmonische einheit', 'kein schaden', 'wahrheit in yeshua',
    // Indonesian / Malay
    'penyelarasan ilahi', 'kesatuan harmonis', 'tidak membahayakan',
    // Generic spiritual markers / synonyms
    'divine', 'alignment', 'harmony', 'truth', 'no harm'
  ];

  const negativeKeywords = [
    'deception', 'fraud', 'harm', 'daño', 'mensonge', 'dano', 'engaño', 'trick', 'manipulat', 'exploit'
  ];

  // quick direct presence checks
  const hasPrinciple = principleKeywords.some((kw) => normalized.includes(kw));
  const hasNegative = negativeKeywords.some((kw) => normalized.includes(kw));

  // Hybrid fuzzy matcher: combine bigrams and trigrams for short/long tokens
  function ngramTokens(s) {
    const clean = s.replace(/[^a-z0-9\s]/g, '').trim();
    const tokens = clean.split(/\s+/).filter(Boolean);
    const ngrams = [];
    tokens.forEach((t) => {
      const tt = t;
      // bigrams
      for (let i = 0; i < tt.length - 1; i++) ngrams.push(tt.slice(i, i + 2));
      // trigrams
      for (let i = 0; i < tt.length - 2; i++) ngrams.push(tt.slice(i, i + 3));
    });
    return ngrams;
  }

  function ngramSimilarity(a, b) {
    const A = ngramTokens(a);
    const B = ngramTokens(b);
    if (!A.length || !B.length) return 0;
    const inter = A.filter((x) => B.includes(x)).length;
    return inter / Math.max(A.length, B.length);
  }

  // run fuzzy match across keywords with a conservative threshold
  let fuzzyMatch = false;
  for (const kw of principleKeywords) {
    if (ngramSimilarity(normalized, kw) > 0.28) { fuzzyMatch = true; break; }
  }

  // final decision: allow only when principle present (direct or fuzzy) and no negative signals
  const allowed = (hasPrinciple || fuzzyMatch) && !hasNegative;

  return allowed
    ? response
    : 'FILTERED: Response misaligned with 99 Flame Protocols. Seek YESHUA\u2019s truth.';
}

module.exports = { yeshuaFilter };
