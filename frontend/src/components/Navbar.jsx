import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Receipt, 
  Boxes, 
  TrendingUp, 
  TableProperties, 
  Database, 
  Download, 
  Smartphone,
  Lock,
  KeyRound,
  ChevronLeft,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  LayoutDashboard
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from './ChangePinModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected } = useRealtime();
  const { logout } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
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

  const tabs = [
    { id: 'kasir', label: 'Kasir & Nota', icon: ShoppingCart },
    { id: 'riwayat', label: 'Riwayat Nota', icon: Receipt },
    { id: 'stock', label: 'Stock Opname', icon: Boxes },
    { id: 'labarugi', label: 'Laba - Rugi', icon: TrendingUp },
    { id: 'matriks', label: 'Matriks Harga', icon: TableProperties },
    { id: 'master', label: 'Master Data', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      
      {/* Top Bar Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Left: Back / Brand Logo */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab('kasir')}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div 
              onClick={() => setActiveTab('kasir')}
              className="cursor-pointer flex items-center space-x-2"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                MC
              </div>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                MASTER CIGARETTES
              </span>
            </div>
          </div>

          {/* Right Actions: Atur Harga / PIN / Lock */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Live Indicator */}
            <div 
              title={isConnected ? 'Terkoneksi Real-time' : 'Menghubungkan...'}
              className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE</span>
            </div>

            {/* Atur Harga Shortcut */}
            <button
              onClick={() => setActiveTab('matriks')}
              className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-2 py-1 transition"
            >
              Atur Harga
            </button>

            {/* Change PIN */}
            <button
              onClick={() => setShowChangePin(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              title="Ganti Kode Akses / PIN"
            >
              <KeyRound className="w-4 h-4 text-slate-600" />
            </button>

            {/* Lock / Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
              title="Kunci Aplikasi"
            >
              <Lock className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>

      {/* Segmented Top Tabs with Green Underline Active Indicator */}
      <div className="bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex space-x-6 sm:space-x-8 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 text-xs sm:text-sm font-bold flex items-center space-x-1.5 relative transition-colors ${
                    isActive 
                      ? 'text-slate-900 font-extrabold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {/* Green active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-md" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangePin && (
        <ChangePinModal onClose={() => setShowChangePin(false)} />
      )}
    </header>
  );
}
