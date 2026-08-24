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
  Plus
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import ReceiptModal from '../components/ReceiptModal';

export default function RiwayatNota({ setActiveTab }) {
  const { eventCounter } = useRealtime();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expanded Invoice Row
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState({});

  // Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [eventCounter, selectedCustomerId, startDate, endDate]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCustomerId) params.append('customer_id', selectedCustomerId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (invId) => {
    if (expandedId === invId) {
      setExpandedId(null);
    } else {
      setExpandedId(invId);
      if (!expandedDetail[invId]) {
        try {
          const res = await fetch(`/api/invoices/${invId}`);
          const data = await res.json();
          setExpandedDetail((prev) => ({ ...prev, [invId]: data }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleDeleteInvoice = async (invId, invNo) => {
    if (window.confirm(`Apakah Anda yakin ingin membatalkan & menghapus Nota ${invNo}? Stok barang akan otomatis dikembalikan.`)) {
      try {
        const res = await fetch(`/api/invoices/${invId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          alert('Nota berhasil dibatalkan dan stok telah dikembalikan.');
          fetchInvoices();
        }
      } catch (err) {
        alert('Gagal menghapus nota: ' + err.message);
      }
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

  const totalOmsetFiltered = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalLabaFiltered = invoices.reduce((acc, i) => acc + (i.total_laba || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Riwayat Nota & Transaksi</h1>
          <p className="text-sm text-slate-400">Daftar seluruh nota penjualan dan riwayat transaksi</p>
        </div>
        <button
          onClick={() => setActiveTab('kasir')}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Transaksi Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Nota / Pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Customer Select */}
        <div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Pelanggan</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            title="Tanggal Mulai"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            title="Tanggal Akhir"
          />
        </div>
      </div>

      {/* Summary Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="text-xs text-slate-400">
          Menampilkan <span className="font-bold text-white">{invoices.length}</span> transaksi nota
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 mr-2">Total Omset:</span>
            <span className="font-mono font-bold text-sm text-amber-400">{formatRupiah(totalOmsetFiltered)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 mr-2">Total Laba:</span>
            <span className="font-mono font-bold text-sm text-emerald-400">{formatRupiah(totalLabaFiltered)}</span>
          </div>
        </div>
      </div>

      {/* Table of Invoices */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3">No. Nota</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Total Bayar</th>
                <th className="px-4 py-3 text-right">Laba</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.map((inv) => {
                const isExpanded = expandedId === inv.id;
                const detail = expandedDetail[inv.id];

                return (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleExpand(inv.id)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-200">
                        {inv.invoice_no}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {formatDate(inv.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-200">
                          {inv.customer_name || inv.customer_name_manual || 'Umum'}
                        </span>
                        {inv.customer_code && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                            {inv.customer_code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                          {inv.item_count} macam
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                        {formatRupiah(inv.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                        {formatRupiah(inv.total_laba)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenReceipt(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-xs font-semibold flex items-center gap-1 transition"
                            title="Cetak Nota / WhatsApp"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoice_no)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Batalkan & Kembalikan Stok"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Breakdown of Items */}
                    {isExpanded && (
                      <tr className="bg-slate-950/60">
                        <td colSpan="8" className="px-6 py-4">
                          {detail ? (
                            <div className="space-y-2">
                              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                Rincian Barang Pada Nota {inv.invoice_no}:
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-slate-300">
                                  <thead>
                                    <tr className="border-b border-slate-800 text-slate-500">
                                      <th className="py-1 text-left">Nama Produk</th>
                                      <th className="py-1 text-center">Qty</th>
                                      <th className="py-1 text-right">Modal</th>
                                      <th className="py-1 text-right">Harga Jual</th>
                                      <th className="py-1 text-right">Subtotal</th>
                                      <th className="py-1 text-right">Laba Bersih</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-900 font-mono">
                                    {detail.items.map((itm, i) => (
                                      <tr key={i}>
                                        <td className="py-1.5 text-left font-sans text-slate-200">{itm.product_name}</td>
                                        <td className="py-1.5 text-center">{itm.qty}</td>
                                        <td className="py-1.5 text-right text-slate-400">{formatRupiah(itm.modal_price)}</td>
                                        <td className="py-1.5 text-right text-slate-200">{formatRupiah(itm.unit_price)}</td>
                                        <td className="py-1.5 text-right font-bold text-amber-400">{formatRupiah(itm.subtotal)}</td>
                                        <td className="py-1.5 text-right text-emerald-400">{formatRupiah(itm.laba)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 py-2">Memuat rincian nota...</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Tidak ada riwayat transaksi yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View/Print Receipt */}
      {selectedInvoice && (
        <ReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
