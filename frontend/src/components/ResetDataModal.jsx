import React, { useState } from 'react';
import { 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  X, 
  Check, 
  Receipt, 
  Boxes, 
  ShieldAlert 
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';

export default function ResetDataModal({ onClose }) {
  const { eventCounter } = useRealtime();

  const [resetType, setResetType] = useState('transactions'); // 'transactions' | 'stocks' | 'all'
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExecuteReset = async (e) => {
    e.preventDefault();

    if (confirmKeyword.trim().toUpperCase() !== 'RESET') {
      setErrorMsg('Ketik kata "RESET" dengan huruf kapital untuk mengonfirmasi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setResultMsg('');

      let endpoint = '';
      if (resetType === 'transactions') endpoint = '/api/admin/reset/transactions';
      else if (resetType === 'stocks') endpoint = '/api/admin/reset/stocks';
      else if (resetType === 'all') endpoint = '/api/admin/reset/all-data';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        setResultMsg(data.message || 'Reset data berhasil diselesaikan.');
        setConfirmKeyword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Gagal melakukan reset.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 to-red-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Reset Sistem & Data</h2>
              <p className="text-xs text-rose-200">Khusus Administrator / Host</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleExecuteReset} className="p-5 sm:p-6 space-y-4">
          
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Perhatian Tindakan Sensitif:</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Tindakan reset ini akan menghapus data riwayat secara permanen. Pastikan Anda telah mengekspor laporan ke Excel jika diperlukan sebelum meriset data.
            </p>
          </div>

          {resultMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{resultMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Reset Options */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pilih Bagian yang Ingin Direset
            </label>
            <div className="space-y-2">
              
              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  resetType === 'transactions'
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reset_type"
                  value="transactions"
                  checked={resetType === 'transactions'}
                  onChange={() => setResetType('transactions')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                    <Receipt className="w-4 h-4 text-rose-600" />
                    <span>Reset Transaksi & Jurnal Nota</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menghapus seluruh riwayat nota penjualan dan jurnal transaksi. Transaksi akan dimulai dari 0 nota. (Stok barang tidak diubah).
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  resetType === 'stocks'
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reset_type"
                  value="stocks"
                  checked={resetType === 'stocks'}
                  onChange={() => setResetType('stocks')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                    <Boxes className="w-4 h-4 text-rose-600" />
                    <span>Reset Stok Semua Produk ke 0</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mengubah sisa stok seluruh 120 produk menjadi 0 dan menghapus seluruh log mutasi stok gudang.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                  resetType === 'all'
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reset_type"
                  value="all"
                  checked={resetType === 'all'}
                  onChange={() => setResetType('all')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Reset Total Sistem (Stok 0 & Transaksi 0)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Membersihkan seluruh transaksi dan mengatur ulang stok semua produk ke 0 secara bersamaan (Master produk & pelanggan tetap aman).
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Keyword Confirmation */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ketik kata <span className="font-mono text-rose-600 font-extrabold">RESET</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              required
              placeholder="Ketik RESET"
              value={confirmKeyword}
              onChange={(e) => { setConfirmKeyword(e.target.value); setErrorMsg(''); }}
              className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-rose-600 focus:bg-white transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmKeyword.trim().toUpperCase() !== 'RESET'}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition disabled:opacity-40"
            >
              {isSubmitting ? 'Memproses Reset...' : 'Eksekusi Reset Sekarang'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
