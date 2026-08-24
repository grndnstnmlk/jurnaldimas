import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Memeriksa Akses Sistem...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LockScreen />;
  }

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
        
        {/* Mobile Top App Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Mobile Page Content (With pb-20 so bottom nav never blocks content) */}
        <main className="flex-1 pb-24">
          {activeTab === 'kasir' && <KasirPOS />}
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'riwayat' && <RiwayatNota setActiveTab={setActiveTab} />}
          {activeTab === 'stock' && <StockOpname />}
          {activeTab === 'labarugi' && <LabaRugi />}
          {activeTab === 'matriks' && <MatriksHarga />}
          {activeTab === 'master' && <MasterData />}
        </main>

        {/* Fixed Mobile Bottom App Navigation Bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

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
