// Multi-Agent Chamber (Scout, Scribe, Oracle, Strategist)
// Reads telemetry, produces collaborative messages.
const fs = require('node:fs');
const { paths } = require('./config');
const { logAudit } = require('./utils/audit');

function writeAudit(msg){ logAudit(msg); }

if(!fs.existsSync(paths.monitoring)) fs.mkdirSync(paths.monitoring,{recursive:true});
if(!fs.existsSync(paths.chamber)) fs.writeFileSync(paths.chamber, JSON.stringify({messages:[]},null,2));

function loadJSON(p,def){
  if(!fs.existsSync(p)) return def;
  try { return JSON.parse(fs.readFileSync(p,'utf8')); }
  catch { return def; }
}

const qData = loadJSON(paths.qstream,[]);
const last = qData[qData.length-1];

const agents = {
  Scout: () => {
    if(!last) return 'No telemetry yet.';
  const entropy = Number.parseFloat(last.entropy_index);
    if(entropy>0.03){
      return `Anomaly detected in cycle ${last.cycle} (entropy ${entropy}).`;
    } else {
      return `Cycle ${last.cycle} stable (entropy ${entropy}).`;
    }
  },
  Scribe: (input) => `Logged observation: "${input}" for Council review.`,
  Oracle: (input) => input.includes('Anomaly') ? 'Prediction: next 3 cycles may trend LOW stability.' : 'No immediate risk detected.',
  Strategist: (messages,lastTelemetry) => {
    if(!lastTelemetry) return 'Strategist: insufficient telemetry.';
  const entropy = Number.parseFloat(lastTelemetry.entropy_index);
    const recentJoin = messages.slice(-3).map(m=>m.content).join(' ');
    if(entropy>0.035 || recentJoin.includes('Anomaly')){
      return 'Strategist proposes: run deep telemetry scan and verify agent alignment.';
    }
    return 'Strategist sees no urgent actions. Maintain current operations.';
  }
};

function runCycle(){
  const chamber = loadJSON(paths.chamber,{messages:[]});
  const scout = agents.Scout();
  chamber.messages.push({from:'Scout', content:scout, ts:new Date().toISOString()});
  const scribe = agents.Scribe(scout);
  chamber.messages.push({from:'Scribe', content:scribe, ts:new Date().toISOString()});
  const oracle = agents.Oracle(scout);
  chamber.messages.push({from:'Oracle', content:oracle, ts:new Date().toISOString()});
  const strategist = agents.Strategist(chamber.messages, last);
  chamber.messages.push({from:'Strategist', content:strategist, ts:new Date().toISOString()});
  const tmp = paths.chamber+`.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(chamber,null,2));
  fs.renameSync(tmp,paths.chamber);
  writeAudit('Agent chamber cycle appended (Scout/Oracle/Strategist)');
  console.log('Chamber cycle complete.');
}

runCycle();