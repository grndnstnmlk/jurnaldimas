import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Edit, 
  Save, 
  Building2, 
  Receipt, 
  Check, 
  Calendar,
  AlertCircle,
  Crosshair,
  Compass,
  Navigation
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

// Robust Google Maps URL Parser (Supports raw coordinates, DMS, short links, geo URIs, and full URLs)
export const parseGoogleMapsUrl = (input, fallbackAddress = '', customerName = '') => {
  const raw = String(input || '').trim();
  
  if (raw) {
    // 1. If it's already a full HTTP/HTTPS URL
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    
    // 2. If it's a domain without protocol (e.g., maps.app.goo.gl/..., goo.gl/maps/..., maps.google.com/...)
    if (
      raw.startsWith('maps.app.goo.gl') || 
      raw.startsWith('goo.gl/maps') || 
      raw.startsWith('google.com/maps') || 
      raw.startsWith('www.google.com/maps') ||
      raw.startsWith('maps.google.')
    ) {
      return `https://${raw}`;
    }

    // 3. If it starts with geo: (e.g., geo:-7.2575,112.7521)
    if (raw.toLowerCase().startsWith('geo:')) {
      const coords = raw.replace(/^geo:/i, '').trim();
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
    }

    // 4. If it's coordinates: e.g. "-7.2575, 112.7521" or "-7.2575,112.7521" or "-7.2575 112.7521"
    const coordPattern = /([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)/;
    const coordMatch = raw.match(coordPattern);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    // 5. If it contains DMS coordinates e.g. 7°15'27.0"S 112°45'07.6"E
    if (raw.includes('°') || raw.includes('"') || raw.includes("'")) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
    }

    // 6. Generic query / location name
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
  }

  // Fallback to text address or store name
  const query = (fallbackAddress || customerName || '').trim();
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return null;
};

// Helper to format WhatsApp link
export const parseWhatsAppLink = (phone) => {
  if (!phone) return null;
  let clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean ? `https://wa.me/${clean}` : null;
};

