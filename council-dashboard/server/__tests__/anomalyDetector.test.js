const { evaluateFFT } = require('../anomalyDetector')

describe('anomalyDetector.evaluateFFT', () => {
  test('flags fundamental spike above threshold', () => {
    const frame = { magnitudes: [1.5, 0.8, 0.9] }
    const res = evaluateFFT(frame, { fundamentalSpikeThreshold: 1.25 })
    expect(res.isAnomaly).toBe(true)
    expect(res.reasons.join(',')).toMatch(/fundamental_spike/)
    expect(res.score).toBeGreaterThan(0)
  })

  test('no anomaly when below threshold', () => {
    const frame = { magnitudes: [1.1, 0.8, 0.9] }
    const res = evaluateFFT(frame, { fundamentalSpikeThreshold: 1.25 })
    expect(res.isAnomaly).toBe(false)
    expect(res.score).toBe(0)
  })

  test('detects harmonic imbalance via variance', () => {
    const frame = { magnitudes: [1.0, 0.1, 0.9, 0.2] }
    const res = evaluateFFT(frame, { harmonicVarianceThreshold: 0.15 })
    expect(res.isAnomaly).toBe(true)
    expect(res.reasons.join(',')).toMatch(/harmonic_imbalance/)
    expect(res.score).toBeGreaterThan(0)
  })
})