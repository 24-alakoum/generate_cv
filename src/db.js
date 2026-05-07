import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'cvpro.json');

const defaultData = {
  users: [],
  cvs: [],
  cover_letters: [],
  payments: [],
  analytics: [],
  admin_users: []
};

let data = null;

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } else {
      data = JSON.parse(JSON.stringify(defaultData));
    }
  } catch (e) {
    data = JSON.parse(JSON.stringify(defaultData));
  }
  // Ensure all keys exist
  for (const key of Object.keys(defaultData)) {
    if (!data[key]) data[key] = [];
  }
  seedAdmin();
  save();
}

function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {}
}

function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cvpro.com';
  const exists = data.admin_users.find(u => u.email === adminEmail);
  if (!exists) {
    const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    data.admin_users.push({
      id: uuidv4(), email: adminEmail, password: hashed,
      name: 'Admin CV Pro', role: 'admin',
      created_at: new Date().toISOString()
    });
  }
}

// Query helpers
function find(table, predicate) { return data[table]?.find(predicate); }
function filter(table, predicate) { return data[table]?.filter(predicate) || []; }
function insert(table, item) { data[table].push(item); save(); return item; }
function update(table, predicate, updates) {
  const idx = data[table].findIndex(predicate);
  if (idx === -1) return null;
  data[table][idx] = { ...data[table][idx], ...updates };
  save();
  return data[table][idx];
}
function remove(table, predicate) {
  const before = data[table].length;
  data[table] = data[table].filter(predicate);
  save();
  return before - data[table].length;
}
function count(table, predicate) {
  if (!predicate) return data[table]?.length || 0;
  return data[table]?.filter(predicate).length || 0;
}
function all(table) { return data[table] || []; }

// Init
load();

export default { find, filter, insert, update, remove, count, all, data, save };
