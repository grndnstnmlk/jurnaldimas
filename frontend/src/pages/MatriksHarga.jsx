import React, { useState, useEffect } from 'react';
import { 
  TableProperties, 
  Search, 
  Save, 
  Check, 
  HelpCircle,
  RefreshCw
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

  // Editing state for active cell
  const [editingCell, setEditingCell] = useState(null); // { prodId, custId }
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
    // Values in matrix are stored in full rupiah (multiplied by 1000 if entered as thousands)
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
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Memuat matriks harga 120 produk x 26 pelanggan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Matriks Harga Khusus Pelanggan</h1>
          <p className="text-sm text-slate-400">
            Tabel harga jual tier per pelanggan (Klik pada sel angka untuk mengubah harga secara instan)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
            💡 Masukkan angka ribuan (Contoh: 67 = Rp 67.000)
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari baris produk (120 produk)..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter kolom pelanggan (26 pelanggan)..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="w-full bg-slate-900 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Matrix Interactive Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 sticky top-0 z-20 shadow-md">
              <tr className="border-b border-slate-800 text-slate-300 uppercase">
                <th className="px-4 py-3 sticky left-0 z-30 bg-slate-900 min-w-[200px] border-r border-slate-800 font-bold">
                  Nama Produk
                </th>
                <th className="px-3 py-3 text-right bg-slate-900 min-w-[90px] border-r border-slate-800 text-blue-400 font-bold">
                  Modal (HPP)
                </th>
                {filteredCustomers.map((c) => (
                  <th 
                    key={c.id} 
                    className="px-3 py-3 text-center min-w-[85px] border-r border-slate-800 font-bold"
                    title={c.name}
                  >
                    <div className="text-amber-400 font-mono text-sm">{c.code}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[75px]">{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition">
                  
                  {/* Sticky Product Column */}
                  <td className="px-4 py-2.5 font-sans font-bold text-slate-200 sticky left-0 z-10 bg-slate-950/90 border-r border-slate-800">
                    {p.name}
                  </td>

                  {/* Modal Price Column */}
                  <td className="px-3 py-2.5 text-right text-slate-400 border-r border-slate-800 bg-slate-950/40 font-semibold">
                    {p.modal_price ? (p.modal_price / 1000).toLocaleString() : '0'}k
                  </td>

                  {/* Customer Specific Price Cells */}
                  {filteredCustomers.map((c) => {
                    const key = `${p.id}_${c.id}`;
                    const price = matrix[key];
                    const isEditing = editingCell?.prodId === p.id && editingCell?.custId === c.id;
                    const isJustSaved = savedBadge === key;

                    return (
                      <td
                        key={c.id}
                        onClick={() => !isEditing && handleCellClick(p.id, c.id, price)}
                        className={`px-2 py-1.5 text-center border-r border-slate-800 cursor-pointer transition ${
                          isEditing
                            ? 'bg-amber-500/20'
                            : isJustSaved
                            ? 'bg-emerald-500/30'
                            : price > 0
                            ? 'hover:bg-slate-800 text-slate-100'
                            : 'text-slate-600 hover:bg-slate-800/40'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
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
                              className="w-16 bg-slate-900 border border-amber-500 text-amber-300 font-bold px-1.5 py-0.5 rounded text-center text-xs focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="font-semibold">
                            {price > 0 ? (
                              <span className="text-emerald-400">{(price / 1000).toLocaleString()}k</span>
                            ) : (
                              <span className="text-slate-600">-</span>
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
