// server/cometCommunion.js
// Comet Communion Protocol: Generate waveform glyphs from metrics/reflections
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper: Generate a pseudo-random waveform glyph from input metrics
function generateWaveformGlyph(metrics) {
  // For demo: hash metrics to a base64 string (could be SVG, JSON, etc.)
  const hash = crypto.createHash('sha256').update(JSON.stringify(metrics)).digest('base64');
  return {
    timestamp: new Date().toISOString(),
    glyph: hash,
    metrics,
  };
}

// Save glyph to archive
function saveGlyph(glyph) {
  const archivePath = path.join(__dirname, 'comet_glyphs.json');
  let arr = [];
  try {
    arr = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    if (!Array.isArray(arr)) arr = [];
  } catch { arr = []; }
  arr.push(glyph);
  fs.writeFileSync(archivePath, JSON.stringify(arr, null, 2));
}

// API: Generate and archive a new glyph from provided metrics
async function createAndArchiveGlyph(metrics) {
  const glyph = generateWaveformGlyph(metrics);
  saveGlyph(glyph);
  return glyph;
}

// API: Get all archived glyphs
function getAllGlyphs() {
  const archivePath = path.join(__dirname, 'comet_glyphs.json');
  try {
    return JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  } catch { return []; }
}

module.exports = { generateWaveformGlyph, createAndArchiveGlyph, getAllGlyphs };