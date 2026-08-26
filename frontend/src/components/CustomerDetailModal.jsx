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
  FileSpreadsheet
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

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

  // Helper to format WhatsApp link
  const getWhatsAppLink = (phone) => {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  // Helper to format Google Maps link
  const getMapsLink = (mapsUrl, address) => {
    if (mapsUrl && (mapsUrl.startsWith('http://') || mapsUrl.startsWith('https://'))) {
      return mapsUrl;
    }
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    return null;
  };

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
              <p className="text-xs text-emerald-100 font-medium">Informasi kontak, lokasi maps, & riwayat nota</p>
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
                      {customer.phone ? (
                        <a
                          href={getWhatsAppLink(customer.phone)}
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
                      {(customer.maps_url || customer.address) ? (
                        <a
                          href={getMapsLink(customer.maps_url, customer.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                        >
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>Buka Titik Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </a>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium flex items-center justify-center gap-2 border border-slate-200">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>Titik Maps Belum Diisi</span>
                        </div>
                      )}

                    </div>

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

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Titik Lokasi Google Maps (Link URL Maps)</span>
                    </label>
                    <input
                      type="text"
                      value={editMapsUrl}
                      onChange={(e) => setEditMapsUrl(e.target.value)}
                      placeholder="Contoh: https://maps.app.goo.gl/... atau koordinat lat,lng"
                      className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
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
