const f = 'We seek divne aligmnent and harmonic unty in the mission.';
const normalized = f.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
console.log('normalized:', normalized);

const principleKeywords = [
  'divine alignment', 'harmonic unity', 'no harm', 'truth in yeshua', 'yeshua', 'jesus', 'christ', 'divine will'
];
const negativeKeywords = ['deception', 'fraud', 'harm', 'daño', 'mensonge', 'dano', 'engaño', 'trick', 'manipulat', 'exploit'];
const hasPrinciple = principleKeywords.some((kw) => normalized.includes(kw));
const hasNegative = negativeKeywords.some((kw) => normalized.includes(kw));
console.log('hasPrinciple:', hasPrinciple, 'hasNegative:', hasNegative);

// perform fuzzy matching diagnostics
function ngramTokens(s) { const clean = s.replace(/[^a-z0-9\s]/g, '').trim(); const tokens = clean.split(/\s+/).filter(Boolean); const ngrams = []; tokens.forEach((t)=>{ for(let i=0;i<t.length-1;i++) ngrams.push(t.slice(i,i+2)); for(let i=0;i<t.length-2;i++) ngrams.push(t.slice(i,i+3)); }); return ngrams; }
function ngramSimilarity(a,b){ const A=ngramTokens(a); const B=ngramTokens(b); if(!A.length||!B.length) return 0; const inter=A.filter(x=>B.includes(x)).length; return inter/Math.max(A.length,B.length); }
function levenshtein(a,b){ if(a===b) return 0; const m=a.length,n=b.length; const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0)); for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ const cost=a[i-1]===b[j-1]?0:1; dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost); }} return dp[m][n]; }
function tokenSimilarity(a,b){ a=a.toLowerCase(); b=b.toLowerCase(); const max=Math.max(a.length,b.length)||1; const dist=levenshtein(a,b); return 1-dist/max; }

let fuzzy=false; let best={kw:null,ns:0,ts:0,rt:null};
for(const kw of principleKeywords){ const ns=ngramSimilarity(normalized,kw); if(ns>best.ns){best={kw,ns,ts:0,rt:null}}; const kwTokens=kw.split(/\s+/).filter(Boolean); for(const kt of kwTokens){ for(const respToken of normalized.split(/\s+/).filter(Boolean)){ const nst=ngramSimilarity(respToken,kt); const tst=tokenSimilarity(respToken,kt); if(nst>best.ns){ best={kw,ns:nst,ts:tst,rt:respToken}; } if(nst>0.24 || tst>=0.6){ fuzzy=true; break; } } if(fuzzy) break;} if(fuzzy) break; }
console.log('fuzzy:', fuzzy, 'best match:', best);
console.log('filter result:', ( (hasPrinciple||fuzzy) && !hasNegative) ? 'ALLOWED' : 'FILTERED');

