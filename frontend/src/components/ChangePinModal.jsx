import React, { useState } from 'react';
import { KeyRound, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ChangePinModal({ onClose }) {
  const { changeAccessCode } = useAuth();
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newCode !== confirmCode) {
      setError('Konfirmasi kode akses baru tidak cocok!');
      return;
    }

    if (newCode.length < 4) {
      setError('Kode akses baru minimal 4 digit!');
      return;
    }

    setIsSubmitting(true);
    const res = await changeAccessCode(currentCode, newCode);
    if (res.success) {
      setSuccess(res.message || 'Kode akses berhasil diperbarui!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(res.error || 'Gagal mengubah kode akses');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 border border-slate-200 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <span>Ganti Kode Akses PIN Master</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Kode Akses Saat Ini (Lama)</label>
            <input
              type="password"
              required
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              placeholder="Masukkan kode lama"
              className="w-full bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Kode Akses Baru (Min. 4 digit)</label>
            <input
              type="password"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Masukkan kode baru rahasia"
              className="w-full bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ulangi Kode Akses Baru</label>
            <input
              type="password"
              required
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Ketik ulang kode baru"
              className="w-full bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kode Baru'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
