const express = require('express')
const request = require('supertest')

describe('SSE alerts stream', () => {
  let app, healthEmitter

  beforeAll(() => {
    // require after setting up app to ensure singleton emitter
    const alertsRouter = require('../alerts')
    healthEmitter = require('../healthEmitter')
    app = express()
    app.use(express.json())
    app.use('/api', alertsRouter)
  })

  test('POST /api/emit-node-alert emits nodeAlert via healthEmitter', async () => {
    const received = []
    const listener = (payload) => received.push(payload)
    healthEmitter.on('nodeAlert', listener)

    const res = await request(app)
      .post('/api/emit-node-alert')
      .send({ nodeId: 'node-002', severity: 'stalled', message: 'Test stalled' })
      .set('Content-Type', 'application/json')

    // small delay for async emit
    await new Promise(r => setTimeout(r, 50))
    healthEmitter.off('nodeAlert', listener)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(received.length).toBeGreaterThanOrEqual(1)
    const last = received[received.length - 1]
    expect(last).toMatchObject({ nodeId: 'node-002', severity: 'stalled', message: 'Test stalled', type: 'nodeAlert' })
  })
})
