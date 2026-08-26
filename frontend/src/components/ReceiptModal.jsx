import React, { useState } from 'react';
import { Printer, MessageCircle, X, CheckCircle2 } from 'lucide-react';
import { formatRupiah, formatDate, generateWhatsAppMessage } from '../utils/format';

export default function ReceiptModal({ invoice, onClose }) {
  const [receiptType, setReceiptType] = useState('thermal');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = generateWhatsAppMessage(invoice);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto no-print">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base font-sans">Nota Penjualan Resmi</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border-b border-slate-100">
          <button
            onClick={() => setReceiptType('thermal')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
              receiptType === 'thermal' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Struk Kasir (Thermal)
          </button>
          <button
            onClick={() => setReceiptType('a4')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
              receiptType === 'a4' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Format Nota A4
          </button>
        </div>

        {/* Receipt Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div 
            id="printable-receipt"
            className={`${
              receiptType === 'thermal' ? 'w-[320px] text-xs' : 'w-full text-sm'
            } bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 font-mono shadow-xs`}
          >
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h2 className="font-bold text-base uppercase tracking-wider text-slate-900">CV. MASTER CIGARETTES</h2>
              <p className="text-[11px] text-slate-600">Distributor & Grosir Tembakau / Rokok</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Surabaya - Jawa Timur</p>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-bold">{invoice.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold uppercase">
                  {invoice.customer_name || invoice.customer_name_manual || invoice.customer_code || 'Umum'} 
                  {invoice.customer_code ? ` [${invoice.customer_code}]` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
                <span>PRODUK</span>
                <span>SUBTOTAL</span>
              </div>
              {invoice.items && invoice.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-[11px] text-slate-800 leading-tight">
                    {item.product_name || item.name}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>{item.qty} x {formatRupiah(item.unit_price)}</span>
                    <span className="font-bold text-slate-800">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-2">
                <span>TOTAL:</span>
                <span className="text-base text-emerald-700 font-black">{formatRupiah(invoice.total_amount)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-5 border-t border-dashed border-slate-200 pt-3">
              <p>Terima kasih atas kerja samanya!</p>
              <p className="mt-0.5 font-bold">*** NOTA RESMI ***</p>
            </div>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim WhatsApp</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota</span>
          </button>
        </div>

      </div>
    </div>
  );
}
