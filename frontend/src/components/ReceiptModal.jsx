import React, { useState } from 'react';
import { Printer, MessageCircle, X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { formatRupiah, formatDate, generateWhatsAppMessage } from '../utils/format';

export default function ReceiptModal({ invoice, onClose }) {
  const [receiptType, setReceiptType] = useState('thermal'); // 'thermal' or 'a4'

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = generateWhatsAppMessage(invoice);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base sm:text-lg">Nota Penjualan</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex items-center justify-center gap-2 p-3 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setReceiptType('thermal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              receiptType === 'thermal' 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Struk Kasir (Thermal 58/80mm)
          </button>
          <button
            onClick={() => setReceiptType('a4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              receiptType === 'a4' 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Format Nota A4 / Standar
          </button>
        </div>

        {/* Receipt Container / Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30 flex justify-center">
          <div 
            id="printable-receipt"
            className={`${
              receiptType === 'thermal' ? 'w-[320px] text-xs' : 'w-full text-sm'
            } bg-white text-slate-900 p-6 rounded-xl shadow-inner font-mono`}
          >
            {/* Header Nota */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="font-black text-base uppercase tracking-wider">CV. MASTER CIGARETTES</h2>
              <p className="text-[11px] text-slate-600">Distributor & Grosir Tembakau / Rokok</p>
              <p className="text-[10px] text-slate-500 mt-1">Telp / WA: 0812-XXXX-XXXX</p>
            </div>

            {/* Meta Data */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Nota:</span>
                <span className="font-bold">{invoice.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tanggal:</span>
                <span>{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pelanggan:</span>
                <span className="font-bold uppercase">
                  {invoice.customer_name || invoice.customer_name_manual || invoice.customer_code || 'Umum'} 
                  {invoice.customer_code ? ` [${invoice.customer_code}]` : ''}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-600">
                <span>PRODUK</span>
                <span>SUBTOTAL</span>
              </div>
              {invoice.items && invoice.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-[11px] text-slate-900 leading-tight">
                    {item.product_name || item.name}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>{item.qty} x {formatRupiah(item.unit_price)}</span>
                    <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-sm font-black border-t border-slate-300 pt-2">
                <span>TOTAL:</span>
                <span className="text-base">{formatRupiah(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-500 mt-5 border-t border-dashed border-slate-300 pt-3">
              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa nota resmi.</p>
              <p className="mt-1 font-semibold">*** Terima Kasih ***</p>
            </div>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim WhatsApp</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota</span>
          </button>
        </div>

      </div>
    </div>
  );
}
