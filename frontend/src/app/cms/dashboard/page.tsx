'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSeason } from '../layout';
import { apiGet } from '@/lib/api';
import {
  Users,
  Image as ImageIcon,
  FolderOpen,
  Award,
  FileBadge,
  Sparkles,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function CMSDashboard() {
  const { activeSeasonId, activeSeasonCode, seasons } = useSeason();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!activeSeasonId) return;
    setLoading(true);
    try {
      const data = await apiGet('/dashboard/stats', { seasonId: activeSeasonId });
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  }, [activeSeasonId]);

  useEffect(() => {
    fetchStats();

    // Listen for season changes in layout
    window.addEventListener('cms_season_changed', fetchStats);
    return () => {
      window.removeEventListener('cms_season_changed', fetchStats);
    };
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500 mr-2" size={24} />
        <span className="text-slate-400 text-sm">Đang tải dữ liệu báo cáo...</span>
      </div>
    );
  }

  const activeSeasonName = seasons.find((s) => s.id === activeSeasonId)?.name || 'Mùa hiện tại';

  const cardData = [
    {
      title: 'Tổng số Trại sinh',
      value: stats?.students || 0,
      icon: Users,
      color: 'from-violet-600 to-indigo-650',
      textColor: 'text-violet-400',
    },
    {
      title: 'Album Ảnh Scrapbook',
      value: stats?.photos || 0,
      icon: ImageIcon,
      color: 'from-fuchsia-600 to-pink-650',
      textColor: 'text-fuchsia-400',
    },
    {
      title: 'Dự án / Slide PPT',
      value: stats?.projects || 0,
      icon: FolderOpen,
      color: 'from-emerald-600 to-teal-650',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Giải thưởng & Giấy khen',
      value: stats?.awards || 0,
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
    },
    {
      title: 'Chứng nhận hoàn thành',
      value: stats?.certificates || 0,
      icon: FileBadge,
      color: 'from-cyan-500 to-blue-650',
      textColor: 'text-cyan-400',
    },
  ];

  // Data formatted for chart
  const chartData = [
    { name: 'Trại sinh', count: stats?.students || 0, color: '#8b5cf6' },
    { name: 'Hình ảnh', count: stats?.photos || 0, color: '#d946ef' },
    { name: 'Dự án', count: stats?.projects || 0, color: '#10b981' },
    { name: 'Giải thưởng', count: stats?.awards || 0, color: '#f59e0b' },
    { name: 'Chứng nhận', count: stats?.certificates || 0, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles size={20} className="text-violet-500" />
            Báo cáo Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Số liệu thống kê chi tiết cho mùa trại: <span className="font-bold text-slate-200">{activeSeasonName} ({activeSeasonCode})</span>
          </p>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cardData.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md group hover:border-slate-750 transition-all duration-300"
            >
              {/* Glow background */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-tr ${card.color} opacity-5 group-hover:opacity-10 blur-xl rounded-full transition-all duration-300`} />
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-950/80 border border-slate-800 ${card.textColor}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold text-slate-100">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart card */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Biểu đồ tổng quan tài nguyên</h3>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
              <TrendingUp size={14} className="text-violet-400" />
              <span>Phân bố dữ liệu</span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System logs / notifications */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Trạng thái hệ thống</h3>
            <div className="space-y-3.5">
              <div className="flex items-start space-x-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-300">Kết nối Database</p>
                  <p className="text-slate-500">PostgreSQL (Supabase) đang hoạt động ổn định.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-300">Công cụ Lưu trữ File</p>
                  <p className="text-slate-500">Cloudinary & AWS S3 sẵn sàng nhận upload.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-violet-500 animate-pulse" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-300">Hệ thống QR Generator</p>
                  <p className="text-slate-500">Sinh QR tự động tích hợp cùng Public Portfolio.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-semibold pt-4 border-t border-slate-850/50">
            Hệ thống Digital Portfolio SaaS v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
