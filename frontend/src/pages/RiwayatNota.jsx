import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  User, 
  Receipt, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Download,
  Filter,
  RefreshCw,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import CustomerDetailModal from '../components/CustomerDetailModal';

export default function RiwayatNota({ setActiveTab }) {
  const { eventCounter } = useRealtime();
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDetailCustomerId, setSelectedDetailCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedCustomerId, startDate, endDate, eventCounter]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      if (Array.isArray(json)) setCustomers(json);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCustomerId) params.append('customer_id', selectedCustomerId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (search) params.append('search', search);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const json = await res.json();
      if (Array.isArray(json)) setInvoices(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (invId) => {
    if (expandedId === invId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(invId);
    if (!expandedDetail[invId]) {
      try {
        const res = await fetch(`/api/invoices/${invId}`);
        const json = await res.json();
        setExpandedDetail((prev) => ({ ...prev, [invId]: json }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteInvoice = async (invId, invNo) => {
    if (!confirm(`Batalkan dan hapus nota transaksi ${invNo}? Stok yang telah terjual akan dikembalikan ke gudang.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchInvoices();
      } else {
        alert(json.error || 'Gagal membatalkan nota.');
      }
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleOpenReceipt = async (invId) => {
    try {
      const res = await fetch(`/api/invoices/${invId}`);
      const json = await res.json();
      setSelectedInvoice(json);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedCustomerId) params.append('customer_id', selectedCustomerId);
      if (search) params.append('search', search);

      const res = await fetch(`/api/export/invoices?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengunduh Excel riwayat transaksi');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NOTA_TRANSAKSI_MASTER_CIGARETTES_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(e.message);
    }
  };

  const totalOmsetFiltered = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalLabaFiltered = invoices.reduce((acc, i) => acc + (i.total_laba || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Riwayat Nota & Transaksi</h1>
          <p className="text-xs text-slate-500">Daftar nota penjualan resmi CV. Master Cigarettes</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs"
            title="Unduh riwayat transaksi ke file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('kasir')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="fintech-card p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Nota / Pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="">Semua Pelanggan</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            title="Tanggal Mulai"
          />
        </div>

        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            title="Tanggal Akhir"
          />
        </div>
      </div>

      {/* Summary Filter Strip */}
      <div className="fintech-card p-3.5 bg-emerald-50/50 border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-600 font-semibold">
          Total <span className="font-extrabold text-slate-900">{invoices.length}</span> Transaksi Terpilih
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 mr-1.5">Total Omset:</span>
            <span className="font-mono font-black text-sm text-emerald-600">{formatRupiah(totalOmsetFiltered)}</span>
          </div>
          {isAdmin && (
            <div className="text-right">
              <span className="text-[11px] text-slate-500 mr-1.5">Laba Bersih:</span>
              <span className="font-mono font-black text-sm text-slate-800">{formatRupiah(totalLabaFiltered)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Table of Invoices */}
      <div className="fintech-card rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3">No. Nota</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pelanggan / Toko</th>
                <th className="px-4 py-3 text-center">Item</th>
                <th className="px-4 py-3 text-right">Total Bayar</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const isExpanded = expandedId === inv.id;
                const detail = expandedDetail[inv.id];

                return (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleExpand(inv.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-slate-900">
                        {inv.invoice_no}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(inv.date)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => inv.customer_id && setSelectedDetailCustomerId(inv.customer_id)}
                          className={`text-left inline-flex items-center gap-1.5 ${inv.customer_id ? 'hover:text-emerald-700 hover:underline cursor-pointer' : ''}`}
                          title={inv.customer_id ? 'Klik untuk melihat WhatsApp, Google Maps & Detail Toko' : ''}
                        >
                          <span className="font-bold text-slate-900">
                            {inv.customer_name || inv.customer_name_manual || 'Umum'}
                          </span>
                          {inv.customer_code && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-100">
                              {inv.customer_code}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {inv.item_count} macam
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-600">
                        {formatRupiah(inv.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenReceipt(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 text-xs font-bold transition flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Batalkan Nota (Hanya Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Breakdown of Items */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan="7" className="px-6 py-4">
                          {detail ? (
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">
                                Rincian Barang Pada Nota {inv.invoice_no}:
                              </div>
                              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-2">
                                <table className="w-full text-xs text-slate-700">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                                      <th className="py-1 text-left">Nama Produk</th>
                                      <th className="py-1 text-center">Qty</th>
                                      <th className="py-1 text-right">Harga Jual</th>
                                      <th className="py-1 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono">
                                    {detail.items.map((itm, i) => (
                                      <tr key={i}>
                                        <td className="py-1.5 text-left font-sans font-bold text-slate-800">{itm.product_name}</td>
                                        <td className="py-1.5 text-center">{itm.qty}</td>
                                        <td className="py-1.5 text-right text-slate-600">{formatRupiah(itm.unit_price)}</td>
                                        <td className="py-1.5 text-right font-black text-emerald-600">{formatRupiah(itm.subtotal)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 py-2">Memuat rincian nota...</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-sans">
                    Tidak ada riwayat transaksi yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Nota */}
      {selectedInvoice && (
        <ReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Modal Detail Pelanggan (WA, Maps & Custom Edit) */}
      {selectedDetailCustomerId && (
        <CustomerDetailModal
          customerId={selectedDetailCustomerId}
          onClose={() => setSelectedDetailCustomerId(null)}
          onCustomerUpdated={() => {
            fetchCustomers();
            fetchInvoices();
          }}
        />
      )}

    </div>
  );
}
