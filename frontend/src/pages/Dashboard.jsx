import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  Package, 
  ArrowUpRight, 
  Receipt, 
  Clock, 
  Sparkles, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import ReceiptModal from '../components/ReceiptModal';

export default function Dashboard({ setActiveTab }) {
  const { eventCounter } = useRealtime();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [eventCounter]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (invId) => {
    try {
      const res = await fetch(`/api/invoices/${invId}`);
      const json = await res.json();
      setSelectedInvoice(json);
    } catch (e) {
      console.error('Error fetching invoice:', e);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center text-[#5a585a]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0f0f0f] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-xs font-bold text-[#0f0f0f]">Memuat ringkasan data keuangan real-time...</p>
      </div>
    );
  }

  const { totalStats, todayStats, lowStockCount, productCount, customerCount, topProducts, topCustomers, recentInvoices } = data;

  const marginPercentage = totalStats.total_omset > 0 
    ? ((totalStats.total_laba / totalStats.total_omset) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* 1. WELCOME HERO (Cotton Pink Confetti Card) */}
      <div className="bg-[#ffd0e2] rounded-[17.5px] border border-[#0f0f0f] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-[14px] bg-[#ffffff] border border-[#0f0f0f] text-[11px] font-bold text-[#0f0f0f] uppercase tracking-wider mb-2">
              PORTAL KEUANGAN & KASIR POS
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f0f0f] tracking-tight leading-[0.9] font-sans">
              CV. MASTER CIGARETTES
            </h1>
            <p className="text-xs sm:text-sm text-[#5a585a] mt-2 max-w-xl font-medium">
              Pantau arus omset penjualan, modal HPP, margin laba bersih, dan sisa stok fisik secara otomatis dan real-time.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('kasir')}
              className="ctrl-btn-lime flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Terminal Kasir</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI STATS (Chromatic Confetti Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omset (Sticker Yellow Card) */}
        <div className="bg-[#fcea59] rounded-[17.5px] border border-[#0f0f0f] p-5">
          <div className="flex items-center justify-between text-[#5a585a] text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-[#0f0f0f]">Total Omset Jual</span>
            <DollarSign className="w-4 h-4 text-[#0f0f0f]" />
          </div>
          <div className="text-2xl font-black text-[#0f0f0f] font-mono">
            {formatRupiah(totalStats.total_omset)}
          </div>
          <div className="text-xs text-[#5a585a] mt-2 flex items-center justify-between font-medium">
            <span>{totalStats.total_invoices} Transaksi Nota</span>
            <span className="font-bold text-[#0f0f0f]">Semua Periode</span>
          </div>
        </div>

        {/* Total Laba Bersih (Acid Lime Highlight Card) */}
        <div className="bg-[#05c92f] rounded-[17.5px] border border-[#0f0f0f] p-5">
          <div className="flex items-center justify-between text-[#0f0f0f] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-[#0f0f0f]" />
          </div>
          <div className="text-2xl font-black text-[#0f0f0f] font-mono">
            {formatRupiah(totalStats.total_laba)}
          </div>
          <div className="text-xs text-[#0f0f0f] mt-2 flex items-center justify-between font-bold">
            <span>Margin Keuntungan</span>
            <span>{marginPercentage}%</span>
          </div>
        </div>

        {/* Total Modal / HPP (Powder Blue Card) */}
        <div className="bg-[#a7cbf6] rounded-[17.5px] border border-[#0f0f0f] p-5">
          <div className="flex items-center justify-between text-[#0f0f0f] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Modal (HPP)</span>
            <Package className="w-4 h-4 text-[#0f0f0f]" />
          </div>
          <div className="text-2xl font-black text-[#0f0f0f] font-mono">
            {formatRupiah(totalStats.total_modal)}
          </div>
          <div className="text-xs text-[#5a585a] mt-2 flex items-center justify-between font-medium">
            <span>{productCount} Macam Produk</span>
            <span className="font-bold text-[#0f0f0f]">Sisa Stok: {totalStats.total_stok_akhir}</span>
          </div>
        </div>

        {/* Omset Hari Ini (Pure White Card) */}
        <div className="bg-[#ffffff] rounded-[17.5px] border border-[#0f0f0f] p-5">
          <div className="flex items-center justify-between text-[#5a585a] text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-[#0f0f0f]">Omset Hari Ini</span>
            <Clock className="w-4 h-4 text-[#0f0f0f]" />
          </div>
          <div className="text-2xl font-black text-[#0f0f0f] font-mono">
            {formatRupiah(todayStats.today_omset || 0)}
          </div>
          <div className="text-xs text-[#5a585a] mt-2 flex items-center justify-between font-medium">
            <span>{todayStats.today_invoices || 0} Nota Baru</span>
            <span className="font-bold text-[#05c92f]">+{formatRupiah(todayStats.today_laba || 0)} Laba</span>
          </div>
        </div>

      </div>

      {/* 3. TWO COLUMN SECTION: TOP PRODUCTS & RECENT INVOICES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-[#ffffff] rounded-[17.5px] border border-[#0f0f0f] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0f0f0f] tracking-tight">
              5 Produk Terlaris (Top Volume)
            </h3>
            <button
              onClick={() => setActiveTab('master')}
              className="text-xs font-bold text-[#0f0f0f] hover:underline"
            >
              Lihat Semua ➔
            </button>
          </div>

          <div className="divide-y divide-[#0f0f0f]/10">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-[7px] bg-[#ecefec] text-[#0f0f0f] font-black text-xs flex items-center justify-center border border-[#0f0f0f]/20">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#0f0f0f]">{p.product_name}</div>
                    <div className="text-[11px] text-[#5a585a]">{p.total_qty} Slop Terjual</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-xs sm:text-sm text-[#0f0f0f]">{formatRupiah(p.total_omset)}</div>
                  <div className="text-[11px] text-[#05c92f] font-bold">+{formatRupiah(p.total_laba)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Invoices (5 cols) */}
        <div className="lg:col-span-5 bg-[#ffffff] rounded-[17.5px] border border-[#0f0f0f] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0f0f0f] tracking-tight">
              Transaksi Terkini
            </h3>
            <button
              onClick={() => setActiveTab('riwayat')}
              className="text-xs font-bold text-[#0f0f0f] hover:underline"
            >
              Semua Nota ➔
            </button>
          </div>

          <div className="divide-y divide-[#0f0f0f]/10">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-[#0f0f0f] flex items-center gap-1.5">
                    <span>{inv.invoice_no}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-[14px] bg-[#ecefec] text-[#0f0f0f] font-bold border border-[#0f0f0f]/20">
                      {inv.customer_code || 'UMUM'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5a585a] mt-0.5">
                    {formatDate(inv.date)} • {inv.item_count} item
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-xs sm:text-sm text-[#0f0f0f]">
                    {formatRupiah(inv.total_amount)}
                  </div>
                  <button
                    onClick={() => handleOpenReceipt(inv.id)}
                    className="text-[10px] font-bold text-[#0f0f0f] hover:underline mt-0.5"
                  >
                    Lihat Struk
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {selectedInvoice && (
        <ReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
