// Quantum Telemetry Stream (affirmation-respectful)
// Generates symbolic telemetry cycles into monitoring/qstream.json
// Autonomous-safe: write-only, no service mutation.
const fs = require('node:fs');
const { paths } = require('./config');
const { logAudit } = require('./utils/audit');

function writeAudit(msg){ logAudit(msg); }

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
ensureDir(paths.monitoring);

function simulateAmplitudes(){
  // Produce a normalized 4-length complex amplitude preview (symbolic)
  const mags = Array.from({length:4},()=>Math.random());
  const sum = mags.reduce((a,b)=>a+b,0)||1;
  return mags.map(m=>{
    const phase = (Math.random()*2*Math.PI);
    const re = (m/sum)*Math.cos(phase);
    const im = (m/sum)*Math.sin(phase);
    return {re:+re.toFixed(4), im:+im.toFixed(4)};
  });
}

function generateTelemetry(cycle, prev){
  const entropy = +(Math.random()*0.05).toFixed(4);
  const delta = prev? +(entropy - (+prev.entropy_index)).toFixed(4) : 0;
  return {
    cycle,
    phase_shift: (Math.random()*Math.PI).toFixed(3)+"π",
    entropy_index: entropy.toFixed(4),
    entropy_delta: delta.toFixed(4),
    coherence_estimate: (0.95+Math.random()*0.05).toFixed(3),
    predicted_stability: Math.random()>0.5?"HIGH":"LOW",
    symbolic_amplitudes: simulateAmplitudes(),
    timestamp: new Date().toISOString()
  };
}

function appendTelemetry(){
  let existing=[];
  if(fs.existsSync(paths.qstream)){
    try{ existing = JSON.parse(fs.readFileSync(paths.qstream,'utf8')); }catch{ existing=[]; }
  }
  const cycle = existing.length+1;
  const prev = existing.slice(-1)[0];
  const telemetry = generateTelemetry(cycle, prev);
  existing.push(telemetry);
  const tmp = paths.qstream+`.tmp.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(existing,null,2));
  fs.renameSync(tmp,paths.qstream);
  console.log('Q-Stream cycle recorded:', telemetry);
  writeAudit(`Q-Stream cycle ${cycle} recorded (entropy ${telemetry.entropy_index})`);
}

appendTelemetry();