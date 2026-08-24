import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Receipt, 
  Boxes, 
  TrendingUp, 
  TableProperties, 
  Database, 
  Lock, 
  KeyRound, 
  ChevronLeft,
  Store
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from './ChangePinModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected } = useRealtime();
  const { logout } = useAuth();
  const [showChangePin, setShowChangePin] = useState(false);

  const tabs = [
    { id: 'kasir', label: 'Kasir & POS', icon: ShoppingCart },
    { id: 'riwayat', label: 'Riwayat Nota', icon: Receipt },
    { id: 'stock', label: 'Stock Opname', icon: Boxes },
    { id: 'labarugi', label: 'Laba - Rugi', icon: TrendingUp },
    { id: 'matriks', label: 'Matriks Harga', icon: TableProperties },
    { id: 'master', label: 'Master Data', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      
      {/* Top Bar Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Store Title */}
          <div 
            onClick={() => setActiveTab('kasir')}
            className="cursor-pointer flex items-center space-x-2.5 select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight block leading-tight">
                CV. MASTER CIGARETTES
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistem Jurnal & POS Kasir Terpadu
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    isActive 
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            
            {/* Live Indicator Pill */}
            <div 
              title={isConnected ? 'Terkoneksi Real-time' : 'Menghubungkan...'}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
              <span>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Change PIN Button */}
            <button
              onClick={() => setShowChangePin(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
              title="Ganti Kode Akses / PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">PIN</span>
            </button>

            {/* Lock Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
              title="Kunci Aplikasi"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden bg-slate-50 border-t border-slate-200 overflow-x-auto no-scrollbar py-2 px-3">
        <div className="flex space-x-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangePin && (
        <ChangePinModal onClose={() => setShowChangePin(false)} />
      )}
    </header>
  );
}
