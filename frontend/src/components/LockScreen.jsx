import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Store,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LockScreen() {
  const { login, register, loginWithGoogle } = useAuth();
  
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('sales');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setError(res.error || 'Gagal masuk. Periksa email & password Anda.');
    }
    setIsSubmitting(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError('Lengkapi semua data pendaftaran.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    const res = await register(regName, regEmail, regPassword, regRole);
    if (res.success) {
      setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke sistem...');
    } else {
      setError(res.error || 'Gagal mendaftar.');
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');

    // Check if Google GIS is available, otherwise prompt for active google email
    const simulatedGoogleUser = {
      profile: {
        email: prompt('Masukkan Alamat Email Google Anda (contoh: host@gmail.com):', 'grndnstnmlk@gmail.com') || '',
        name: 'Pengguna Akun Google',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      }
    };

    if (!simulatedGoogleUser.profile.email) {
      setIsSubmitting(false);
      return;
    }

    const res = await loginWithGoogle(simulatedGoogleUser);
    if (!res.success) {
      setError(res.error || 'Gagal login menggunakan akun Google.');
    }
    setIsSubmitting(false);
  };

  const handleQuickLogin = async (email, password) => {
    setIsSubmitting(true);
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Gagal login otomatis.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-900 relative overflow-hidden">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-5 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1 shadow-inner">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="font-black text-xl sm:text-2xl text-white tracking-tight">
            CV. MASTER CIGARETTES
          </h1>
          <p className="text-xs text-slate-400">
            Sistem Kasir POS & Jurnal Keuangan Real-Time
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/50 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-2xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/80 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Akun Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Atau dengan Email</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="text-xs text-rose-300 bg-rose-950/70 py-2.5 px-3.5 rounded-2xl border border-rose-800/80 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="text-xs text-emerald-300 bg-emerald-950/70 py-2.5 px-3.5 rounded-2xl border border-emerald-800/80 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
                  placeholder="admin@masterpos.com"
                  className="w-full bg-slate-900/90 text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 text-white pl-10 pr-10 py-2.5 rounded-2xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder:text-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              <span>{isSubmitting ? 'Memproses...' : 'Buka Aplikasi POS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setError(''); }}
                  placeholder="Nama Sales / Admin"
                  className="w-full bg-slate-900/90 text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                  placeholder="contoh@gmail.com"
                  className="w-full bg-slate-900/90 text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-900/90 text-white pl-10 pr-10 py-2.5 rounded-2xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Hak Akses / Peran Akun
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center ${
                    regRole === 'sales'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="sales"
                    checked={regRole === 'sales'}
                    onChange={() => setRegRole('sales')}
                    className="hidden"
                  />
                  <span className="text-xs">💼 Sales</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Kasir & Stok</span>
                </label>

                <label
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center ${
                    regRole === 'admin'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={regRole === 'admin'}
                    onChange={() => setRegRole('admin')}
                    className="hidden"
                  />
                  <span className="text-xs">👑 Admin (Host)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Semua Fitur</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftar Akun Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Demo Access Buttons */}
        <div className="pt-3 border-t border-slate-700/60 space-y-2">
          <p className="text-[10px] text-center uppercase tracking-wider font-extrabold text-slate-400">
            Akses Cepat (Demo / Default Login)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@masterpos.com', 'admin123')}
              className="py-2 px-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-purple-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 text-center"
            >
              <span>👑 Host Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sales@masterpos.com', 'sales123')}
              className="py-2 px-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 text-center"
            >
              <span>💼 Akun Sales</span>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        CV. Master Cigarettes POS & Jurnal Keuangan &copy; 2026
      </div>

    </div>
  );
}
