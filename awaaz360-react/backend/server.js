const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { PORT, CITY, LATITUDE, LONGITUDE, COMPLAINT_CATEGORIES, STATUSES, BLOOD_GROUPS, ROOT_DIR } = require('./config');
const db = require('./database');
const services = require('./services');
const chatbot = require('./chatbot');
const pdfExport = require('./pdf_export');
const { setupWebhookRoutes } = require('./webhook');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
db.initDb();

// ─── Helper: build absolute URL for evidence files ───
function buildFileUrl(req, relativeUrl) {
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) return relativeUrl;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['host'];
  return `${protocol}://${host}${relativeUrl}`;
}

// ─── Multer Setup ───
const UPLOAD_DIR = path.resolve(ROOT_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const stamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${stamp}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sirf images (JPEG, PNG, GIF, WebP) aur PDF files upload kar sakte hain'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Stats ───
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// ─── Complaints (collection) ───
app.get('/api/complaints', (req, res) => {
  const { query, status } = req.query;
  res.json(db.listComplaints(query || '', status || 'All'));
});

app.post('/api/complaints', (req, res) => {
  const { name, phone, category, description, location, evidence, geoLocation } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Naam zaroori hai' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Masla bayan karein' });
  const evidenceStr = evidence && Array.isArray(evidence) && evidence.length > 0
    ? JSON.stringify(evidence)
    : '';
  const geoLat = geoLocation?.lat?.toString() || '';
  const geoLng = geoLocation?.lng?.toString() || '';
  const cid = db.createComplaint(name.trim(), phone?.trim(), category, description.trim(), location?.trim(), evidenceStr, geoLat, geoLng);
  res.json({ id: cid, message: 'Complaint registered successfully', evidenceCount: evidence ? evidence.length : 0, geoTagged: !!(geoLat && geoLng) });
});

// ─── Upload evidence files ───
app.post('/api/upload', upload.array('evidence', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Koi file select nahi ki gayi' });
  }
  const files = req.files.map(f => ({
    name: f.filename,
    original: f.originalname,
    size: f.size,
    mimetype: f.mimetype,
    url: buildFileUrl(req, `/uploads/${f.filename}`),
  }));
  res.json({ files });
});

// Upload error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File size 10MB se zyada nahi honi chahiye' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Sirf 5 files upload kar sakte hain' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

// ─── Community Issue Verification ───
// Note: In Express 5, verify routes use a different pattern to avoid :id conflicts
app.get('/api/verify/:complaintId', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const count = db.getVerificationCount(req.params.complaintId);
  const verified = db.hasUserVerified(req.params.complaintId, ip);
  res.json({ count, verified });
});

app.post('/api/verify/:complaintId', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const count = db.addVerification(req.params.complaintId, ip);
  const verified = db.hasUserVerified(req.params.complaintId, ip);
  res.json({ count, verified });
});

app.delete('/api/verify/:complaintId', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const count = db.removeVerification(req.params.complaintId, ip);
  res.json({ count, verified: false });
});

app.get('/api/verifications', (req, res) => {
  res.json(db.getAllVerificationCounts());
});

