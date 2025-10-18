// predictiveMergeEngine.js
// Predictive Merge Engine for Living Dashboard Council Enhancements
// Collects pending enhancement PRs, attempts merge, runs lint/tests, computes confidence, emits events

const { exec } = require('child_process');
const { Octokit } = require('@octokit/rest');
const EventEmitter = require('events');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const repo = { owner: 'YourOrg', repo: 'LivingDashboard' };
const mergeEmitter = new EventEmitter();

function execShell(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(stderr || error);
      resolve(stdout);
    });
  });
}

async function getOpenEnhancementPRs() {
  const prs = await octokit.rest.pulls.list({ ...repo, state: 'open' });
  return prs.data.filter(pr => pr.head.ref.startsWith('enhancement/'));
}

async function createTempMergeBranch(base = 'main') {
  const branchName = `temp/merge-${Date.now()}`;
  await execShell(`git fetch origin ${base}`);
  await execShell(`git checkout -b ${branchName} origin/${base}`);
  return branchName;
}

async function tryMergePRs(branch, prs) {
  for (const pr of prs) {
    try {
      await execShell(`git merge origin/${pr.head.ref} --no-ff --no-commit`);
    } catch (e) {
      return { conflict: true, pr };
    }
  }
  return { conflict: false };
}

async function runLint() {
  await execShell('npm run lint');
}
async function runTests() {
  await execShell('npm test');
}

function predictMergeScore({ lintErrors, testsPassed, conflict }) {
  return (testsPassed * 0.5 + (100 - lintErrors) * 0.3 + (conflict ? 0 : 100) * 0.2);
}

async function predictiveMerge() {
  const prs = await getOpenEnhancementPRs();
  if (prs.length < 2) return; // Only consolidate if >1
  const tempBranch = await createTempMergeBranch();
  const mergeResult = await tryMergePRs(tempBranch, prs);
  let lintErrors = 0, testsPassed = 0;
  let mergeStatus = 'success';
  if (mergeResult.conflict) {
    mergeStatus = 'conflict';
  } else {
    try {
      await runLint();
    } catch {
      lintErrors = 100;
      mergeStatus = 'lint-fail';
    }
    try {
      await runTests();
      testsPassed = 100;
    } catch {
      testsPassed = 0;
      mergeStatus = 'test-fail';
    }
  }
  const score = predictMergeScore({ lintErrors, testsPassed, conflict: mergeResult.conflict });
  mergeEmitter.emit('mergeStatus', {
    prs: prs.map(pr => pr.number),
    status: mergeStatus,
    score,
    tempBranch,
    conflictPR: mergeResult.pr ? mergeResult.pr.number : null
  });
  // Clean up temp branch
  await execShell(`git checkout main && git branch -D ${tempBranch}`);
  return { status: mergeStatus, score };
}

module.exports = { predictiveMerge, mergeEmitter };