import React, { useState } from 'react';
import { Lock, ArrowRight, Delete, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-600 selection:text-white">
      
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-6 shadow-sm">
        
        {/* Brand Icon */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 border border-emerald-100">
            <Lock className="w-6 h-6" />
          </div>
          
          <h1 className="font-extrabold text-xl text-slate-800 tracking-tight font-sans">
            CV. MASTER CIGARETTES
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Kasir & POS — Masukkan Kode Akses
          </p>
        </div>

        {/* PIN Input */}
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
              placeholder="Masukkan Kode Akses PIN"
              className="w-full bg-slate-50 text-center tracking-[0.3em] font-mono text-xl text-slate-800 py-3.5 px-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white placeholder:tracking-normal placeholder:text-xs placeholder:font-sans placeholder:text-slate-400"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 py-2 px-3 rounded-xl border border-rose-200 font-bold">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !code}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs flex items-center justify-center space-x-2 transition disabled:opacity-40"
          >
            <span>{isSubmitting ? 'Memverifikasi...' : 'Buka Aplikasi'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Numeric Keypad */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num.toString())}
                className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-lg font-bold border border-slate-200 active:scale-95 transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 active:scale-95 transition uppercase"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-lg font-bold border border-slate-200 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteDigit}
              className="py-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center border border-slate-200 active:scale-95 transition"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Default PIN Note */}
        <div className="text-[11px] text-slate-500 pt-1">
          <span>Kode Akses Default: </span>
          <span className="font-mono font-bold text-slate-700">123456</span>
        </div>

      </div>

    </div>
  );
}
