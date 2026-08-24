import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal,
  CircleDot
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
    <header className="sticky top-0 z-40 bg-[#f9faf9] border-b border-[#0f0f0f]/10 backdrop-blur-md">
      
      {/* Top Bar Header */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo with Chrome Dots Signature */}
          <div 
            onClick={() => setActiveTab('kasir')}
            className="cursor-pointer flex items-center space-x-2.5 select-none"
          >
            <div className="w-8 h-8 rounded-[9px] bg-[#0f0f0f] text-white font-black text-xs flex items-center justify-center border border-[#0f0f0f]">
              MC
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg text-[#0f0f0f] tracking-tight font-sans">
                MASTER CIGARETTES
              </span>
              {/* Chrome Dots Icon */}
              <div className="hidden sm:flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#05c92f]"></span>
                <span className="w-2 h-2 rounded-full bg-[#fcea59]"></span>
                <span className="w-2 h-2 rounded-full bg-[#ffd0e2]"></span>
              </div>
            </div>
          </div>

          {/* Centered Ghost Nav Pill (Bone-colored rounded container ~9px radius) */}
          <nav className="hidden lg:flex items-center bg-[#ecefec] p-1 rounded-[9px] border border-[#0f0f0f]/15">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <React.Fragment key={tab.id}>
                  {idx > 0 && <span className="w-[1px] h-3.5 bg-[#0f0f0f]/20 my-auto"></span>}
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold flex items-center space-x-1.5 transition ${
                      isActive 
                        ? 'bg-[#0f0f0f] text-[#ffffff] font-bold shadow-xs' 
                        : 'text-[#0f0f0f] hover:bg-[#ffffff]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            
            {/* Live Indicator Pill */}
            <div 
              title={isConnected ? 'Real-time Server Active' : 'Connecting...'}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-[35px] bg-[#ffffff] border border-[#0f0f0f] text-[11px] font-bold text-[#0f0f0f]"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#05c92f]' : 'bg-[#ffd0e2] animate-pulse'}`}></span>
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>

            {/* Atur Harga / Matriks Shortcut Pill */}
            <button
              onClick={() => setActiveTab('matriks')}
              className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-[35px] bg-[#fcea59] text-[#0f0f0f] text-xs font-bold border border-[#0f0f0f] hover:bg-[#fbd938] transition active:scale-95"
            >
              Atur Harga
            </button>

            {/* Change PIN Button */}
            <button
              onClick={() => setShowChangePin(true)}
              className="p-2 rounded-[35px] bg-[#ffffff] text-[#0f0f0f] border border-[#0f0f0f] hover:bg-[#ecefec] transition"
              title="Ganti Kode Akses / PIN"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            {/* Black Download / Lock Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-[35px] bg-[#0f0f0f] hover:bg-[#000000] text-[#ffffff] text-xs font-bold border border-[#0f0f0f] transition active:scale-95"
              title="Kunci Aplikasi"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Sub-Nav Row */}
      <div className="lg:hidden bg-[#ecefec] border-t border-[#0f0f0f]/10 overflow-x-auto no-scrollbar py-1.5 px-3">
        <div className="flex space-x-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold flex items-center space-x-1.5 transition ${
                  isActive 
                    ? 'bg-[#0f0f0f] text-[#ffffff] font-bold' 
                    : 'text-[#0f0f0f] hover:bg-[#ffffff]/60'
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
