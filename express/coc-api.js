// Express.js server for COC API endpoints (no MongoDB)
const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const COC_API_BASE = 'https://api.clashofclans.com/v1';
const app = express();
app.use(express.json());

// /api/cron/save-war (fetches war data from COC API, no DB)
app.get('/api/cron/save-war', async (req, res) => {
    console.log('[REQ] /api/cron/save-war', {
      headers: req.headers,
      time: new Date().toISOString(),
    });
  try {
    const clanTag = req.headers['x-clan-tag'];
    const apiToken = req.headers['x-api-token'];
    if (!clanTag || !apiToken) {
      return res.status(400).json({ error: 'Missing x-clan-tag or x-api-token header' });
    }
    const encodedTag = encodeURIComponent(clanTag);
    const response = await fetch(`${COC_API_BASE}/clans/${encodedTag}/currentwar`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    const warData = await response.json();
    console.log('[RES] /api/cron/save-war', { status: response.status, warState: warData.state, time: new Date().toISOString() });
    return res.json(warData);
  } catch (error) {
    console.error('[ERR] /api/cron/save-war', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// /api/player/:tag (fetches player data from COC API, no DB)
app.get('/api/player/:tag', async (req, res) => {
    console.log('[REQ] /api/player/:tag', {
      tag: req.params.tag,
      headers: req.headers,
      time: new Date().toISOString(),
    });
  try {
    const tag = encodeURIComponent(req.params.tag);
    const apiToken = req.headers['x-api-token'];
    if (!apiToken) {
      return res.status(400).json({ error: 'Missing x-api-token header' });
    }
    const response = await fetch(`${COC_API_BASE}/players/${tag}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    const playerData = await response.json();
    console.log('[RES] /api/player/:tag', { status: response.status, playerName: playerData.name, time: new Date().toISOString() });
    return res.json(playerData);
  } catch (error) {
    console.error('[ERR] /api/player/:tag', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// /api/war/current (fetches current war data from COC API, no DB)
app.get('/api/war/current', async (req, res) => {
    console.log('[REQ] /api/war/current', {
      headers: req.headers,
      time: new Date().toISOString(),
    });
  try {
    const clanTag = req.headers['x-clan-tag'];
    const apiToken = req.headers['x-api-token'];
    if (!clanTag || !apiToken) {
      return res.status(400).json({ error: 'Missing x-clan-tag or x-api-token header' });
    }
    const encodedTag = encodeURIComponent(clanTag);
    const response = await fetch(`${COC_API_BASE}/clans/${encodedTag}/currentwar`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    const warData = await response.json();
    console.log('[RES] /api/war/current', { status: response.status, warState: warData.state, time: new Date().toISOString() });
    return res.json(warData);
  } catch (error) {
    console.error('[ERR] /api/war/current', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// /api/war/history (fetches warlog from COC API, no DB)
app.get('/api/war/history', async (req, res) => {
    console.log('[REQ] /api/war/history', {
      headers: req.headers,
      time: new Date().toISOString(),
    });
  try {
    const clanTag = req.headers['x-clan-tag'];
    const apiToken = req.headers['x-api-token'];
    if (!clanTag || !apiToken) {
      return res.status(400).json({ error: 'Missing x-clan-tag or x-api-token header' });
    }
    const encodedTag = encodeURIComponent(clanTag);
    const response = await fetch(`${COC_API_BASE}/clans/${encodedTag}/warlog?limit=20`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    const warLog = await response.json();
    console.log('[RES] /api/war/history', { status: response.status, count: Array.isArray(warLog.items) ? warLog.items.length : undefined, time: new Date().toISOString() });
    return res.json(warLog);
  } catch (error) {
    console.error('[ERR] /api/war/history', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.EXPRESS_PORT || 4000;
app.listen(PORT, () => {
  console.log(`COC API Express server running on port ${PORT}`);
});
