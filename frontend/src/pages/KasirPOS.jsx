import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Calendar, 
  Tag, 
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Building2,
  Receipt,
  Banknote,
  Flame,
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

  // Category filter list
  const categoryTiles = [
    { id: 'ALL', label: 'Semua Produk' },
    { id: 'ESTE', label: 'ESTE / ESSE' },
    { id: 'SURYA', label: 'Surya & 54RYA' },
    { id: 'ANG', label: 'ANG Series' },
    { id: 'BALVER', label: 'BALVER' },
    { id: 'AVATAR', label: 'AVATAR' },
    { id: 'MD', label: 'MD 16' },
    { id: 'HM', label: 'HM & HMIN' }
  ];

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

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((i) => i.product_id !== productId));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* 1. TOP HERO SUMMARY (Soft Tinted Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Omset Total (Soft Mint Green) */}
        <div className="md:col-span-7 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 p-6 flex flex-col justify-between">
          <div>
            <div className="inline-block px-3 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              Akumulasi Omset Penjualan
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-900 tracking-tight font-sans">
              {formatRupiah(dashboardStats.total_omset)}
            </div>
            <p className="text-xs text-emerald-700/80 mt-1 font-medium">
              Sistem kasir real-time & pencatatan jurnal terpadu CV. Master Cigarettes.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Transaksi Baru</span>
            </button>
          </div>
        </div>

        {/* Customer & Date Selector (Soft Sky Blue) */}
        <div className="md:col-span-5 bg-sky-50/80 rounded-2xl border border-sky-200/80 p-6 flex flex-col justify-between">
          <div>
            <div className="inline-block px-3 py-1 rounded-lg bg-sky-100/90 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
              Pilih Pelanggan
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              [{selectedCustomerObj ? selectedCustomerObj.code : '-'}] {selectedCustomerObj ? selectedCustomerObj.name : 'Umum'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriks harga khusus aktif otomatis per pelanggan.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-white text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer focus:outline-none focus:border-sky-400"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full bg-white text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

      </div>

      {/* 2. CATEGORY PILLS (Soft Pastel Chips) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            Kategori Seri Rokok
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {products.length} Macam Produk
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categoryTiles.map((tile) => {
            const isSelected = selectedCategory === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => setSelectedCategory(tile.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {tile.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRODUCT CATALOG (Soft White Cards) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-800">
              Katalog Produk
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
              {filteredProducts.length}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari rokok (e.g. ESTE, SURYA)..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-white text-slate-800 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-xs"
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
                className={`bg-white rounded-2xl border p-4 transition-all flex flex-col justify-between shadow-xs ${
                  inCartItem 
                    ? 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-800 leading-snug">
                      {p.name}
                    </h4>
                    {inCartItem && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        {inCartItem.qty}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isLowStock 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-100 text-slate-600'
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
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      {formatRupiah(customerPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inCartItem ? (
                      <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => updateQty(p.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-slate-800 font-mono">
                          {inCartItem.qty}
                        </span>
                        <button
                          onClick={() => updateQty(p.id, 1)}
                          className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center hover:bg-emerald-700 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs border border-emerald-200 transition flex items-center gap-1 active:scale-95"
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

      {/* 4. FLOATING CHECKOUT BAR (Soft Slate-800 Bar) */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-6xl mx-auto">
          <div className="bg-slate-800 text-white p-4 rounded-2xl border border-slate-700 flex items-center justify-between shadow-xl">
            
            <div 
              onClick={() => setShowCartDrawer(true)}
              className="cursor-pointer flex items-center space-x-3.5 pl-2"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                {totalItemsCount}
              </div>
              <div>
                <div className="text-[11px] text-slate-300 font-semibold uppercase">Total Tagihan ({cart.length} item)</div>
                <div className="text-xl font-bold text-white font-mono">
                  {formatRupiah(totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-1">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="hidden sm:inline-flex px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200"
              >
                Rincian
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-md"
              >
                <span>Bayar & Cetak Nota</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. CART DETAILS DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Rincian Nota Kasir</h3>
              </div>
              <button onClick={() => setShowCartDrawer(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
              {cart.map((item) => (
                <div key={item.product_id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs sm:text-sm text-slate-800">{item.name}</div>
                    <button onClick={() => removeFromCart(item.product_id)} className="text-slate-400 hover:text-rose-600 p-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-mono">
                      @ {formatRupiah(item.unit_price)}
                    </div>
                    <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.product_id, -1)} className="p-1 text-slate-600 hover:bg-white rounded">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-800 font-mono">{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="p-1 text-slate-600 hover:bg-white rounded">
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
                        className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px]">Subtotal:</span>
                    <span className="font-bold text-slate-800 font-mono">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase">TOTAL PEMBAYARAN:</span>
                <span className="text-2xl font-extrabold text-emerald-700 font-mono">{formatRupiah(totalAmount)}</span>
              </div>
              <button
                onClick={() => {
                  setShowCartDrawer(false);
                  setShowPaymentModal(true);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Lanjut Pembayaran</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. PAYMENT MODAL */}
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

      {/* 7. RECEIPT MODAL */}
      {completedInvoice && (
        <ReceiptModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

    </div>
  );
}
