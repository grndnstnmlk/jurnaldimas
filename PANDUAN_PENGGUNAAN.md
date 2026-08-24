# 📱 Panduan Lengkap Aplikasi Jurnal Keuangan & POS Master Cigarettes

Aplikasi ini dibuat khusus untuk mendigitalisasi file Excel **`JURNAL KEUANGAN (fix).xlsm`** ke dalam sistem web & mobile PWA yang responsif, online, dan real-time.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Cara Cepat (Klik 2 Kali):
- Buka folder `Jurnal Dimas`
- Klik 2 kali file **`start.bat`**
- Browser Anda akan otomatis terbuka dan menampilkan aplikasi di:  
  👉 **`http://localhost:5000`**

---

## 📲 Cara Akses di HP Android / iPhone (Jaringan Wi-Fi Sama)

1. Pastikan laptop/komputer dan HP Anda terhubung ke **Wi-Fi yang sama**.
2. Cari tahu IP Lokal laptop Anda (buka Command Prompt lalu ketik `ipconfig`, contoh IP: `192.168.1.15`).
3. Di browser HP (Chrome / Safari), buka:
   ```
   http://192.168.1.15:5000
   ```
4. **Cara Pasang Aplikasi di HP (PWA Lite App)**:
   - **Di Chrome (Android)**: Klik titik tiga di pojok kanan atas ➔ Pilih **"Tambahkan ke Layar Utama" / "Install Aplikasi"**.
   - **Di Safari (iPhone/iPad)**: Klik tombol Share (ikon kotak dengan panah atas) ➔ Pilih **"Add to Home Screen" (Tambahkan ke Layar Utama)**.
   - Ikon aplikasi **MasterPOS** akan langsung muncul di layar utama HP Anda dan dapat dibuka layaknya aplikasi native mandiri!

---

## 🌐 Cara Akses Online 24 Jam (Tanpa Perlu Laptop Selalu Nyala)

Aplikasi ini dibangun menggunakan arsitektur modern Node.js + SQLite/REST API yang dapat di-deploy secara **GRATIS** ke layanan cloud:
1. **Render.com / Railway.app / Glitch**: Cukup upload folder project ini, set start command `node backend/server.js`, dan Anda akan mendapatkan link online resmi seperti `https://master-cigarettes.onrender.com` yang bisa dibuka siapa saja dari mana saja.
2. **Cloudflare Tunnel**: Alternatif gratis untuk membuat link publik aman tanpa biaya.

---

## 📦 Fitur-Fitur Utama Aplikasi

1. **🛒 Kasir & Pembuatan Nota (POS)**:
   - Pilih pelanggan (SIM, NDL, UMK, dll) dan **harga jual otomatis disesuaikan** dengan matriks harga pelanggan tersebut.
   - Tambah produk dengan pencarian cepat dari 120 produk.
   - Hitung subtotal dan estimasi laba kotor secara instan.
   - Cetak nota resmi (Format Thermal 58/80mm atau A4) dan tombol **Kirim ke WhatsApp**.

2. **📊 Dashboard Real-time**:
   - Total Omset Penjualan, Total Modal (HPP), Total Laba Bersih, Margin Keuntungan %.
   - 5 Produk Terlaris dan 5 Pelanggan dengan volume belanja terbesar.
   - Peringatan Stok Menipis (Stok ≤ 5).

3. **📋 Riwayat Nota**:
   - Filter berdasarkan rentang tanggal, pelanggan, atau pencarian nomor nota.
   - Buka rincian item barang pada setiap nota.
   - Batalkan transaksi dengan **pengembalian stok otomatis**.

4. **📦 Stock Opname**:
   - Pantau Stok Awal, Barang Masuk, Barang Keluar, dan Sisa Stok Fisik.
   - Input **Barang Masuk (Restock)** dengan keterangan supplier.
   - Menu **Penyesuaian Fisik (Opname)** untuk sinkronisasi stok riil.
   - Riwayat mutasi log stok.

5. **📈 Laporan Laba - Rugi**:
   - Rincian laba per produk dan per pelanggan sesuai rumus Excel `Laba-Rugi`.
   - Filter periode (Hari ini, Bulan ini, atau Custom).
   - Ekspor laporan ke file Excel asli (.xlsx) kapan saja.

6. **📑 Matriks Harga Khusus Pelanggan**:
   - Tabel interaktif 120 produk x 26 pelanggan.
   - Klik langsung pada sel angka untuk mengubah harga per pelanggan dan langsung tersimpan secara otomatis.

7. **🗃️ Master Data**:
   - Kelola katalog produk (tambah, edit harga modal/HPP, hapus).
   - Kelola direktori pelanggan (kode, nama, telepon, alamat).
