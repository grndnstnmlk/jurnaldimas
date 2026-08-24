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
  X
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected } = useRealtime();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="font-black text-slate-950 text-xl tracking-wider">MC</span>
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg text-white leading-tight flex items-center gap-2">
                CV. MASTER CIGARETTES
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? item.highlight 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                        : 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions: Live Sync Status, PWA Install & Excel Export */}
          <div className="hidden sm:flex items-center space-x-3">
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

            {/* Download Excel */}
            <a
              href="/api/export/excel"
              download="JURNAL_KEUANGAN_MASTER_CIGARETTES.xlsx"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Ekspor Seluruh Data ke Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor Excel</span>
            </a>

            {/* Install PWA Button */}
            <button
              onClick={handleInstallPWA}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
              title="Pasang aplikasi di Handphone / Desktop"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Install App</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <a
              href="/api/export/excel"
              download="JURNAL_KEUANGAN_MASTER_CIGARETTES.xlsx"
              className="flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh File Excel</span>
            </a>
            <button
              onClick={() => {
                handleInstallPWA();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pasang di Layar Utama HP</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
