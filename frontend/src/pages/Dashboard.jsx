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
  ChevronRight
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
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Memuat ringkasan data keuangan real-time...</p>
      </div>
    );
  }

  const { totalStats, todayStats, lowStockCount, productCount, customerCount, topProducts, topCustomers, recentInvoices } = data;

  const marginPercentage = totalStats.total_omset > 0 
    ? ((totalStats.total_laba / totalStats.total_omset) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600/20 via-slate-900 to-slate-900 border border-amber-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PORTAL KEUANGAN & OPERASIONAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              CV. MASTER CIGARETTES — LIVE DASHBOARD
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Pantau arus omset penjualan, modal HPP, margin laba bersih, dan pergerakan stok secara otomatis dan sinkron.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('kasir')}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir Nota</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Omset Penjualan</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatRupiah(totalStats.total_omset)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>{totalStats.total_invoices} Transaksi Nota</span>
            <span className="text-amber-400 font-semibold">Semua Periode</span>
          </div>
        </div>

        {/* Total Laba Bersih */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(totalStats.total_laba)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Margin Keuntungan</span>
            <span className="text-emerald-400 font-bold">{marginPercentage}%</span>
          </div>
        </div>

        {/* Total Modal HPP */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Modal (HPP)</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-200 font-mono">
            {formatRupiah(totalStats.total_modal)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Katalog Aktif</span>
            <span className="text-blue-400 font-semibold">{productCount} Produk</span>
          </div>
        </div>

        {/* Stock Alert / Master Stats */}
        <div 
          onClick={() => setActiveTab('stock')}
          className="glass-panel p-5 rounded-2xl border-l-4 border-l-rose-500 cursor-pointer hover:bg-slate-800/80 transition"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Peringatan Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {lowStockCount} Produk
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Stok ≤ 5 Slop/Karton</span>
            <span className="text-rose-400 font-bold flex items-center">Lihat <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Top Products & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top 5 Best Selling Products (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">5 Produk Terlaris</h3>
              <p className="text-xs text-slate-400">Berdasarkan akumulasi kuantiti terjual</p>
            </div>
            <button
              onClick={() => setActiveTab('labarugi')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Laporan Lengkap <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.total_qty} slop/unit terjual</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-100 font-mono">{formatRupiah(p.total_sales)}</div>
                  <div className={`text-xs font-semibold font-mono ${p.total_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Laba: {formatRupiah(p.total_profit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white">Pelanggan Terbesar</h3>
              <p className="text-xs text-slate-400">Berdasarkan total volume transaksi</p>
            </div>
            <button
              onClick={() => setActiveTab('master')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Semua ({customerCount}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topCustomers.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/20">
                    {c.code}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.order_count} transaksi</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-amber-400 font-mono">
                    {formatRupiah(c.total_spent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white">Transaksi Nota Terbaru</h3>
            <p className="text-xs text-slate-400">5 transaksi terakhir yang tercatat di sistem</p>
          </div>
          <button
            onClick={() => setActiveTab('riwayat')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            Lihat Semua Transaksi <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">No. Nota</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3 text-right">Total Transaksi</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">
                    {inv.invoice_no}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(inv.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-200">{inv.customer_name}</span>
                    {inv.customer_code && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                        {inv.customer_code}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                    {formatRupiah(inv.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleOpenReceipt(inv.id)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nota</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View/Print Receipt */}
      {selectedInvoice && (
        <ReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