// ─── Complaints (by ID) — must come AFTER sub-routes ───
app.get('/api/complaints/:id', (req, res) => {
  const complaint = db.getComplaint(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Not found' });
  // Resolve relative evidence URLs for backward compatibility
  if (complaint.evidence && Array.isArray(complaint.evidence)) {
    complaint.evidence = complaint.evidence.map(ef => ({
      ...ef,
      url: buildFileUrl(req, ef.url),
    }));
  }
  res.json(complaint);
});

app.get('/api/complaints/:id/evidence', (req, res) => {
  const c = db.getComplaint(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const evidence = (c.evidence || []).map(ef => ({
    ...ef,
    url: buildFileUrl(req, ef.url),
  }));
  res.json({ evidence });
});

app.put('/api/complaints/:id/status', (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.updateComplaintStatus(req.params.id, status);
  res.json({ message: 'Status updated' });
});

app.delete('/api/complaints/:id', (req, res) => {
  db.deleteComplaint(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── Complaints PDF ───
app.get('/api/complaints/export/pdf', async (req, res) => {
  try {
    const { query, status } = req.query;
    const rows = db.listComplaints(query || '', status || 'All');
    const pdfData = await pdfExport.exportComplaintsPDF(rows.map(r => [r.id, r.name, r.category, r.location, r.date, r.status]));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=complaints_${Date.now()}.pdf`);
    res.send(pdfData);
  } catch (e) {
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

// ─── Lost & Found ───
app.get('/api/lost-found', (req, res) => {
  const { type, query } = req.query;
  res.json(db.listLostFoundItems(type || 'All', query || ''));
});

app.get('/api/lost-found/:id', (req, res) => {
  const item = db.getLostFoundItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/lost-found', (req, res) => {
  const { type, itemType, title, description, name, phone, location } = req.body;
  if (!type || !['lost', 'found'].includes(type)) return res.status(400).json({ error: 'Type lost ya found hona chahiye' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title zaroori hai' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'Naam zaroori hai' });
  const id = db.createLostFoundItem(type, itemType, title.trim(), (description || '').trim(), name.trim(), phone?.trim(), location?.trim());
  res.json({ id, message: 'Lost/Found item registered' });
});

app.put('/api/lost-found/:id/resolve', (req, res) => {
  db.resolveLostFoundItem(req.params.id);
  res.json({ message: 'Marked as resolved' });
});

app.delete('/api/lost-found/:id', (req, res) => {
  db.deleteLostFoundItem(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── Donors ───
app.get('/api/donors', (req, res) => {
  const { bloodGroup, area } = req.query;
  res.json(db.listDonors(bloodGroup || 'All', area || ''));
});

app.post('/api/donors', (req, res) => {
  const { name, phone, bloodGroup, area } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Naam zaroori hai' });
  db.createDonor(name.trim(), phone?.trim(), bloodGroup, area?.trim());
  res.json({ message: 'Donor registered' });
});

app.delete('/api/donors/:id', (req, res) => {
  db.deleteDonor(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── Fuel Prices ───
app.get('/api/fuel-prices', async (req, res) => {
  const result = await services.getFuelPrices();
  res.json(result);
});

// ─── Weather ───
app.get('/api/weather', async (req, res) => {
  const weather = await services.getWeather();
  if (!weather) return res.status(503).json({ error: 'Weather fetch failed' });
  res.json(weather);
});

// ─── Prayer Times ───
app.get('/api/prayer-times', async (req, res) => {
  const prayer = await services.getPrayerTimes();
  if (!prayer) return res.status(503).json({ error: 'Prayer times fetch failed' });
  res.json(prayer);
});

// ─── News ───
app.get('/api/news', async (req, res) => {
  const news = await services.getNews();
  res.json(news);
});

// ─── Chatbot ───
app.post('/api/chat', async (req, res) => {
  const { query, fuelPrices, fuelUpdated, weatherData, prayerData, fuelSource } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });
  const answer = await chatbot.answerQuery(query, fuelPrices || [], fuelUpdated || '', weatherData, prayerData, fuelSource || 'live sources');
  res.json({ answer });
});

// ─── Config Info ───
app.get('/api/config', (req, res) => {
  res.json({
    categories: COMPLAINT_CATEGORIES,
    statuses: STATUSES,
    bloodGroups: BLOOD_GROUPS,
    city: CITY,
    latitude: LATITUDE,
    longitude: LONGITUDE,
  });
});

// ─── Webhook routes ───
setupWebhookRoutes(app);

// ─── Serve frontend in production (only if dist/ exists) ───
const DIST_DIR = path.resolve(__dirname, '../dist');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  // Full-stack mode: serve SPA for non-API routes
  app.use(express.static(DIST_DIR));
  app.use((req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/webhooks')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
} else {
  // API-only mode (frontend on Vercel) — inform direct browser visitors
  app.use((req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/webhooks')) {
      res.json({ message: 'AWAAZ360 API is running. Frontend is deployed on Vercel.', apiUrl: '/api' });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

// ─── Start server (only when run directly, not when required as a module) ───
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AWAAZ360 API server running on http://localhost:${PORT}`);
    console.log(`Fuel webhook: http://localhost:${PORT}/webhooks/fuel-prices/refresh`);
  });
}

module.exports = app;
