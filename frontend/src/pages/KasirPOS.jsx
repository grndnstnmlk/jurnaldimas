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
  Sparkles,
  Package,
  Layers
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
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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

      // Default select first customer if none
      if (!selectedCustomerId && resCust.length > 0) {
        setSelectedCustomerId(resCust[0].id);
      }
    } catch (err) {
      console.error('Error fetching POS data:', err);
    }
  };

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
  const addToCart = (product) => {
    const unitPrice = getProductPriceForCustomer(product.id, selectedCustomerId);
    
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.product_id === product.id);
      if (existing) {
        return prevCart.map((i) =>
          i.product_id === product.id
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unit_price }
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
            qty: 1,
            subtotal: unitPrice,
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

  // Update custom unit price directly in cart if needed
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

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((i) => i.product_id !== productId));
  };

  // Clear Cart
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

  // Submit Transaction / Checkout
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
        // Trigger celebratory confetti effect
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}

        // Fetch full invoice detail for print receipt
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

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const selectedCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Top Banner / Customer & Date Selection */}
      <div className="glass-panel p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Pilih Pelanggan (Harga Otomatis Menyesuaikan)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-amber-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-slate-900/90 text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 font-semibold text-sm cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tanggal Transaksi
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full bg-slate-900/90 text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 text-sm font-semibold"
            />
          </div>
        </div>

        {/* Selected Customer Price Profile Info */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Kode & Profil Pelanggan</div>
            <div className="text-sm font-bold text-amber-400">
              {selectedCustomerObj ? `[${selectedCustomerObj.code}] ${selectedCustomerObj.name}` : '-'}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Matriks Aktif
          </span>
        </div>
      </div>

      {/* Main Grid: Products Catalog (Left) & Live Cart Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Product Catalog (7 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari dari 120+ produk rokok (e.g. 54RYA, ESTE, MD 16, SURYA...)"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-slate-900 text-white pl-12 pr-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm shadow-inner"
            />
            {searchProduct && (
              <button 
                onClick={() => setSearchProduct('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md"
              >
                Clear
              </button>
            )}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const customerPrice = getProductPriceForCustomer(p.id, selectedCustomerId);
              const inCartItem = cart.find((i) => i.product_id === p.id);
              const isLowStock = (p.stok_akhir || 0) <= 5;

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    inCartItem
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* In Cart Badge */}
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow">
                      {inCartItem.qty}x
                    </span>
                  )}

                  <div>
                    <div className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition leading-snug line-clamp-2">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isLowStock ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Stok: {p.stok_akhir ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Harga Pelanggan</div>
                      <div className="text-sm font-extrabold text-emerald-400">
                        {formatRupiah(customerPrice)}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p);
                      }}
                      className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>Tidak ada produk yang cocok dengan pencarian "{searchProduct}"</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Order Cart & Checkout Drawer (5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[700px]">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Keranjang Nota</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                {totalItemsCount} item
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-xs sm:text-sm text-slate-200 leading-snug">
                    {item.name}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Unit Price (Editable) */}
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span>@</span>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItemPrice(item.product_id, e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-200 text-xs font-mono font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="p-1 rounded text-slate-300 hover:bg-slate-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-amber-400">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="p-1 rounded text-slate-300 hover:bg-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

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
                <ShoppingCart className="w-12 h-12 mb-3 opacity-30 text-amber-400" />
                <p className="text-sm font-medium">Keranjang masih kosong</p>
                <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
                  Pilih produk di sebelah kiri untuk menambahkan ke nota.
                </p>
              </div>
            )}
          </div>

          {/* Cart Footer / Summary & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              {/* Summary details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Estimasi Laba Kotor:</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatRupiah(totalEstimatedProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-white">
                  <span className="font-bold text-sm">TOTAL PEMBAYARAN:</span>
                  <span className="font-black text-lg sm:text-xl text-amber-400 font-mono">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={isSubmitting}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98 disabled:opacity-50"
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