export default function CustomerDetailModal({ customerId, onClose, onCustomerUpdated }) {
  const { isAdmin } = useAuth();
  const { eventCounter } = useRealtime();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMapsUrl, setEditMapsUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetail();
    }
  }, [customerId, eventCounter]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (data && !data.error) {
        setCustomer(data);
        setEditName(data.name || '');
        setEditCode(data.code || '');
        setEditPhone(data.phone || '');
        setEditAddress(data.address || '');
        setEditMapsUrl(data.maps_url || '');
        setEditNotes(data.notes || '');
      } else {
        setErrorMsg(data.error || 'Pelanggan tidak ditemukan');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName || !editCode) {
      setErrorMsg('Kode dan Nama toko wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
          maps_url: editMapsUrl.trim(),
          notes: editNotes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Data pelanggan berhasil diperbarui!');
        setIsEditing(false);
        fetchCustomerDetail();
        if (onCustomerUpdated) onCustomerUpdated();
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan perubahan.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Get current device GPS coordinates
  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setEditMapsUrl(`${lat}, ${lng}`);
        setIsGettingGps(false);
        alert(`Titik koordinat berhasil didapatkan: ${lat}, ${lng}`);
      },
      (err) => {
        setIsGettingGps(false);
        alert('Gagal mengambil titik koordinat GPS: ' + err.message + '. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Open maps in new tab
  const handleOpenMaps = (mapsUrl, address, name) => {
    const targetUrl = parseGoogleMapsUrl(mapsUrl, address, name);
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Alamat atau titik koordinat Google Maps belum diisi.');
    }
  };

  // Test maps link in edit mode
  const handleTestMapsInEdit = () => {
    const testUrl = parseGoogleMapsUrl(editMapsUrl, editAddress, editName);
    if (testUrl) {
      window.open(testUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Masukkan titik koordinat atau link Google Maps terlebih dahulu untuk diuji.');
    }
  };

  const currentMapsUrl = customer ? parseGoogleMapsUrl(customer.maps_url, customer.address, customer.name) : null;
  const currentWaUrl = customer ? parseWhatsAppLink(customer.phone) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto">
        
        {/* Header - Fixed & Visible */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Detail Pelanggan / Toko</h2>
              <p className="text-xs text-emerald-100 font-medium">Informasi kontak, titik navigasi maps, & riwayat nota</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs">
              Memuat detail pelanggan...
            </div>
          ) : errorMsg && !customer ? (
            <div className="text-rose-600 text-xs p-4 bg-rose-50 rounded-2xl font-bold border border-rose-200">
              {errorMsg}
            </div>
          ) : customer && (
            <>
              {/* Success / Error alerts */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-2xl border border-rose-200 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isEditing ? (
                /* VIEW MODE */
                <div className="space-y-4">
                  
                  {/* Customer Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-black text-xs border border-emerald-200">
                            {customer.code}
                          </span>
                          <h3 className="font-black text-lg text-slate-900">
                            {customer.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Terdaftar sejak: {formatDate(customer.created_at)}
                        </p>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200 shrink-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit / Kustom</span>
                        </button>
                      )}
                    </div>

                    {/* Contact & Map Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      
                      {/* WhatsApp Button */}
                      {currentWaUrl ? (
                        <a
                          href={currentWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>Chat WhatsApp ({customer.phone})</span>
                        </a>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium flex items-center justify-center gap-2 border border-slate-200">
                          <Phone className="w-4 h-4 shrink-0" />
                          <span>Nomor WA Belum Diisi</span>
                        </div>
                      )}

                      {/* Google Maps Button */}
                      {currentMapsUrl ? (
                        <button
                          type="button"
                          onClick={() => handleOpenMaps(customer.maps_url, customer.address, customer.name)}
                          className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 shrink-0 text-amber-300" />
                          <span>Buka Titik Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </button>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium flex items-center justify-center gap-2 border border-slate-200">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>Titik Maps Belum Diisi</span>
                        </div>
                      )}

                    </div>

                    {/* Coordinate / Map URL Indicator */}
                    {customer.maps_url && (
                      <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                        <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <span className="font-bold text-[11px]">Titik Koordinat / Link:</span>
                          <p className="font-mono text-[11px] text-blue-700 truncate">{customer.maps_url}</p>
                        </div>
                      </div>
                    )}

                    {/* Address & Notes Details */}
                    <div className="space-y-2 pt-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-600">Alamat Lengkap Toko:</span>
                        <p className="text-slate-800 font-medium mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200">
                          {customer.address || 'Belum ada catatan alamat lengkap.'}
                        </p>
                      </div>

                      {customer.notes && (
                        <div>
                          <span className="font-bold text-slate-600">Catatan Khusus Toko:</span>
                          <p className="text-slate-700 font-medium mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200">
                            {customer.notes}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Transaction Stats Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <div className="text-[10px] uppercase font-bold text-emerald-800">Total Transaksi</div>
                      <div className="text-base font-mono font-black text-emerald-700 mt-0.5">
                        {formatRupiah(customer.total_transactions || 0)}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-600">Jumlah Nota</div>
                      <div className="text-base font-mono font-black text-slate-900 mt-0.5">
                        {customer.total_invoices || 0} Nota
                      </div>
                    </div>
                  </div>

                  {/* Recent Invoices List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>Riwayat Nota Terakhir:</span>
                    </h4>

                    {customer.recentInvoices && customer.recentInvoices.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                        {customer.recentInvoices.map((inv) => (
                          <div key={inv.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                            <div>
                              <div className="font-mono font-extrabold text-slate-900">{inv.invoice_no}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(inv.date)}</span>
                              </div>
                            </div>
                            <div className="font-mono font-black text-emerald-600 text-right">
                              {formatRupiah(inv.total_amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-2xl border border-slate-100">
                        Belum ada riwayat transaksi untuk pelanggan ini.
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                /* EDIT MODE (HOST ADMIN ONLY) */
                <form onSubmit={handleSave} className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
                    Edit & Kustomisasi Data Pelanggan / Toko
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Kode Toko / Pelanggan *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        placeholder="Contoh: TKO-01"
                        className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Nama Toko / Pelanggan *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Contoh: Toko Berkah Jaya"
                        className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nomor Telepon / WhatsApp Toko</span>
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Titik Koordinat / Link Google Maps</span>
                      </label>
                      
                      {/* GPS Helper Button */}
                      <button
                        type="button"
                        onClick={handleGetCurrentGps}
                        disabled={isGettingGps}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1 transition disabled:opacity-50"
                        title="Ambil titik koordinat latitude, longitude dari GPS perangkat Anda saat ini"
                      >
                        <Crosshair className="w-3 h-3 text-blue-600" />
                        <span>{isGettingGps ? 'Mengambil GPS...' : 'Ambil GPS Saat Ini'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={editMapsUrl}
                      onChange={(e) => setEditMapsUrl(e.target.value)}
                      placeholder="Contoh: -7.257543, 112.752132 atau https://maps.app.goo.gl/..."
                      className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                      <span>Bisa diisi: <b>Titik Koordinat</b> (misal: <code>-7.2575, 112.7521</code>) atau <b>Link Maps</b></span>
                      {editMapsUrl && (
                        <button
                          type="button"
                          onClick={handleTestMapsInEdit}
                          className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>Uji Buka Titik Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Alamat Lengkap Toko
                    </label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Jl. Raya Utama No. 123, Pasar Besar..."
                      className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Catatan Tambahan
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Catatan hari buka, nama pemilik, patokan toko, dll."
                      className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
