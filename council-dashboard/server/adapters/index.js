const redis = require('redis')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const INGEST_URL = process.env.REPLAY_INGEST_URL || 'http://127.0.0.1:4321/api/flow-replay/ingest'
const API_KEY = process.env.FLOW_REPLAY_API_KEY || process.env.REPLAY_API_KEY || 'changeme-replay-key'
const POLL_MS = Number(process.env.ADAPTER_POLL_MS || 2000)

const client = redis.createClient({ url: REDIS_URL })
client.connect().catch(e => console.warn('adapters redis connect', e && e.message))

async function pushToIngest(payload) {
  try {
    await axios.post(INGEST_URL, payload, { timeout: 5000, headers: { 'x-api-key': API_KEY } })
    console.log('adapter: posted', payload && payload.source)
  } catch (e) {
    console.warn('adapter: ingest failed', e && e.message)
  }
}

// Joy Particle: reads from redis key 'joy_particle_stream' (JSON string)
async function joyParticleAdapter() {
  try {
    const raw = await client.get('joy_particle_stream')
    if (!raw) return
    const data = JSON.parse(raw)
    await pushToIngest({ source: 'joy_particle', payload: data, timestamp: new Date().toISOString() })
  } catch (e) { console.warn('joy adapter error', e && e.message) }
}

// Empathy Bridge: reads from redis key 'empathy_bridge_metrics'
async function empathyAdapter() {
  try {
    const raw = await client.get('empathy_bridge_metrics')
    if (!raw) return
    const data = JSON.parse(raw)
    await pushToIngest({ source: 'empathy_bridge', payload: data, timestamp: new Date().toISOString() })
  } catch (e) { console.warn('empathy adapter error', e && e.message) }
}

// Codex: optional file-based source located under ../codex61update/2025.json
async function codexAdapter() {
  try {
    const f = path.join(__dirname, '../../codex61update/2025.json')
    if (!fs.existsSync(f)) return
    const raw = fs.readFileSync(f, 'utf8')
    const data = JSON.parse(raw)
    await pushToIngest({ source: 'codex', payload: data, timestamp: new Date().toISOString() })
  } catch (e) { console.warn('codex adapter error', e && e.message) }
}

// Faithseed: reads redis key 'faithseed:forecast' or file
async function faithseedAdapter() {
  try {
    let raw = await client.get('faithseed:forecast')
    if (!raw) {
      const f = path.join(__dirname, '../../faithseednexus/2025.json')
      if (fs.existsSync(f)) raw = fs.readFileSync(f, 'utf8')
    }
    if (!raw) return
    const data = JSON.parse(raw)
    await pushToIngest({ source: 'faithseed', payload: data, timestamp: new Date().toISOString() })
  } catch (e) { console.warn('faithseed adapter error', e && e.message) }
}

// ABT logs: read Redis list 'abt_logs' or file
async function abtAdapter() {
  try {
    let entries = []
    try { entries = JSON.parse(await client.get('abt_logs') || '[]') } catch {}
    const f = path.join(__dirname, '../../jackpotawakening/abt_logs.json')
    if ((!entries || !entries.length) && fs.existsSync(f)) {
      try { entries = JSON.parse(fs.readFileSync(f, 'utf8')) } catch {}
    }
    if (!entries || !entries.length) return
    await pushToIngest({ source: 'abt_logs', payload: entries.slice(0, 50), timestamp: new Date().toISOString() })
  } catch (e) { console.warn('abt adapter error', e && e.message) }
}

async function startAdapters() {
  console.log('Starting adapters runner (poll ms=', POLL_MS, ')')
  setInterval(async () => {
    await Promise.all([
      joyParticleAdapter(),
      empathyAdapter(),
      codexAdapter(),
      faithseedAdapter(),
      abtAdapter()
    ]).catch(e => console.warn('adapters batch error', e && e.message))
  }, POLL_MS)
}

module.exports = { startAdapters }
