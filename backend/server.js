const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const XLSX = require('xlsx');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// WebSocket Real-time Broadcast
function broadcast(event, data) {
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ event: 'CONNECTED', message: 'Connected to Master Cigarettes Realtime Server' }));
});

// ==========================================
// 1. DASHBOARD & STATS API
// ==========================================
app.get('/api/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total sales & profit overall & today
    const totalStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(ii.subtotal), 0) as total_omset,
        COALESCE(SUM(ii.modal_price * ii.qty), 0) as total_modal,
        COALESCE(SUM(ii.laba), 0) as total_laba
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
    `).get();

    const todayStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as today_invoices,
        COALESCE(SUM(ii.subtotal), 0) as today_omset,
        COALESCE(SUM(ii.laba), 0) as today_laba
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.date = ?
    `).get(today);

    // Stock alert (Stok <= 5)
    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count FROM stocks WHERE stok_akhir <= 5
    `).get().count;

    // Total active products and customers
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;

    // Top 5 Best Selling Products
    const topProducts = db.prepare(`
      SELECT p.name, SUM(ii.qty) as total_qty, SUM(ii.subtotal) as total_sales, SUM(ii.laba) as total_profit
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 5
    `).all();

    // Top 5 Customers
    const topCustomers = db.prepare(`
      SELECT c.code, c.name, COUNT(DISTINCT i.id) as order_count, SUM(i.total_amount) as total_spent
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 5
    `).all();

    // Recent 5 Transactions
    const recentInvoices = db.prepare(`
      SELECT i.id, i.invoice_no, i.date, i.total_amount, COALESCE(c.name, i.customer_name_manual) as customer_name, c.code as customer_code
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.id DESC
      LIMIT 5
    `).all();

    res.json({
      totalStats,
      todayStats,
      lowStockCount,
      productCount,
      customerCount,
      topProducts,
      topCustomers,
      recentInvoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PRODUCTS API
// ==========================================
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, s.stok_awal, s.stok_in, s.stok_out, s.stok_akhir
      FROM products p
      LEFT JOIN stocks s ON p.id = s.product_id
      ORDER BY p.name ASC
    `).all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, category, modal_price, default_price, initial_stock } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama produk wajib diisi' });

    const insertProd = db.prepare(`
      INSERT INTO products (name, category, modal_price, default_price) VALUES (?, ?, ?, ?)
    `);
    const insertStock = db.prepare(`
      INSERT INTO stocks (product_id, stok_awal, stok_in, stok_out, stok_akhir) VALUES (?, ?, 0, 0, ?)
    `);

    const result = db.transaction(() => {
      const resP = insertProd.run(name.trim(), category || 'Rokok', modal_price || 0, default_price || modal_price || 0);
      const prodId = resP.lastInsertRowid;
      const initStk = initial_stock || 0;
      insertStock.run(prodId, initStk, initStk);
      return prodId;
    })();

    broadcast('PRODUCT_CREATED', { id: result, name });
    res.json({ success: true, id: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { name, category, modal_price, default_price, is_active } = req.body;
    const prodId = req.params.id;

    db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, modal_price = ?, default_price = ?, is_active = ?
      WHERE id = ?
    `).run(name, category, modal_price, default_price, is_active ?? 1, prodId);

    broadcast('PRODUCT_UPDATED', { id: prodId, name });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const prodId = req.params.id;
    db.prepare('DELETE FROM products WHERE id = ?').run(prodId);
    broadcast('PRODUCT_DELETED', { id: prodId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CUSTOMERS API
// ==========================================
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT c.*, 
        COUNT(DISTINCT i.id) as total_invoices,
        COALESCE(SUM(i.total_amount), 0) as total_transactions
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { code, name, phone, address } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Kode dan Nama pelanggan wajib diisi' });

    const info = db.prepare(`
      INSERT INTO customers (code, name, phone, address) VALUES (?, ?, ?, ?)
    `).run(code.trim().toUpperCase(), name.trim(), phone || '', address || '');

    broadcast('CUSTOMER_CREATED', { id: info.lastInsertRowid, code, name });
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { code, name, phone, address } = req.body;
    const custId = req.params.id;

    db.prepare(`
      UPDATE customers SET code = ?, name = ?, phone = ?, address = ? WHERE id = ?
    `).run(code.trim().toUpperCase(), name.trim(), phone || '', address || '', custId);

    broadcast('CUSTOMER_UPDATED', { id: custId, code, name });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const custId = req.params.id;
    db.prepare('DELETE FROM customers WHERE id = ?').run(custId);
    broadcast('CUSTOMER_DELETED', { id: custId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. PRICING MATRIX API
// ==========================================
app.get('/api/pricing-matrix', (req, res) => {
  try {
    const products = db.prepare('SELECT id, name, modal_price, default_price FROM products WHERE is_active = 1 ORDER BY name ASC').all();
    const customers = db.prepare('SELECT id, code, name FROM customers ORDER BY code ASC').all();
    const prices = db.prepare('SELECT product_id, customer_id, sell_price FROM pricing_matrix').all();

    // Map by prodId_custId
    const matrix = {};
    for (const p of prices) {
      matrix[`${p.product_id}_${p.customer_id}`] = p.sell_price;
    }

    res.json({ products, customers, matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get price for a specific product and customer
app.get('/api/pricing-matrix/lookup', (req, res) => {
  try {
    const { product_id, customer_id } = req.query;
    if (!product_id || !customer_id) return res.status(400).json({ error: 'product_id & customer_id required' });

    const item = db.prepare(`
      SELECT pm.sell_price, p.modal_price, p.default_price
      FROM products p
      LEFT JOIN pricing_matrix pm ON p.id = pm.product_id AND pm.customer_id = ?
      WHERE p.id = ?
    `).get(customer_id, product_id);

    if (!item) return res.status(404).json({ error: 'Product not found' });

    const finalPrice = item.sell_price > 0 ? item.sell_price : (item.default_price || item.modal_price);
    res.json({
      product_id: Number(product_id),
      customer_id: Number(customer_id),
      sell_price: finalPrice,
      modal_price: item.modal_price,
      is_custom: item.sell_price > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-matrix/update-cell', (req, res) => {
  try {
    const { product_id, customer_id, sell_price } = req.body;
    db.prepare(`
      INSERT INTO pricing_matrix (product_id, customer_id, sell_price)
      VALUES (?, ?, ?)
      ON CONFLICT(product_id, customer_id) DO UPDATE SET sell_price = excluded.sell_price
    `).run(product_id, customer_id, sell_price || 0);

    broadcast('PRICING_UPDATED', { product_id, customer_id, sell_price });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. TRANSACTIONS & CASHIER NOTA API
// ==========================================
app.get('/api/invoices', (req, res) => {
  try {
    const { start_date, end_date, customer_id, search } = req.query;
    let query = `
      SELECT i.*, 
        c.code as customer_code, 
        c.name as customer_name,
        COUNT(ii.id) as item_count,
        COALESCE(SUM(ii.laba), 0) as total_laba
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ` AND i.date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND i.date <= ?`;
      params.push(end_date);
    }
    if (customer_id) {
      query += ` AND i.customer_id = ?`;
      params.push(customer_id);
    }
    if (search) {
      query += ` AND (i.invoice_no LIKE ? OR c.name LIKE ? OR c.code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY i.id ORDER BY i.date DESC, i.id DESC`;
    const invoices = db.prepare(query).all(...params);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.code as customer_code, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = db.prepare(`
      SELECT ii.*, p.name as product_name, p.category as product_category
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `).all(req.params.id);

    res.json({ ...invoice, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const { date, customer_id, customer_name_manual, items, notes } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Minimal 1 produk dalam nota' });
    }

    const txDate = date || new Date().toISOString().split('T')[0];

    // Generate Invoice Number
    const countToday = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE date = ?').get(txDate).count;
    const invNo = `INV-${txDate.replace(/-/g, '')}-${String(countToday + 1).padStart(3, '0')}`;

    const insertInv = db.prepare(`
      INSERT INTO invoices (invoice_no, date, customer_id, customer_name_manual, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, product_id, qty, modal_price, unit_price, subtotal, laba)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE stocks 
      SET stok_out = stok_out + ?, stok_akhir = stok_akhir - ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `);

    const insertLog = db.prepare(`
      INSERT INTO stock_logs (product_id, type, qty, notes, date)
      VALUES (?, 'OUT', ?, ?, ?)
    `);

    let totalAmount = 0;

    const tx = db.transaction(() => {
      // Calculate total
      for (const itm of items) {
        totalAmount += Number(itm.subtotal || (itm.unit_price * itm.qty));
      }

      const resInv = insertInv.run(invNo, txDate, customer_id || null, customer_name_manual || '', totalAmount, notes || '');
      const invoiceId = resInv.lastInsertRowid;

      for (const itm of items) {
        const prod = db.prepare('SELECT modal_price FROM products WHERE id = ?').get(itm.product_id);
        const modal = prod ? prod.modal_price : 0;
        const subtotal = Number(itm.subtotal || (itm.unit_price * itm.qty));
        const laba = subtotal - (modal * itm.qty);

        insertItem.run(invoiceId, itm.product_id, itm.qty, modal, itm.unit_price, subtotal, laba);

        // Deduct Stock
        updateStock.run(itm.qty, itm.qty, itm.product_id);
        insertLog.run(itm.product_id, itm.qty, `Nota: ${invNo}`, txDate);
      }

      return invoiceId;
    });

    const newInvoiceId = tx();

    broadcast('INVOICE_CREATED', { id: newInvoiceId, invoice_no: invNo, total_amount: totalAmount });
    broadcast('STOCK_UPDATED', { reason: 'NEW_SALE' });

    res.json({ success: true, id: newInvoiceId, invoice_no: invNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', (req, res) => {
  try {
    const invId = req.params.id;
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invId);

    const restoreStock = db.prepare(`
      UPDATE stocks 
      SET stok_out = stok_out - ?, stok_akhir = stok_akhir + ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `);

    const tx = db.transaction(() => {
      for (const itm of items) {
        restoreStock.run(itm.qty, itm.qty, itm.product_id);
      }
      db.prepare('DELETE FROM invoices WHERE id = ?').run(invId);
    });

    tx();
    broadcast('INVOICE_DELETED', { id: invId });
    broadcast('STOCK_UPDATED', { reason: 'INVOICE_CANCELLED' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. STOCK OPNAME & RESTOCK API
// ==========================================
app.get('/api/stocks', (req, res) => {
  try {
    const stocks = db.prepare(`
      SELECT s.*, p.name as product_name, p.category, p.modal_price
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      WHERE p.is_active = 1
      ORDER BY p.name ASC
    `).all();
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stocks/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT sl.*, p.name as product_name
      FROM stock_logs sl
      JOIN products p ON sl.product_id = p.id
      ORDER BY sl.id DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restock / Barang Masuk
app.post('/api/stocks/in', (req, res) => {
  try {
    const { product_id, qty, date, notes } = req.body;
    if (!product_id || !qty || qty <= 0) {
      return res.status(400).json({ error: 'Produk dan kuantiti valid wajib diisi' });
    }

    const logDate = date || new Date().toISOString().split('T')[0];

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE stocks 
        SET stok_in = stok_in + ?, stok_akhir = stok_akhir + ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `).run(qty, qty, product_id);

      db.prepare(`
        INSERT INTO stock_logs (product_id, type, qty, notes, date)
        VALUES (?, 'IN', ?, ?, ?)
      `).run(product_id, qty, notes || 'Barang Masuk', logDate);
    });

    tx();
    broadcast('STOCK_UPDATED', { product_id, qty, type: 'IN' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Adjustment (Penyesuaian Fisik / Stok Awal)
app.post('/api/stocks/adjust', (req, res) => {
  try {
    const { product_id, new_actual_stock, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const current = db.prepare('SELECT stok_akhir FROM stocks WHERE product_id = ?').get(product_id);
    if (!current) return res.status(404).json({ error: 'Stok produk tidak ditemukan' });

    const diff = new_actual_stock - current.stok_akhir;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE stocks 
        SET stok_akhir = ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `).run(new_actual_stock, product_id);

      db.prepare(`
        INSERT INTO stock_logs (product_id, type, qty, notes, date)
        VALUES (?, 'ADJUSTMENT', ?, ?, ?)
      `).run(product_id, diff, notes || `Penyesuaian stok (${diff >= 0 ? '+' : ''}${diff})`, today);
    });

    tx();
    broadcast('STOCK_UPDATED', { product_id, new_actual_stock, type: 'ADJUSTMENT' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. LABA - RUGI & FINANCIAL REPORT API
// ==========================================
app.get('/api/reports/laba-rugi', (req, res) => {
  try {
    const { start_date, end_date, product_id, customer_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (start_date) {
      whereClause += ' AND i.date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND i.date <= ?';
      params.push(end_date);
    }
    if (product_id) {
      whereClause += ' AND ii.product_id = ?';
      params.push(product_id);
    }
    if (customer_id) {
      whereClause += ' AND i.customer_id = ?';
      params.push(customer_id);
    }

    // Summary Card Stats
    const summary = db.prepare(`
      SELECT 
        COALESCE(SUM(ii.qty), 0) as total_qty,
        COALESCE(SUM(ii.modal_price * ii.qty), 0) as total_modal,
        COALESCE(SUM(ii.subtotal), 0) as total_jual,
        COALESCE(SUM(ii.laba), 0) as total_laba
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      ${whereClause}
    `).get(...params);

    summary.margin_pct = summary.total_jual > 0 
      ? Number(((summary.total_laba / summary.total_jual) * 100).toFixed(2)) 
      : 0;

    // Breakdown per Product
    const perProduct = db.prepare(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.modal_price as unit_modal,
        COALESCE(SUM(ii.qty), 0) as total_qty,
        COALESCE(SUM(ii.modal_price * ii.qty), 0) as total_modal,
        COALESCE(SUM(ii.subtotal), 0) as total_jual,
        COALESCE(SUM(ii.laba), 0) as total_laba
      FROM products p
      JOIN invoice_items ii ON p.id = ii.product_id
      JOIN invoices i ON ii.invoice_id = i.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY total_laba DESC
    `).all(...params);

    perProduct.forEach(p => {
      p.margin_pct = p.total_jual > 0 ? Number(((p.total_laba / p.total_jual) * 100).toFixed(2)) : 0;
    });

    // Breakdown per Customer
    const perCustomer = db.prepare(`
      SELECT 
        c.id as customer_id,
        c.code as customer_code,
        c.name as customer_name,
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(ii.qty), 0) as total_qty,
        COALESCE(SUM(ii.modal_price * ii.qty), 0) as total_modal,
        COALESCE(SUM(ii.subtotal), 0) as total_jual,
        COALESCE(SUM(ii.laba), 0) as total_laba
      FROM customers c
      JOIN invoices i ON c.id = i.customer_id
      JOIN invoice_items ii ON i.id = ii.invoice_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY total_laba DESC
    `).all(...params);

    res.json({ summary, perProduct, perCustomer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. EXCEL EXPORT API
// ==========================================
app.get('/api/export/excel', (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Laba-Rugi
    const lrData = db.prepare(`
      SELECT 
        p.name as "Nama Produk",
        SUM(ii.qty) as "Qty Terjual",
        SUM(ii.modal_price * ii.qty) as "Total Modal (HPP)",
        SUM(ii.subtotal) as "Total Jual (Omset)",
        SUM(ii.laba) as "Total Laba / Rugi"
      FROM products p
      JOIN invoice_items ii ON p.id = ii.product_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `).all();
    const wsLR = XLSX.utils.json_to_sheet(lrData);
    XLSX.utils.book_append_sheet(wb, wsLR, 'Laba-Rugi');

    // 2. Sheet Transaksi / Nota
    const txData = db.prepare(`
      SELECT 
        i.date as "Tanggal",
        i.invoice_no as "No Nota",
        COALESCE(c.code, i.customer_name_manual) as "Kode Pembeli",
        COALESCE(c.name, i.customer_name_manual) as "Nama Pembeli",
        p.name as "Produk",
        ii.qty as "Qty",
        ii.unit_price as "Harga Satuan",
        ii.subtotal as "Subtotal",
        ii.laba as "Laba"
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.date DESC, i.id DESC
    `).all();
    const wsTX = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTX, 'Riwayat Transaksi');

    // 3. Sheet Stock Opname
    const stockData = db.prepare(`
      SELECT 
        p.name as "Nama Produk",
        s.stok_awal as "Stok Awal",
        s.stok_in as "Barang Masuk",
        s.stok_out as "Barang Keluar",
        s.stok_akhir as "Stok Akhir"
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      ORDER BY p.name ASC
    `).all();
    const wsSO = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, wsSO, 'Stock Opname');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="JURNAL_KEUANGAN_MASTER_CIGARETTES.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for SPA routing
app.use((req, res) => {
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('API is running. Build frontend with `npm run build` inside /frontend.');
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Master Cigarettes Backend & Realtime WS running on http://localhost:${PORT}`);
});
