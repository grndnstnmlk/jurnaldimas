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
  const [activeSubTab, setActiveSubTab] = useState('inventory');

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Stock Opname & Gudang</h1>
          <p className="text-xs text-slate-500">Monitoring stok fisik, barang masuk, dan sisa gudang</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Opname Fisik</span>
          </button>
          <button
            onClick={() => setShowRestockModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Barang Masuk</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="fintech-card p-4 bg-white">
          <div className="text-slate-500 text-xs font-bold uppercase">Total Sisa Stok Fisik</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">{totalStokAkhirAll} Slop</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sisa seluruh 120 produk</div>
        </div>
        <div className="fintech-card p-4 bg-white">
          <div className="text-slate-500 text-xs font-bold uppercase">Total Masuk (Restock)</div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-0.5">{totalStokInAll} Slop</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi pengadaan</div>
        </div>
        <div className="fintech-card p-4 bg-white">
          <div className="text-slate-500 text-xs font-bold uppercase">Total Keluar (Terjual)</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">{totalStokOutAll} Slop</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Otomatis terpotong nota</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="fintech-card p-3.5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk di stok gudang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
            filterLowStock
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Hanya Stok Menipis (≤ 5)</span>
        </button>
      </div>

      {/* Stock Table */}
      <div className="fintech-card rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3 text-center">Awal</th>
                <th className="px-4 py-3 text-center text-blue-600">Masuk</th>
                <th className="px-4 py-3 text-center text-amber-600">Keluar</th>
                <th className="px-4 py-3 text-center font-black">Sisa Akhir</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredStocks.map((s) => {
                const isLow = s.stok_akhir <= 5;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-sans font-bold text-slate-900">
                      {s.product_name}
                      {isLow && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          Menipis
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">{s.stok_awal}</td>
                    <td className="px-4 py-3 text-center text-blue-600 font-bold">+{s.stok_in}</td>
                    <td className="px-4 py-3 text-center text-amber-600 font-bold">-{s.stok_out}</td>
                    <td className="px-4 py-3 text-center font-black text-sm text-emerald-600">{s.stok_akhir}</td>
                    <td className="px-4 py-3 text-center font-sans">
                      <button
                        onClick={() => {
                          setRestockProductId(s.product_id);
                          setShowRestockModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 text-xs font-bold transition"
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

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Input Barang Masuk (Restock)</h3>
              <button onClick={() => setShowRestockModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Produk</label>
                <select
                  required
                  value={restockProductId}
                  onChange={(e) => setRestockProductId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Masuk (Slop)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    placeholder="Contoh: 20"
                    className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={restockDate}
                    onChange={(e) => setRestockDate(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Keterangan / Supplier</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Pengiriman Pabrik"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Penyesuaian Fisik Stok</h3>
              <button onClick={() => setShowAdjustModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Produk</label>
                <select
                  required
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Fisik Riil di Gudang</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Selisih hitung fisik bulanan"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20"
                >
                  Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
