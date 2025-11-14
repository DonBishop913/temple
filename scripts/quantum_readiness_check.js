// Quantum readiness diagnostic (affirmation not required; read-only)
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const baseDir = path.resolve(__dirname,'..');
function candidatePaths(){
  return [
    path.join(baseDir,'.venv311','Scripts','python.exe'),
    path.join(baseDir,'.venv_3.11','Scripts','python.exe'),
    path.join(baseDir,'.venv312','Scripts','python.exe'),
    path.join(baseDir,'.venv_3.12','Scripts','python.exe'),
    path.join(baseDir,'.venv','Scripts','python.exe')
  ].filter(p=>fs.existsSync(p));
}
function checkPython(py){
  try { return execSync(`"${py}" -c "import sys; print(sys.version.replace('\n',''))"`,{encoding:'utf8'}).trim(); } catch{return null;}
}
function checkQiskit(py){
  try {
    return execSync(`"${py}" -c "import qiskit, json; print(json.dumps({'version':qiskit.__version__}))"`,{encoding:'utf8',timeout:8000}).trim();
  } catch(e){
    return JSON.stringify({error:e.message.slice(0,120)}); // bounded error info
  }
}
const candidates = candidatePaths();
const results = candidates.map(py=>({python:py, version:checkPython(py), qiskit:checkQiskit(py)}));
let chosen = results.find(r=>r.qiskit && !r.qiskit.startsWith('{"error"')); // has version
const summary = {
  timestamp: new Date().toISOString(),
  candidates: results,
  chosenInterpreter: chosen?chosen.python:null,
  qiskitReady: !!chosen,
  recommendation: chosen? 'READY: Real quantum telemetry can run.' : 'Install Python 3.11 or 3.12 and create venv (see install_python311.ps1).'
};
console.log(JSON.stringify(summary,null,2));
