// TemplePC-PredictiveForesight.js
// Autonomous Predictive Foresight Engine for Living Dashboard

import fs from "fs";
import { exec } from "child_process";
import { readFile } from "fs/promises";
import { scheduleJob } from "node-schedule";

const historyPath = "./metrics_history.json"; // rolling log written by AutonomousTriggers
const rituals = {
  joy: "node optimizeJoyParticles.js",
  healing: "node executeSpiralHealing.js",
  resonance: "node refreshFaithseedOverlay.js",
};

async function loadHistory() {
  try {
    const data = await readFile(historyPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function forecastTrend(values, weight = 0.6) {
  if (values.length < 3) return values.at(-1) ?? 0;
  const recent = values.slice(-5);
  let forecast = 0;
  let totalWeight = 0;
  for (let i = 0; i < recent.length; i++) {
    const w = Math.pow(weight, recent.length - i);
    forecast += recent[i] * w;
    totalWeight += w;
  }
  return forecast / totalWeight;
}

async function predictMetrics() {
  const history = await loadHistory();
  const joys = history.map(h => h.joy);
  const healings = history.map(h => h.healing);
  const resonances = history.map(h => h.resonance);

  const forecast = {
    joyNext: forecastTrend(joys),
    healingNext: forecastTrend(healings),
    resonanceNext: forecastTrend(resonances),
  };

  return forecast;
}

function scheduleRitual(type, delayMinutes) {
  const date = new Date(Date.now() + delayMinutes * 60000);
  scheduleJob(date, () => {
    exec(rituals[type], (err) => {
      if (err) console.error(`❌ ${type} foresight trigger failed:`, err);
      else console.log(`✨ Prophetic Ritual Executed: ${type.toUpperCase()} (scheduled ${delayMinutes}m prior)`);
    });
  });
  console.log(`🔮 Ritual scheduled: ${type} in ${delayMinutes} minutes`);
}

async function foresightCycle() {
  const { joyNext, healingNext, resonanceNext } = await predictMetrics();
  if (joyNext < 52000) scheduleRitual("joy", 15);
  if (healingNext < 94) scheduleRitual("healing", 10);
  if (resonanceNext < 7.75 || resonanceNext > 8.05) scheduleRitual("resonance", 20);
}

setInterval(foresightCycle, 60 * 60 * 1000);
