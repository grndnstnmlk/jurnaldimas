const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Support both node:sqlite (Node 22.5+) and better-sqlite3
let db;
const dbPath = path.join(__dirname, 'database.sqlite');

try {
  const { DatabaseSync } = require('node:sqlite');
  const rawDb = new DatabaseSync(dbPath);
  rawDb.exec('PRAGMA foreign_keys = ON');
  rawDb.exec('PRAGMA journal_mode = WAL');

  // Wrap to match standard API
  db = {
    exec: (sql) => rawDb.exec(sql),
    prepare: (sql) => {
      const stmt = rawDb.prepare(sql);
      return {
        run: (...args) => stmt.run(...args),
        get: (...args) => stmt.get(...args),
        all: (...args) => stmt.all(...args)
      };
    },
    transaction: (fn) => (...args) => {
      rawDb.exec('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }
    },
    pragma: (p) => rawDb.exec('PRAGMA ' + p)
  };
} catch (e) {
  const Database = require('better-sqlite3');
  const rawDb = new Database(dbPath);
  rawDb.pragma('foreign_keys = ON');
  rawDb.pragma('journal_mode = WAL');
  db = rawDb;
}

// Password hashing utility
function hashPassword(password, salt = 'master_pos_salt_2026') {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'sales', -- 'admin' | 'sales'
      auth_provider TEXT DEFAULT 'local', -- 'local' | 'google'
      google_id TEXT,
      avatar_url TEXT DEFAULT '',
      is_verified INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      verification_code TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'Rokok',
      modal_price INTEGER NOT NULL DEFAULT 0,
      default_price INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pricing_matrix (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      sell_price INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      UNIQUE(product_id, customer_id)
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER UNIQUE NOT NULL,
      stok_awal INTEGER NOT NULL DEFAULT 0,
      stok_in INTEGER NOT NULL DEFAULT 0,
      stok_out INTEGER NOT NULL DEFAULT 0,
      stok_akhir INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
      qty INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      customer_id INTEGER,
      customer_name_manual TEXT DEFAULT '',
      total_amount INTEGER NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      modal_price INTEGER NOT NULL DEFAULT 0,
      unit_price INTEGER NOT NULL DEFAULT 0,
      subtotal INTEGER NOT NULL DEFAULT 0,
      laba INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Default Host Administrator & Sales user accounts
  seedDefaultUsers();

  // Check if initial master data seeding is needed
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customerCount === 0) {
    seedMasterData();
  }
}

function seedDefaultUsers() {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, auth_provider, is_verified, is_active)
    VALUES (?, ?, ?, ?, 'local', 1, 1)
  `);

  // 1. Host / Administrator
  insertUser.run(
    'Host Administrator',
    'admin@masterpos.com',
    hashPassword('admin123'),
    'admin'
  );

  // 2. Sales Account
  insertUser.run(
    'Sales Tim 1',
    'sales@masterpos.com',
    hashPassword('sales123'),
    'sales'
  );
}

function seedMasterData() {
  const seedFile = path.join(__dirname, 'seed_data.json');
  if (!fs.existsSync(seedFile)) {
    console.log('No seed file found.');
    return;
  }

  const raw = fs.readFileSync(seedFile, 'utf-8');
  const seed = JSON.parse(raw);

  console.log('Seeding master data (Customers, Products, Pricing Matrix with Stock = 0)...');

  const insertCustomer = db.prepare(`
    INSERT INTO customers (code, name, phone, address) VALUES (?, ?, ?, ?)
  `);

  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, modal_price, default_price) VALUES (?, ?, ?, ?)
  `);

  const insertPricing = db.prepare(`
    INSERT INTO pricing_matrix (product_id, customer_id, sell_price) VALUES (?, ?, ?)
  `);

  const insertStock = db.prepare(`
    INSERT INTO stocks (product_id, stok_awal, stok_in, stok_out, stok_akhir) VALUES (?, 0, 0, 0, 0)
  `);

  const tx = db.transaction(() => {
    const custMap = {}; // code -> id
    for (const c of seed.customers) {
      const res = insertCustomer.run(c.code, c.name, c.phone || '', c.address || '');
      custMap[c.code] = res.lastInsertRowid;
    }

    const prodMap = {}; // name -> {id, modal}
    for (const p of seed.products) {
      const res = insertProduct.run(p.name, p.category, p.modal_price, p.default_price);
      prodMap[p.name] = { id: res.lastInsertRowid, modal: p.modal_price };

      // Initialize all stocks to exactly 0 (requirement: stok dimulai dari 0)
      insertStock.run(res.lastInsertRowid);
    }

    for (const pm of seed.pricing_matrix) {
      const pInfo = prodMap[pm.product_name];
      const cId = custMap[pm.customer_code];
      if (pInfo && cId) {
        insertPricing.run(pInfo.id, cId, pm.sell_price || 0);
      }
    }

    // Invoices start at 0 (empty transactions)
  });

  tx();
  console.log('Master data seeded successfully with stock starting at 0 and 0 transactions.');
}

initDb();

module.exports = {
  db,
  hashPassword,
  initDb
};
