import React, { useState, useEffect } from 'react';
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
  const { isAuthenticated, isAdmin, isSales, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('kasir');

  // Enforce role guard: if sales tries to open admin tabs, reset to kasir
  useEffect(() => {
    if (!isAdmin && ['dashboard', 'labarugi', 'master'].includes(activeTab)) {
      setActiveTab('kasir');
    }
  }, [isAdmin, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Memeriksa Autentikasi Sistem...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LockScreen />;
  }

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
        
        {/* Top App Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Content */}
        <main className="flex-1 pb-24">
          {activeTab === 'kasir' && <KasirPOS />}
          {activeTab === 'riwayat' && <RiwayatNota setActiveTab={setActiveTab} />}
          {activeTab === 'stock' && <StockOpname />}
          {activeTab === 'matriks' && <MatriksHarga />}
          
          {/* Admin Only Pages */}
          {isAdmin && activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {isAdmin && activeTab === 'labarugi' && <LabaRugi />}
          {isAdmin && activeTab === 'master' && <MasterData />}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
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
