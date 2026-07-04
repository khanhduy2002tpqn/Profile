'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiGet } from '@/lib/api';

export default function HomePage() {
  const [campId, setCampId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campId.trim()) return;

    setLoading(true);
    setError('');

    try {
      // API call to lookup the camp ID
      const result = await apiGet(`/students/lookup/${campId.trim()}`);
      
      // Trigger confetti on successful search
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Wait a brief moment for animation, then redirect
      setTimeout(() => {
        router.push(`/p/${result.publicId}`);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError('Không tìm thấy CampID. Vui lòng kiểm tra lại!');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Decorative Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center border-b border-slate-900 bg-slate-950/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-violet-600 to-emerald-500 p-2 rounded-lg text-white font-bold tracking-wider text-sm">
            SC
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-emerald-400">
            SUMMER CAMP HUB
          </span>
        </div>
        <button
          onClick={() => router.push('/cms/login')}
          className="text-xs uppercase tracking-wider font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-full transition-all duration-300"
        >
          Admin Portal
        </button>
      </header>

      {/* Main Search Panel */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 relative z-10">
        <div className="text-center max-w-xl mb-8 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-violet-950/30 border border-violet-850/50 px-3 py-1 rounded-full text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={12} className="text-violet-400 animate-pulse" />
            <span>Digital Portfolios 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Tra cứu{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400">
              Hồ Sơ Trại Sinh
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Nhập mã CampID cá nhân của bạn (ví dụ: <code className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded">SC2026-CAMP001</code>) để tra cứu album hoạt động, chứng nhận và các dự án của bạn.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="w-full max-w-lg p-6 bg-slate-900/40 border border-slate-850 rounded-2xl backdrop-blur-xl shadow-2xl relative">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={campId}
                onChange={(e) => setCampId(e.target.value)}
                placeholder="Nhập CampID của bạn..."
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all duration-300 placeholder-slate-500 text-slate-150 uppercase tracking-widest text-center font-bold"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
            </div>

            <button
              type="submit"
              disabled={loading || !campId.trim()}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 rounded-xl text-white font-bold shadow-lg hover:shadow-violet-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-350"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Đang tìm kiếm hồ sơ...</span>
                </>
              ) : (
                <>
                  <span>TRA CỨU PORTFOLIO</span>
                </>
              )}
            </button>
          </form>

          {/* Validation Feedback */}
          {error && (
            <div className="mt-4 p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 rounded-xl flex items-center space-x-2 text-xs md:text-sm animate-shake">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-600 border-t border-slate-950 bg-slate-950/80 z-10">
        <p>© 2026 Summer Camp Hub. Mọi quyền được bảo lưu.</p>
        <p className="mt-1">Thiết kế cho các chương trình Summer Camp, Winter Camp và Trại Hè Khoa Học.</p>
      </footer>
    </div>
  );
}
