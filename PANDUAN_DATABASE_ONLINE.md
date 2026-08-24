# 🌐 Panduan Menghubungkan Database Online Permanen (100% Gratis)

Panduan ini menjelaskan cara menghubungkan aplikasi **Jurnal Dimas (Master Cigarettes)** ke database online cloud gratis (**Supabase** atau **Neon.tech**) agar seluruh data transaksi, stok, dan harga khusus tersimpan **aman, permanen selamanya, dan tidak akan hilang**.

---

## 🚀 Langkah 1: Buat Database Gratis di Supabase (2 Menit)

1. Buka website **[https://supabase.com](https://supabase.com)** dan klik **Start your project** (Bisa login langsung pakai akun **GitHub** Anda).
2. Klik tombol **+ New Project**.
3. Isi data project:
   - **Name**: `jurnaldimas-db`
   - **Database Password**: Buat password yang kuat (dan simpan/catat password ini).
   - **Region**: Pilih **Singapore (Southeast Asia)** *(agar akses dari Indonesia sangat cepat)*.
   - **Pricing Plan**: Pilih **Free Plan**.
4. Klik **Create new project** dan tunggu 1 menit sampai database siap.

---

## 🔑 Langkah 2: Dapatkan Connection String (URI) Database

1. Di dashboard Supabase project Anda, klik menu **Project Settings** (ikon gerigi di kiri bawah) ➔ pilih **Database**.
2. Gulir ke bawah ke bagian **Connection string**, pilih tab **URI**.
3. Salin URL tersebut, formatnya seperti ini:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   *(Ganti `[YOUR-PASSWORD]` dengan password yang Anda buat di Langkah 1).*

---

## ⚡ Langkah 3: Masukkan ke Render.com

1. Buka dashboard **[Render.com](https://dashboard.render.com)** dan buka Web Service aplikasi Anda (`jurnal-dimas`).
2. Klik menu **Environment** di sebelah kiri.
3. Klik **+ Add Environment Variable**:
   - **Key**: `DATABASE_URL`
   - **Value**: *(Tempel/Paste connection string dari Supabase tadi)*
4. Klik **Save Changes**.

---

## 🎉 Hasilnya:

- Render akan otomatis melakukan restart.
- Aplikasi Anda sekarang **100% terhubung ke Cloud Database PostgreSQL**.
- Data seluruh 120 produk, 26 pelanggan, matriks harga, stok, dan semua riwayat nota penjualan tersimpan permanen di cloud dan dapat diakses realtime dari HP/Laptop mana pun!
