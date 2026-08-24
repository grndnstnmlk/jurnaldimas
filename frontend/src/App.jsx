import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import Navbar from './components/Navbar';
import LockScreen from './components/LockScreen';
import Dashboard from './pages/Dashboard';
import KasirPOS from './pages/KasirPOS';
import RiwayatNota from './pages/RiwayatNota';
import StockOpname from './pages/StockOpname';
import LabaRugi from './pages/LabaRugi';
import MatriksHarga from './pages/MatriksHarga';
import MasterData from './pages/MasterData';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('kasir');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs font-semibold uppercase tracking-wider">Memeriksa Akses Sistem...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LockScreen />;
  }

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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
