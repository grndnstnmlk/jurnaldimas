import React, { useState } from 'react';
import { Lock, ArrowRight, Delete } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f9faf9] flex flex-col items-center justify-center p-4 selection:bg-[#05c92f] selection:text-[#0f0f0f]">
      
      <div className="w-full max-w-sm bg-[#ffffff] rounded-[26px] p-6 sm:p-8 border border-[#0f0f0f] text-center space-y-6 shadow-2xl">
        
        {/* Brand Icon & Chrome Dots */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-[14px] bg-[#0f0f0f] text-[#ffffff] flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#05c92f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#fcea59]"></span>
            <span className="w-2 h-2 rounded-full bg-[#ffd0e2]"></span>
          </div>

          <h1 className="font-extrabold text-xl text-[#0f0f0f] tracking-tight font-sans">
            MASTER CIGARETTES
          </h1>
          <p className="text-xs text-[#5a585a] mt-0.5">
            Sistem Kasir Terpadu — Masukkan Kode Akses
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
              className="w-full bg-[#eeeeee] text-center tracking-[0.3em] font-mono text-xl text-[#0f0f0f] py-3.5 px-4 rounded-[35px] border border-[#0f0f0f] focus:outline-none placeholder:tracking-normal placeholder:text-xs placeholder:font-sans placeholder:text-[#5a585a]"
            />
          </div>

          {error && (
            <div className="text-xs text-[#0f0f0f] bg-[#ffd0e2] py-2 px-3 rounded-[14px] border border-[#0f0f0f] font-bold">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !code}
            className="w-full ctrl-btn-lime flex items-center justify-center space-x-2 disabled:opacity-40"
          >
            <span>{isSubmitting ? 'Memverifikasi...' : 'Buka Aplikasi'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Numeric Keypad */}
        <div className="pt-2 border-t border-[#0f0f0f]/10">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num.toString())}
                className="py-3 rounded-[35px] bg-[#ecefec] hover:bg-[#ffffff] text-[#0f0f0f] font-mono text-lg font-bold border border-[#0f0f0f]/20 active:scale-95 transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-[35px] bg-[#ecefec] hover:bg-[#ffffff] text-[#5a585a] font-bold text-xs border border-[#0f0f0f]/20 active:scale-95 transition uppercase"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 rounded-[35px] bg-[#ecefec] hover:bg-[#ffffff] text-[#0f0f0f] font-mono text-lg font-bold border border-[#0f0f0f]/20 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteDigit}
              className="py-3 rounded-[35px] bg-[#ecefec] hover:bg-[#ffd0e2] text-[#0f0f0f] flex items-center justify-center border border-[#0f0f0f]/20 active:scale-95 transition"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Default PIN Note */}
        <div className="text-[11px] text-[#5a585a] pt-1">
          <span>Kode Akses Default: </span>
          <span className="font-mono font-bold text-[#0f0f0f]">123456</span>
        </div>

      </div>

    </div>
  );
}
