import React, { useState, useEffect } from 'react';
import { 
  TableProperties, 
  Search, 
  Save, 
  Check, 
  HelpCircle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { useRealtime } from '../context/RealtimeContext';

export default function MatriksHarga() {
  const { eventCounter } = useRealtime();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-600">Memuat matriks harga 120 produk...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Matriks Harga Pelanggan</h1>
          <p className="text-xs text-slate-500">
            Tabel harga tier khusus per pelanggan (Klik sel harga untuk mengubah angka)
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start">
          💡 Ketik ribuan (Contoh: 67 = Rp 67.000)
        </span>
      </div>

      {/* Filters */}
      <div className="fintech-card p-3.5 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari baris produk (120 produk)..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter kolom pelanggan..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="fintech-card rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200">
              <tr className="text-slate-500 uppercase">
                <th className="px-4 py-3 sticky left-0 z-30 bg-slate-50 min-w-[180px] border-r border-slate-200 font-bold">
                  Nama Produk
                </th>
                <th className="px-3 py-3 text-right bg-slate-50 min-w-[80px] border-r border-slate-200 text-slate-600 font-bold">
                  HPP
                </th>
                {filteredCustomers.map((c) => (
                  <th 
                    key={c.id} 
                    className="px-2.5 py-3 text-center min-w-[75px] border-r border-slate-200 font-bold"
                    title={c.name}
                  >
                    <div className="text-emerald-700 font-mono text-xs font-black">{c.code}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[65px] font-sans">{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2 font-sans font-bold text-slate-800 sticky left-0 z-10 bg-white border-r border-slate-100">
                    {p.name}
                  </td>

                  <td className="px-3 py-2 text-right text-slate-400 border-r border-slate-100 font-semibold bg-slate-50/50">
                    {p.modal_price ? (p.modal_price / 1000).toLocaleString() : '0'}k
                  </td>

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
                            ? 'hover:bg-emerald-50/40 text-slate-900'
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
                              <span className="text-emerald-600">{(price / 1000).toLocaleString()}k</span>
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
  );
}
