'use client';

import React, { useState, useEffect } from 'react';
import { useSeason } from '../layout';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function CMSSeasons() {
  const { activeSeasonId, loadSeasons, selectSeason } = useSeason();
  const [seasonsList, setSeasonsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create Season States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [seasonCode, setSeasonCode] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState(2026);
  const [isActive, setIsActive] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete Action states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/seasons');
      setSeasonsList(data);
    } catch (err) {
      console.error('Failed to load seasons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonCode.trim() || !name.trim()) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      await apiPost('/seasons', {
        seasonCode: seasonCode.trim().toUpperCase(),
        name: name.trim(),
        year: Number(year),
        isActive,
      });

      // Clear Form & Close
      setSeasonCode('');
      setName('');
      setYear(2026);
      setIsActive(false);
      setCreateModalOpen(false);

      // Refresh listings and layout context
      await loadSeasons();
      await fetchSeasons();
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Lỗi khi tạo mùa trại mới.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await apiPut(`/seasons/${id}`, { isActive: true });
      
      // Update global context & reload
      selectSeason(id);
      await loadSeasons();
      await fetchSeasons();
    } catch (err) {
      console.error('Failed to toggle active season', err);
      alert('Kích hoạt mùa trại thất bại.');
    }
  };

  const handleDeleteSeason = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);

    try {
      await apiDelete(`/seasons/${deleteTargetId}`);
      setDeleteTargetId(null);
      
      // Refresh listings and layout context
      await loadSeasons();
      await fetchSeasons();
    } catch (err) {
      console.error('Failed to delete season', err);
      alert('Không xóa được mùa trại. Đã xảy ra lỗi.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Calendar size={24} className="text-violet-500" />
            Quản lý Mùa trại
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Thiết lập các mùa Summer Camp độc lập, giúp cô lập thông tin trại sinh theo từng năm.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg hover:shadow-violet-650/10 transition"
        >
          <Plus size={14} />
          <span>Thêm mùa mới</span>
        </button>
      </div>

      {/* Seasons list data table */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center">
            <Loader2 className="animate-spin text-violet-500 mb-2" size={32} />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Đang tải danh sách...</span>
          </div>
        ) : seasonsList.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Calendar className="mx-auto text-slate-600" size={40} />
            <p className="text-slate-400 text-sm font-semibold">Chưa có mùa trại nào</p>
            <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
              Vui lòng tạo ít nhất một mùa trại mới để bắt đầu quản lý danh sách trại sinh.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Mã Mùa</th>
                  <th className="px-6 py-4">Tên Mùa</th>
                  <th className="px-6 py-4">Năm diễn ra</th>
                  <th className="px-6 py-4 text-center">Trạng thái active</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {seasonsList.map((season) => (
                  <tr key={season.id} className="hover:bg-slate-900/20 transition duration-150">
                    <td className="px-6 py-4 font-mono font-bold text-slate-350">{season.seasonCode}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{season.name}</td>
                    <td className="px-6 py-4 text-slate-400">{season.year}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        {season.isActive ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            <CheckCircle size={10} />
                            <span>Đang kích hoạt</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActive(season.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-wider transition cursor-pointer"
                          >
                            <Clock size={10} />
                            <span>Đặt làm hoạt động</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Delete action */}
                      <button
                        onClick={() => {
                          setDeleteTargetId(season.id);
                          setDeleteTargetName(season.name);
                        }}
                        disabled={season.isActive}
                        className={`inline-flex p-2 rounded-lg transition border ${
                          season.isActive
                            ? 'text-slate-650 border-slate-950 cursor-not-allowed opacity-30'
                            : 'bg-slate-950 hover:bg-rose-950/20 hover:text-rose-455 text-slate-500 border-slate-850 hover:border-rose-900/50 cursor-pointer'
                        }`}
                        title={season.isActive ? 'Không thể xóa mùa đang active' : 'Xóa mùa trại'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SEASON MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-200">Tạo mùa trại mới</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSeason} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Mùa (Season Code)</label>
                <input
                  type="text"
                  value={seasonCode}
                  onChange={(e) => setSeasonCode(e.target.value)}
                  placeholder="Ví dụ: SC2026, STEM2026"
                  required
                  disabled={createLoading}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Mùa</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Summer Camp 2026"
                  required
                  disabled={createLoading}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Năm tổ chức</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  required
                  disabled={createLoading}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                />
              </div>

              {/* Set Active Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={createLoading}
                  className="rounded border-slate-800 bg-slate-955 text-violet-500 focus:ring-violet-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="isActive" className="text-xs text-slate-350 select-none cursor-pointer">
                  Đặt làm mùa trại kích hoạt ngay lập tức
                </label>
              </div>

              {/* Error logs */}
              {createError && (
                <div className="p-3 bg-rose-955/20 border border-rose-900/50 text-rose-400 rounded-xl flex items-center space-x-2 text-xs">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Actions footer */}
              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={createLoading}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !seasonCode.trim() || !name.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 transition"
                >
                  {createLoading && <Loader2 className="animate-spin" size={12} />}
                  <span>Thêm mùa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <Trash2 className="mx-auto text-rose-500" size={36} />
                <h3 className="font-bold text-slate-200">Xóa Mùa Trại?</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Bạn có chắc chắn muốn xóa mùa trại <span className="font-bold text-slate-200">{deleteTargetName}</span>? Hành động này sẽ thực hiện **xóa toàn bộ trại sinh và mọi portfolio (album, dự án, chứng nhận) thuộc về mùa trại này**. Hành động này **không thể khôi phục**!
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteSeason}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 transition"
                >
                  {deleteLoading && <Loader2 className="animate-spin" size={12} />}
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
