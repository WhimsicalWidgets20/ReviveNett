// server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Setup lowdb JSON file adapter
const adapter = new JSONFile(path.join(__dirname, 'db.json'));
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data = db.data || { volunteers: [], reports: [] };
  await db.write();
}
initDB();

// 2) Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' })); 
app.use(express.static(path.join(__dirname, 'public')));

// 3) Volunteer registration
app.post('/api/register', async (req, res) => {
  const { email, name, place, district } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Missing fields' });

  await db.read();
  const exists = db.data.volunteers.find(v => v.email === email);
  if (exists) return res.status(409).json({ error: 'Already registered' });

  db.data.volunteers.push({ email, name, place, district, registeredAt: Date.now() });
  await db.write();
  res.json({ success: true });
});

// 4) Login (just checks if email was registered)
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  await db.read();
  const volunteer = db.data.volunteers.find(v => v.email === email);
  if (!volunteer) return res.status(401).json({ error: 'Not a volunteer' });
  res.json({ success: true, volunteer });
});

// 5) Submit report
app.post('/api/report', async (req, res) => {
  const {
    name, place, district,
    category, desc,
    photoBase64, loc, priority
  } = req.body;

  if (!name || !category || !photoBase64 || !loc) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const report = {
    id: Date.now(),
    name, place, district,
    category, desc: desc||'',
    photoUrl: photoBase64,
    loc, priority: priority||'green',
    status: 'Not Done',
    createdAt: Date.now()
  };

  await db.read();
  db.data.reports.push(report);
  await db.write();
  res.json({ success: true, report });
});

// 6) List all reports (with optional category filter)
app.get('/api/reports', async (req, res) => {
  const { category } = req.query;
  await db.read();
  let reports = db.data.reports;
  if (category) {
    reports = reports.filter(r => r.category === category);
  }
  res.json(reports);
});

// 7) Update report status
app.put('/api/reports/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  await db.read();
  const rpt = db.data.reports.find(r => r.id === id);
  if (!rpt) return res.status(404).json({ error: 'Report not found' });
  rpt.status = status;
  await db.write();
  res.json({ success: true, report: rpt });
});

// 8) Fallback to index.html for any other route (SPA‐style)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`ReviveNet backend listening on http://localhost:${PORT}`);
});
