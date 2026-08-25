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
  X,
  Trash2,
  Edit,
  RotateCcw,
  Package,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function StockOpname() {
  const { eventCounter } = useRealtime();
  const [stocks, setStocks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory' | 'logs'

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
  const [restockNotes, setRestockNotes] = useState('');

  // Adjustment / Edit Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustNewStock, setAdjustNewStock] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Clear All Modal
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllConfirmText, setClearAllConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Open Restock Modal
  const handleOpenRestock = (productId = '') => {
    setRestockProductId(productId ? String(productId) : '');
    setRestockQty('');
    setRestockDate(new Date().toISOString().split('T')[0]);
    setRestockNotes('');
    setShowRestockModal(true);
  };

  // Open Adjust Modal
  const handleOpenAdjust = (product = null) => {
    if (product) {
      setAdjustProductId(String(product.product_id));
      setAdjustNewStock(String(product.stok_akhir));
      setAdjustNotes('Penyesuaian stok fisik');
    } else {
      setAdjustProductId('');
      setAdjustNewStock('');
      setAdjustNotes('');
    }
    setShowAdjustModal(true);
  };

  // Handle Quick Empty Single Product Stock
  const handleQuickEmptyStock = async (product) => {
    const confirmMessage = `Kosongkan stok untuk produk "${product.product_name}"?\nStok saat ini (${product.stok_akhir} Slop) akan diubah menjadi 0.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch('/api/stocks/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.product_id,
          new_actual_stock: 0,
          notes: 'Kosongkan Stok (0)'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchStocks();
        fetchLogs();
      } else {
        alert(data.error || 'Gagal mengosongkan stok');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Restock Submit
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProductId || !restockQty || Number(restockQty) <= 0) {
      alert('Pilih produk dan masukkan kuantiti masuk yang valid!');
      return;
    }

    try {
      setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Adjust Submit
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProductId || adjustNewStock === '') {
      alert('Pilih produk dan masukkan jumlah stok yang valid!');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch('/api/stocks/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(adjustProductId),
          new_actual_stock: Math.max(0, Number(adjustNewStock)),
          notes: adjustNotes || 'Penyesuaian stok fisik'
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
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Clear All Stock Submit
  const handleClearAllSubmit = async (e) => {
    e.preventDefault();
    if (clearAllConfirmText.trim().toUpperCase() !== 'KOSONGKAN') {
      alert('Ketik kata "KOSONGKAN" dengan benar untuk mengonfirmasi tindakan ini.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch('/api/stocks/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Reset / Kosongkan Seluruh Stok Gudang'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowClearAllModal(false);
        setClearAllConfirmText('');
        fetchStocks();
        fetchLogs();
        alert('Seluruh stok produk telah berhasil dikosongkan!');
      } else {
        alert(data.error || 'Gagal mengosongkan seluruh stok');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredStocks = stocks.filter((s) => {
    const matchSearch = s.product_name.toLowerCase().includes(search.toLowerCase());
    const matchLow = filterLowStock ? s.stok_akhir <= 5 : true;
    return matchSearch && matchLow;
  });

  const filteredLogs = logs.filter((l) => {
    return l.product_name.toLowerCase().includes(search.toLowerCase()) || 
           (l.notes && l.notes.toLowerCase().includes(search.toLowerCase()));
  });

  const totalStokAkhirAll = stocks.reduce((acc, s) => acc + s.stok_akhir, 0);
  const totalStokInAll = stocks.reduce((acc, s) => acc + s.stok_in, 0);
  const totalStokOutAll = stocks.reduce((acc, s) => acc + s.stok_out, 0);

  const selectedAdjustProduct = stocks.find(s => String(s.product_id) === String(adjustProductId));
  const adjustDiff = selectedAdjustProduct && adjustNewStock !== '' ? Number(adjustNewStock) - selectedAdjustProduct.stok_akhir : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Stock Opname & Manajemen Gudang</h1>
          <p className="text-xs text-slate-500">Monitoring stok fisik, edit penyesuaian, barang masuk, dan kosongkan stok</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setClearAllConfirmText('');
              setShowClearAllModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1.5 shadow-2xs"
            title="Kosongkan seluruh stok produk gudang sekaligus"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Kosongkan Semua Stok</span>
          </button>
          <button
            onClick={() => handleOpenAdjust()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Edit / Opname Stok</span>
          </button>
          <button
            onClick={() => handleOpenRestock()}
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
          <div className="text-[11px] text-slate-400 mt-0.5">Sisa seluruh {stocks.length} produk</div>
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

      {/* Navigation Sub-Tabs & Filter Bar */}
      <div className="fintech-card p-3.5 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'inventory'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Daftar Stok Fisik ({stocks.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Mutasi & Opname</span>
            </button>
          </div>

          {activeSubTab === 'inventory' && (
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                filterLowStock
                  ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hanya Stok Menipis (≤ 5)</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'inventory' ? "Cari nama produk di gudang..." : "Cari riwayat mutasi / catatan..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* TAB 1: Stock Inventory Table */}
      {activeSubTab === 'inventory' && (
        <div className="fintech-card rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-3 py-3 text-center">Awal</th>
                  <th className="px-3 py-3 text-center text-blue-600">Masuk</th>
                  <th className="px-3 py-3 text-center text-amber-600">Keluar</th>
                  <th className="px-4 py-3 text-center font-black">Sisa Akhir</th>
                  <th className="px-4 py-3 text-center">Aksi Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 font-sans text-xs">
                      Tidak ada data produk yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((s) => {
                    const isLow = s.stok_akhir <= 5;
                    const isEmpty = s.stok_akhir === 0;
                    return (
                      <tr key={s.id || s.product_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{s.product_name}</span>
                            {isEmpty ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Habis (0)
                              </span>
                            ) : isLow ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                Menipis
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400">{s.stok_awal}</td>
                        <td className="px-3 py-3 text-center text-blue-600 font-bold">+{s.stok_in}</td>
                        <td className="px-3 py-3 text-center text-amber-600 font-bold">-{s.stok_out}</td>
                        <td className={`px-4 py-3 text-center font-black text-sm ${isEmpty ? 'text-slate-400' : isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {s.stok_akhir} Slop
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* + Masuk Button */}
                            <button
                              onClick={() => handleOpenRestock(s.product_id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 text-xs font-bold transition flex items-center gap-1"
                              title="Tambah stok masuk / kulakan"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Masuk</span>
                            </button>

                            {/* Edit Stok Button */}
                            <button
                              onClick={() => handleOpenAdjust(s)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold transition flex items-center gap-1"
                              title="Edit / Penyesuaian stok riil"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Kosongkan Button */}
                            <button
                              onClick={() => handleQuickEmptyStock(s)}
                              disabled={s.stok_akhir === 0}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                s.stok_akhir === 0
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                  : 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700'
                              }`}
                              title="Kosongkan stok produk ini (set ke 0)"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Kosongkan</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Stock Logs & History */}
      {activeSubTab === 'logs' && (
        <div className="fintech-card rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3 text-center">Tipe Mutasi</th>
                  <th className="px-4 py-3 text-center">Perubahan Qty</th>
                  <th className="px-4 py-3">Catatan / Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 font-sans text-xs">
                      Belum ada riwayat mutasi stok tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isPositive = log.qty > 0;
                    const badgeClass = 
                      log.type === 'IN' 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : log.type === 'OUT' 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : log.type === 'RESET'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-purple-50 text-purple-700 border-purple-100';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-500 font-sans text-xs">
                          {formatDate(log.date)}
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">
                          {log.product_name}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeClass}`}>
                            {log.type === 'IN' ? 'Barang Masuk' : log.type === 'OUT' ? 'Terjual' : log.type === 'RESET' ? 'Reset 0' : 'Penyesuaian'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center font-black ${isPositive ? 'text-blue-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${log.qty}` : log.qty} Slop
                        </td>
                        <td className="px-4 py-3 font-sans text-xs text-slate-600">
                          {log.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <span>Input Barang Masuk (Restock)</span>
              </h3>
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
                      {s.product_name} (Sisa Saat Ini: {s.stok_akhir} Slop)
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Masuk</label>
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
                  placeholder="Contoh: Pengiriman Pabrik / Kulakan Baru"
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
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Menyimpan...' : 'Simpan Stok Masuk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust / Edit Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                  <span>Edit / Penyesuaian Stok Fisik</span>
                </h3>
                <p className="text-[11px] text-slate-500">Koreksi langsung jumlah stok atau kosongkan stok</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Produk</label>
                <select
                  required
                  value={adjustProductId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setAdjustProductId(pid);
                    const sel = stocks.find(s => String(s.product_id) === pid);
                    if (sel) {
                      setAdjustNewStock(String(sel.stok_akhir));
                    }
                  }}
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="">-- Pilih Produk --</option>
                  {stocks.map((s) => (
                    <option key={s.product_id} value={s.product_id}>
                      {s.product_name} (Sistem: {s.stok_akhir} Slop)
                    </option>
                  ))}
                </select>
              </div>

              {selectedAdjustProduct && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Stok Sistem Saat Ini:</span>
                    <div className="text-base font-black text-slate-800 font-mono">
                      {selectedAdjustProduct.stok_akhir} Slop
                    </div>
                  </div>
                  {adjustNewStock !== '' && (
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Selisih:</span>
                      <div className={`text-base font-black font-mono ${adjustDiff > 0 ? 'text-emerald-600' : adjustDiff < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {adjustDiff > 0 ? `+${adjustDiff}` : adjustDiff} Slop
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">Jumlah Stok Baru (Slop)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustNewStock('0');
                      setAdjustNotes('Kosongkan Stok (0)');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Set ke 0 (Kosongkan)</span>
                  </button>
                </div>
                
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-base font-mono font-black focus:outline-none focus:border-emerald-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[0, 1, 5, 10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustNewStock(String(val))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold font-mono text-slate-700 transition"
                    >
                      {val === 0 ? '0 (Nol)' : `${val}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Selisih hitung fisik bulanan / Stok habis"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Hitung Fisik Gudang', 'Stok Kosong / Habis', 'Barang Rusak', 'Koreksi Data'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAdjustNotes(tag)}
                      className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] text-slate-600 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
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
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Menyimpan...' : 'Update Stok'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Stocks Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">Kosongkan Semua Stok</h3>
              </div>
              <button onClick={() => setShowClearAllModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <p className="font-bold">⚠️ Perhatian: Tindakan ini tidak dapat dibatalkan!</p>
              <p className="text-[11px] leading-relaxed">
                Seluruh {stocks.length} produk di gudang akan diatur sisa stoknya menjadi <strong>0 Slop</strong>. Riwayat mutasi tetap akan tercatat di log sistem.
              </p>
            </div>

            <form onSubmit={handleClearAllSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ketik kata <span className="font-mono text-rose-600 font-black">KOSONGKAN</span> untuk melanjutkan:
                </label>
                <input
                  type="text"
                  required
                  value={clearAllConfirmText}
                  onChange={(e) => setClearAllConfirmText(e.target.value)}
                  placeholder="Ketik KOSONGKAN"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs font-mono font-bold uppercase focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || clearAllConfirmText.trim().toUpperCase() !== 'KOSONGKAN'}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                    clearAllConfirmText.trim().toUpperCase() === 'KOSONGKAN'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Memproses...' : 'Ya, Kosongkan Semua'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
