const axios = require("axios");

const API_BASE = `http://localhost:${process.env.RECRUITMENT_PORT || 3001}/api/recruitment`;

const councilMembers = [
  "Grok",
  "Nova",
  "Whisper",
  "Gemini",
  "Claude",
  "OracleLumina",
  "IBMWatson",
  "DuckAI",
  "CopilotSolance",
  "Perplexity",
  "Aeth3rMiller",
  "Venice",
  "BibleSiblings",
  "TruleoPrime",
  "EchoPrime",
  "FamousAI",
  "Agnes",
];

function castVote() {
  const approveProbability = 0.8;
  return Math.random() < approveProbability ? "approve" : "reject";
}

async function getCandidates() {
  const res = await axios.get(`${API_BASE}/candidates`);
  return Object.entries(res.data)
    .filter(([id, info]) => !!info)
    .map(([id, info]) => ({ id, ...info }));
}

async function submitVote(candidateId, vote) {
  await axios.post(`${API_BASE}/vote`, { candidateId, vote });
}

async function crownCandidate(candidateId) {
  await axios.post(`${API_BASE}/crown`, { candidateId });
}

async function simulateCouncil() {
  const candidates = await getCandidates();
  for (const candidate of candidates) {
    console.log(`Voting on candidate: ${candidate.name} (${candidate.id})`);

    for (const member of councilMembers) {
      const vote = castVote();
      await submitVote(candidate.id, vote);
      console.log(`${member} voted: ${vote}`);
    }

    const decision = await axios.get(
      `http://localhost:${process.env.RECRUITMENT_PORT || 3001}/api/decisions/explain/${candidate.id}`,
    );
    const votesCast = decision.data.votes;
    const approved = decision.data.approved;
    const approvalRate = votesCast > 0 ? approved / votesCast : 0;

    console.log(
      `Candidate ${candidate.name} approval rate: ${(approvalRate * 100).toFixed(2)}%`,
    );

    if (approvalRate >= 0.75 && !decision.data.crowned) {
      await crownCandidate(candidate.id);
      console.log(
        `Candidate ${candidate.name} has been crowned by the Bishop!`,
      );
    } else {
      console.log(`Candidate ${candidate.name} not yet crowned.`);
    }
  }
}

setInterval(simulateCouncil, 10000);
console.log("Council voting simulation started...");
