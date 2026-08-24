import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Calendar, 
  Building2, 
  ArrowRight,
  Sparkles,
  Package,
  Layers,
  Flame,
  CheckCircle2,
  X,
  PlusCircle,
  Tag
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

  const categories = [
    { id: 'ALL', label: 'Semua' },
    { id: 'ESTE', label: 'ESTE / ESSE' },
    { id: 'SURYA', label: 'Surya' },
    { id: 'ANG', label: 'ANG' },
    { id: 'BALVER', label: 'BALVER' },
    { id: 'AVATAR', label: 'AVATAR' },
    { id: 'MD', label: 'MD 16' },
    { id: 'HM', label: 'HM' }
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
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
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
    <div className="max-w-md md:max-w-4xl mx-auto px-3 sm:px-6 py-3 space-y-3">
      
      {/* 1. COMPACT CUSTOMER SELECTOR & DATE BAR */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pilih Pelanggan / Toko</span>
          </label>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {selectedCustomerObj ? `Kode: ${selectedCustomerObj.code}` : 'Umum'}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-8">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-4">
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR & HORIZONTAL CATEGORY SWIPER */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari rokok (ESTE, SURYA, BALVER)..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="w-full bg-white text-slate-900 pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-xs"
          />
          {searchProduct && (
            <button 
              onClick={() => setSearchProduct('')}
              className="absolute right-2.5 top-2 text-slate-400 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 active:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MOBILE-OPTIMIZED 2-COLUMN PRODUCT GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {filteredProducts.map((p) => {
          const customerPrice = getProductPriceForCustomer(p.id, selectedCustomerId);
          const inCartItem = cart.find((i) => i.product_id === p.id);
          const isLowStock = (p.stok_akhir || 0) <= 5;

          return (
            <div
              key={p.id}
              onClick={() => addToCart(p, 1)}
              className={`bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between cursor-pointer select-none relative active:scale-97 shadow-xs ${
                inCartItem 
                  ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' 
                  : 'border-slate-200'
              }`}
            >
              {inCartItem && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
                  {inCartItem.qty}x
                </span>
              )}

              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug line-clamp-2 pr-6">
                  {p.name}
                </h4>
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isLowStock 
                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    Stok: {p.stok_akhir ?? 0}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Harga Jual</div>
                  <div className="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono">
                    {formatRupiah(customerPrice)}
                  </div>
                </div>

                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p, 1);
                  }}
                  className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 hover:bg-emerald-600 hover:text-white transition"
                >
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MOBILE STICKY CHECKOUT BAR (Floats above BottomNav) */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-30 p-2 max-w-md mx-auto">
          <div className="bg-slate-800 text-white p-3 rounded-2xl border border-slate-700 flex items-center justify-between shadow-2xl">
            
            <div 
              onClick={() => setShowCartDrawer(true)}
              className="cursor-pointer flex items-center space-x-2.5 pl-1"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {totalItemsCount}
              </div>
              <div>
                <div className="text-[10px] text-slate-300 font-bold uppercase">{cart.length} Jenis Produk</div>
                <div className="text-base font-extrabold text-white font-mono leading-tight">
                  {formatRupiah(totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pr-1">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200"
              >
                Rincian
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
              >
                <span>Bayar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MOBILE BOTTOM SHEET CART DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t border-slate-200 flex flex-col max-h-[80vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Rincian Nota Belanja ({totalItemsCount} Slop)</h3>
              </div>
              <button onClick={() => setShowCartDrawer(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
              {cart.map((item) => (
                <div key={item.product_id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs text-slate-800 leading-snug">{item.name}</div>
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

                  <div className="flex items-center gap-1 pt-0.5">
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

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px]">Subtotal:</span>
                    <span className="font-bold text-slate-800 font-mono">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 space-y-3 pb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase">TOTAL PEMBAYARAN:</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono">{formatRupiah(totalAmount)}</span>
              </div>
              <button
                onClick={() => {
                  setShowCartDrawer(false);
                  setShowPaymentModal(true);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md"
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
