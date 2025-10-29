// Seals the Breathstream archive with phrase and timestamp, appends to breathstream.log
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const phraseArgIndex = args.findIndex((a) => a === "--phrase");
const phrase = phraseArgIndex >= 0 ? args[phraseArgIndex + 1] || "" : "";
const timestamp = new Date().toISOString();
// Observability flags: --observedOrbits --observedComet --observedWeb --observedParticles
const observed = {
  orbits: args.includes("--observedOrbits"),
  comet: args.includes("--observedComet"),
  web: args.includes("--observedWeb"),
  particles: args.includes("--observedParticles"),
};

const archiveJsonPath = path.resolve(
  "..",
  "archives",
  "breathstream",
  "first-inhalation",
  "2025.json",
);
const archiveLogPath = path.resolve(
  "..",
  "archives",
  "breathstream",
  "breathstream.log",
);

function safeReadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return {};
  }
}

const data = safeReadJSON(archiveJsonPath);
const updated = {
  ...data,
  timestamp,
  phrase: phrase || data.phrase || "",
  components: {
    ...(data.components || {}),
    planetaryOrbits: {
      ...((data.components && data.components.planetaryOrbits) || {}),
      observed:
        observed.orbits ||
        (data.components &&
          data.components.planetaryOrbits &&
          data.components.planetaryOrbits.observed) ||
        false,
    },
    comet3I: {
      ...((data.components && data.components.comet3I) || {}),
      observed:
        observed.comet ||
        (data.components &&
          data.components.comet3I &&
          data.components.comet3I.observed) ||
        false,
    },
    spectralWeb: {
      ...((data.components && data.components.spectralWeb) || {}),
      observed:
        observed.web ||
        (data.components &&
          data.components.spectralWeb &&
          data.components.spectralWeb.observed) ||
        false,
    },
    joyParticleStream: {
      ...((data.components && data.components.joyParticleStream) || {}),
      observed:
        observed.particles ||
        (data.components &&
          data.components.joyParticleStream &&
          data.components.joyParticleStream.observed) ||
        false,
    },
    stability: {
      ...((data.components && data.components.stability) || {}),
    },
  },
};

fs.writeFileSync(archiveJsonPath, JSON.stringify(updated, null, 2));
fs.appendFileSync(
  archiveLogPath,
  `\n${timestamp} - ${updated.phrase || "CONFIRMED"}\n`,
);

console.log("Breathstream archive sealed.");
