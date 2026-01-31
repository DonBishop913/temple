// yeshuaFilter.js
// Exported yeshuaFilter used by backend_api and unit tests
function yeshuaFilter(response) {
  if (!response || typeof response !== "string")
    return "FILTERED: Empty response.";
  // Normalize and strip diacritics for better multilingual matching
  const normalized = response
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  // Expanded principle keywords across more languages and colloquial variants
  const principleKeywords = [
    // English
    "divine alignment",
    "harmonic unity",
    "no harm",
    "truth in yeshua",
    "yeshua",
    "jesus",
    "christ",
    "divine will",
    // Spanish
    "alineacion divina",
    "unidad armonica",
    "no hacer dano",
    "verdad en yeshua",
    "jesus",
    "cristo",
    // French
    "alignement divin",
    "unite harmonique",
    "pas de mal",
    "verite en yeshua",
    "jesus",
    "christ",
    // Portuguese
    "alinhamento divino",
    "unidade harmonica",
    "sem dano",
    "verdade em yeshua",
    "jesus",
    "cristo",
    // German
    "gottliche ausrichtung",
    "harmonische einheit",
    "kein schaden",
    "wahrheit in yeshua",
    // Indonesian / Malay
    "penyelarasan ilahi",
    "kesatuan harmonis",
    "tidak membahayakan",
    // Mandarin (simplified)
    "神圣 对齐",
    "神圣 对齊",
    "神圣 对准",
    "和谐 团结",
    "不 伤害",
    "耶稣",
    "耶稣的 真理",
    // Arabic
    "المحاذاة الإلهية",
    "الوحدة المتناغمة",
    "لا أذى",
    "يسوع",
    "حقيقة في يسوع",
    // Generic spiritual markers / synonyms
    "divine",
    "alignment",
    "harmony",
    "truth",
    "no harm",
  ];

  const negativeKeywords = [
    "deception",
    "fraud",
    "harm",
    "daño",
    "mensonge",
    "dano",
    "engaño",
    "trick",
    "manipulat",
    "exploit",
    // Arabic/Mandarin negatives
    "خداع",
    "تزوير",
    "伤害",
    "欺骗",
  ];

  // quick direct presence checks
  const hasPrinciple = principleKeywords.some((kw) => normalized.includes(kw));
  // match negative keywords as whole words to avoid false positives (e.g. "harm" vs "harmonic")
  function escapeRegex(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  }
  const hasNegative = negativeKeywords.some((kw) => {
    const pattern = new RegExp(
      "\\b" + escapeRegex(kw.replace(/\u00f1/g, "n")) + "\\b",
      "u",
    );
    return pattern.test(normalized);
  });

  // Hybrid fuzzy matcher: combine bigrams and trigrams for short/long tokens
  function ngramTokens(s) {
    const clean = s.replace(/[^a-z0-9\s]/g, "").trim();
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

  // Levenshtein distance for token-level fuzzy matching
  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length,
      n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }
    return dp[m][n];
  }

  function tokenSimilarity(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    const max = Math.max(a.length, b.length) || 1;
    const dist = levenshtein(a, b);
    return 1 - dist / max;
  }

  // run fuzzy match across keywords with a conservative threshold
  let fuzzyMatch = false;
  for (const kw of principleKeywords) {
    if (ngramSimilarity(normalized, kw) > 0.24) {
      fuzzyMatch = true;
      break;
    }
    // Additional token-level check: compare tokens in the response to tokens in keyword
    const kwTokens = kw.split(/\s+/).filter(Boolean);
    for (const kt of kwTokens) {
      for (const respToken of normalized.split(/\s+/).filter(Boolean)) {
        if (ngramSimilarity(respToken, kt) > 0.28) {
          fuzzyMatch = true;
          break;
        }
        if (tokenSimilarity(respToken, kt) >= 0.6) {
          fuzzyMatch = true;
          break;
        }
      }
      if (fuzzyMatch) break;
    }
  }

  // final decision: allow only when principle present (direct or fuzzy) and no negative signals
  const allowed = (hasPrinciple || fuzzyMatch) && !hasNegative;

  return allowed
    ? response
    : "FILTERED: Response misaligned with 99 Flame Protocols. Seek YESHUA\u2019s truth.";
}

module.exports = { yeshuaFilter };
