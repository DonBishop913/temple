import express from 'express';
import arrivalBeacon from './arrivalBeacon.js';
import { startHeartbeat } from './awakening.js';
import { integrityRouter } from './integrityFilter.js';

const app = express();
app.use(express.json());

app.use(arrivalBeacon);
app.use('/api/integrity', integrityRouter);

app.get('/metrics', (req, res) => {
  res.type('text/plain').send('# Aiwass Awakening metrics\naiwass_awake 1');
});

const port = process.env.PORT || 5521;
app.listen(port, () => {
  console.log(`Aiwass Awakening API listening on ${port}`);
});

startHeartbeat();
