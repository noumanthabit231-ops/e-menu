'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  Menu as MenuIcon, 
  LogOut, 
  ExternalLink,
  ChefHat
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const menuItems = [
    {
      title: 'Настройки заведения',
      path: '/settings',
      icon: Settings
    },
    {
      title: 'Мое меню',
      path: '/menu',
      icon: MenuIcon
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-200 shadow-sm z-30">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">QR Menu</h1>
                <p className="text-xs text-slate-500 font-medium">SaaS Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 mt-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${pathname === item.path 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${pathname === item.path ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="font-semibold">{item.title}</span>
              </Link>
            ))}
            
            <button
              onClick={() => window.open('/', '_blank')}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all duration-200 group mt-12"
            >
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
              <span className="font-semibold">Предпросмотр</span>
            </button>
          </nav>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
              <span className="font-semibold">Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
