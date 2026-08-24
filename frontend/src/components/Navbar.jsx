import React, { useState } from 'react';
import { 
  Store, 
  KeyRound, 
  Lock, 
  Database, 
  Smartphone, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import ChangePinModal from './ChangePinModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected } = useRealtime();
  const { logout } = useAuth();
  const [showChangePin, setShowChangePin] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 safe-area-top shadow-2xs">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Store Title */}
          <div 
            onClick={() => setActiveTab('kasir')}
            className="cursor-pointer flex items-center space-x-2 select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight block leading-tight">
                MASTER CIGARETTES
              </span>
              <div className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isConnected ? 'POS Online' : 'Menghubungkan...'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-1.5">
            
            {/* Master Data button */}
            <button
              onClick={() => setActiveTab('master')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition border ${
                activeTab === 'master'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Master Data Produk & Pelanggan"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Data</span>
            </button>

            {/* Change PIN Button */}
            <button
              onClick={() => setShowChangePin(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition flex items-center gap-1"
              title="Ganti Kode Akses / PIN"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PIN</span>
            </button>

            {/* Lock App Button */}
            <button
              onClick={logout}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1"
              title="Kunci Aplikasi"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kunci</span>
            </button>

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
