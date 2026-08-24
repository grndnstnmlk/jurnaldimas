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
  ChevronRight,
  Zap,
  Star,
  CheckCircle2,
  X
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
  const [dashboardStats, setDashboardStats] = useState({ total_omset: 0, today_omset: 0, today_invoices: 0 });

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [eventCounter]);

  const fetchData = async () => {
    try {
      const [resCust, resProd, resMatrix, resDash] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/pricing-matrix').then(r => r.json()),
        fetch('/api/dashboard').then(r => r.json())
      ]);
      setCustomers(resCust);
      setProducts(resProd);
      setPricingMatrix(resMatrix.matrix || {});
      if (resDash?.totalStats) {
        setDashboardStats({
          total_omset: resDash.totalStats.total_omset || 0,
          today_omset: resDash.todayStats?.today_omset || 0,
          today_invoices: resDash.todayStats?.today_invoices || 0
        });
      }

      if (!selectedCustomerId && resCust.length > 0) {
        setSelectedCustomerId(resCust[0].id);
      }
    } catch (err) {
      console.error('Error fetching POS data:', err);
    }
  };

  // Cigarette Category Grid Icons (Matching Reference App Image)
  const categoryTiles = [
    { id: 'ALL', label: 'Semua Produk', icon: Layers, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'ESTE', label: 'ESTE / ESSE', icon: Flame, color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { id: 'SURYA', label: 'Surya & 54RYA', icon: Star, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'ANG', label: 'ANG Series', icon: Package, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'BALVER', label: 'BALVER', icon: Zap, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { id: 'AVATAR', label: 'AVATAR', icon: Sparkles, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { id: 'MD', label: 'MD 16', icon: Tag, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { id: 'HM', label: 'HM & HMIN', icon: LayoutGrid, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
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

  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalEstimatedProfit = cart.reduce(
    (acc, item) => acc + (item.subtotal - item.modal_price * item.qty),
    0
  );

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
        setShowCartDrawer(false);
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

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
    let matchCat = true;
    if (selectedCategory !== 'ALL') {
      matchCat = p.name.toUpperCase().includes(selectedCategory);
    }
    return matchSearch && matchCat;
  });

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      
      {/* 1. HERO BALANCE CARD (Exact visual style from reference image) */}
      <div className="fintech-card p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Omset Penjualan
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight mt-0.5">
            {formatRupiah(dashboardStats.total_omset)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Kasir Online Real-time CV. Master Cigarettes</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => searchInputRef.current?.focus()}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* 2. CUSTOMER & DATE BAR */}
      <div className="fintech-card p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Pilih Pelanggan (Harga Otomatis Menyesuaikan)
          </label>
          <div className="relative">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tanggal Nota
          </label>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm font-semibold shadow-xs"
          />
        </div>
      </div>

      {/* 3. CATEGORY BENTO ICONS GRID (Exact layout from reference image) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
            Kategori Produk Rokok
          </h2>
          <span className="text-xs text-slate-500">
            {products.length} Produk Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
          {categoryTiles.map((tile) => {
            const Icon = tile.icon;
            const isSelected = selectedCategory === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => setSelectedCategory(tile.id)}
                className={`fintech-card fintech-card-interactive p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center text-center transition ${
                  isSelected 
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/40 shadow-sm' 
                    : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 border ${tile.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] sm:text-xs font-bold leading-tight line-clamp-1 ${
                  isSelected ? 'text-emerald-700 font-extrabold' : 'text-slate-700'
                }`}>
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PRODUCT SEARCH & CATALOG LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <span>Daftar Produk</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {filteredProducts.length}
            </span>
          </h2>

          {/* Search Bar */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari rokok (e.g. ESTE, SURYA...)"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-white text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-xs shadow-xs"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const customerPrice = getProductPriceForCustomer(p.id, selectedCustomerId);
            const inCartItem = cart.find((i) => i.product_id === p.id);
            const isLowStock = (p.stok_akhir || 0) <= 5;

            return (
              <div
                key={p.id}
                className={`fintech-card p-4 rounded-2xl bg-white transition-all flex flex-col justify-between ${
                  inCartItem ? 'border-emerald-400 ring-1 ring-emerald-400 bg-emerald-50/10' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-slate-900 leading-snug">
                      {p.name}
                    </div>
                    {inCartItem && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs">
                        {inCartItem.qty}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isLowStock ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Stok: {p.stok_akhir ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tier: {selectedCustomerObj ? selectedCustomerObj.code : 'Umum'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Harga Jual</span>
                    <span className="text-base font-black text-emerald-600 font-mono">
                      {formatRupiah(customerPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inCartItem ? (
                      <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQty(p.id, -1)}
                          className="p-1 rounded-lg bg-white shadow-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-slate-900 font-mono">
                          {inCartItem.qty}
                        </span>
                        <button
                          onClick={() => updateQty(p.id, 1)}
                          className="p-1 rounded-lg bg-emerald-500 text-white shadow-xs hover:bg-emerald-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white font-bold text-xs transition flex items-center gap-1 border border-emerald-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. FLOATING BOTTOM CART BAR (Active when cart has items) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-5xl mx-auto">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-800">
            
            <div 
              onClick={() => setShowCartDrawer(true)}
              className="cursor-pointer flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                {totalItemsCount}
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase">Total Tagihan ({cart.length} item)</div>
                <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                  {formatRupiah(totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="hidden sm:inline-flex px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Rincian
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>Bayar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. CART DETAILS DRAWER / MODAL */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Rincian Nota Penjualan</h3>
              </div>
              <button onClick={() => setShowCartDrawer(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {cart.map((item) => (
                <div key={item.product_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs sm:text-sm text-slate-800">{item.name}</div>
                    <button onClick={() => removeFromCart(item.product_id)} className="text-slate-400 hover:text-rose-500 p-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-mono">
                      @ {formatRupiah(item.unit_price)}
                    </div>
                    <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.product_id, -1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-900 font-mono">{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Grosir:</span>
                    {[5, 10, 20, 50].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => addWholesaleQty(item.product_id, amt)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-400 text-[10px]">Subtotal:</span>
                    <span className="font-black text-slate-900 font-mono">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase">TOTAL PEMBAYARAN:</span>
                <span className="text-xl font-black text-emerald-600 font-mono">{formatRupiah(totalAmount)}</span>
              </div>
              <button
                onClick={() => {
                  setShowCartDrawer(false);
                  setShowPaymentModal(true);
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Lanjut Pembayaran</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. PAYMENT MODAL */}
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

      {/* 8. RECEIPT NOTA PRINT MODAL */}
      {completedInvoice && (
        <ReceiptModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

    </div>
  );
}
