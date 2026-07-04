'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiPost, setToken, setCurrentUser, getToken } from '@/lib/api';

export default function CMSLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push('/cms/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiPost('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });

      // Save token & user
      setToken(data.access_token);
      setCurrentUser(data.user);

      // Redirect to CMS Dashboard
      router.push('/cms/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 bg-slate-900/40 border border-slate-850 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-violet-600 to-emerald-500 rounded-2xl text-white font-extrabold text-xl shadow-lg mb-2">
            SC
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">CMS Admin Portal</h1>
          <p className="text-slate-400 text-xs">Đăng nhập để quản lý hồ sơ và các mùa Summer Camp</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Admin</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@summercamp.com"
                disabled={loading}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl transition text-sm text-slate-150"
              />
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl transition text-sm text-slate-150"
              />
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error alerts */}
          {error && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/50 text-rose-400 rounded-xl flex items-center space-x-2 text-xs">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 rounded-xl text-white font-bold shadow-lg hover:shadow-violet-650/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang kiểm tra thông tin...</span>
              </>
            ) : (
              <span>ĐĂNG NHẬP</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-400 transition"
          >
            ← Quay lại trang tra cứu công cộng
          </a>
        </div>
      </div>
    </div>
  );
}
