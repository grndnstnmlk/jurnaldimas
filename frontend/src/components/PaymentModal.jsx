import React, { useState } from 'react';
import { 
  X, 
  Banknote, 
  CreditCard, 
  Clock, 
  Printer, 
  ArrowRight
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
  const [paymentMethod, setPaymentMethod] = useState('TUNAI');
  const [cashReceived, setCashReceived] = useState(totalAmount);
  const [tempoDueDate, setTempoDueDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Pembayaran Kasir</h3>
              <p className="text-xs text-slate-500">
                Pelanggan: <span className="text-emerald-700 font-bold">[{customerCode || '-'}] {customerName || 'Umum'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFinalSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 bg-white">
          
          {/* Total Tagihan Box (Soft Mint Green) */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">TOTAL TAGIHAN BELANJA</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-800 font-mono tracking-tight mt-0.5">
              {formatRupiah(totalAmount)}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              {itemCount} macam produk pesanan
            </div>
          </div>

          {/* Payment Method Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
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
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'TUNAI' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={cashReceived}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full bg-white text-slate-800 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xl font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              {/* Quick Cash Options */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickCashOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashReceived(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                      cashReceived === opt.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {opt.label === 'Uang Pas' ? 'Uang Pas' : formatRupiah(opt.value)}
                  </button>
                ))}
              </div>

              {/* Kembalian Box */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Uang Kembalian:</span>
                <span className={`text-xl font-extrabold font-mono ${changeAmount > 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {formatRupiah(changeAmount)}
                </span>
              </div>

              {isCashInsufficient && (
                <div className="text-xs text-rose-700 font-bold text-center">
                  ⚠️ Uang diterima kurang dari total tagihan!
                </div>
              )}
            </div>
          )}

          {/* Tempo Section */}
          {paymentMethod === 'TEMPO' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Jatuh Tempo Pembayaran
                </label>
                <input
                  type="date"
                  value={tempoDueDate}
                  onChange={(e) => setTempoDueDate(e.target.value)}
                  className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Catatan Nota (Opsional)
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Contoh: Titip toko / Sales Dimas"
              className="w-full bg-white text-slate-800 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing || isCashInsufficient}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition disabled:opacity-40"
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
