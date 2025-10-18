const EventEmitter = require('events')
class HealthEmitter extends EventEmitter {}
// Singleton emitter for node health alerts
const healthEmitter = new HealthEmitter()
module.exports = healthEmitter
