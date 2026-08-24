import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';
import ReceiptModal from '../components/ReceiptModal';

export default function KasirPOS() {
  const { eventCounter } = useRealtime();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pricingMatrix, setPricingMatrix] = useState({});

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [searchProduct, setSearchProduct] = useState('');
  const [activeBrandFilter, setActiveBrandFilter] = useState('ALL');

  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Load Customers, Products & Matrix
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

  // Brand quick filter categories based on 120 cigarette brands
  const brandFilters = [
    { id: 'ALL', label: 'Semua Produk' },
    { id: 'ESTE', label: 'ESTE / ESSE' },
    { id: 'ANG', label: 'ANG Series' },
    { id: 'SURYA', label: 'Surya / 54RYA' },
    { id: 'BALVER', label: 'BALVER' },
    { id: 'AVATAR', label: 'AVATAR' },
    { id: 'HM', label: 'HM / HMIN' },
    { id: 'MD', label: 'MD 16' },
    { id: 'LUXIO', label: 'LUXIO' }
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

  // Quick Wholesale Quantity Increments (+5, +10, +20, +50 slop)
  const addWholesaleQty = (productId, amount) => {
    updateQty(productId, amount);
  };

  // Update custom unit price directly in cart
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

  // Calculations
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalEstimatedProfit = cart.reduce(
    (acc, item) => acc + (item.subtotal - item.modal_price * item.qty),
    0
  );

  // Submit Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const selectedCust = customers.find((c) => c.id === Number(selectedCustomerId));
      const payload = {
        date: txDate,
        customer_id: selectedCust ? selectedCust.id : null,
        customer_name_manual: selectedCust ? selectedCust.name : 'Umum',
        notes,
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
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.75 } });
        } catch (e) {}

        const invRes = await fetch(`/api/invoices/${data.id}`).then((r) => r.json());
        setCompletedInvoice(invRes);
        setCart([]);
        setNotes('');
      } else {
        alert('Gagal membuat transaksi: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Koneksi gagal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by search and brand chip
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
    let matchBrand = true;
    if (activeBrandFilter !== 'ALL') {
      matchBrand = p.name.toUpperCase().includes(activeBrandFilter);
    }
    return matchSearch && matchBrand;
  });

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
      
      {/* Executive Customer & Transaction Header Bar */}
      <div className="b2b-card rounded-2xl p-4 sm:p-5 mb-5 border-l-4 border-l-amber-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Customer Selection (6 cols) */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Pelanggan / Toko Penerima</span>
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full bg-slate-900 text-white pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-500 font-bold text-sm cursor-pointer shadow-inner"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selector (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanggal Nota</span>
            </label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full bg-slate-900 text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-semibold shadow-inner"
            />
          </div>

          {/* Customer Pricing Tier Status (4 cols) */}
          <div className="md:col-span-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tier Harga Aktif</div>
              <div className="text-sm font-extrabold text-amber-400">
                {selectedCustomerObj ? `[${selectedCustomerObj.code}] ${selectedCustomerObj.name}` : '-'}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Otomatis Excel Matrix
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Screen: Product Selection (Left) & Sales Order Slip (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Catalog & Brand Filter (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik nama produk rokok (e.g. ESTE, 54RYA, SURYA, BALVER, MD 16...)"
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

          {/* Brand Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {brandFilters.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBrandFilter(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeBrandFilter === b.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const customerPrice = getProductPriceForCustomer(p.id, selectedCustomerId);
              const inCartItem = cart.find((i) => i.product_id === p.id);
              const isLowStock = (p.stok_akhir || 0) <= 5;
              const unitProfit = customerPrice - (p.modal_price || 0);

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p, 1)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    inCartItem
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Cart count badge */}
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950">
                      {inCartItem.qty} slop
                    </span>
                  )}

                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-400 transition leading-snug line-clamp-2">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isLowStock ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Sisa: {p.stok_akhir ?? 0}
                      </span>
                      {p.modal_price > 0 && (
                        <span className="text-[9px] text-slate-500">
                          HPP: {(p.modal_price / 1000).toLocaleString()}k
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-semibold">Harga Jual</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                        {formatRupiah(customerPrice)}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p, 1);
                      }}
                      className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition"
                      title="Tambah ke nota"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-xs">Tidak ada produk rokok yang sesuai dengan filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Wholesale Sales Order Slip (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 b2b-card rounded-2xl flex flex-col h-[680px] shadow-2xl">
          
          {/* Slip Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-white text-sm">Nota Belanja Grosir</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-slate-950">
                {totalItemsCount} Slop
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-medium ml-1"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="font-bold text-xs text-slate-200 leading-snug">
                    {item.name}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Price and Quantity Stepper */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <span>@</span>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItemPrice(item.product_id, e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-amber-400 font-mono">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Wholesale Quick Buttons (+5, +10, +25, +50 slop) */}
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Grosir:</span>
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addWholesaleQty(item.product_id, amt)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                {/* Item Subtotal */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-900">
                  <span className="text-slate-500 text-[10px]">Subtotal:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-20 text-amber-400" />
                <p className="text-xs font-bold text-slate-400">Belum Ada Produk Dipilih</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                  Klik pada katalog rokok di sebelah kiri untuk menambah kuantiti order.
                </p>
              </div>
            )}
          </div>

          {/* Slip Footer & Save Button */}
          {cart.length > 0 && (
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Est. Margin Laba:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    +{formatRupiah(totalEstimatedProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-white pt-1 border-t border-slate-900">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">TOTAL BAYAR:</span>
                  <span className="font-black text-lg sm:text-xl text-amber-400 font-mono">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Cetak Nota'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Modal Cetak Nota */}
      {completedInvoice && (
        <ReceiptModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

    </div>
  );
}
