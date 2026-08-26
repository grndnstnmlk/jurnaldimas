import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Navigation,
  HelpCircle,
  ClipboardPaste,
  Search,
  Settings,
  Smartphone,
  RefreshCw
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

// Helper to clean and extract valid maps link or coords from pasted text
export const extractCleanMapsInput = (val) => {
  if (!val) return '';
  const text = String(val).trim();

  // 1. Check if contains http/https URL (e.g., "Pin dipasang https://maps.app.goo.gl/xyz")
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    return urlMatch[0].trim();
  }

  // 2. Check if contains maps.app.goo.gl without https
  const shortLinkMatch = text.match(/maps\.app\.goo\.gl\/[^\s]+/i);
  if (shortLinkMatch) {
    return `https://${shortLinkMatch[0].trim()}`;
  }

  // 3. Check if contains latitude, longitude coordinates (e.g. "-7.257543, 112.752132")
  const coordMatch = text.match(/[-+]?\d{1,2}(?:\.\d+)?[,\s]+[-+]?\d{1,3}(?:\.\d+)?/);
  if (coordMatch && !text.startsWith('http')) {
    return coordMatch[0].trim();
  }

  return text;
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
  const [showGpsGuide, setShowGpsGuide] = useState(false);
  const [gpsErrorType, setGpsErrorType] = useState('denied'); // 'denied' | 'unavailable' | 'unsupported'
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
          maps_url: extractCleanMapsInput(editMapsUrl),
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

  // Smart GPS Getter with Automatic High & Low Accuracy Fallback
  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsErrorType('unsupported');
      setShowGpsGuide(true);
      return;
    }

    setIsGettingGps(true);
    setErrorMsg('');

    // Step 1: Try high accuracy first (device GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setEditMapsUrl(`${lat}, ${lng}`);
        setIsGettingGps(false);
        setSuccessMsg(`Titik koordinat GPS berhasil didapatkan: ${lat}, ${lng}`);
      },
      (err) => {
        // If denied permission (code 1), show visual guide
        if (err.code === 1) {
          setIsGettingGps(false);
          setGpsErrorType('denied');
          setShowGpsGuide(true);
        } else {
          // If timeout or position unavailable (code 2 or 3), try low accuracy fallback (cell/wifi)
          navigator.geolocation.getCurrentPosition(
            (pos2) => {
              const lat = pos2.coords.latitude.toFixed(6);
              const lng = pos2.coords.longitude.toFixed(6);
              setEditMapsUrl(`${lat}, ${lng}`);
              setIsGettingGps(false);
              setSuccessMsg(`Titik koordinat GPS berhasil didapatkan: ${lat}, ${lng}`);
            },
            (err2) => {
              setIsGettingGps(false);
              setGpsErrorType(err2.code === 1 ? 'denied' : 'unavailable');
              setShowGpsGuide(true);
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
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

  // Open Google Maps search to pick/find a store location
  const handleOpenGoogleMapsPicker = () => {
    const query = editAddress || editName || 'Indonesia';
    const pickerUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(pickerUrl, '_blank', 'noopener,noreferrer');
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = extractCleanMapsInput(text);
          setEditMapsUrl(cleaned);
          setSuccessMsg('Titik koordinat/link berhasil ditempel dari clipboard!');
        } else {
          alert('Clipboard Anda masih kosong.');
        }
      } else {
        alert('Fitur baca clipboard otomatis tidak didukung oleh browser Anda. Silakan tekan lama pada kotak teks lalu pilih Tempel / Paste.');
      }
    } catch (e) {
      alert('Silakan tekan lama pada kotak teks lalu pilih Tempel / Paste.');
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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

                  {/* Enhanced Maps / GPS Location Section */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Titik Koordinat / Link Google Maps</span>
                      </label>
                      
                      {/* Action buttons bar */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Auto GPS button */}
                        <button
                          type="button"
                          onClick={handleGetCurrentGps}
                          disabled={isGettingGps}
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 transition disabled:opacity-50 active:scale-95"
                          title="Ambil titik koordinat latitude, longitude dari GPS HP Anda saat ini"
                        >
                          <Crosshair className={`w-3 h-3 text-emerald-600 ${isGettingGps ? 'animate-spin' : ''}`} />
                          <span>{isGettingGps ? 'Mencari GPS...' : '📍 Ambil GPS HP'}</span>
                        </button>

                        {/* Open Google Maps search button */}
                        <button
                          type="button"
                          onClick={handleOpenGoogleMapsPicker}
                          className="text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg border border-blue-300 flex items-center gap-1 transition active:scale-95"
                          title="Buka aplikasi Google Maps untuk mencari toko dan menyalin titik lokasi"
                        >
                          <Search className="w-3 h-3 text-blue-600" />
                          <span>Cari di Maps</span>
                        </button>

                        {/* Clipboard paste helper */}
                        <button
                          type="button"
                          onClick={handlePasteClipboard}
                          className="text-[10px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-lg border border-slate-300 flex items-center gap-1 transition active:scale-95"
                          title="Tempel link/koordinat yang sudah Anda salin dari Google Maps"
                        >
                          <ClipboardPaste className="w-3 h-3 text-slate-600" />
                          <span>Tempel</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={editMapsUrl}
                        onChange={(e) => setEditMapsUrl(extractCleanMapsInput(e.target.value))}
                        placeholder="Contoh: -7.257543, 112.752132 atau https://maps.app.goo.gl/..."
                        className="w-full bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                      <span>Bisa diisi: <b>Koordinat</b> (<code>-7.2575, 112.7521</code>) atau <b>Link Maps</b></span>
                      {editMapsUrl && (
                        <button
                          type="button"
                          onClick={handleTestMapsInEdit}
                          className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                        >
                          <span>🔗 Uji Titik di Maps</span>
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

      {/* Interactive GPS Permission Guide Modal */}
      {showGpsGuide && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Guide Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Panduan Izin Lokasi GPS di HP</h3>
                  <p className="text-[11px] text-amber-100">Solusi "User denied Geolocation"</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGpsGuide(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guide Body */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-700 overflow-y-auto flex-1">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 font-medium text-amber-900 leading-relaxed">
                {gpsErrorType === 'denied' ? (
                  <span>Browser di HP Anda saat ini memblokir akses lokasi otomatis. Ikuti 3 langkah mudah berikut untuk mengaktifkannya:</span>
                ) : (
                  <span>Sinyal GPS perangkat belum terbaca. Pastikan tombol GPS / Lokasi pada HP Anda dalam keadaan AKTIF (ON).</span>
                )}
              </div>

              {/* Step by step */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="font-bold text-slate-900">Ketuk ikon Gembok / Pengaturan Situs di atas</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Di samping alamat website <code>jurnaldimas.onrender.com</code>, ketuk ikon 🔒 atau ⚙️.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="font-bold text-slate-900">Aktifkan Izin Lokasi (Location)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pilih menu <b>Izin (Permissions)</b> ➔ ubah <b>Lokasi (Location)</b> menjadi <b>Izinkan (Allow)</b>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-900">Nyalakan Tombol GPS HP</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tarik bilah notifikasi atas HP Anda dan pastikan fitur <b>Lokasi / GPS</b> sudah Menyala.</p>
                  </div>
                </div>
              </div>

              {/* Alternative Quick Shortcut */}
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 space-y-1.5">
                <p className="font-bold text-blue-900 text-[11px] flex items-center gap-1">
                  <span>💡 Cara Alternatif (Sangat Cepat):</span>
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Buka aplikasi <b>Google Maps</b> di HP Anda ➔ Cari toko atau tekan lama pada peta ➔ Ketuk <b>Bagikan (Share)</b> ➔ <b>Salin Link (Copy link)</b> ➔ Tempel pada kotak input di atas.
                </p>
              </div>
            </div>

            {/* Guide Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowGpsGuide(false);
                  handleOpenGoogleMapsPicker();
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buka Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGpsGuide(false);
                  setTimeout(() => handleGetCurrentGps(), 300);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Ambil GPS Lagi</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>,
    document.body
  );
}
