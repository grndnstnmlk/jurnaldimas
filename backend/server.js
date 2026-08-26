const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');
const XLSX = require('xlsx');
const { db, hashPassword } = require('./db');

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
// TOKEN & SECURITY UTILITIES
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'master_pos_jwt_secret_key_2026_super_secure';

function generateUserToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyUserToken(tokenStr) {
  if (!tokenStr) return null;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Middleware: Authenticate User
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace('Bearer ', '') : req.query.token;

  const payload = verifyUserToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.' });
  }

  const user = db.prepare('SELECT id, name, email, role, avatar_url, is_active FROM users WHERE id = ?').get(payload.id);
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Akun Anda tidak aktif atau tidak ditemukan.' });
  }

  req.user = user;
  next();
}

// Middleware: Require Admin / Host Role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Fitur ini hanya untuk Administrator / Host.' });
  }
  next();
}

// Public Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// AUTHENTICATION & REGISTRATION API
// ==========================================

// Register Account
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama lengkap, email, dan password wajib diisi.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email ini sudah terdaftar. Silakan login.' });
    }

    // Public registration is strictly for 'sales' accounts only (Admin is exclusively for the host)
    const finalRole = 'sales';
    const pwdHash = hashPassword(password);
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

    const insertRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, auth_provider, is_verified, is_active, verification_code)
      VALUES (?, ?, ?, ?, 'local', 1, 1, ?)
    `).run(cleanName, cleanEmail, pwdHash, finalRole, verificationCode);

    const newUser = {
      id: insertRes.lastInsertRowid,
      name: cleanName,
      email: cleanEmail,
      role: finalRole,
      avatar_url: '',
      is_verified: 1,
      is_active: 1
    };

    const token = generateUserToken(newUser);
    broadcast('USER_REGISTERED', { id: newUser.id, name: newUser.name, role: newUser.role });

    return res.json({
      success: true,
      token,
      user: newUser,
      message: 'Registrasi akun berhasil.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login with Email & Password
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Email tidak terdaftar.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh Administrator.' });
    }

    const inputHash = hashPassword(password);
    if (user.password_hash !== inputHash) {
      return res.status(401).json({ error: 'Password tidak sesuai. Silakan coba lagi.' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      auth_provider: user.auth_provider,
      is_verified: user.is_verified,
      is_active: user.is_active
    };

    const token = generateUserToken(safeUser);
    return res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login / Register with Google
app.post('/api/auth/google', (req, res) => {
  try {
    const { credential, profile } = req.body;
    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    if (profile && profile.email) {
      email = profile.email;
      name = profile.name || email.split('@')[0];
      avatar = profile.picture || profile.avatar || '';
      googleId = profile.id || profile.sub || '';
    } else if (credential) {
      // Decode JWT credential from Google Identity Services
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          email = payload.email;
          name = payload.name || payload.given_name || email.split('@')[0];
          avatar = payload.picture || '';
          googleId = payload.sub || '';
        }
      } catch (e) {
        console.error('Google token decode err:', e);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Data akun Google tidak valid.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isHostEmail = cleanEmail === 'grndnstnmlk@gmail.com' || cleanEmail === 'admin@masterpos.com';
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (user) {
      if (!user.is_active) {
        return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh Administrator.' });
      }
      const updatedRole = isHostEmail ? 'admin' : user.role;
      // Update google ID & avatar & ensure host email has admin role
      db.prepare(`
        UPDATE users 
        SET google_id = COALESCE(google_id, ?), 
            avatar_url = COALESCE(NULLIF(?, ''), avatar_url),
            role = ?,
            is_verified = 1,
            last_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(googleId, avatar, updatedRole, user.id);
      user.role = updatedRole;
    } else {
      // Register new user via Google: only the host email gets admin, everyone else is sales
      const role = isHostEmail ? 'admin' : 'sales';

      const insertRes = db.prepare(`
        INSERT INTO users (name, email, role, auth_provider, google_id, avatar_url, is_verified, is_active, last_login)
        VALUES (?, ?, ?, 'google', ?, ?, 1, 1, CURRENT_TIMESTAMP)
      `).run(name, cleanEmail, role, googleId, avatar);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(insertRes.lastInsertRowid);
      broadcast('USER_REGISTERED', { id: user.id, name: user.name, role: user.role, provider: 'google' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || avatar,
      auth_provider: user.auth_provider,
      is_verified: 1,
      is_active: user.is_active
    };

    const token = generateUserToken(safeUser);
    return res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Current Session
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Change Password
app.post('/api/auth/change-password', authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (user.auth_provider === 'local' && user.password_hash) {
      if (hashPassword(current_password) !== user.password_hash) {
        return res.status(400).json({ error: 'Password saat ini salah.' });
      }
    }

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(new_password), user.id);
    return res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN: USER MANAGEMENT API
// ==========================================
app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, auth_provider, avatar_url, is_verified, is_active, created_at, last_login
      FROM users
      ORDER BY id ASC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) return res.status(400).json({ error: 'Email sudah terdaftar.' });

    const insertRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, auth_provider, is_verified, is_active)
      VALUES (?, ?, ?, ?, 'local', 1, 1)
    `).run(name.trim(), cleanEmail, hashPassword(password), role || 'sales');

    broadcast('USER_UPDATED', { id: insertRes.lastInsertRowid });
    res.json({ success: true, id: insertRes.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/role', authenticate, requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['admin', 'sales'].includes(role)) {
      return res.status(400).json({ error: 'Role harus "admin" atau "sales".' });
    }

    // Prevent removing own admin role if last admin
    if (Number(userId) === Number(req.user.id) && role !== 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Tidak dapat mengubah role karena Anda adalah satu-satunya Administrator.' });
      }
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    broadcast('USER_UPDATED', { id: userId, role });
    res.json({ success: true, message: `Role berhasil diubah menjadi ${role === 'admin' ? 'Administrator' : 'Sales'}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/status', authenticate, requireAdmin, (req, res) => {
  try {
    const { is_active } = req.body;
    const userId = req.params.id;

    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({ error: 'Tidak dapat menonaktifkan akun sendiri.' });
    }

    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, userId);
    broadcast('USER_UPDATED', { id: userId, is_active });
    res.json({ success: true, message: `Status akun berhasil diperbarui.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    broadcast('USER_UPDATED', { id: userId, deleted: true });
    res.json({ success: true, message: 'Akun berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN: SYSTEM DATA RESET API
// ==========================================

// 1. Reset all transaction invoices & logs
app.post('/api/admin/reset/transactions', authenticate, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      db.exec('DELETE FROM invoice_items');
      db.exec('DELETE FROM invoices');
      // Remove transaction stock logs
      db.exec("DELETE FROM stock_logs WHERE type = 'OUT' AND notes LIKE 'Nota:%'");
    })();

    broadcast('INVOICE_RESET', { message: 'All transactions have been reset to 0.' });
    broadcast('STOCK_UPDATED', { type: 'TX_RESET' });
    res.json({ success: true, message: 'Seluruh riwayat transaksi & nota berhasil direset ke 0.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Reset all stocks to 0
app.post('/api/admin/reset/stocks', authenticate, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      db.exec('UPDATE stocks SET stok_awal = 0, stok_in = 0, stok_out = 0, stok_akhir = 0, updated_at = CURRENT_TIMESTAMP');
      db.exec('DELETE FROM stock_logs');
    })();

    broadcast('STOCK_UPDATED', { type: 'STOCK_RESET_ALL_ZERO' });
    res.json({ success: true, message: 'Seluruh stok barang berhasil direset menjadi 0.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Reset both transactions & stocks to clean state
app.post('/api/admin/reset/all-data', authenticate, requireAdmin, (req, res) => {
  try {
    db.transaction(() => {
      db.exec('DELETE FROM invoice_items');
      db.exec('DELETE FROM invoices');
      db.exec('UPDATE stocks SET stok_awal = 0, stok_in = 0, stok_out = 0, stok_akhir = 0, updated_at = CURRENT_TIMESTAMP');
      db.exec('DELETE FROM stock_logs');
    })();

    broadcast('INVOICE_RESET', { message: 'System full reset completed.' });
    broadcast('STOCK_UPDATED', { type: 'FULL_RESET' });
    res.json({ success: true, message: 'Seluruh transaksi dan data stok berhasil dibersihkan kembali ke 0.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. DASHBOARD & STATS API (Admin Only)
// ==========================================
app.get('/api/dashboard', authenticate, requireAdmin, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

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

    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count FROM stocks WHERE stok_akhir <= 5
    `).get().count;

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;

    const topProducts = db.prepare(`
      SELECT p.name, SUM(ii.qty) as total_qty, SUM(ii.subtotal) as total_sales, SUM(ii.laba) as total_profit
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 5
    `).all();

    const topCustomers = db.prepare(`
      SELECT c.code, c.name, COUNT(DISTINCT i.id) as order_count, SUM(i.total_amount) as total_spent
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 5
    `).all();

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
// 2. PRODUCTS API (Sales & Admin)
// ==========================================
app.get('/api/products', authenticate, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, s.stok_awal, s.stok_in, s.stok_out, s.stok_akhir
      FROM products p
      LEFT JOIN stocks s ON p.id = s.product_id
      ORDER BY p.name ASC
    `).all();

    // If sales role, hide sensitive modal_price / HPP from general product response if needed
    if (req.user.role === 'sales') {
      products.forEach(p => {
        p.modal_price = 0; // Protected from Sales
      });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticate, requireAdmin, (req, res) => {
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

app.put('/api/products/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, category, modal_price, default_price, is_active, stock, initial_stock } = req.body;
    const prodId = req.params.id;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE products 
        SET name = ?, category = ?, modal_price = ?, default_price = ?, is_active = ?
        WHERE id = ?
      `).run(name, category, modal_price, default_price, is_active ?? 1, prodId);

      const targetStock = stock !== undefined ? stock : initial_stock;
      if (targetStock !== undefined && targetStock !== null && targetStock !== '') {
        const numStock = Math.max(0, Number(targetStock));
        const currentStock = db.prepare('SELECT stok_akhir FROM stocks WHERE product_id = ?').get(prodId);
        if (currentStock) {
          if (currentStock.stok_akhir !== numStock) {
            const diff = numStock - currentStock.stok_akhir;
            db.prepare(`
              UPDATE stocks 
              SET stok_akhir = ?, updated_at = CURRENT_TIMESTAMP
              WHERE product_id = ?
            `).run(numStock, prodId);

            db.prepare(`
              INSERT INTO stock_logs (product_id, type, qty, notes, date)
              VALUES (?, 'ADJUSTMENT', ?, ?, ?)
            `).run(prodId, diff, `Edit produk & stok (${diff >= 0 ? '+' : ''}${diff})`, new Date().toISOString().split('T')[0]);
          }
        } else {
          db.prepare(`
            INSERT INTO stocks (product_id, stok_awal, stok_in, stok_out, stok_akhir)
            VALUES (?, ?, 0, 0, ?)
          `).run(prodId, numStock, numStock);
        }
      }
    });

    tx();
    broadcast('PRODUCT_UPDATED', { id: prodId, name });
    broadcast('STOCK_UPDATED', { product_id: prodId, type: 'EDIT' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticate, requireAdmin, (req, res) => {
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
// 3. CUSTOMERS API (Sales & Admin)
// ==========================================
app.get('/api/customers', authenticate, (req, res) => {
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

app.post('/api/customers', authenticate, requireAdmin, (req, res) => {
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

app.put('/api/customers/:id', authenticate, requireAdmin, (req, res) => {
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

app.delete('/api/customers/:id', authenticate, requireAdmin, (req, res) => {
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
// 4. PRICING MATRIX API (Sales & Admin)
// ==========================================
app.get('/api/pricing-matrix', authenticate, (req, res) => {
  try {
    const products = db.prepare('SELECT id, name, modal_price, default_price FROM products WHERE is_active = 1 ORDER BY name ASC').all();
    const customers = db.prepare('SELECT id, code, name FROM customers ORDER BY code ASC').all();
    const prices = db.prepare('SELECT product_id, customer_id, sell_price FROM pricing_matrix').all();

    // Map by prodId_custId
    const matrix = {};
    for (const p of prices) {
      matrix[`${p.product_id}_${p.customer_id}`] = p.sell_price;
    }

    if (req.user.role === 'sales') {
      products.forEach(p => {
        p.modal_price = 0; // Hide modal price from sales
      });
    }

    res.json({ products, customers, matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pricing-matrix/lookup', authenticate, (req, res) => {
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
      modal_price: req.user.role === 'admin' ? item.modal_price : 0,
      is_custom: item.sell_price > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-matrix/update-cell', authenticate, requireAdmin, (req, res) => {
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

app.post('/api/pricing-matrix/batch-update-customer', authenticate, requireAdmin, (req, res) => {
  try {
    const { customer_id, prices } = req.body;
    if (!customer_id || !Array.isArray(prices)) {
      return res.status(400).json({ error: 'customer_id and prices array required' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO pricing_matrix (product_id, customer_id, sell_price)
      VALUES (?, ?, ?)
      ON CONFLICT(product_id, customer_id) DO UPDATE SET sell_price = excluded.sell_price
    `);

    const updateMany = db.transaction((list) => {
      for (const item of list) {
        if (item.product_id && item.sell_price >= 0) {
          upsertStmt.run(item.product_id, customer_id, Math.round(item.sell_price));
        }
      }
    });

    updateMany(prices);
    broadcast('PRICING_BATCH_UPDATED', { customer_id, count: prices.length });
    res.json({ success: true, message: `Berhasil memperbarui ${prices.length} harga produk` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-matrix/copy-customer-prices', authenticate, requireAdmin, (req, res) => {
  try {
    const { source_customer_id, target_customer_id } = req.body;
    if (!source_customer_id || !target_customer_id) {
      return res.status(400).json({ error: 'source_customer_id and target_customer_id required' });
    }

    const sourcePrices = db.prepare(`
      SELECT product_id, sell_price FROM pricing_matrix WHERE customer_id = ?
    `).all(source_customer_id);

    const upsertStmt = db.prepare(`
      INSERT INTO pricing_matrix (product_id, customer_id, sell_price)
      VALUES (?, ?, ?)
      ON CONFLICT(product_id, customer_id) DO UPDATE SET sell_price = excluded.sell_price
    `);

    db.transaction(() => {
      for (const sp of sourcePrices) {
        upsertStmt.run(sp.product_id, target_customer_id, sp.sell_price);
      }
    })();

    broadcast('PRICING_COPIED', { source_customer_id, target_customer_id, count: sourcePrices.length });
    res.json({ success: true, count: sourcePrices.length, message: `Berhasil menyalin ${sourcePrices.length} harga khusus` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-matrix/apply-margin-customer', authenticate, requireAdmin, (req, res) => {
  try {
    const { customer_id, margin_percent } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' });

    const marginFactor = 1 + (Number(margin_percent) || 0) / 100;
    const products = db.prepare('SELECT id, modal_price, default_price FROM products WHERE is_active = 1').all();

    const upsertStmt = db.prepare(`
      INSERT INTO pricing_matrix (product_id, customer_id, sell_price)
      VALUES (?, ?, ?)
      ON CONFLICT(product_id, customer_id) DO UPDATE SET sell_price = excluded.sell_price
    `);

    db.transaction(() => {
      for (const p of products) {
        const basePrice = p.modal_price || p.default_price || 0;
        const calculatedPrice = Math.round((basePrice * marginFactor) / 500) * 500;
        upsertStmt.run(p.id, customer_id, calculatedPrice);
      }
    })();

    broadcast('PRICING_MARGIN_APPLIED', { customer_id, margin_percent });
    res.json({ success: true, count: products.length, message: `Berhasil menerapkan margin +${margin_percent}% pada ${products.length} produk` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. TRANSACTIONS & CASHIER NOTA API (Sales & Admin)
// ==========================================
app.get('/api/invoices', authenticate, (req, res) => {
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

    if (req.user.role === 'sales') {
      invoices.forEach(inv => {
        inv.total_laba = 0; // Hide profit from sales
      });
    }

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', authenticate, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.code as customer_code, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) return res.status(404).json({ error: 'Nota tidak ditemukan' });

    const items = db.prepare(`
      SELECT ii.*, p.name as product_name, p.category as product_category
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `).all(req.params.id);

    if (req.user.role === 'sales') {
      items.forEach(itm => {
        itm.modal_price = 0;
        itm.laba = 0;
      });
    }

    res.json({ ...invoice, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', authenticate, (req, res) => {
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

app.delete('/api/invoices/:id', authenticate, requireAdmin, (req, res) => {
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
// 6. STOCK OPNAME & RESTOCK API (Sales & Admin)
// ==========================================
app.get('/api/stocks', authenticate, (req, res) => {
  try {
    const stocks = db.prepare(`
      SELECT s.*, p.name as product_name, p.category, p.modal_price
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      WHERE p.is_active = 1
      ORDER BY p.name ASC
    `).all();

    if (req.user.role === 'sales') {
      stocks.forEach(s => {
        s.modal_price = 0; // Hide modal price from sales
      });
    }

    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stocks/logs', authenticate, (req, res) => {
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
app.post('/api/stocks/in', authenticate, (req, res) => {
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

// Stock Adjustment (Admin only)
app.post('/api/stocks/adjust', authenticate, requireAdmin, (req, res) => {
  try {
    const { product_id, new_actual_stock, notes } = req.body;
    if (product_id === undefined || new_actual_stock === undefined || new_actual_stock === null || new_actual_stock === '') {
      return res.status(400).json({ error: 'Produk dan stok fisik valid wajib diisi' });
    }

    const today = new Date().toISOString().split('T')[0];
    const targetStock = Math.max(0, Number(new_actual_stock));

    const current = db.prepare('SELECT stok_akhir FROM stocks WHERE product_id = ?').get(product_id);
    if (!current) return res.status(404).json({ error: 'Stok produk tidak ditemukan' });

    const diff = targetStock - current.stok_akhir;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE stocks 
        SET stok_akhir = ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `).run(targetStock, product_id);

      db.prepare(`
        INSERT INTO stock_logs (product_id, type, qty, notes, date)
        VALUES (?, 'ADJUSTMENT', ?, ?, ?)
      `).run(
        product_id, 
        diff, 
        notes || (targetStock === 0 ? 'Kosongkan Stok (0)' : `Penyesuaian stok (${diff >= 0 ? '+' : ''}${diff})`), 
        today
      );
    });

    tx();
    broadcast('STOCK_UPDATED', { product_id, new_actual_stock: targetStock, type: 'ADJUSTMENT' });
    res.json({ success: true, new_stock: targetStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear All Stocks (Admin only)
app.post('/api/stocks/clear-all', authenticate, requireAdmin, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { notes } = req.body || {};

    const tx = db.transaction(() => {
      const positiveStocks = db.prepare('SELECT product_id, stok_akhir FROM stocks WHERE stok_akhir > 0').all();
      const insertLog = db.prepare(`
        INSERT INTO stock_logs (product_id, type, qty, notes, date)
        VALUES (?, 'ADJUSTMENT', ?, ?, ?)
      `);

      for (const s of positiveStocks) {
        insertLog.run(s.product_id, -s.stok_akhir, notes || 'Kosongkan Semua Stok Gudang', today);
      }

      db.prepare(`
        UPDATE stocks 
        SET stok_akhir = 0, updated_at = CURRENT_TIMESTAMP
      `).run();
    });

    tx();
    broadcast('STOCK_UPDATED', { type: 'CLEAR_ALL' });
    res.json({ success: true, message: 'Semua stok berhasil dikosongkan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. LABA - RUGI & FINANCIAL REPORT API (Admin Only)
// ==========================================
app.get('/api/reports/laba-rugi', authenticate, requireAdmin, (req, res) => {
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
// 8. EXCEL EXPORT API (Admin Only)
// ==========================================
app.get('/api/export/excel', authenticate, requireAdmin, (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

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
