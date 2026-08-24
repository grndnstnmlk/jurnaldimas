import React, { useState } from 'react';
import { RealtimeProvider } from './context/RealtimeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import KasirPOS from './pages/KasirPOS';
import RiwayatNota from './pages/RiwayatNota';
import StockOpname from './pages/StockOpname';
import LabaRugi from './pages/LabaRugi';
import MatriksHarga from './pages/MatriksHarga';
import MasterData from './pages/MasterData';

export default function App() {
  const [activeTab, setActiveTab] = useState('kasir');

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
        
        {/* Navigation Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'kasir' && <KasirPOS />}
          {activeTab === 'riwayat' && <RiwayatNota setActiveTab={setActiveTab} />}
          {activeTab === 'stock' && <StockOpname />}
          {activeTab === 'labarugi' && <LabaRugi />}
          {activeTab === 'matriks' && <MatriksHarga />}
          {activeTab === 'master' && <MasterData />}
        </main>

        {/* Bottom Mobile Sticky POS Button (Only when not on kasir tab) */}
        {activeTab !== 'kasir' && (
          <div className="fixed bottom-4 right-4 z-40 lg:hidden">
            <button
              onClick={() => setActiveTab('kasir')}
              className="px-4 py-3 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-2xl shadow-amber-500/50 flex items-center gap-2 border-2 border-slate-950 active:scale-95 transition"
            >
              <span>+ Kasir / Nota</span>
            </button>
          </div>
        )}

      </div>
    </RealtimeProvider>
  );
}
