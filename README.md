# 🚬 CV. MASTER CIGARETTES — Sistem Jurnal Keuangan & POS Real-Time

Aplikasi Web & Mobile PWA terpadu untuk digitalisasi sistem penjualan grosir, kasir/nota transaksi, manajemen stok opname, matriks harga khusus pelanggan, dan laporan laba-rugi keuangan secara **real-time dan online**.

---

## 🌟 Fitur Utama

- **🛒 Kasir & Pembuatan Nota (POS)**:
  - Pemilihan pelanggan dengan **harga jual yang otomatis menyesuaikan** profil pelanggan (26 kode pelanggan & 120 produk).
  - Keranjang multi-item, hitung subtotal & total instan.
  - Cetak Struk Kasir Thermal (58mm/80mm), format Nota A4, atau langsung kirim ringkasan nota ke **WhatsApp**.
  - Otomatis memotong stok barang dan memperbarui jurnal laba-rugi saat transaksi disimpan.

- **📊 Dashboard Keuangan Real-Time**:
  - Live Omset Penjualan, Total Modal (HPP), Total Laba Bersih, Margin Keuntungan %.
  - 5 Produk Terlaris dan 5 Pelanggan terbesar.
  - Peringatan Stok Menipis (Stok ≤ 5).

- **📦 Stock Opname & Gudang**:
  - Monitoring Stok Awal, Barang Masuk (Restock), Barang Keluar, dan Sisa Stok Akhir.
  - Input Barang Masuk & Penyesuaian Fisik (Opname).
  - Riwayat log mutasi stok lengkap.

- **📈 Laporan Laba - Rugi (P&L)**:
  - Rincian laba per produk dan per pelanggan sesuai rumus akuntansi.
  - Filter rentang tanggal fleksibel.
  - Ekspor seluruh data laporan ke file Excel asli (`.xlsx`).

- **📑 Matriks Harga Khusus Pelanggan**:
  - Tabel interaktif 120 produk x 26 pelanggan dengan fitur inline edit dan auto-save instan.

- **📱 Mobile PWA Lite App**:
  - Dapat diinstall di layar utama smartphone Android / iOS (*Add to Home Screen*) menjadi aplikasi mandiri yang ringan dan cepat.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat:
- [Node.js](https://nodejs.org/) (versi 18+)

### 2. Instalasi & Menjalankan:
```bash
# 1. Install dependencies
npm run install:all

# 2. Build frontend
npm run build

# 3. Jalankan server aplikasi
npm start
```
Buka browser di: `http://localhost:5000`

### 3. Di Windows (Sekali Klik):
Cukup klik 2 kali file **`start.bat`**.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Lucide Icons, Vite PWA
- **Backend**: Node.js, Express.js, WebSocket (Real-time Broadcast)
- **Database**: SQLite with WAL mode & automated seeding
- **Export**: SheetJS (XLSX)

---

## 📄 Lisensi
ISC License.
