import React, { useState, useEffect } from 'react';
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
  DollarSign
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function MasterData() {
  const { eventCounter } = useRealtime();
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'customers'
  
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({ name: '', category: 'Rokok', modal_price: 0, default_price: 0, initial_stock: 0 });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custForm, setCustForm] = useState({ code: '', name: '', phone: '', address: '' });

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

  // Product Actions
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
      modal_price: p.modal_price || 0,
      default_price: p.default_price || p.modal_price || 0,
      initial_stock: p.stok_akhir || 0
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
        body: JSON.stringify(prodForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        fetchProducts();
      } else {
        alert(data.error || 'Gagal menyimpan produk');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (p) => {
    if (window.confirm(`Hapus produk "${p.name}"?`)) {
      try {
        const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Customer Actions
  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setCustForm({ code: '', name: '', phone: '', address: '' });
    setShowCustomerModal(true);
  };

  const handleOpenEditCustomer = (c) => {
    setEditingCustomer(c);
    setCustForm({ code: c.code, name: c.name, phone: c.phone || '', address: c.address || '' });
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
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = async (c) => {
    if (window.confirm(`Hapus pelanggan "${c.name}" [${c.code}]?`)) {
      try {
        const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchCustomers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Master Data & Katalog</h1>
          <p className="text-sm text-slate-400">Pengelolaan master 120 produk tembakau/rokok dan direktori 26+ pelanggan</p>
        </div>
        <div>
          {activeTab === 'products' ? (
            <button
              onClick={handleOpenNewProduct}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewCustomer}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pelanggan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab('products'); setSearch(''); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'products' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Produk ({products.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('customers'); setSearch(''); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === 'customers' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Direktori Pelanggan ({customers.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={activeTab === 'products' ? 'Cari nama produk...' : 'Cari nama/kode pelanggan...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Harga Modal (HPP)</th>
                  <th className="px-4 py-3 text-center">Stok Saat Ini</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.category}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                      {formatRupiah(p.modal_price)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-300">
                      {p.stok_akhir ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
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

      {/* CUSTOMERS TABLE */}
      {activeTab === 'customers' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Kode Pelanggan</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3 text-center">Total Transaksi</th>
                  <th className="px-4 py-3 text-right">Volume Belanja</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      <span className="px-2 py-1 rounded bg-slate-800 text-amber-300">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{c.name}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{c.total_invoices || 0} nota</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      {formatRupiah(c.total_transactions || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
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

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Contoh: ESTE BLUEBERRY"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Kategori</label>
                <input
                  type="text"
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Harga Modal / HPP (Rupiah)</label>
                <input
                  type="number"
                  required
                  value={prodForm.modal_price}
                  onChange={(e) => setProdForm({ ...prodForm, modal_price: Number(e.target.value) })}
                  placeholder="Contoh: 58000"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stok Awal Fisik</label>
                  <input
                    type="number"
                    value={prodForm.initial_stock}
                    onChange={(e) => setProdForm({ ...prodForm, initial_stock: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kode (3-4 Huruf)</label>
                  <input
                    type="text"
                    required
                    maxLength="5"
                    value={custForm.code}
                    onChange={(e) => setCustForm({ ...custForm, code: e.target.value.toUpperCase() })}
                    placeholder="SIM"
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={custForm.name}
                    onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                    placeholder="Contoh: SIMO / TOKO A"
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  value={custForm.phone}
                  onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                  placeholder="0812XXXXXXXX"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Alamat / Lokasi</label>
                <input
                  type="text"
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  placeholder="Contoh: Jl. Diponegoro No. 12"
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
