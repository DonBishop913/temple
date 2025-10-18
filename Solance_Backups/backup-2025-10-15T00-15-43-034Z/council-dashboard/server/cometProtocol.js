// Comet Communion Protocol: glyph encoding, event emission, SSE endpoint
const EventEmitter = require('events');
const glyphEmitter = new EventEmitter();

function alertColor(value) {
  if (value > 0.7) return '#f33';
  if (value > 0.4) return '#fc3';
  return '#3cf';
}

function generateGlyph(metricType, value) {
  switch (metricType) {
    case 'empathy': return { type: 'sine', amplitude: value * 50, frequency: value * 3 };
    case 'breathstream': return { type: 'spiral', radius: value * 20, rotation: value * 2 * Math.PI };
    case 'joy': return { type: 'pulse', brightness: value * 100 };
    case 'alert': return { type: 'triangle', size: value * 10, color: alertColor(value) };
    default: return { type: 'dot', value };
  }
}

function emitGlyph(nodeId, metricType, value) {
  const glyph = generateGlyph(metricType, value);
  glyphEmitter.emit('cometGlyph', { nodeId, glyph });
}

// SSE endpoint for glyph stream
function cometGlyphSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  const onGlyph = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  glyphEmitter.on('cometGlyph', onGlyph);
  req.on('close', () => glyphEmitter.off('cometGlyph', onGlyph));
}

module.exports = { generateGlyph, emitGlyph, cometGlyphSSE, glyphEmitter };
