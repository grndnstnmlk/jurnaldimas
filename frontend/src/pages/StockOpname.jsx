import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  SlidersHorizontal,
  History,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function StockOpname() {
  const { eventCounter } = useRealtime();
  const [stocks, setStocks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory' or 'logs'

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
  const [restockNotes, setRestockNotes] = useState('');

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustNewStock, setAdjustNewStock] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    fetchStocks();
    fetchLogs();
  }, [eventCounter]);

  const fetchStocks = async () => {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      setStocks(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/stocks/logs');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProductId || !restockQty) return;

    try {
      const res = await fetch('/api/stocks/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(restockProductId),
          qty: Number(restockQty),
          date: restockDate,
          notes: restockNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowRestockModal(false);
        setRestockProductId('');
        setRestockQty('');
        setRestockNotes('');
        fetchStocks();
        fetchLogs();
      } else {
        alert(data.error || 'Gagal menyimpan barang masuk');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProductId || adjustNewStock === '') return;

    try {
      const res = await fetch('/api/stocks/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(adjustProductId),
          new_actual_stock: Number(adjustNewStock),
          notes: adjustNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAdjustModal(false);
        setAdjustProductId('');
        setAdjustNewStock('');
        setAdjustNotes('');
        fetchStocks();
        fetchLogs();
      } else {
        alert(data.error || 'Gagal menyimpan penyesuaian stok');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredStocks = stocks.filter((s) => {
    const matchSearch = s.product_name.toLowerCase().includes(search.toLowerCase());
    const matchLow = filterLowStock ? s.stok_akhir <= 5 : true;
    return matchSearch && matchLow;
  });

  const totalStokAkhirAll = stocks.reduce((acc, s) => acc + s.stok_akhir, 0);
  const totalStokInAll = stocks.reduce((acc, s) => acc + s.stok_in, 0);
  const totalStokOutAll = stocks.reduce((acc, s) => acc + s.stok_out, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Stock Opname & Gudang</h1>
          <p className="text-sm text-slate-400">Monitoring stok awal, barang masuk, barang keluar, dan sisa akhir fisik</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Penyesuaian Fisik</span>
          </button>
          <button
            onClick={() => setShowRestockModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Input Barang Masuk</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Stok Fisik Saat Ini</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{totalStokAkhirAll} unit</div>
          <div className="text-xs text-emerald-400 mt-1">Sisa di semua produk</div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-blue-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Barang Masuk (Restock)</div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">{totalStokInAll} unit</div>
          <div className="text-xs text-slate-400 mt-1">Akumulasi pengadaan</div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500">
          <div className="text-slate-400 text-xs font-semibold uppercase">Total Barang Keluar (Terjual)</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{totalStokOutAll} unit</div>
          <div className="text-xs text-slate-400 mt-1">Melalui nota penjualan</div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeSubTab === 'inventory'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Tabel Stok Produk ({stocks.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeSubTab === 'logs'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Mutasi Stok ({logs.length})</span>
        </button>
      </div>

      {/* INVENTORY TAB */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
                filterLowStock
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Hanya Stok Menipis (≤ 5)</span>
            </button>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3 text-center">Stok Awal</th>
                    <th className="px-4 py-3 text-center text-blue-400">Masuk (In)</th>
                    <th className="px-4 py-3 text-center text-amber-400">Keluar (Out)</th>
                    <th className="px-4 py-3 text-center">Stok Akhir</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredStocks.map((s) => {
                    const isLow = s.stok_akhir <= 5;
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-sans font-bold text-slate-200">
                          {s.product_name}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400">
                          {s.stok_awal}
                        </td>
                        <td className="px-4 py-3 text-center text-blue-400 font-semibold">
                          +{s.stok_in}
                        </td>
                        <td className="px-4 py-3 text-center text-amber-400 font-semibold">
                          -{s.stok_out}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-base text-slate-100">
                          {s.stok_akhir}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Stok Menipis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <button
                            onClick={() => {
                              setRestockProductId(s.product_id);
                              setShowRestockModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-semibold transition"
                          >
                            + Masuk
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeSubTab === 'logs' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-center">Tipe Mutasi</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition text-xs">
                    <td className="px-4 py-3 text-slate-400">{formatDate(log.date)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{log.product_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.type === 'IN' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : log.type === 'OUT'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {log.type === 'IN' ? `+${log.qty}` : log.type === 'OUT' ? `-${log.qty}` : log.qty}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                <span>Input Barang Masuk (Restock)</span>
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Produk</label>
                <select
                  required
                  value={restockProductId}
                  onChange={(e) => setRestockProductId(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Produk --</option>
                  {stocks.map((s) => (
                    <option key={s.product_id} value={s.product_id}>
                      {s.product_name} (Sisa: {s.stok_akhir})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Jumlah Masuk (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={restockDate}
                    onChange={(e) => setRestockDate(e.target.value)}
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Keterangan / Supplier (Opsional)</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Pembelian dari Pabrik / Agen"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
                >
                  Simpan Stok Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <span>Penyesuaian Fisik Stok (Opname)</span>
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Pilih Produk</label>
                <select
                  required
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Produk --</option>
                  {stocks.map((s) => (
                    <option key={s.product_id} value={s.product_id}>
                      {s.product_name} (Sistem: {s.stok_akhir})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Jumlah Fisik Aktual (Stok Riil)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(e.target.value)}
                  placeholder="Masukkan jumlah fisik di gudang saat ini"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Selisih hitung fisik bulanan / rusak"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  Update Stok Riil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
