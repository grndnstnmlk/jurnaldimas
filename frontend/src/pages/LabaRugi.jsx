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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [activeTab, setActiveTab] = useState('product');

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

  const summary = data?.summary || { total_qty: 0, total_modal: 0, total_jual: 0, total_laba: 0, margin_pct: 0 };
  const perProduct = data?.perProduct || [];
  const perCustomer = data?.perCustomer || [];

  const filteredProducts = perProduct.filter((p) =>
    p.product_name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Laporan Laba - Rugi</h1>
          <p className="text-xs text-slate-500">Perhitungan omset, modal HPP, laba kotor, dan margin penjualan</p>
        </div>
        <a
          href="/api/export/excel"
          download="JURNAL_KEUANGAN_MASTER_CIGARETTES.xlsx"
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition self-start"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Format Excel</span>
        </a>
      </div>

      {/* Date Filter Bar */}
      <div className="fintech-card p-3.5 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setQuickRange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              !startDate && !endDate ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Data
          </button>
          <button
            onClick={() => setQuickRange('today')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
          >
            Hari Ini
          </button>
          <button
            onClick={() => setQuickRange('month')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
          >
            Bulan Ini
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
          <span className="text-slate-400 text-xs">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="fintech-card p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Penjualan (Jual)</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">{formatRupiah(summary.total_jual)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{summary.total_qty} Slop terjual</div>
        </div>

        <div className="fintech-card p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Modal (HPP)</span>
          <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{formatRupiah(summary.total_modal)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Beban pokok pembelian</div>
        </div>

        <div className="fintech-card p-4 bg-white border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Laba Bersih</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">{formatRupiah(summary.total_laba)}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Laba = Jual - Modal</div>
        </div>

        <div className="fintech-card p-4 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Margin Keuntungan</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{summary.margin_pct}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Rasio laba terhadap omset</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('product')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'product' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Laba Per Produk ({perProduct.length})
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'customer' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Laba Per Pelanggan ({perCustomer.length})
        </button>
      </div>

      {/* Table Breakdown */}
      <div className="fintech-card rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-4 py-3">Nama {activeTab === 'product' ? 'Produk' : 'Pelanggan'}</th>
                <th className="px-4 py-3 text-center">Terjual</th>
                <th className="px-4 py-3 text-right">Modal (HPP)</th>
                <th className="px-4 py-3 text-right">Penjualan</th>
                <th className="px-4 py-3 text-right font-black text-emerald-600">Laba Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {activeTab === 'product' ? (
                filteredProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-sans font-bold text-slate-900">{p.product_name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{p.total_qty}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatRupiah(p.total_modal)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatRupiah(p.total_jual)}</td>
                    <td className={`px-4 py-3 text-right font-black ${p.total_laba >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(p.total_laba)}
                    </td>
                  </tr>
                ))
              ) : (
                perCustomer.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-sans font-bold text-slate-900">
                      <span className="text-emerald-700 font-mono font-bold mr-1.5">[{c.customer_code}]</span>
                      {c.customer_name}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{c.total_qty}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatRupiah(c.total_modal)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatRupiah(c.total_jual)}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{formatRupiah(c.total_laba)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
