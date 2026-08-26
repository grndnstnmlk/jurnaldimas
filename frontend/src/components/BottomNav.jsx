import React from 'react';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Receipt, 
  Boxes, 
  TableProperties, 
  TrendingUp 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

  const allNavItems = [
    { id: 'kasir', label: 'Kasir', icon: ShoppingCart, role: 'all' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'admin' },
    { id: 'riwayat', label: 'Riwayat', icon: Receipt, role: 'all' },
    { id: 'stock', label: 'Stok', icon: Boxes, role: 'all' },
    { id: 'matriks', label: 'Harga', icon: TableProperties, role: 'all' },
    { id: 'labarugi', label: 'Laba', icon: TrendingUp, role: 'admin' },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (item.role === 'admin') return isAdmin;
    return true;
  });

  const gridColsClass = visibleNavItems.length === 6 
    ? 'grid-cols-6' 
    : visibleNavItems.length === 5 
      ? 'grid-cols-5' 
      : 'grid-cols-4';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 safe-area-bottom shadow-lg">
      <div className={`max-w-md mx-auto grid ${gridColsClass} gap-1 items-center`}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all select-none ${
                isActive
                  ? 'text-emerald-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${
                isActive ? 'bg-emerald-100/80 scale-105' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 block truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
