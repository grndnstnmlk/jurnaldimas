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
      <div className="min-h-screen bg-[#f9faf9] flex flex-col items-center justify-center text-[#5a585a]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0f0f0f] border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#0f0f0f]">Memeriksa Akses Sistem...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LockScreen />;
  }

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-[#f9faf9] text-[#0f0f0f] flex flex-col selection:bg-[#05c92f] selection:text-[#0f0f0f]">
        
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
          <div className="fixed bottom-5 right-5 z-40 lg:hidden">
            <button
              onClick={() => setActiveTab('kasir')}
              className="px-5 py-3 rounded-[35px] ctrl-btn-lime flex items-center gap-2 shadow-xl border border-[#0f0f0f] active:scale-95 transition"
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
