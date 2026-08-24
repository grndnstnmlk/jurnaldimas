const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys & WAL mode for high concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
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
  `);

  // Check if seeding is needed
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customerCount === 0) {
    seedData();
  }
}

function seedData() {
  const seedFile = path.join(__dirname, 'seed_data.json');
  if (!fs.existsSync(seedFile)) {
    console.log('No seed file found.');
    return;
  }

  const raw = fs.readFileSync(seedFile, 'utf-8');
  const seed = JSON.parse(raw);

  console.log('Seeding initial data to SQLite...');

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
    INSERT INTO stocks (product_id, stok_awal, stok_in, stok_out, stok_akhir) VALUES (?, ?, ?, ?, ?)
  `);

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoice_no, date, customer_id, customer_name_manual, total_amount, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertInvoiceItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, product_id, qty, modal_price, unit_price, subtotal, laba)
    VALUES (?, ?, ?, ?, ?, ?, ?)
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

      // Initialize stock
      const st = seed.stock[p.name] || { stok_awal: 0, stok_in: 0, stok_out: 0, stok_akhir: 0 };
      insertStock.run(res.lastInsertRowid, st.stok_awal, st.stok_in, st.stok_out, st.stok_akhir);
    }

    for (const pm of seed.pricing_matrix) {
      const pInfo = prodMap[pm.product_name];
      const cId = custMap[pm.customer_code];
      if (pInfo && cId) {
        insertPricing.run(pInfo.id, cId, pm.sell_price || 0);
      }
    }

    for (const inv of seed.invoices) {
      const cId = custMap[inv.customer_code] || null;
      const resInv = insertInvoice.run(
        inv.invoice_no,
        inv.date,
        cId,
        inv.customer_code,
        inv.total_amount,
        'Import dari Excel'
      );
      const invId = resInv.lastInsertRowid;

      for (const itm of inv.items) {
        const pInfo = prodMap[itm.product_name];
        if (pInfo) {
          const modal = pInfo.modal;
          const laba = itm.subtotal - (modal * itm.qty);
          insertInvoiceItem.run(
            invId,
            pInfo.id,
            itm.qty,
            modal,
            itm.unit_price,
            itm.subtotal,
            laba
          );
        }
      }
    }
  });

  tx();
  console.log('Seeding completed successfully!');
}

initDb();

module.exports = db;
