import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  DollarSign, 
  CreditCard, 
  Clock, 
  Printer, 
  MessageCircle, 
  ArrowRight,
  Banknote,
  Coins
} from 'lucide-react';
import { formatRupiah } from '../utils/format';

export default function PaymentModal({ 
  totalAmount, 
  customerName, 
  customerCode, 
  itemCount,
  onConfirm, 
  onClose,
  isProcessing 
}) {
  const [paymentMethod, setPaymentMethod] = useState('TUNAI'); // 'TUNAI', 'TRANSFER', 'TEMPO'
  const [cashReceived, setCashReceived] = useState(totalAmount);
  const [tempoDueDate, setTempoDueDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Pre-calculated quick cash amounts
  const quickCashOptions = [
    { label: 'Uang Pas', value: totalAmount },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
    { label: '200.000', value: 200000 },
    { label: '500.000', value: 500000 },
    { label: '1.000.000', value: 1000000 },
    { label: '2.000.000', value: 2000000 },
    { label: '5.000.000', value: 5000000 },
  ].filter(opt => opt.value >= totalAmount || opt.label === 'Uang Pas');

  const changeAmount = Math.max(0, cashReceived - totalAmount);
  const isCashInsufficient = paymentMethod === 'TUNAI' && cashReceived < totalAmount;

  const handleSelectQuickCash = (val) => {
    setCashReceived(val);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (isCashInsufficient) return;
    onConfirm({
      paymentMethod,
      cashReceived: paymentMethod === 'TUNAI' ? cashReceived : totalAmount,
      changeAmount: paymentMethod === 'TUNAI' ? changeAmount : 0,
      tempoDueDate,
      notes: paymentNotes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Pembayaran & Cetak Nota</h3>
              <p className="text-xs text-slate-400">
                Pelanggan: <span className="text-amber-400 font-bold">[{customerCode || '-'}] {customerName || 'Umum'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFinalSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Total Tagihan Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL TAGIHAN BELANJA</span>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight mt-1">
              {formatRupiah(totalAmount)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {itemCount} macam barang pesanan
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'TUNAI', label: 'Tunai (Cash)', icon: Banknote },
                { id: 'TRANSFER', label: 'Transfer Bank', icon: CreditCard },
                { id: 'TEMPO', label: 'Tempo / Hutang', icon: Clock }
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition border ${
                      active 
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' 
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH PAYMENT SECTION */}
          {paymentMethod === 'TUNAI' && (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    autoFocus
                    value={cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full bg-slate-900 text-white pl-4 pr-4 py-3 rounded-xl border border-slate-700 font-mono text-xl font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickCashOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuickCash(opt.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                      cashReceived === opt.value
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {opt.label === 'Uang Pas' ? 'Uang Pas' : formatRupiah(opt.value)}
                  </button>
                ))}
              </div>

              {/* Kembalian Box */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Uang Kembalian:</span>
                <span className={`text-xl font-black font-mono ${changeAmount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {formatRupiah(changeAmount)}
                </span>
              </div>

              {isCashInsufficient && (
                <div className="text-xs text-rose-400 font-bold text-center">
                  ⚠️ Uang diterima kurang dari total tagihan!
                </div>
              )}
            </div>
          )}

          {/* TEMPO / HUTANG SECTION */}
          {paymentMethod === 'TEMPO' && (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Jatuh Tempo Pembayaran
                </label>
                <input
                  type="date"
                  value={tempoDueDate}
                  onChange={(e) => setTempoDueDate(e.target.value)}
                  className="w-full bg-slate-900 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Catatan Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Keterangan / Catatan Nota (Opsional)
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Contoh: Titip di toko / Sales Dimas"
              className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing || isCashInsufficient}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 flex items-center gap-2 transition disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses...' : 'Selesaikan Transaksi (F9)'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
