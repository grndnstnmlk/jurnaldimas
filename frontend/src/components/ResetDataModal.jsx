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
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto">
        
        {/* Header - Fixed & Visible */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Reset Sistem & Data</h2>
              <p className="text-xs text-rose-100 font-medium">Khusus Host Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleExecuteReset} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 leading-relaxed font-medium">
              <p className="font-bold mb-0.5">Tindakan ini permanen!</p>
              Pilih opsi data yang ingin Anda hapus atau kosongkan kembali dari awal.
            </div>
          </div>

          {/* Reset Options */}
          <div className="space-y-2.5">
            
            {/* Option 1: Transactions */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                resetType === 'transactions'
                  ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="resetType"
                value="transactions"
                checked={resetType === 'transactions'}
                onChange={() => setResetType('transactions')}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>Reset Seluruh Transaksi & Nota ke 0</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight font-medium">
                  Menghapus semua riwayat nota penjualan dan mengembalikan jurnal keuangan ke kondisi 0. (Stok barang & master produk tidak berubah).
                </p>
              </div>
            </label>

            {/* Option 2: Stocks */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                resetType === 'stocks'
                  ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="resetType"
                value="stocks"
                checked={resetType === 'stocks'}
                onChange={() => setResetType('stocks')}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                  <Boxes className="w-4 h-4 text-rose-600" />
                  <span>Reset Stok Semua Produk ke 0</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight font-medium">
                  Mengubah sisa stok seluruh 120 produk menjadi 0 dan menghapus seluruh log mutasi stok gudang.
                </p>
              </div>
            </label>

            {/* Option 3: All */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                resetType === 'all'
                  ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="resetType"
                value="all"
                checked={resetType === 'all'}
                onChange={() => setResetType('all')}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-rose-700">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Reset Total Sistem (Stok 0 & Transaksi 0)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight font-medium">
                  Membersihkan seluruh transaksi dan mengatur ulang stok semua produk ke 0 secara bersamaan (Master produk & pelanggan tetap aman).
                </p>
              </div>
            </label>
          </div>

          {/* Keyword Confirmation Input */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Ketik kata <span className="text-rose-600 font-extrabold font-mono">RESET</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              required
              value={confirmKeyword}
              onChange={(e) => {
                setConfirmKeyword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Ketik RESET"
              className="w-full bg-slate-50 text-slate-900 px-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 font-bold"
            />
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-2xl border border-rose-200 font-bold">
              {errorMsg}
            </div>
          )}

          {resultMsg && (
            <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmKeyword.trim().toUpperCase() !== 'RESET'}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengeksekusi...' : 'Eksekusi Reset Sekarang'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
