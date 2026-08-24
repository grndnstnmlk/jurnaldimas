import React, { useState } from 'react';
import { KeyRound, X, Check, Shield } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="b2b-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Ganti Kode Akses Master</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kode Akses Saat Ini (Lama)</label>
            <input
              type="password"
              required
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              placeholder="Masukkan kode saat ini"
              className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono tracking-widest"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Kode Akses Baru (Min. 4 digit)</label>
            <input
              type="password"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Masukkan kode baru rahasia"
              className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono tracking-widest"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Ulangi Kode Akses Baru</label>
            <input
              type="password"
              required
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Ketik ulang kode baru"
              className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-500 font-mono tracking-widest"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kode Baru'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
