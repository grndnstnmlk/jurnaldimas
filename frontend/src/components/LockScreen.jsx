import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, ArrowRight, Delete } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LockScreen() {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!code) return;

    setIsSubmitting(true);
    setError('');

    const res = await login(code);
    if (!res.success) {
      setError(res.error || 'Kode akses tidak sesuai');
      setCode('');
    }
    setIsSubmitting(false);
  };

  const handleKeypadPress = (digit) => {
    if (code.length < 12) {
      setCode((prev) => prev + digit);
      setError('');
    }
  };

  const handleDeleteDigit = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      
      <div className="w-full max-w-sm b2b-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-center space-y-6">
        
        {/* Brand Icon */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
            <Lock className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="font-black text-lg sm:text-xl text-white tracking-tight">
            CV. MASTER CIGARETTES
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistem Terproteksi — Masukkan Kode Akses
          </p>
        </div>

        {/* PIN / Password Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              autoFocus
              maxLength={12}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Masukkan Kode Akses / PIN"
              className="w-full bg-slate-900 text-center tracking-[0.3em] font-mono text-xl text-amber-400 py-3.5 px-4 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 shadow-inner placeholder:tracking-normal placeholder:text-xs placeholder:font-sans placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 py-2 px-3 rounded-lg border border-rose-500/20 font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* Desktop/Form Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !code}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-40"
          >
            <span>{isSubmitting ? 'Memverifikasi...' : 'Buka Akses Sistem'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Numeric Keypad for Mobile / Fast Touch */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num.toString())}
                className="py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-mono text-lg font-bold border border-slate-800/80 active:scale-95 transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-500 hover:text-slate-300 font-bold text-xs border border-slate-800/60 active:scale-95 transition uppercase"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-mono text-lg font-bold border border-slate-800/80 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteDigit}
              className="py-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center border border-slate-800/60 active:scale-95 transition"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Note / Default PIN Hint */}
        <div className="text-[11px] text-slate-500 pt-1">
          <span>Kode Akses Default: </span>
          <span className="font-mono font-bold text-slate-400">123456</span>
          <p className="text-[10px] text-slate-600 mt-0.5">
            (Dapat Anda ubah kapan saja setelah masuk ke aplikasi)
          </p>
        </div>

      </div>

    </div>
  );
}
