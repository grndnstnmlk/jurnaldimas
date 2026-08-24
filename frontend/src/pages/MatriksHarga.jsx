import React, { useState, useEffect } from 'react';
import { 
  TableProperties, 
  Search, 
  Save, 
  Check, 
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  Printer,
  MessageCircle,
  Eye,
  EyeOff,
  Building2,
  TrendingUp,
  Percent,
  Share2
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function MatriksHarga() {
  const { eventCounter } = useRealtime();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  // View Mode: 'matrix' (Internal Admin View) or 'customer_pricelist' (Shareable Customer View)
  const [viewMode, setViewMode] = useState('customer_pricelist');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showHPP, setShowHPP] = useState(false); // Toggle to hide/show confidential HPP
  const [retailMarginPercent, setRetailMarginPercent] = useState(5); // Default recommended retail margin for stores (5%)

  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savedBadge, setSavedBadge] = useState(null);

  useEffect(() => {
    fetchMatrix();
  }, [eventCounter]);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pricing-matrix');
      const data = await res.json();
      setProducts(data.products || []);
      setCustomers(data.customers || []);
      setMatrix(data.matrix || {});

      if (!selectedCustomerId && data.customers && data.customers.length > 0) {
        setSelectedCustomerId(data.customers[0].id);
      }
    } catch (e) {
      console.error('Error loading matrix:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (prodId, custId, currentPrice) => {
    setEditingCell({ prodId, custId });
    setEditValue(currentPrice ? (currentPrice / 1000).toString() : '');
  };

  const handleSaveCell = async (prodId, custId) => {
    const rawNum = parseFloat(editValue) || 0;
    const finalPrice = rawNum > 0 ? Math.round(rawNum * 1000) : 0;

    try {
      const res = await fetch('/api/pricing-matrix/update-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: prodId,
          customer_id: custId,
          sell_price: finalPrice
        })
      });
      const data = await res.json();
      if (data.success) {
        setMatrix((prev) => ({
          ...prev,
          [`${prodId}_${custId}`]: finalPrice
        }));
        setSavedBadge(`${prodId}_${custId}`);
        setTimeout(() => setSavedBadge(null), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingCell(null);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.code.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  // Generate WhatsApp Message for Selected Customer Price List
  const handleShareWhatsApp = () => {
    if (!selectedCustomerObj) return;

    let text = `*DAFTAR HARGA KHUSUS - CV. MASTER CIGARETTES*\n`;
    text += `Pelanggan/Toko: *${selectedCustomerObj.name}* (${selectedCustomerObj.code})\n`;
    text += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
    text += `===============================\n\n`;

    filteredProducts.slice(0, 35).forEach((p, idx) => {
      const key = `${p.id}_${selectedCustomerObj.id}`;
      const buyPrice = matrix[key] || p.default_price || p.modal_price;
      const recRetail = Math.round(buyPrice * (1 + retailMarginPercent / 100) / 500) * 500;
      text += `${idx + 1}. *${p.name}*\n`;
      text += `   • Harga Beli Toko: Rp ${buyPrice.toLocaleString('id-ID')}\n`;
      text += `   • Saran Jual Eceran: Rp ${recRetail.toLocaleString('id-ID')}\n`;
    });

    if (filteredProducts.length > 35) {
      text += `\n...dan ${filteredProducts.length - 35} produk lainnya.\n`;
    }

    text += `\n===============================\n`;
    text += `*CV. MASTER CIGARETTES*\n_Distributor & Grosir Tembakau / Rokok Resmi_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintPriceList = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-700">Memuat matriks harga 120 produk...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Matriks & Daftar Harga Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola harga khusus per toko atau bagikan price list resmi kepada penjual/pelanggan
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setViewMode('customer_pricelist')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === 'customer_pricelist'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Price List Khusus Toko (Siap Diberikan)</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === 'matrix'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Matriks Lengkap (Semua Toko)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PRICE LIST KHUSUS PELANGGAN (AMAN DIBERIKAN KEPADA PENJUAL / TOKO) */}
      {/* ========================================================================= */}
      {viewMode === 'customer_pricelist' && (
        <div className="space-y-4">
          
          {/* Top Control Bar for Customer Price List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Customer Picker (5 cols) */}
            <div className="md:col-span-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilih Toko / Penjual Penerima Price List</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Retail Margin Guide Slider (3 cols) */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Est. Margin Toko</span>
                <span className="text-emerald-700 font-bold font-mono">+{retailMarginPercent}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={retailMarginPercent}
                onChange={(e) => setRetailMarginPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Actions: WhatsApp & Print (4 cols) */}
            <div className="md:col-span-4 flex items-center justify-end gap-2 pt-1 sm:pt-0">
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition flex items-center justify-center gap-1.5"
                title="Kirim Price List ke WhatsApp Toko"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim WA</span>
              </button>

              <button
                onClick={handlePrintPriceList}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                title="Cetak Price List Toko"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Price List</span>
              </button>
            </div>

          </div>

          {/* Search bar inside Price List */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk pada daftar harga..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-white text-slate-800 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>

          {/* Printable Price List Table (Safe for Customers: HPP Hidden!) */}
          <div id="printable-receipt" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Header info in print / on screen */}
            <div className="p-4 bg-emerald-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  DAFTAR HARGA GROSIR RESMI
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  Toko: {selectedCustomerObj ? `[${selectedCustomerObj.code}] ${selectedCustomerObj.name}` : '-'}
                </div>
                <div className="text-[11px] text-slate-500">
                  CV. Master Cigarettes • Surabaya, Jawa Timur
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-500">
                <div>Berlaku per: <span className="font-bold text-slate-700">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">✅ HPP Rahasia Aman Tersembunyi</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">Nama Produk Rokok</th>
                    <th className="px-4 py-3 text-right">Harga Beli Toko / Slop</th>
                    <th className="px-4 py-3 text-right">Saran Jual Eceran</th>
                    <th className="px-4 py-3 text-right text-emerald-700">Est. Untung Toko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredProducts.map((p, idx) => {
                    const key = `${p.id}_${selectedCustomerObj?.id}`;
                    const buyPrice = matrix[key] || p.default_price || p.modal_price;
                    const recRetail = Math.round(buyPrice * (1 + retailMarginPercent / 100) / 500) * 500;
                    const storeProfit = recRetail - buyPrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-sans font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 text-sm">
                          {formatRupiah(buyPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-600">
                          {formatRupiah(recRetail)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-extrabold text-emerald-700">
                          +{formatRupiah(storeProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FULL MATRIX GRID (INTERNAL ADMIN / OWNER VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          
          {/* Controls Bar for Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Product */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari baris produk..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Search Customer */}
              <div className="relative w-48">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter kolom toko..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Toggle Show HPP */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHPP(!showHPP)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                  showHPP 
                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {showHPP ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showHPP ? 'Sembunyikan HPP' : 'Tampilkan Kolom HPP'}</span>
              </button>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                💡 Klik angka untuk edit harga
              </span>
            </div>
          </div>

          {/* Complete 120 x 26 Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[640px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
                  <tr className="text-slate-600 uppercase">
                    <th className="px-4 py-3 sticky left-0 z-30 bg-slate-50 min-w-[190px] border-r border-slate-200 font-bold">
                      Nama Produk
                    </th>
                    {showHPP && (
                      <th className="px-3 py-3 text-right bg-amber-50/70 min-w-[85px] border-r border-slate-200 text-amber-900 font-bold">
                        HPP (Modal)
                      </th>
                    )}
                    {filteredCustomers.map((c) => (
                      <th 
                        key={c.id} 
                        className="px-2.5 py-3 text-center min-w-[75px] border-r border-slate-200 font-bold"
                        title={c.name}
                      >
                        <div className="text-emerald-700 font-mono text-xs font-bold">{c.code}</div>
                        <div className="text-[9px] text-slate-400 truncate max-w-[65px] font-sans">{c.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-white border-r border-slate-100">
                        {p.name}
                      </td>

                      {showHPP && (
                        <td className="px-3 py-2 text-right text-amber-900 font-semibold border-r border-slate-100 bg-amber-50/30">
                          {p.modal_price ? (p.modal_price / 1000).toLocaleString() : '0'}k
                        </td>
                      )}

                      {filteredCustomers.map((c) => {
                        const key = `${p.id}_${c.id}`;
                        const price = matrix[key];
                        const isEditing = editingCell?.prodId === p.id && editingCell?.custId === c.id;
                        const isJustSaved = savedBadge === key;

                        return (
                          <td
                            key={c.id}
                            onClick={() => !isEditing && handleCellClick(p.id, c.id, price)}
                            className={`px-1.5 py-1 text-center border-r border-slate-100 cursor-pointer transition ${
                              isEditing
                                ? 'bg-emerald-50'
                                : isJustSaved
                                ? 'bg-emerald-100'
                                : price > 0
                                ? 'hover:bg-emerald-50/50 text-slate-900'
                                : 'text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveCell(p.id, c.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCell(p.id, c.id);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-14 bg-white border border-emerald-500 text-emerald-700 font-bold px-1 py-0.5 rounded text-center text-xs focus:outline-none"
                              />
                            ) : (
                              <div className="font-bold">
                                {price > 0 ? (
                                  <span className="text-emerald-700">{(price / 1000).toLocaleString()}k</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
