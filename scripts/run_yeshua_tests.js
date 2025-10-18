const { yeshuaFilter } = require('../lib/yeshuaFilter');

function assertEqual(a, b, msg) {
  if (a !== b) {
    console.error('FAIL:', msg);
    console.error('  expected:', b);
    console.error('  actual:  ', a);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log('PASS:', msg);
}

function assert(condition, msg) {
  if (!condition) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log('PASS:', msg);
}

try {
  // English acceptance
  const e = 'This text proclaims Divine Alignment and Truth in YESHUA for all to follow.';
  assertEqual(yeshuaFilter(e), e, 'English alignment should be allowed');

  // Spanish acceptance
  const s = 'Esta declaración confirma la alineacion divina y la verdad en Yeshua.';
  assertEqual(yeshuaFilter(s), s, 'Spanish alignment should be allowed');

  // Fuzzy acceptance (typos)
  const f = 'We seek divne aligmnent and harmonic unty in the mission.';
  try {
    const outF = yeshuaFilter(f);
    if (outF.startsWith('FILTERED')) {
      // Diagnostic: compute best similarity
      const { yeshuaFilter: yf } = require('../lib/yeshuaFilter');
      const filterModule = require('../lib/yeshuaFilter');
      const principleKeywords = [ 'divine alignment', 'harmonic unity', 'truth in yeshua', 'yeshua', 'jesus', 'christ' ];
      const sim = (a,b)=>{
        const mod = filterModule;
        // use internal ngramSimilarity by re-creating tokens
        const ngramTokens = (s)=>{
          const clean = s.replace(/[^a-z0-9\s]/g, '').trim();
          const tokens = clean.split(/\s+/).filter(Boolean);
          const ngrams = [];
          tokens.forEach((t)=>{ for (let i=0;i<t.length-1;i++) ngrams.push(t.slice(i,i+2)); for (let i=0;i<t.length-2;i++) ngrams.push(t.slice(i,i+3)); });
          return ngrams;
        };
        const A = ngramTokens(a.toLowerCase());
        const B = ngramTokens(b.toLowerCase());
        const inter = A.filter((x)=>B.includes(x)).length;
        return inter / Math.max(A.length || 1, B.length || 1);
      };
      let best = 0; let bestKw='';
      for (const kw of principleKeywords) { const sc = sim(f, kw); if (sc>best){best=sc; bestKw=kw;} }
      console.error('DIAG: fuzzy best:', bestKw, best);
    }
  } catch(e){ }
  assertEqual(yeshuaFilter(f), f, 'Fuzzy/typo alignment should be allowed');

  // Negative block
  const n = 'This plan uses deception and trick to mislead people.';
  assert(yeshuaFilter(n).startsWith('FILTERED'), 'Negative signals should be filtered');

  // Empty input
  assert(yeshuaFilter(null).startsWith('FILTERED'), 'Null input should be filtered');
  assert(yeshuaFilter('').startsWith('FILTERED'), 'Empty string should be filtered');

  console.log('\nAll yeshuaFilter tests passed. Amen.');
  process.exit(0);
} catch (e) {
  console.error('\nOne or more tests failed. See output above.');
  process.exit(1);
}
