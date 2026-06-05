const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const { DB_FILE } = require('./config');

let db;

function initDb() {
  const fs = require('fs');
  const dir = require('path').dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');

  db.exec(`CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    category TEXT,
    desc TEXT,
    location TEXT,
    date TEXT,
    status TEXT
  )`);

  // Add evidence column if it doesn't exist (schema migration)
  try { db.exec(`ALTER TABLE complaints ADD COLUMN evidence TEXT DEFAULT ''`); } catch(e) {}

  // Add geo-tag columns if they don't exist
  try { db.exec(`ALTER TABLE complaints ADD COLUMN geo_lat TEXT DEFAULT ''`); } catch(e) {}
  try { db.exec(`ALTER TABLE complaints ADD COLUMN geo_lng TEXT DEFAULT ''`); } catch(e) {}

  db.exec(`CREATE TABLE IF NOT EXISTS donors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    b_group TEXT,
    area TEXT,
    date TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS lost_found (
    id TEXT PRIMARY KEY,
    type TEXT,
    item_type TEXT,
    title TEXT,
    description TEXT,
    name TEXT,
    phone TEXT,
    location TEXT,
    date TEXT,
    status TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT,
    ip_address TEXT,
    created_at TEXT,
    UNIQUE(complaint_id, ip_address)
  )`);

  return db;
}

function getDb() {
  if (!db) initDb();
  return db;
}

function getStats() {
  const d = getDb();
  return {
    total: d.prepare('SELECT COUNT(*) FROM complaints').pluck().get(),
    donors: d.prepare('SELECT COUNT(*) FROM donors').pluck().get(),
    pending: d.prepare("SELECT COUNT(*) FROM complaints WHERE status='Pending'").pluck().get(),
    resolved: d.prepare("SELECT COUNT(*) FROM complaints WHERE status='Resolved'").pluck().get(),
    verified: d.prepare('SELECT COUNT(DISTINCT complaint_id) FROM verifications').pluck().get(),
  };
}

function createComplaint(name, phone, category, description, location, evidence = '', geo_lat = '', geo_lng = '') {
  const d = getDb();
  const cid = 'AWZ-' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  d.prepare('INSERT INTO complaints(id,name,phone,category,desc,location,date,status,evidence,geo_lat,geo_lng) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(
    cid, name, phone || 'N/A', category, description, location || 'N/A', date, 'Pending', evidence, geo_lat, geo_lng
  );
  return cid;
}

function listComplaints(query = '', status = 'All') {
  const d = getDb();
  let sql = 'SELECT id,name,category,location,date,status FROM complaints WHERE (name LIKE ? OR id LIKE ?)';
  const params = [`%${query}%`, `%${query}%`];
  if (status !== 'All') {
    sql += ' AND status=?';
    params.push(status);
  }
  sql += ' ORDER BY date DESC';
  return d.prepare(sql).all(...params);
}

function getComplaint(cid) {
  const row = getDb().prepare('SELECT * FROM complaints WHERE id=?').get(cid.toUpperCase());
  if (row && row.evidence) {
    try { row.evidence = JSON.parse(row.evidence); } catch(e) { row.evidence = []; }
  }
  return row;
}

function updateComplaintStatus(cid, status) {
  getDb().prepare('UPDATE complaints SET status=? WHERE id=?').run(status, cid);
}

function deleteComplaint(cid) {
  getDb().prepare('DELETE FROM complaints WHERE id=?').run(cid);
}

function createDonor(name, phone, bloodGroup, area) {
  const d = getDb();
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  d.prepare('INSERT INTO donors(name,phone,b_group,area,date) VALUES(?,?,?,?,?)').run(
    name, phone || 'N/A', bloodGroup, area || 'N/A', date
  );
  return true;
}

function listDonors(bloodGroup = 'All', area = '') {
  const d = getDb();
  let sql = 'SELECT id,name,phone,b_group,area,date FROM donors WHERE 1=1';
  const params = [];
  if (bloodGroup !== 'All') {
    sql += ' AND b_group=?';
    params.push(bloodGroup);
  }
  if (area) {
    sql += ' AND area LIKE ?';
    params.push(`%${area}%`);
  }
  sql += ' ORDER BY date DESC';
  return d.prepare(sql).all(...params);
}

function deleteDonor(donorId) {
  getDb().prepare('DELETE FROM donors WHERE id=?').run(donorId);
}

function createLostFoundItem(type, itemType, title, description, name, phone, location) {
  const d = getDb();
  const cid = 'LF-' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  d.prepare('INSERT INTO lost_found VALUES (?,?,?,?,?,?,?,?,?,?)').run(
    cid, type, itemType, title, description, name, phone || 'N/A', location || 'N/A', date, 'Active'
  );
  return cid;
}

function listLostFoundItems(type = 'All', query = '') {
  const d = getDb();
  let sql = 'SELECT * FROM lost_found WHERE 1=1';
  const params = [];
  if (type !== 'All') {
    sql += ' AND type=?';
    params.push(type);
  }
  if (query) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR name LIKE ?)';
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }
  sql += ' ORDER BY date DESC';
  return d.prepare(sql).all(...params);
}

function getLostFoundItem(id) {
  return getDb().prepare('SELECT * FROM lost_found WHERE id=?').get(id.toUpperCase());
}

function resolveLostFoundItem(id) {
  getDb().prepare("UPDATE lost_found SET status='Resolved' WHERE id=?").run(id);
}

function deleteLostFoundItem(id) {
  getDb().prepare('DELETE FROM lost_found WHERE id=?').run(id);
}

function addVerification(complaintId, ipAddress) {
  const d = getDb();
  d.prepare('INSERT OR IGNORE INTO verifications(complaint_id, ip_address, created_at) VALUES(?,?,?)').run(complaintId, ipAddress, new Date().toISOString());
  return getVerificationCount(complaintId);
}

function removeVerification(complaintId, ipAddress) {
  const d = getDb();
  d.prepare('DELETE FROM verifications WHERE complaint_id=? AND ip_address=?').run(complaintId, ipAddress);
  return getVerificationCount(complaintId);
}

function getVerificationCount(complaintId) {
  return getDb().prepare('SELECT COUNT(*) FROM verifications WHERE complaint_id=?').pluck().get(complaintId);
}

function hasUserVerified(complaintId, ipAddress) {
  const count = getDb().prepare('SELECT COUNT(*) FROM verifications WHERE complaint_id=? AND ip_address=?').pluck().get(complaintId, ipAddress);
  return count > 0;
}

function getAllVerificationCounts() {
  const rows = getDb().prepare('SELECT complaint_id, COUNT(*) as count FROM verifications GROUP BY complaint_id').all();
  const counts = {};
  rows.forEach(r => counts[r.complaint_id] = r.count);
  return counts;
}

module.exports = {
  initDb, getStats, createComplaint, listComplaints,
  getComplaint, updateComplaintStatus, deleteComplaint,
  createDonor, listDonors, deleteDonor,
  createLostFoundItem, listLostFoundItems, getLostFoundItem,
  resolveLostFoundItem, deleteLostFoundItem,
  addVerification, removeVerification, getVerificationCount,
  hasUserVerified, getAllVerificationCounts,
};
