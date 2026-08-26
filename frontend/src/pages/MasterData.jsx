import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Database, 
  Users, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  Check, 
  DollarSign,
  MapPin,
  Phone,
  MessageSquare
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import CustomerDetailModal from '../components/CustomerDetailModal';

export default function MasterData() {
  const { eventCounter } = useRealtime();
  const [activeTab, setActiveTab] = useState('products');
  
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDetailCustomerId, setSelectedDetailCustomerId] = useState(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({ name: '', category: 'Rokok', modal_price: 0, default_price: 0, initial_stock: 0 });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custForm, setCustForm] = useState({ code: '', name: '', phone: '', address: '', maps_url: '', notes: '' });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [eventCounter]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdForm({ name: '', category: 'Rokok', modal_price: 0, default_price: 0, initial_stock: 0 });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      category: p.category || 'Rokok',
      modal_price: p.modal_price,
      default_price: p.default_price || p.modal_price,
      initial_stock: p.stok_akhir !== undefined ? p.stok_akhir : 0
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prodForm,
          stock: prodForm.initial_stock
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        fetchProducts();
      } else {
        alert(data.error || 'Gagal menyimpan produk');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteProduct = async (p) => {
    if (!confirm(`Hapus produk "${p.name}"? Data harga dan riwayat terkait produk ini akan dihapus.`)) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert(data.error || 'Gagal menghapus produk');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setCustForm({ code: '', name: '', phone: '', address: '', maps_url: '', notes: '' });
    setShowCustomerModal(true);
  };

  const handleOpenEditCustomer = (c) => {
    setEditingCustomer(c);
    setCustForm({
      code: c.code,
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      maps_url: c.maps_url || '',
      notes: c.notes || ''
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custForm)
      });

      const data = await res.json();
      if (data.success) {
        setShowCustomerModal(false);
        fetchCustomers();
      } else {
        alert(data.error || 'Gagal menyimpan pelanggan');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteCustomer = async (c) => {
    if (!confirm(`Hapus pelanggan "${c.name}"? Data riwayat transaksi terkait pelanggan ini akan dilepas.`)) return;
    try {
      const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      } else {
        alert(data.error || 'Gagal menghapus pelanggan');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Master Data Produk & Pelanggan</h1>
          <p className="text-xs text-slate-500">Kelola database produk rokok, daftar pelanggan/toko, nomor WhatsApp, dan titik Google Maps</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'products' ? (
            <button
              onClick={handleOpenNewProduct}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Produk</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewCustomer}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pelanggan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="fintech-card p-3.5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('products'); setSearch(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-1 sm:flex-initial justify-center ${
              activeTab === 'products' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Master Produk ({products.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-1 sm:flex-initial justify-center ${
              activeTab === 'customers' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Master Pelanggan ({customers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'products' ? "Cari nama produk..." : "Cari kode / nama pelanggan..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Products Table */}
      {activeTab === 'products' && (
        <div className="fintech-card rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3 text-right">Modal HPP (Rp)</th>
                  <th className="px-4 py-3 text-center">Stok Fisik</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-sans font-bold text-slate-900">{p.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">{formatRupiah(p.modal_price)}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{p.stok_akhir ?? 0}</td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Produk"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customers Table */}
      {activeTab === 'customers' && (
        <div className="fintech-card rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Toko / Pelanggan</th>
                  <th className="px-4 py-3">Kontak WA & Maps</th>
                  <th className="px-4 py-3 text-center">Jumlah Nota</th>
                  <th className="px-4 py-3 text-right">Total Transaksi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailCustomerId(c.id)}
                        className="px-2 py-1 rounded bg-emerald-50 border border-emerald-100 font-black hover:bg-emerald-100"
                        title="Klik untuk detail pelanggan"
                      >
                        {c.code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailCustomerId(c.id)}
                        className="font-bold text-left text-slate-900 hover:text-emerald-700 hover:underline"
                        title="Klik untuk melihat nomor WA & titik Google Maps"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        {c.phone ? (
                          <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No WA -</span>
                        )}
                        {c.maps_url && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            📍 Maps
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 font-mono">{c.total_invoices || 0}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {formatRupiah(c.total_transactions || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedDetailCustomerId(c.id)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Lihat Detail & Titik Lokasi"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Edit Pelanggan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal (Non-clipping layout) */}
      {showProductModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Produk Rokok</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Contoh: ESTE BLUEBERRY"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Harga Modal / HPP (Rp)</label>
                <input
                  type="number"
                  required
                  value={prodForm.modal_price}
                  onChange={(e) => setProdForm({ ...prodForm, modal_price: Number(e.target.value) })}
                  placeholder="Contoh: 58000"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    {editingProduct ? 'Stok Fisik Saat Ini (Slop)' : 'Stok Awal (Slop)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setProdForm({ ...prodForm, initial_stock: 0 })}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 transition"
                  >
                    Set 0 (Kosongkan)
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={prodForm.initial_stock}
                  onChange={(e) => setProdForm({ ...prodForm, initial_stock: Math.max(0, Number(e.target.value)) })}
                  placeholder="0"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Customer Modal (Non-clipping layout) */}
      {showCustomerModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base">
                {editingCustomer ? 'Edit Pelanggan / Toko' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={custForm.code}
                    onChange={(e) => setCustForm({ ...custForm, code: e.target.value.toUpperCase() })}
                    placeholder="SIM"
                    className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-black focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Toko *</label>
                  <input
                    type="text"
                    required
                    value={custForm.name}
                    onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                    placeholder="Contoh: TOKO SIMO JAYA"
                    className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={custForm.phone}
                  onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Titik Lokasi Google Maps (URL / Link)</label>
                <input
                  type="text"
                  value={custForm.maps_url}
                  onChange={(e) => setCustForm({ ...custForm, maps_url: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Lengkap Toko</label>
                <textarea
                  rows={2}
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  placeholder="Jl. Pasar Besar No. 45..."
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Customer Detail Modal (WhatsApp, Maps & Custom Edit) */}
      {selectedDetailCustomerId && (
        <CustomerDetailModal
          customerId={selectedDetailCustomerId}
          onClose={() => setSelectedDetailCustomerId(null)}
          onCustomerUpdated={() => fetchCustomers()}
        />
      )}

    </div>
  );
}
