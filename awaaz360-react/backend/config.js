const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'awaaz360_pro.db');
const PRICE_CACHE = path.resolve(DATA_DIR, 'fuel_cache.json');

const APP_TITLE = 'AWAAZ360 Pro';
const APP_SUBTITLE = 'Pakistan ka Civic Platform - Shikayat, Malumat, Madad';

const COMPLAINT_CATEGORIES = ['Electricity', 'Water', 'Roads', 'Sanitation', 'Gas', 'Drainage', 'Other'];
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const CITY = process.env.CITY || 'Rawalpindi';
const COUNTRY = process.env.COUNTRY || 'Pakistan';
const LATITUDE = process.env.LATITUDE || '33.6007';
const LONGITUDE = process.env.LONGITUDE || '73.0679';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Karachi';
const FUEL_WEBHOOK_PORT = parseInt(process.env.FUEL_WEBHOOK_PORT || '8765');
const FUEL_WEBHOOK_TOKEN = process.env.FUEL_WEBHOOK_TOKEN || '';
const PORT = parseInt(process.env.PORT || '3001');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

module.exports = {
  ROOT_DIR, DATA_DIR, DB_FILE, PRICE_CACHE,
  APP_TITLE, APP_SUBTITLE,
  COMPLAINT_CATEGORIES, STATUSES, BLOOD_GROUPS,
  CITY, COUNTRY, LATITUDE, LONGITUDE, TIMEZONE,
  FUEL_WEBHOOK_PORT, FUEL_WEBHOOK_TOKEN, PORT,
  OPENAI_API_KEY, TAVILY_API_KEY, WEATHER_API_KEY,
};
