import React, { useState } from 'react';
import { 
  Store, 
  Database, 
  Users, 
  RotateCcw, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import UserManagementModal from './UserManagementModal';
import ResetDataModal from './ResetDataModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected } = useRealtime();
  const { user, isAdmin, logout } = useAuth();

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 safe-area-top shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
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
                <div className="flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isConnected ? 'Online' : 'Menghubungkan...'}
                  </span>
                  <span className="text-[10px] text-slate-300">•</span>
                  
                  {/* User Role Badge */}
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    isAdmin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdmin ? '👑 Host Admin' : '💼 Sales'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              
              {/* ADMIN ONLY CONTROLS */}
              {isAdmin && (
                <>
                  {/* Master Data button */}
                  <button
                    onClick={() => setActiveTab('master')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition border ${
                      activeTab === 'master'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Kelola Master Data Produk & Pelanggan"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Master Data</span>
                  </button>

                  {/* Manage Users Button */}
                  <button
                    onClick={() => setShowUsersModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition flex items-center gap-1"
                    title="Manajemen Pengguna & Akun Sales"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Kelola User</span>
                  </button>

                  {/* Reset System Data Button */}
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1"
                    title="Reset Transaksi & Stok"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Reset</span>
                  </button>
                </>
              )}

              {/* Logged in User Display */}
              <div className="hidden sm:flex items-center gap-2 pl-2 pr-1 border-l border-slate-200">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">
                  {user?.name || 'User'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold border border-slate-200 transition flex items-center gap-1"
                title="Keluar dari Aplikasi"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Modals rendered OUTSIDE header stacking context */}
      {showUsersModal && (
        <UserManagementModal onClose={() => setShowUsersModal(false)} />
      )}

      {showResetModal && (
        <ResetDataModal onClose={() => setShowResetModal(false)} />
      )}
    </>
  );
}
