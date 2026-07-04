'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderSync,
  LogOut,
  Calendar,
  Layers,
  Menu,
  X,
  User,
  Loader2,
  Settings,
} from 'lucide-react';
import { apiGet, getToken, removeToken, removeCurrentUser, getCurrentUser } from '@/lib/api';

// Create a Season Context
interface SeasonContextType {
  activeSeasonId: string;
  activeSeasonCode: string;
  seasons: any[];
  loadSeasons: () => Promise<void>;
  selectSeason: (id: string) => void;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [seasons, setSeasons] = useState<any[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState('');
  const [activeSeasonCode, setActiveSeasonCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // 1. Skip layout for login screen
  const isLoginPage = pathname === '/cms/login';

  const loadSeasons = async () => {
    try {
      const data = await apiGet('/seasons');
      setSeasons(data);

      if (data.length > 0) {
        // Try to get from localStorage first
        const savedId = localStorage.getItem('cms_season_id');
        const savedCode = localStorage.getItem('cms_season_code');

        const activeInList = savedId ? data.find((s: any) => s.id === savedId) : null;

        if (activeInList) {
          setActiveSeasonId(activeInList.id);
          setActiveSeasonCode(activeInList.seasonCode);
        } else {
          // Fallback to active season in DB, or first season
          const dbActive = data.find((s: any) => s.isActive) || data[0];
          setActiveSeasonId(dbActive.id);
          setActiveSeasonCode(dbActive.seasonCode);
          localStorage.setItem('cms_season_id', dbActive.id);
          localStorage.setItem('cms_season_code', dbActive.seasonCode);
        }
      }
    } catch (err) {
      console.error('Failed to load seasons', err);
    }
  };

  const selectSeason = (id: string) => {
    const s = seasons.find((item) => item.id === id);
    if (s) {
      setActiveSeasonId(s.id);
      setActiveSeasonCode(s.seasonCode);
      localStorage.setItem('cms_season_id', s.id);
      localStorage.setItem('cms_season_code', s.seasonCode);
      // Dispatch custom event to trigger reload in active views
      window.dispatchEvent(new Event('cms_season_changed'));
    }
  };

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      router.push('/cms/login');
      return;
    }

    const user = getCurrentUser();
    setAdminUser(user);

    loadSeasons().finally(() => {
      setLoading(false);
    });
  }, [isLoginPage, router]);

  const handleLogout = () => {
    removeToken();
    removeCurrentUser();
    localStorage.removeItem('cms_season_id');
    localStorage.removeItem('cms_season_code');
    router.push('/cms/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-violet-500 mb-4" size={48} />
        <p className="text-slate-400 text-sm font-semibold tracking-wider">ĐANG KHỞI TẠO CMS...</p>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/cms/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Trại sinh', path: '/cms/students', icon: Users },
    { name: 'Quản lý Mùa trại', path: '/cms/seasons', icon: Calendar },
    { name: 'Nhập dữ liệu', path: '/cms/import', icon: FolderSync },
  ];

  return (
    <SeasonContext.Provider value={{ activeSeasonId, activeSeasonCode, seasons, loadSeasons, selectSeason }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
        {/* Mobile Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Shell */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-850 z-40 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex lg:flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-850 bg-slate-950/20">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-tr from-violet-600 to-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                SC
              </div>
              <span className="font-extrabold text-sm tracking-wider text-slate-200">ADMIN CONTROL</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/20 to-violet-850/5 text-violet-400 border-l-4 border-violet-500 pl-3'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/30'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 space-y-4">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                {adminUser?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-slate-350">{adminUser?.email}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{adminUser?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-950 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/50 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-slate-900 border-b border-slate-850 flex items-center justify-between px-6 z-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
              >
                <Menu size={24} />
              </button>
              <h2 className="hidden md:block font-bold text-lg text-slate-200">
                {adminUser?.organizationName || 'Summer Camp Hub'}
              </h2>
            </div>

            {/* Top Toolbar */}
            <div className="flex items-center space-x-4">
              {/* Active Season Dropdown Selector */}
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-violet-400 hidden sm:block" />
                <span className="text-xs text-slate-400 font-semibold hidden sm:block">Mùa trại:</span>
                <select
                  value={activeSeasonId}
                  onChange={(e) => selectSeason(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.seasonCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          {/* Page Body Viewport */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950 relative">
            {children}
          </main>
        </div>
      </div>
    </SeasonContext.Provider>
  );
}
