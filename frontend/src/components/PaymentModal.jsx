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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#ffffff] rounded-[26px] border border-[#0f0f0f] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#0f0f0f]/10 flex items-center justify-between bg-[#ecefec]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#0f0f0f] text-[#ffffff] flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0f0f0f] text-base">Pembayaran Kasir</h3>
              <p className="text-xs text-[#5a585a]">
                Pelanggan: <span className="text-[#0f0f0f] font-bold">[{customerCode || '-'}] {customerName || 'Umum'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-[#0f0f0f] hover:bg-[#ffffff] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFinalSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#f9faf9]">
          
          {/* Confetti Yellow Total Box */}
          <div className="p-5 rounded-[17.5px] bg-[#fcea59] border border-[#0f0f0f] text-center">
            <span className="text-xs font-bold text-[#0f0f0f] uppercase tracking-wider">TOTAL TAGIHAN BELANJA</span>
            <div className="text-3xl sm:text-4xl font-black text-[#0f0f0f] font-mono tracking-tight mt-0.5">
              {formatRupiah(totalAmount)}
            </div>
            <div className="text-xs text-[#5a585a] mt-1 font-medium">
              {itemCount} macam produk pesanan
            </div>
          </div>

          {/* Payment Method Pills */}
          <div>
            <label className="block text-xs font-bold text-[#0f0f0f] uppercase tracking-wider mb-2">
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
                    className={`py-3 px-2 rounded-[17.5px] text-xs font-bold flex flex-col items-center gap-1.5 transition border ${
                      active 
                        ? 'bg-[#0f0f0f] text-[#ffffff] border-[#0f0f0f]' 
                        : 'bg-[#ffffff] text-[#0f0f0f] border-[#0f0f0f]/30 hover:border-[#0f0f0f]'
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
            <div className="space-y-3 bg-[#ffffff] p-4 rounded-[17.5px] border border-[#0f0f0f]/30">
              <div>
                <label className="block text-xs font-bold text-[#0f0f0f] uppercase tracking-wider mb-1">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={cashReceived}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full bg-[#eeeeee] text-[#0f0f0f] px-4 py-2.5 rounded-[35px] border border-[#0f0f0f] font-mono text-xl font-bold focus:outline-none"
                />
              </div>

              {/* Quick Cash Options */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickCashOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashReceived(opt.value)}
                    className={`px-3 py-1.5 rounded-[35px] text-xs font-mono font-bold transition border ${
                      cashReceived === opt.value
                        ? 'bg-[#05c92f] text-[#0f0f0f] border-[#0f0f0f]'
                        : 'bg-[#ffffff] text-[#0f0f0f] hover:bg-[#ecefec] border-[#0f0f0f]/30'
                    }`}
                  >
                    {opt.label === 'Uang Pas' ? 'Uang Pas' : formatRupiah(opt.value)}
                  </button>
                ))}
              </div>

              {/* Kembalian Box */}
              <div className="pt-2 border-t border-[#0f0f0f]/10 flex items-center justify-between">
                <span className="text-xs font-bold text-[#5a585a] uppercase">Uang Kembalian:</span>
                <span className={`text-xl font-black font-mono ${changeAmount > 0 ? 'text-[#05c92f]' : 'text-[#0f0f0f]'}`}>
                  {formatRupiah(changeAmount)}
                </span>
              </div>

              {isCashInsufficient && (
                <div className="text-xs text-rose-600 font-bold text-center">
                  ⚠️ Uang diterima kurang dari total tagihan!
                </div>
              )}
            </div>
          )}

          {/* Tempo Section */}
          {paymentMethod === 'TEMPO' && (
            <div className="space-y-3 bg-[#ffffff] p-4 rounded-[17.5px] border border-[#0f0f0f]/30">
              <div>
                <label className="block text-xs font-bold text-[#0f0f0f] uppercase tracking-wider mb-1">
                  Jatuh Tempo Pembayaran
                </label>
                <input
                  type="date"
                  value={tempoDueDate}
                  onChange={(e) => setTempoDueDate(e.target.value)}
                  className="w-full bg-[#eeeeee] text-[#0f0f0f] px-3.5 py-2.5 rounded-[35px] border border-[#0f0f0f] text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#0f0f0f] uppercase tracking-wider mb-1">
              Catatan Nota (Opsional)
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Contoh: Titip toko / Sales Dimas"
              className="w-full bg-[#ffffff] text-[#0f0f0f] px-4 py-2.5 rounded-[35px] border border-[#0f0f0f] text-xs focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#0f0f0f]/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[35px] text-xs font-bold text-[#5a585a] hover:text-[#0f0f0f]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing || isCashInsufficient}
              className="ctrl-btn-lime flex items-center gap-2 disabled:opacity-40"
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
