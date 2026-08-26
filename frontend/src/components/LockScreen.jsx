import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Store,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LockScreen() {
  const { login, register, loginWithGoogle } = useAuth();
  
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state (Always Sales)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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

    // Public registrations are strictly created as 'sales' role
    const res = await register(regName, regEmail, regPassword, 'sales');
    if (res.success) {
      setSuccessMsg('Akun Sales berhasil dibuat! Mengalihkan ke sistem...');
    } else {
      setError(res.error || 'Gagal mendaftar.');
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');

    const simulatedGoogleUser = {
      profile: {
        email: prompt('Masukkan Alamat Email Google Anda:', '') || '',
        name: 'Pengguna Akun Google',
        picture: ''
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-slate-50 to-emerald-100/50 text-slate-800 flex flex-col items-center justify-center p-4 selection:bg-emerald-600 selection:text-white relative">
      
      {/* Decorative Blur Accents */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/60 space-y-5 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-1 shadow-md shadow-emerald-600/20">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
            CV. MASTER CIGARETTES
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sistem Kasir POS & Jurnal Keuangan Real-Time
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
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
          className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-2xs transition active:scale-[0.98] disabled:opacity-50"
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
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atau dengan Email</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 py-2.5 px-3.5 rounded-2xl border border-rose-200 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="text-xs text-emerald-800 bg-emerald-50 py-2.5 px-3.5 rounded-2xl border border-emerald-200 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
                  placeholder=""
                  className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                  placeholder=""
                  className="w-full bg-slate-50 text-slate-900 pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              <span>{isSubmitting ? 'Memproses...' : 'Buka Aplikasi POS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* REGISTER FORM (STRICTLY SALES ONLY) */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Registration Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pendaftaran Akun Sales Tim CV. Master Cigarettes</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setError(''); }}
                  placeholder=""
                  className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                  placeholder=""
                  className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                  placeholder=""
                  className="w-full bg-slate-50 text-slate-900 pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftar Akun Sales Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      <div className="mt-4 text-center text-xs text-slate-500 font-medium">
        CV. Master Cigarettes POS & Jurnal Keuangan &copy; 2026
      </div>

    </div>
  );
}
