import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Search, 
  DollarSign, 
  Package, 
  Users, 
  Percent,
  ChevronDown
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function LabaRugi() {
  const { eventCounter } = useRealtime();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [activeTab, setActiveTab] = useState('product'); // 'product' or 'customer'

  useEffect(() => {
    fetchReport();
  }, [eventCounter, startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetch(`/api/reports/laba-rugi?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Error fetching P&L report:', e);
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (range) => {
    const today = new Date().toISOString().split('T')[0];
    if (range === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (range === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (range === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Menghitung laporan laba rugi real-time...</p>
      </div>
    );
  }

  const summary = data?.summary || { total_qty: 0, total_modal: 0, total_jual: 0, total_laba: 0, margin_pct: 0 };
  const perProduct = data?.perProduct || [];
  const perCustomer = data?.perCustomer || [];

  const filteredProducts = perProduct.filter((p) =>
    p.product_name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Laporan Laba - Rugi (P&L)</h1>
          <p className="text-sm text-slate-400">Analisis menyeluruh omset, modal pokok (HPP), laba kotor, dan margin keuntungan</p>
        </div>
        <a
          href="/api/export/excel"
          download="JURNAL_KEUANGAN_MASTER_CIGARETTES.xlsx"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition self-start"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Format Excel</span>
        </a>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Periode:</span>
          <button
            onClick={() => setQuickRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !startDate && !endDate ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Semua Data
          </button>
          <button
            onClick={() => setQuickRange('today')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
          >
            Hari Ini
          </button>
          <button
            onClick={() => setQuickRange('month')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
          >
            Bulan Ini
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
          />
          <span className="text-slate-500 text-xs">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Penjualan (Jual)</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {formatRupiah(summary.total_jual)}
          </div>
          <div className="text-xs text-slate-400 mt-2">{summary.total_qty} slop/unit terjual</div>
        </div>

        {/* Total Modal (HPP) */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Modal (HPP)</div>
          <div className="text-2xl font-black text-slate-200 font-mono mt-1">
            {formatRupiah(summary.total_modal)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Beban pokok pengadaan</div>
        </div>

        {/* Total Laba Bersih */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Laba Bersih</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatRupiah(summary.total_laba)}
          </div>
          <div className="text-xs text-emerald-400 mt-2">Selisih Penjualan - Modal</div>
        </div>

        {/* Margin % */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-indigo-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Margin Keuntungan</div>
          <div className="text-2xl font-black text-indigo-300 font-mono mt-1">
            {summary.margin_pct}%
          </div>
          <div className="text-xs text-slate-400 mt-2">Laba / Omset rasio</div>
        </div>

      </div>

      {/* Switch Tab (Per Produk vs Per Pelanggan) */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'product'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Rincian Laba Per Produk ({perProduct.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'customer'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rincian Laba Per Pelanggan ({perCustomer.length})</span>
        </button>
      </div>

      {/* PRODUCT BREAKDOWN TAB */}
      {activeTab === 'product' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk pada laporan..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3 text-center">Qty Terjual</th>
                    <th className="px-4 py-3 text-right">Modal Satuan</th>
                    <th className="px-4 py-3 text-right">Total Modal (HPP)</th>
                    <th className="px-4 py-3 text-right">Total Jual (Omset)</th>
                    <th className="px-4 py-3 text-right">Laba / Rugi</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredProducts.map((p) => (
                    <tr key={p.product_id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-sans font-bold text-slate-200">
                        {p.product_name}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">
                        {p.total_qty}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {formatRupiah(p.unit_modal)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {formatRupiah(p.total_modal)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-400">
                        {formatRupiah(p.total_jual)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        p.total_laba >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatRupiah(p.total_laba)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-300">
                        {p.margin_pct}%
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 font-sans">
                        Tidak ada data penjualan pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER BREAKDOWN TAB */}
      {activeTab === 'customer' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Pelanggan</th>
                  <th className="px-4 py-3 text-center">Jumlah Transaksi</th>
                  <th className="px-4 py-3 text-center">Total Qty</th>
                  <th className="px-4 py-3 text-right">Total Modal (HPP)</th>
                  <th className="px-4 py-3 text-right">Total Pembelian</th>
                  <th className="px-4 py-3 text-right">Laba Dari Pelanggan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {perCustomer.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-amber-400">{c.customer_code}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-200">{c.customer_name}</td>
                    <td className="px-4 py-3 text-center">{c.invoice_count}</td>
                    <td className="px-4 py-3 text-center">{c.total_qty}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{formatRupiah(c.total_modal)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">{formatRupiah(c.total_jual)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatRupiah(c.total_laba)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
