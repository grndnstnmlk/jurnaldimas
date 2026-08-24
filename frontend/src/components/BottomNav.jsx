import React from 'react';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Receipt, 
  Boxes, 
  TableProperties, 
  TrendingUp, 
  Database 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'kasir', label: 'Kasir', icon: ShoppingCart, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'riwayat', label: 'Riwayat', icon: Receipt },
    { id: 'stock', label: 'Stok', icon: Boxes },
    { id: 'matriks', label: 'Harga', icon: TableProperties },
    { id: 'labarugi', label: 'Laba', icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 safe-area-bottom shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5 items-center">
        {navItems.map((item) => {
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
