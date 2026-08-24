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
  Share2,
  Edit3,
  Copy,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function MatriksHarga() {
  const { eventCounter } = useRealtime();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  // View Mode: 'customer_pricelist' (Shareable Customer View & Custom Price Editor) or 'matrix' (Internal Admin View)
  const [viewMode, setViewMode] = useState('customer_pricelist');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPrices, setEditedPrices] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Modals for Bulk Actions
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sourceCustomerCopyId, setSourceCustomerCopyId] = useState('');
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [customMarginInput, setCustomMarginInput] = useState(5);

  const [showHPP, setShowHPP] = useState(false);
  const [retailMarginPercent, setRetailMarginPercent] = useState(5);

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
        setSourceCustomerCopyId(data.customers[0].id);
      }
    } catch (e) {
      console.error('Error loading matrix:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  // Initialize editable prices when entering edit mode or changing customer
  const handleToggleEditMode = () => {
    if (!isEditMode) {
      const initialMap = {};
      products.forEach((p) => {
        const key = `${p.id}_${selectedCustomerId}`;
        const currentPrice = matrix[key] || p.default_price || p.modal_price || 0;
        initialMap[p.id] = currentPrice;
      });
      setEditedPrices(initialMap);
    }
    setIsEditMode(!isEditMode);
  };

  const handlePriceChange = (productId, val) => {
    setEditedPrices((prev) => ({
      ...prev,
      [productId]: Number(val) || 0
    }));
  };

  // Batch save all edited prices for current customer
  const handleSaveAllCustomerPrices = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const priceListPayload = Object.entries(editedPrices).map(([prodId, price]) => ({
        product_id: Number(prodId),
        sell_price: price
      }));

      const res = await fetch('/api/pricing-matrix/batch-update-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(selectedCustomerId),
          prices: priceListPayload
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(`Harga untuk ${selectedCustomerObj?.name} berhasil disimpan!`);
        setIsEditMode(false);
        fetchMatrix();
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } else {
        alert(data.error || 'Gagal menyimpan harga');
      }
    } catch (e) {
      alert('Koneksi gagal: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy prices from another customer
  const handleExecuteCopyPrices = async () => {
    if (!sourceCustomerCopyId || !selectedCustomerId) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/pricing-matrix/copy-customer-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_customer_id: Number(sourceCustomerCopyId),
          target_customer_id: Number(selectedCustomerId)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCopyModal(false);
        setSaveSuccessMsg(data.message || 'Harga berhasil disalin!');
        setIsEditMode(false);
        fetchMatrix();
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } else {
        alert(data.error || 'Gagal menyalin harga');
      }
    } catch (e) {
      alert('Koneksi gagal: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply markup percentage for all products for this customer
  const handleExecuteApplyMargin = async () => {
    if (!selectedCustomerId) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/pricing-matrix/apply-margin-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(selectedCustomerId),
          margin_percent: Number(customMarginInput)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowMarginModal(false);
        setSaveSuccessMsg(data.message || 'Margin harga berhasil diterapkan!');
        setIsEditMode(false);
        fetchMatrix();
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } else {
        alert(data.error || 'Gagal menerapkan margin');
      }
    } catch (e) {
      alert('Koneksi gagal: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Cell click in full matrix mode
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

  // WhatsApp Price List share
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
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 space-y-4">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
            Matriks & Pengaturan Harga Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur harga jual khusus untuk pelanggan baru atau bagikan price list resmi
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => {
              setViewMode('customer_pricelist');
              setIsEditMode(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === 'customer_pricelist'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Price List & Atur Harga Toko</span>
          </button>

          <button
            onClick={() => {
              setViewMode('matrix');
              setIsEditMode(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === 'matrix'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Matriks Lengkap (26 Toko)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: PRICE LIST & ATUR HARGA PER PELANGGAN */}
      {/* ========================================================================= */}
      {viewMode === 'customer_pricelist' && (
        <div className="space-y-3">
          
          {/* Top Control Bar for Customer Price List & Editing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Customer Picker (6 cols) */}
              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pilih Pelanggan / Toko yang Dikelola</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setIsEditMode(false);
                  }}
                  className="w-full bg-slate-50 text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons Toolbar (6 cols) */}
              <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-1.5 pt-1 md:pt-4">
                
                {/* Toggle Edit Price Button */}
                <button
                  onClick={handleToggleEditMode}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    isEditMode
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditMode ? 'Batal Edit' : 'Ubah Harga Toko Ini'}</span>
                </button>

                {/* Copy Prices from other customer */}
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5"
                  title="Salin semua harga dari pelanggan lain"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Harga</span>
                </button>

                {/* Auto Margin Markup */}
                <button
                  onClick={() => setShowMarginModal(true)}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5"
                  title="Terapkan margin serentak"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Set Margin %</span>
                </button>

                {/* WhatsApp & Print */}
                {!isEditMode && (
                  <>
                    <button
                      onClick={handleShareWhatsApp}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                      title="Kirim ke WhatsApp Toko"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePrintPriceList}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                      title="Cetak Price List"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </>
                )}

              </div>
            </div>

            {/* When in Edit Mode: Show Sticky Save Bar */}
            {isEditMode && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-amber-900 font-medium">
                  ✏️ <span className="font-bold">Mode Edit Harga Aktif:</span> Ketik harga jual baru pada kolom di tabel bawah, lalu klik Simpan.
                </div>
                <button
                  onClick={handleSaveAllCustomerPrices}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Harga'}</span>
                </button>
              </div>
            )}

          </div>

          {/* Search bar inside Price List */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk pada daftar harga..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-white text-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>

          {/* Price List & Editor Table */}
          <div id="printable-receipt" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Header info */}
            <div className="p-4 bg-emerald-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
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
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">Nama Produk Rokok</th>
                    <th className="px-4 py-3 text-right">
                      {isEditMode ? 'Ubah Harga Beli Toko (Rp)' : 'Harga Beli Toko / Slop'}
                    </th>
                    {!isEditMode && (
                      <>
                        <th className="px-4 py-3 text-right">Saran Jual Eceran</th>
                        <th className="px-4 py-3 text-right text-emerald-700">Est. Untung Toko</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredProducts.map((p, idx) => {
                    const key = `${p.id}_${selectedCustomerObj?.id}`;
                    const currentBuyPrice = matrix[key] || p.default_price || p.modal_price;
                    const recRetail = Math.round(currentBuyPrice * (1 + retailMarginPercent / 100) / 500) * 500;
                    const storeProfit = recRetail - currentBuyPrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-sans font-bold text-slate-900">
                          {p.name}
                        </td>
                        
                        {/* Column: Price (Editable or Read-Only) */}
                        <td className="px-4 py-2.5 text-right font-bold">
                          {isEditMode ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-slate-400">Rp</span>
                              <input
                                type="number"
                                value={editedPrices[p.id] ?? currentBuyPrice}
                                onChange={(e) => handlePriceChange(p.id, e.target.value)}
                                className="w-28 bg-white border border-emerald-500 text-emerald-800 font-bold px-2 py-1 rounded-lg text-right text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-900 text-sm">{formatRupiah(currentBuyPrice)}</span>
                          )}
                        </td>

                        {!isEditMode && (
                          <>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-600">
                              {formatRupiah(recRetail)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-extrabold text-emerald-700">
                              +{formatRupiah(storeProfit)}
                            </td>
                          </>
                        )}
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
      {/* MODE 2: FULL MATRIX GRID (26 CUSTOMERS) */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="space-y-3">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari baris produk..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="relative w-40">
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
                <span>{showHPP ? 'Sembunyikan HPP' : 'Kolom HPP'}</span>
              </button>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                💡 Klik sel untuk edit
              </span>
            </div>
          </div>

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

      {/* ========================================================================= */}
      {/* MODAL: SALIN HARGA DARI PELANGGAN LAIN */}
      {/* ========================================================================= */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-emerald-600" />
                <span>Salin Harga Pelanggan</span>
              </h3>
              <button onClick={() => setShowCopyModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Salin seluruh daftar harga produk dari toko lain ke: <br />
              <span className="font-bold text-emerald-700">[{selectedCustomerObj?.code}] {selectedCustomerObj?.name}</span>
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Pilih Toko Sumber (Yang Ingin Disalin):
              </label>
              <select
                value={sourceCustomerCopyId}
                onChange={(e) => setSourceCustomerCopyId(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                {customers
                  .filter((c) => c.id !== Number(selectedCustomerId))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteCopyPrices}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Menyalin...' : 'Salin Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SET MARGIN MASSAL (+X% DARI MODAL HPP) */}
      {/* ========================================================================= */}
      {showMarginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Set Margin Harga Massal</span>
              </h3>
              <button onClick={() => setShowMarginModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Otomatis hitung harga seluruh 120 produk untuk <span className="font-bold text-emerald-700">[{selectedCustomerObj?.code}] {selectedCustomerObj?.name}</span> berdasarkan persentase di atas modal HPP:
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Margin Keuntungan (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customMarginInput}
                  onChange={(e) => setCustomMarginInput(e.target.value)}
                  className="w-24 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-center"
                />
                <span className="text-xs text-slate-500 font-medium">Contoh: 3%, 5%, atau 10%</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowMarginModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteApplyMargin}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Menerapkan...' : 'Terapkan Margin'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
