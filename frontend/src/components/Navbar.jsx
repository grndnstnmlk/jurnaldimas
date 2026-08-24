import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Boxes, 
  TrendingUp, 
  TableProperties, 
  Database, 
  Download, 
  Wifi, 
  WifiOff, 
  Smartphone,
  Menu,
  X,
  Lock,
  KeyRound,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from './ChangePinModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected } = useRealtime();
  const { logout } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Untuk memasang di HP: Buka menu peramban Chrome/Safari lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen)');
    }
  };

  const navItems = [
    { id: 'kasir', label: 'Kasir & Nota', icon: ShoppingCart, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'riwayat', label: 'Riwayat Nota', icon: Receipt },
    { id: 'stock', label: 'Stock Opname', icon: Boxes },
    { id: 'labarugi', label: 'Laba - Rugi', icon: TrendingUp },
    { id: 'matriks', label: 'Matriks Harga', icon: TableProperties },
    { id: 'master', label: 'Master Data', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="font-black text-slate-950 text-xl tracking-wider">MC</span>
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg text-white leading-tight flex items-center gap-2">
                CV. MASTER CIGARETTES
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  REALTIME
                </span>
              </div>
              <div className="text-xs text-slate-400">Jurnal & POS Terpadu</div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? item.highlight 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                        : 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions: Live Sync Status, Ganti PIN, Lock & Excel */}
          <div className="hidden sm:flex items-center space-x-2">
            {/* Live Indicator */}
            <div 
              title={isConnected ? 'Terkoneksi Real-time' : 'Menghubungkan kembali...'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isConnected 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
              }`}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>

            {/* Change PIN Button */}
            <button
              onClick={() => setShowChangePin(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="Ganti Kode Akses / PIN Master"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN</span>
            </button>

            {/* Lock / Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition"
              title="Kunci Aplikasi / Keluar"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20"
              title="Kunci Aplikasi"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setShowChangePin(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg bg-slate-800 text-amber-400 text-xs font-bold"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ganti PIN</span>
            </button>
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg bg-rose-600/20 text-rose-300 text-xs font-bold border border-rose-500/30"
            >
              <Lock className="w-4 h-4" />
              <span>Kunci Aplikasi</span>
            </button>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {showChangePin && (
        <ChangePinModal onClose={() => setShowChangePin(false)} />
      )}
    </header>
  );
}
