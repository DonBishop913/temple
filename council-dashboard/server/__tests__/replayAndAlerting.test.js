// API tests for /api/replay/spacex and alerting endpoints
const request = require('supertest');
const app = require('../server');

describe('Replay & Alerting API', () => {
  it('should return SpaceX replay frames', async () => {
    const res = await request(app).get('/api/replay/spacex?count=2');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('frames');
    expect(Array.isArray(res.body.frames)).toBe(true);
  });

  it('should allow manual alert dispatch', async () => {
    const payload = { category: 'test', message: 'Test alert dispatch' };
    const res = await request(app)
      .post('/api/alert/dispatch')
      .send(payload)
      .set('Accept', 'application/json');
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('ok');
  });
});
