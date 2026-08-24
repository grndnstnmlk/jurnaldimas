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
  TrendingUp,
  Receipt,
  Banknote,
  Flame,
  LayoutGrid,
  Zap,
  Star,
  CheckCircle2,
  X,
  PlusCircle
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

  // Confetti Category Pills matching Ctrl Design System (Sticker Yellow, Cotton Pink, Powder Blue, Bone)
  const categoryTiles = [
    { id: 'ALL', label: 'Semua Produk', bg: 'bg-[#ffffff]', border: 'border-[#0f0f0f]' },
    { id: 'ESTE', label: 'ESTE / ESSE', bg: 'bg-[#fcea59]', border: 'border-[#0f0f0f]' },
    { id: 'SURYA', label: 'Surya & 54RYA', bg: 'bg-[#ffd0e2]', border: 'border-[#0f0f0f]' },
    { id: 'ANG', label: 'ANG Series', bg: 'bg-[#a7cbf6]', border: 'border-[#0f0f0f]' },
    { id: 'BALVER', label: 'BALVER', bg: 'bg-[#ecefec]', border: 'border-[#0f0f0f]' },
    { id: 'AVATAR', label: 'AVATAR', bg: 'bg-[#ffd0e2]', border: 'border-[#0f0f0f]' },
    { id: 'MD', label: 'MD 16', bg: 'bg-[#fcea59]', border: 'border-[#0f0f0f]' },
    { id: 'HM', label: 'HM & HMIN', bg: 'bg-[#a7cbf6]', border: 'border-[#0f0f0f]' }
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

  const clearCart = () => {
    setCart([]);
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* 1. HERO SECTION: DISPLAY HEADLINE & CHROMATIC CONFETTI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Main Display Omset Card (Cotton Pink Confetti Card) */}
        <div className="md:col-span-7 bg-[#ffd0e2] rounded-[17.5px] border border-[#0f0f0f] p-6 flex flex-col justify-between">
          <div>
            <div className="inline-block px-3 py-1 rounded-[14px] bg-[#ffffff] border border-[#0f0f0f] text-[11px] font-bold text-[#0f0f0f] uppercase tracking-wider mb-2">
              Akumulasi Omset
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f0f0f] tracking-tight leading-[0.9] mt-1 font-sans">
              {formatRupiah(dashboardStats.total_omset)}
            </div>
            <p className="text-xs text-[#5a585a] mt-2 font-medium">
              Sistem kasir real-time & pencatatan jurnal terpadu CV. Master Cigarettes.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="ctrl-btn-lime flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Transaksi</span>
            </button>
          </div>
        </div>

        {/* Customer & Date Selector (Sticker Yellow Confetti Card) */}
        <div className="md:col-span-5 bg-[#fcea59] rounded-[17.5px] border border-[#0f0f0f] p-6 flex flex-col justify-between">
          <div>
            <div className="inline-block px-3 py-1 rounded-[14px] bg-[#ffffff] border border-[#0f0f0f] text-[11px] font-bold text-[#0f0f0f] uppercase tracking-wider mb-2">
              Pilih Pelanggan
            </div>
            <h3 className="text-xl font-bold text-[#0f0f0f] leading-tight">
              [{selectedCustomerObj ? selectedCustomerObj.code : '-'}] {selectedCustomerObj ? selectedCustomerObj.name : 'Umum'}
            </h3>
            <p className="text-xs text-[#5a585a] mt-1">
              Matriks harga khusus aktif otomatis per akun toko.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-[#ffffff] text-[#0f0f0f] px-3.5 py-2.5 rounded-[35px] border border-[#0f0f0f] font-bold text-xs cursor-pointer focus:outline-none"
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
              className="w-full bg-[#ffffff] text-[#0f0f0f] px-3.5 py-2 rounded-[35px] border border-[#0f0f0f] text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* 2. CATEGORY CONFETTI CHIPS (Flat, Border-driven, 14-17.5px Radii) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0f0f0f] tracking-tight">
            Kategori Seri Rokok
          </h2>
          <span className="text-xs text-[#5a585a] font-medium">
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
                className={`px-4 py-2 rounded-[35px] text-xs font-bold whitespace-nowrap transition-all border ${tile.border} ${tile.bg} ${
                  isSelected 
                    ? 'ring-2 ring-[#0f0f0f] font-black scale-105 shadow-xs' 
                    : 'opacity-85 hover:opacity-100 hover:scale-102'
                }`}
              >
                {tile.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRODUCT CATALOG (Pure White Cards, 17.5px Radius, 1px #0f0f0f Border) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-[#0f0f0f] tracking-tight">
              Katalog Produk
            </h2>
            <span className="px-2.5 py-0.5 rounded-[14px] bg-[#ecefec] text-[#0f0f0f] text-xs font-bold border border-[#0f0f0f]/20">
              {filteredProducts.length}
            </span>
          </div>

          {/* Search Input (35px Radius Pill) */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#5a585a]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari rokok (e.g. ESTE, SURYA)..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-[#ffffff] text-[#0f0f0f] pl-10 pr-4 py-2 rounded-[35px] border border-[#0f0f0f] text-xs font-medium focus:outline-none"
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
                className={`bg-[#ffffff] rounded-[17.5px] border p-5 transition flex flex-col justify-between ${
                  inCartItem ? 'border-[#0f0f0f] ring-2 ring-[#0f0f0f] bg-[#f9faf9]' : 'border-[#0f0f0f]/30 hover:border-[#0f0f0f]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#0f0f0f] leading-snug">
                      {p.name}
                    </h4>
                    {inCartItem && (
                      <span className="px-2.5 py-0.5 rounded-[14px] bg-[#05c92f] text-[#0f0f0f] text-[10px] font-black border border-[#0f0f0f]">
                        {inCartItem.qty}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[14px] border ${
                      isLowStock 
                        ? 'bg-[#ffd0e2] text-[#0f0f0f] border-[#0f0f0f]' 
                        : 'bg-[#ecefec] text-[#5a585a] border-[#0f0f0f]/20'
                    }`}>
                      Stok: {p.stok_akhir ?? 0}
                    </span>
                    <span className="text-[10px] text-[#5a585a]">
                      Tier: {selectedCustomerObj ? selectedCustomerObj.code : 'Umum'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#0f0f0f]/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#5a585a] uppercase font-bold block">Harga Jual</span>
                    <span className="text-base font-black text-[#0f0f0f] font-mono">
                      {formatRupiah(customerPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inCartItem ? (
                      <div className="flex items-center space-x-1 bg-[#ecefec] rounded-[35px] p-1 border border-[#0f0f0f]">
                        <button
                          onClick={() => updateQty(p.id, -1)}
                          className="w-6 h-6 rounded-full bg-[#ffffff] text-[#0f0f0f] font-bold flex items-center justify-center hover:bg-[#ffd0e2] transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-[#0f0f0f] font-mono">
                          {inCartItem.qty}
                        </span>
                        <button
                          onClick={() => updateQty(p.id, 1)}
                          className="w-6 h-6 rounded-full bg-[#0f0f0f] text-[#ffffff] font-bold flex items-center justify-center hover:bg-[#05c92f] hover:text-[#0f0f0f] transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="px-4 py-1.5 rounded-[35px] bg-[#0f0f0f] hover:bg-[#000000] text-[#ffffff] font-bold text-xs border border-[#0f0f0f] transition flex items-center gap-1 active:scale-95"
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

      {/* 4. FLOATING CHECKOUT BAR (Black Pill with Acid Lime CTA) */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-[1200px] mx-auto">
          <div className="bg-[#0f0f0f] text-[#ffffff] p-4 rounded-[53px] border border-[#0f0f0f] flex items-center justify-between shadow-2xl">
            
            <div 
              onClick={() => setShowCartDrawer(true)}
              className="cursor-pointer flex items-center space-x-3.5 pl-2"
            >
              <div className="w-10 h-10 rounded-full bg-[#05c92f] text-[#0f0f0f] flex items-center justify-center font-black text-sm border border-[#0f0f0f]">
                {totalItemsCount}
              </div>
              <div>
                <div className="text-[11px] text-[#ecefec] font-bold uppercase">Total Tagihan ({cart.length} item)</div>
                <div className="text-xl font-black text-[#ffffff] font-mono">
                  {formatRupiah(totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-1">
              <button
                onClick={() => setShowCartDrawer(true)}
                className="hidden sm:inline-flex px-4 py-2.5 rounded-[35px] bg-[#222222] hover:bg-[#333333] text-xs font-bold text-[#ffffff]"
              >
                Rincian
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="ctrl-btn-lime flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#ffffff] rounded-t-[26px] sm:rounded-[26px] border border-[#0f0f0f] flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
            
            <div className="p-4 border-b border-[#0f0f0f]/10 flex items-center justify-between bg-[#ecefec]">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-[#0f0f0f]" />
                <h3 className="font-extrabold text-[#0f0f0f] text-base">Rincian Nota Kasir</h3>
              </div>
              <button onClick={() => setShowCartDrawer(false)} className="p-1.5 rounded-full hover:bg-[#ffffff] text-[#0f0f0f]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#f9faf9]">
              {cart.map((item) => (
                <div key={item.product_id} className="p-3.5 rounded-[17.5px] bg-[#ffffff] border border-[#0f0f0f]/15 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs sm:text-sm text-[#0f0f0f]">{item.name}</div>
                    <button onClick={() => removeFromCart(item.product_id)} className="text-[#5a585a] hover:text-rose-600 p-0.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#5a585a] font-mono">
                      @ {formatRupiah(item.unit_price)}
                    </div>
                    <div className="flex items-center space-x-1 bg-[#ecefec] border border-[#0f0f0f]/20 rounded-[35px] p-0.5">
                      <button onClick={() => updateQty(item.product_id, -1)} className="p-1 text-[#0f0f0f] hover:bg-[#ffffff] rounded-full">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-[#0f0f0f] font-mono">{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="p-1 text-[#0f0f0f] hover:bg-[#ffffff] rounded-full">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-[9px] text-[#5a585a] font-bold uppercase">Grosir:</span>
                    {[5, 10, 20, 50].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => addWholesaleQty(item.product_id, amt)}
                        className="px-2 py-0.5 rounded-[14px] text-[9px] font-bold bg-[#ffffff] hover:bg-[#fcea59] text-[#0f0f0f] border border-[#0f0f0f] transition"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[#0f0f0f]/10">
                    <span className="text-[#5a585a] text-[10px]">Subtotal:</span>
                    <span className="font-black text-[#0f0f0f] font-mono">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#ecefec] border-t border-[#0f0f0f]/10 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#5a585a] uppercase">TOTAL PEMBAYARAN:</span>
                <span className="text-2xl font-black text-[#0f0f0f] font-mono">{formatRupiah(totalAmount)}</span>
              </div>
              <button
                onClick={() => {
                  setShowCartDrawer(false);
                  setShowPaymentModal(true);
                }}
                className="w-full ctrl-btn-lime flex items-center justify-center space-x-2"
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
