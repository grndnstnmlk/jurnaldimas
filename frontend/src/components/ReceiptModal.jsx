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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="relative w-full max-w-lg bg-[#ffffff] rounded-[26px] border border-[#0f0f0f] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f0f0f]/10 bg-[#ecefec]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#05c92f]" />
            <h3 className="font-extrabold text-[#0f0f0f] text-base font-sans">Nota Penjualan Resmi</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-[#0f0f0f] hover:bg-[#ffffff] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center justify-center gap-2 p-3 bg-[#f9faf9] border-b border-[#0f0f0f]/10">
          <button
            onClick={() => setReceiptType('thermal')}
            className={`px-4 py-1.5 rounded-[35px] text-xs font-bold transition border ${
              receiptType === 'thermal' 
                ? 'bg-[#0f0f0f] text-[#ffffff] border-[#0f0f0f]' 
                : 'bg-[#ffffff] text-[#0f0f0f] border-[#0f0f0f]/30 hover:border-[#0f0f0f]'
            }`}
          >
            Struk Kasir (Thermal)
          </button>
          <button
            onClick={() => setReceiptType('a4')}
            className={`px-4 py-1.5 rounded-[35px] text-xs font-bold transition border ${
              receiptType === 'a4' 
                ? 'bg-[#0f0f0f] text-[#ffffff] border-[#0f0f0f]' 
                : 'bg-[#ffffff] text-[#0f0f0f] border-[#0f0f0f]/30 hover:border-[#0f0f0f]'
            }`}
          >
            Format Nota A4
          </button>
        </div>

        {/* Receipt Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#eeeeee] flex justify-center">
          <div 
            id="printable-receipt"
            className={`${
              receiptType === 'thermal' ? 'w-[320px] text-xs' : 'w-full text-sm'
            } bg-[#ffffff] text-[#0f0f0f] p-6 rounded-[17.5px] border border-[#0f0f0f] font-mono`}
          >
            <div className="text-center border-b border-dashed border-[#0f0f0f] pb-3 mb-3">
              <h2 className="font-black text-base uppercase tracking-wider text-[#0f0f0f]">CV. MASTER CIGARETTES</h2>
              <p className="text-[11px] text-[#5a585a]">Distributor & Grosir Tembakau / Rokok</p>
              <p className="text-[10px] text-[#5a585a] mt-0.5">Surabaya - Jawa Timur</p>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-[#0f0f0f] pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-[#5a585a]">No. Nota:</span>
                <span className="font-bold">{invoice.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5a585a]">Tanggal:</span>
                <span>{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5a585a]">Pelanggan:</span>
                <span className="font-bold uppercase">
                  {invoice.customer_name || invoice.customer_name_manual || invoice.customer_code || 'Umum'} 
                  {invoice.customer_code ? ` [${invoice.customer_code}]` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-[#0f0f0f] pb-3 mb-3">
              <div className="flex justify-between font-bold text-[10px] uppercase text-[#5a585a]">
                <span>PRODUK</span>
                <span>SUBTOTAL</span>
              </div>
              {invoice.items && invoice.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-[11px] text-[#0f0f0f] leading-tight">
                    {item.product_name || item.name}
                  </div>
                  <div className="flex justify-between text-[11px] text-[#5a585a]">
                    <span>{item.qty} x {formatRupiah(item.unit_price)}</span>
                    <span className="font-bold text-[#0f0f0f]">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-sm font-black border-t border-[#0f0f0f] pt-2">
                <span>TOTAL:</span>
                <span className="text-base text-[#0f0f0f]">{formatRupiah(invoice.total_amount)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#5a585a] mt-5 border-t border-dashed border-[#0f0f0f]/30 pt-3">
              <p>Terima kasih atas kerja samanya!</p>
              <p className="mt-0.5 font-bold">*** NOTA RESMI ***</p>
            </div>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="p-4 bg-[#ecefec] border-t border-[#0f0f0f]/10 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-[35px] bg-[#ffffff] hover:bg-[#ecefec] text-[#0f0f0f] text-xs font-bold border border-[#0f0f0f] transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim WhatsApp</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 ctrl-btn-lime text-xs font-black transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota</span>
          </button>
        </div>

      </div>
    </div>
  );
}
