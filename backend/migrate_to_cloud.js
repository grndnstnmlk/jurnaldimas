/**
 * Cloud Database Auto-Migration & Sync Tool
 * Supports: PostgreSQL (Supabase / Neon / Render Postgres) & Turso (LibSQL)
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');

async function migratePostgres(connectionString) {
  const { Client } = require('pg');
  console.log('Connecting to PostgreSQL Cloud (Supabase / Neon)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(100) DEFAULT '',
      address TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(100) DEFAULT 'Rokok',
      modal_price BIGINT NOT NULL DEFAULT 0,
      default_price BIGINT NOT NULL DEFAULT 0,
      is_active INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pricing_matrix (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      sell_price BIGINT NOT NULL DEFAULT 0,
      UNIQUE(product_id, customer_id)
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      stok_awal INT NOT NULL DEFAULT 0,
      stok_in INT NOT NULL DEFAULT 0,
      stok_out INT NOT NULL DEFAULT 0,
      stok_akhir INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_logs (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      qty INT NOT NULL,
      notes TEXT DEFAULT '',
      date VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_no VARCHAR(100) UNIQUE NOT NULL,
      date VARCHAR(50) NOT NULL,
      customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
      customer_name_manual VARCHAR(255) DEFAULT '',
      total_amount BIGINT NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      qty INT NOT NULL DEFAULT 1,
      modal_price BIGINT NOT NULL DEFAULT 0,
      unit_price BIGINT NOT NULL DEFAULT 0,
      subtotal BIGINT NOT NULL DEFAULT 0,
      laba BIGINT NOT NULL DEFAULT 0
    );
  `);

  console.log('Tables created / verified in PostgreSQL.');

  // Set default access code
  const accessCode = process.env.ACCESS_CODE || '123456';
  await client.query(`
    INSERT INTO settings (key, value) VALUES ('access_code', $1)
    ON CONFLICT (key) DO NOTHING
  `, [accessCode]);

  // Check if seeding is needed
  const custRes = await client.query('SELECT COUNT(*) as count FROM customers');
  if (parseInt(custRes.rows[0].count, 10) === 0) {
    console.log('Seeding initial 120 products, 26 customers, and pricing matrix to Cloud PostgreSQL...');
    const seedFile = path.join(__dirname, 'seed_data.json');
    if (fs.existsSync(seedFile)) {
      const seed = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));

      const custMap = {};
      for (const c of seed.customers) {
        const res = await client.query(
          'INSERT INTO customers (code, name, phone, address) VALUES ($1, $2, $3, $4) RETURNING id',
          [c.code, c.name, c.phone || '', c.address || '']
        );
        custMap[c.code] = res.rows[0].id;
      }

      const prodMap = {};
      for (const p of seed.products) {
        const res = await client.query(
          'INSERT INTO products (name, category, modal_price, default_price) VALUES ($1, $2, $3, $4) RETURNING id',
          [p.name, p.category, p.modal_price, p.default_price]
        );
        const prodId = res.rows[0].id;
        prodMap[p.name] = { id: prodId, modal: p.modal_price };

        const st = seed.stock[p.name] || { stok_awal: 0, stok_in: 0, stok_out: 0, stok_akhir: 0 };
        await client.query(
          'INSERT INTO stocks (product_id, stok_awal, stok_in, stok_out, stok_akhir) VALUES ($1, $2, $3, $4, $5)',
          [prodId, st.stok_awal, st.stok_in, st.stok_out, st.stok_akhir]
        );
      }

      for (const pm of seed.pricing_matrix) {
        const pInfo = prodMap[pm.product_name];
        const cId = custMap[pm.customer_code];
        if (pInfo && cId) {
          await client.query(
            'INSERT INTO pricing_matrix (product_id, customer_id, sell_price) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [pInfo.id, cId, pm.sell_price || 0]
          );
        }
      }

      for (const inv of seed.invoices) {
        const cId = custMap[inv.customer_code] || null;
        const resInv = await client.query(
          'INSERT INTO invoices (invoice_no, date, customer_id, customer_name_manual, total_amount, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [inv.invoice_no, inv.date, cId, inv.customer_code, inv.total_amount, 'Import dari Excel']
        );
        const invId = resInv.rows[0].id;

        for (const itm of inv.items) {
          const pInfo = prodMap[itm.product_name];
          if (pInfo) {
            const modal = pInfo.modal;
            const laba = itm.subtotal - (modal * itm.qty);
            await client.query(
              'INSERT INTO invoice_items (invoice_id, product_id, qty, modal_price, unit_price, subtotal, laba) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [invId, pInfo.id, itm.qty, modal, itm.unit_price, itm.subtotal, laba]
            );
          }
        }
      }

      console.log('Cloud PostgreSQL Seeding Completed Successfully!');
    }
  }

  await client.end();
  console.log('Migration finished!');
}

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  migratePostgres(dbUrl).catch(console.error);
} else {
  console.log('Please provide DATABASE_URL environment variable to run cloud migration.');
  console.log('Example: DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" node backend/migrate_to_cloud.js');
}
