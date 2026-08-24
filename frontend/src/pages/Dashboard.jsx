import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  Package, 
  ArrowUpRight, 
  Receipt, 
  Clock, 
  Sparkles, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import ReceiptModal from '../components/ReceiptModal';

export default function Dashboard({ setActiveTab }) {
  const { eventCounter } = useRealtime();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [eventCounter]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (invId) => {
    try {
      const res = await fetch(`/api/invoices/${invId}`);
      const json = await res.json();
      setSelectedInvoice(json);
    } catch (e) {
      console.error('Error fetching invoice:', e);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-xs font-bold text-slate-700">Memuat ringkasan data keuangan...</p>
      </div>
    );
  }

  const { totalStats, todayStats, productCount, topProducts, recentInvoices } = data;

  const marginPercentage = totalStats.total_omset > 0 
    ? ((totalStats.total_laba / totalStats.total_omset) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* 1. WELCOME HERO (Soft Sage Card) */}
      <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200/80 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              PORTAL KEUANGAN & KASIR POS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight leading-tight font-sans">
              CV. MASTER CIGARETTES
            </h1>
            <p className="text-xs sm:text-sm text-emerald-800/80 mt-1.5 max-w-xl font-medium">
              Pantau arus omset penjualan, modal HPP, margin laba bersih, dan sisa stok fisik secara otomatis dan real-time.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('kasir')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Terminal Kasir</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI STATS (Soft Tinted Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Omset Jual</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatRupiah(totalStats.total_omset)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between font-medium">
            <span>{totalStats.total_invoices} Transaksi Nota</span>
            <span className="font-bold text-slate-700">Semua Periode</span>
          </div>
        </div>

        {/* Total Laba Bersih */}
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 font-mono">
            {formatRupiah(totalStats.total_laba)}
          </div>
          <div className="text-xs text-emerald-700 mt-2 flex items-center justify-between font-bold">
            <span>Margin Keuntungan</span>
            <span>{marginPercentage}%</span>
          </div>
        </div>

        {/* Total Modal / HPP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Modal (HPP)</span>
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatRupiah(totalStats.total_modal)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between font-medium">
            <span>{productCount} Macam Produk</span>
            <span className="font-bold text-slate-700">Sisa: {totalStats.total_stok_akhir} Slop</span>
          </div>
        </div>

        {/* Omset Hari Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Omset Hari Ini</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatRupiah(todayStats.today_omset || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between font-medium">
            <span>{todayStats.today_invoices || 0} Nota Baru</span>
            <span className="font-bold text-emerald-700">+{formatRupiah(todayStats.today_laba || 0)} Laba</span>
          </div>
        </div>

      </div>

      {/* 3. TWO COLUMN SECTION: TOP PRODUCTS & RECENT INVOICES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              5 Produk Terlaris (Top Volume)
            </h3>
            <button
              onClick={() => setActiveTab('master')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Lihat Semua ➔
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800">{p.product_name}</div>
                    <div className="text-[11px] text-slate-500">{p.total_qty} Slop Terjual</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-xs sm:text-sm text-slate-800">{formatRupiah(p.total_omset)}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">+{formatRupiah(p.total_laba)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Invoices (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Transaksi Terkini
            </h3>
            <button
              onClick={() => setActiveTab('riwayat')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Semua Nota ➔
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                    <span>{inv.invoice_no}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      {inv.customer_code || 'UMUM'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatDate(inv.date)} • {inv.item_count} item
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                    {formatRupiah(inv.total_amount)}
                  </div>
                  <button
                    onClick={() => handleOpenReceipt(inv.id)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline mt-0.5"
                  >
                    Lihat Struk
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {selectedInvoice && (
        <ReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
