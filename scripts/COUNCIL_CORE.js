// Council Core Orchestrator (Heartbeat + Failover + Cycle Execution)
const { CONFIG, loadJSON, saveJSON, logAudit, isAffirmed } = require('./utils/council_utils');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function updateHeartbeat(status){
  const heartbeat = loadJSON(CONFIG.paths.heartbeat,{cycle:0});
  heartbeat.cycle = (heartbeat.cycle||0)+1;
  heartbeat.timestamp = new Date().toISOString();
  heartbeat.status = status;
  heartbeat.affirmed = isAffirmed();
  const lastTelemetry = loadJSON(CONFIG.paths.qstream,[]).slice(-1)[0]||{};
  heartbeat.lastTelemetry = lastTelemetry;
  saveJSON(CONFIG.paths.heartbeat, heartbeat);
  console.log(`Heartbeat cycle ${heartbeat.cycle} status ${status}`);
}

function logFailover(script, error){
  const failLog = loadJSON(CONFIG.paths.failover, []);
  failLog.push({timestamp:new Date().toISOString(), script, error});
  if(failLog.length>50) failLog.shift();
  saveJSON(CONFIG.paths.failover, failLog);
  logAudit(`Failover recorded: ${script} -> ${error}`);
}

function runScript(name, purpose, requireAff=false){
  if(requireAff && !isAffirmed()){ console.log(`Skip ${name} (affirmation required)`); return false; }
  try {
    console.log(`▶ ${purpose}`);
    const args = isAffirmed()? ' -Affirmed' : '';
    const output = execSync(`node ${name}${args}`, { cwd: path.join(__dirname), encoding:'utf8', timeout:30000 });
    if(output) console.log(output.trim());
    logAudit(`${purpose} ok`);
    return true;
  } catch(e){
    console.error(`✗ ${purpose} failed:`, e.message);
    logFailover(name, e.message);
    return false;
  }
}

function cycle(){
  console.log('\n════════ Council Core Cycle ════════');
  updateHeartbeat('RUNNING');
  // Phase 1 (Quantum first, then classical symbolic)
  executeQuantumTelemetry();
  runScript('q_stream.js','Symbolic telemetry generation');
  runScript('agent_chamber.js','Multi-agent chamber');
  // Phase 2 (affirmation)
  if(isAffirmed()){
    runScript('dashboard_pulse_merger.js','Dashboard pulse merge',true);
    runScript('dashboard_visualizer.js','Dashboard visualize',true);
    runScript('branch_chamber.js','Branch chamber simulation',true);
    runScript('alerts_generator.js','Alerts generation',true);
    runScript('parallel_visualizer.js','Parallel visualization',true);
    runScript('master_index.js','Master index build',true);
  } else {
    console.log('Affirmation absent - advanced phases skipped.');
  }
  updateHeartbeat('OK');
  logAudit('Council core cycle complete');
  console.log('════════ Cycle Complete ═══════════\n');
}

function resolvePython(){
  const baseDir = path.resolve(__dirname,'..');
  // Allow explicit override via env
  if(process.env.COUNCIL_PYTHON && fs.existsSync(process.env.COUNCIL_PYTHON)){
    logAudit(`Python override used: ${process.env.COUNCIL_PYTHON}`);
    return process.env.COUNCIL_PYTHON;
  }
  const candidates = [
    path.join(baseDir,'.venv311','Scripts','python.exe'),
    path.join(baseDir,'.venv_3.11','Scripts','python.exe'),
    path.join(baseDir,'.venv312','Scripts','python.exe'),
    path.join(baseDir,'.venv_3.12','Scripts','python.exe'),
    path.join(baseDir,'.venv','Scripts','python.exe'),
  ];
  for(const c of candidates){ if(fs.existsSync(c)) { logAudit(`Python candidate selected: ${c}`); return c; } }
  logAudit('No venv python found; using system python');
  return 'python'; // fallback assumes python on PATH
}

function executeQuantumTelemetry(){
  const baseDir = path.resolve(__dirname,'..');
  const qtScript = path.join(baseDir,'quantum','q_telemetry.py');
  if(!fs.existsSync(qtScript)){
    console.log('Quantum telemetry script absent - skipping.');
    logAudit('Quantum telemetry skipped: script missing');
    return false;
  }
  const py = resolvePython();
  console.log(`▶ Quantum telemetry (real entropy) via ${(py.includes('venv')||py.includes('311')||py.includes('312'))?'venv':'system'} python`);
  try {
    const out = execSync(`"${py}" "${qtScript}" --circuit bell_state`, {encoding:'utf8', timeout:30000});
    console.log(out.trim());
    logAudit('Quantum telemetry cycle ok');
    return true;
  } catch(err){
    console.warn('Quantum telemetry failed:', err.message);
    logFailover('q_telemetry.py', err.message);
    if(/ModuleNotFoundError: No module named 'qiskit'/.test(err.message)){
      logAudit('Quantum dependency missing: qiskit not installed');
    } else {
      logAudit('Quantum telemetry failure - degraded to symbolic only');
    }
    return false;
  }
}

if(require.main === module){ cycle(); }
module.exports = { cycle, executeQuantumTelemetry };