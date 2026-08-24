import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Check, 
  Calendar, 
  Tag, 
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Building2,
  TrendingUp,
  Receipt,
  FileText,
  CreditCard,
  Banknote,
  Flame,
  LayoutGrid,
  List,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import ReceiptModal from '../components/ReceiptModal';
import PaymentModal from '../components/PaymentModal';

export default function KasirPOS() {
  const { eventCounter } = useRealtime();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pricingMatrix, setPricingMatrix] = useState({});

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchProduct, setSearchProduct] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  const searchInputRef = useRef(null);

  // Load Data
  useEffect(() => {
    fetchData();
  }, [eventCounter]);

  // Keyboard Shortcuts (F2: Search, F9: Pay, Esc: Clear)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      } else if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setCompletedInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const fetchData = async () => {
    try {
      const [resCust, resProd, resMatrix] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/pricing-matrix').then(r => r.json())
      ]);
      setCustomers(resCust);
      setProducts(resProd);
      setPricingMatrix(resMatrix.matrix || {});

      if (!selectedCustomerId && resCust.length > 0) {
        setSelectedCustomerId(resCust[0].id);
      }
    } catch (err) {
      console.error('Error fetching POS data:', err);
    }
  };

  // Categories tailored for Cigarette Distribution
  const categories = [
    { id: 'ALL', label: 'Semua Produk', count: products.length },
    { id: 'ESTE', label: 'ESTE / ESSE Series', icon: Flame },
    { id: 'SURYA', label: 'Surya & 54RYA', icon: Tag },
    { id: 'ANG', label: 'ANG Series', icon: Package },
    { id: 'BALVER', label: 'BALVER', icon: Layers },
    { id: 'AVATAR', label: 'AVATAR', icon: Sparkles },
    { id: 'MD', label: 'MD 16', icon: Tag },
    { id: 'HM', label: 'HM & HMIN', icon: Package }
  ];

  // Helper to get unit price for selected customer
  const getProductPriceForCustomer = (productId, customerId) => {
    if (!customerId) {
      const prod = products.find(p => p.id === productId);
      return prod ? (prod.default_price || prod.modal_price) : 0;
    }
    const key = `${productId}_${customerId}`;
    const customPrice = pricingMatrix[key];
    if (customPrice && customPrice > 0) {
      return customPrice;
    }
    const prod = products.find(p => p.id === productId);
    return prod ? (prod.default_price || prod.modal_price) : 0;
  };

  // Update cart prices when customer changes
  const handleCustomerChange = (newCustId) => {
    setSelectedCustomerId(newCustId);
    setCart((prevCart) =>
      prevCart.map((item) => {
        const newUnitPrice = getProductPriceForCustomer(item.product_id, newCustId);
        return {
          ...item,
          unit_price: newUnitPrice,
          subtotal: newUnitPrice * item.qty
        };
      })
    );
  };

  // Add product to cart
  const addToCart = (product, quantityToAdd = 1) => {
    const unitPrice = getProductPriceForCustomer(product.id, selectedCustomerId);
    
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.product_id === product.id);
      if (existing) {
        const newQty = existing.qty + quantityToAdd;
        return prevCart.map((i) =>
          i.product_id === product.id
            ? { ...i, qty: newQty, subtotal: newQty * i.unit_price }
            : i
        );
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            modal_price: product.modal_price,
            unit_price: unitPrice,
            qty: quantityToAdd,
            subtotal: unitPrice * quantityToAdd,
            stok_akhir: product.stok_akhir
          }
        ];
      }
    });
  };

  // Update quantity in cart
  const updateQty = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0
              ? { ...item, qty: newQty, subtotal: newQty * item.unit_price }
              : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const addWholesaleQty = (productId, amount) => {
    updateQty(productId, amount);
  };

  const updateItemPrice = (productId, newPrice) => {
    const val = Number(newPrice) || 0;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === productId
          ? { ...item, unit_price: val, subtotal: val * item.qty }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate totals
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalEstimatedProfit = cart.reduce(
    (acc, item) => acc + (item.subtotal - item.modal_price * item.qty),
    0
  );

  // Submit and Complete Transaction
  const handleConfirmPayment = async (paymentData) => {
    setIsSubmitting(true);
    try {
      const selectedCust = customers.find((c) => c.id === Number(selectedCustomerId));
      const payload = {
        date: txDate,
        customer_id: selectedCust ? selectedCust.id : null,
        customer_name_manual: selectedCust ? selectedCust.name : 'Umum',
        notes: paymentData.notes || `Metode: ${paymentData.paymentMethod}`,
        items: cart
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}

        const invRes = await fetch(`/api/invoices/${data.id}`).then((r) => r.json());
        setCompletedInvoice(invRes);
        setShowPaymentModal(false);
        setCart([]);
      } else {
        alert('Gagal menyimpan transaksi: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Koneksi gagal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
    let matchCat = true;
    if (activeCategory !== 'ALL') {
      matchCat = p.name.toUpperCase().includes(activeCategory);
    }
    return matchSearch && matchCat;
  });

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
      
      {/* Top Floating POS Context Bar */}
      <div className="b2b-card rounded-2xl p-3.5 sm:p-4 mb-4 border-l-4 border-l-amber-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Customer Selection (6 cols) */}
          <div className="md:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilih Pelanggan / Toko</span>
              </label>
              <span className="text-[10px] text-amber-400 font-bold">
                {selectedCustomerObj ? `Kode: ${selectedCustomerObj.code}` : ''}
              </span>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-slate-900 text-white pl-3 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 font-bold text-xs sm:text-sm cursor-pointer shadow-inner"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanggal Nota</span>
            </label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-semibold shadow-inner"
            />
          </div>

          {/* POS Status and Shortcut Guide (4 cols) */}
          <div className="md:col-span-4 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Status Terminal</div>
              <div className="text-xs font-black text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Kasir Siap Transaksi</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800" title="Shortcut Cari">
                F2 Cari
              </span>
              <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Shortcut Bayar">
                F9 Bayar
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* POS Workspace: Products Catalog (Left) & Live Register Stream (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          
          {/* Search Bar & View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari rokok (tekan F2 / ketik nama e.g. ESTE, SURYA, BALVER, MD...)"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full bg-slate-900 text-white pl-10 pr-20 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium shadow-inner"
              />
              {searchProduct && (
                <button 
                  onClick={() => setSearchProduct('')}
                  className="absolute right-2.5 top-2 text-[10px] uppercase font-bold text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md"
                >
                  Reset
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Tampilan Tabel Cepat"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const customerPrice = getProductPriceForCustomer(p.id, selectedCustomerId);
                const inCartItem = cart.find((i) => i.product_id === p.id);
                const isLowStock = (p.stok_akhir || 0) <= 5;

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
                      inCartItem
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800/90 hover:border-slate-700 active:scale-98'
                    }`}
                  >
                    {/* In Cart Pill Badge */}
                    {inCartItem && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow">
                        {inCartItem.qty}x
                      </span>
                    )}

                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-400 transition leading-snug line-clamp-2">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isLowStock ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          Stok: {p.stok_akhir ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">Harga Khusus</div>
                        <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                          {formatRupiah(customerPrice)}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW (High-Speed Table) */}
          {viewMode === 'list' && (
            <div className="b2b-card rounded-2xl overflow-hidden border border-slate-800 max-h-[560px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Nama Produk</th>
                    <th className="px-3 py-2.5 text-center">Stok</th>
                    <th className="px-3 py-2.5 text-right">Harga Pelanggan</th>
                    <th className="px-3 py-2.5 text-center">Tambah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {filteredProducts.map((p) => {
                    const price = getProductPriceForCustomer(p.id, selectedCustomerId);
                    const inCart = cart.find((i) => i.product_id === p.id);
                    return (
                      <tr 
                        key={p.id} 
                        onClick={() => addToCart(p, 1)}
                        className="hover:bg-slate-800/50 cursor-pointer transition"
                      >
                        <td className="px-3 py-2 font-sans font-bold text-slate-200">
                          {p.name}
                          {inCart && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">{inCart.qty}x</span>}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400">{p.stok_akhir ?? 0}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-400">{formatRupiah(price)}</td>
                        <td className="px-3 py-2 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(p, 1); }}
                            className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-xs"
                          >
                            +
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* RIGHT: Live Cash Register Slip (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 b2b-card rounded-3xl flex flex-col h-[670px] shadow-2xl border border-slate-800 overflow-hidden">
          
          {/* Slip Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="font-black text-white text-sm">Register Struk Kasir</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                {totalItemsCount} Slop
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold ml-1"
                >
                  Kosongkan
                </button>
              )}
            </div>
          </div>

          {/* Ticket Stream / Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 leading-snug">
                    {item.name}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Price and Stepper */}
                <div className="flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <span>@</span>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItemPrice(item.product_id, e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-xl p-0.5">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-black text-xs text-amber-400 font-mono">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Wholesale Quick Buttons */}
                <div className="flex items-center gap-1 pt-0.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Grosir:</span>
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWholesaleQty(item.product_id, amt)}
                      className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-900">
                  <span className="text-slate-500 text-[10px]">Subtotal:</span>
                  <span className="font-black text-slate-100 font-mono text-sm">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-20 text-amber-400" />
                <p className="text-sm font-bold text-slate-300">Belum Ada Item Belanja</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                  Klik pada katalog rokok di sebelah kiri untuk memasukkan barang ke nota.
                </p>
              </div>
            )}
          </div>

          {/* Register Footer */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Est. Margin Laba:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    +{formatRupiah(totalEstimatedProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-white pt-1 border-t border-slate-900">
                  <span className="font-black text-xs uppercase tracking-wider text-slate-300">TOTAL PEMBAYARAN:</span>
                  <span className="font-black text-xl sm:text-2xl text-amber-400 font-mono">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={isSubmitting}
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Bayar & Cetak Struk (F9)</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MODAL PEMBAYARAN & HITUNG KEMBALIAN */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={totalAmount}
          itemCount={cart.length}
          customerName={selectedCustomerObj?.name}
          customerCode={selectedCustomerObj?.code}
          isProcessing={isSubmitting}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* MODAL CETAK NOTA / STRUK RESMI */}
      {completedInvoice && (
        <ReceiptModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

    </div>
  );
}
