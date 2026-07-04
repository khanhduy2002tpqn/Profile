'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSeason } from '../layout';
import { apiGet, apiPost, apiDelete, getUploadUrl } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  QrCode,
  Download,
  Loader2,
  X,
  AlertCircle,
  FileDown,
} from 'lucide-react';

export default function CMSStudents() {
  const { activeSeasonId, activeSeasonCode } = useSeason();
  const router = useRouter();

  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pages, setPages] = useState(1);

  // Modal create state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCampId, setNewCampId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newAge, setNewAge] = useState(10);
  const [newHometown, setNewHometown] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!activeSeasonId) return;
    setLoading(true);
    try {
      const res = await apiGet('/students', {
        seasonId: activeSeasonId,
        search,
        page,
        limit,
      });
      setStudents(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  }, [activeSeasonId, search, page, limit]);

  useEffect(() => {
    fetchStudents();

    // Listen for season change
    window.addEventListener('cms_season_changed', fetchStudents);
    return () => {
      window.removeEventListener('cms_season_changed', fetchStudents);
    };
  }, [fetchStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampId.trim() || !newFullName.trim()) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      await apiPost(`/students?seasonId=${activeSeasonId}`, {
        campId: newCampId.trim().toUpperCase(),
        fullName: newFullName.trim(),
        age: Number(newAge),
        hometown: newHometown.trim() || 'Unknown',
      });

      // Clear form
      setNewCampId('');
      setNewFullName('');
      setNewAge(10);
      setNewHometown('');
      setCreateModalOpen(false);
      
      // Refresh list
      fetchStudents();
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Lỗi khi tạo trại sinh.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/students/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchStudents();
    } catch (err) {
      console.error('Failed to delete student', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const downloadAllQR = () => {
    if (!activeSeasonId) return;
    // Launch endpoint directly in a new window to trigger download
    window.open(getUploadUrl(`/students/qr/zip?seasonId=${activeSeasonId}`), '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users size={24} className="text-violet-500" />
            Danh sách Trại sinh
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Tổng số: <span className="font-bold text-slate-200">{total} trại sinh</span> trong mùa{' '}
            <span className="font-bold text-slate-200">{activeSeasonCode}</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadAllQR}
            disabled={total === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-750 text-slate-300 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FileDown size={14} className="text-emerald-400" />
            <span>Tải ZIP tất cả mã QR</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg hover:shadow-violet-600/10 transition"
          >
            <Plus size={14} />
            <span>Thêm Trại sinh</span>
          </button>
        </div>
      </div>

      {/* Search Filter Toolbar */}
      <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo họ tên, CampID hoặc quê quán..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm transition"
            />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-sm font-bold text-slate-300 rounded-xl transition cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Students Data Table */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center">
            <Loader2 className="animate-spin text-violet-500 mb-2" size={32} />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Đang tải danh sách...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Users className="mx-auto text-slate-600" size={40} />
            <p className="text-slate-400 text-sm font-semibold">Chưa có trại sinh nào</p>
            <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
              Bạn có thể thêm thủ công trại sinh hoặc dùng tính năng nhập hàng loạt bằng Excel và ZIP.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">CampID</th>
                  <th className="px-6 py-4">Họ tên</th>
                  <th className="px-6 py-4">Tuổi</th>
                  <th className="px-6 py-4">Quê quán</th>
                  <th className="px-6 py-4 text-center">Hoạt động khác</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/20 transition duration-150">
                    <td className="px-6 py-4 font-mono font-bold text-slate-300">{student.campId}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-850 border border-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-slate-300">
                          {student.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover" />
                          ) : (
                            student.fullName.charAt(0)
                          )}
                        </div>
                        <span className="truncate max-w-[180px]">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{student.age} tuổi</td>
                    <td className="px-6 py-4 text-slate-400">{student.hometown}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      <div className="flex items-center justify-center gap-4">
                        <span title="Dự án">{student.projects?.length || 0} Dự án</span>
                        <span title="Album">{student.activities?.length || 0} Ảnh</span>
                        <span title="Giải">{student.awards?.length || 0} Giải</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* Open Portfolio Page */}
                      <a
                        href={`/p/${student.publicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-250 border border-slate-850 rounded-lg cursor-pointer transition"
                        title="Xem Portfolio"
                      >
                        <ExternalLink size={14} />
                      </a>

                      {/* Download QR Code */}
                      {student.qrCodeUrl && (
                        <a
                          href={student.qrCodeUrl}
                          download={`${student.campId}_qr.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-250 border border-slate-850 rounded-lg cursor-pointer transition"
                          title="Tải mã QR"
                        >
                          <QrCode size={14} />
                        </a>
                      )}

                      {/* Edit Details */}
                      <button
                        onClick={() => router.push(`/cms/students/${student.id}`)}
                        className="inline-flex p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-250 border border-slate-850 rounded-lg cursor-pointer transition"
                        title="Chỉnh sửa chi tiết"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete student */}
                      <button
                        onClick={() => {
                          setDeleteTargetId(student.id);
                          setDeleteTargetName(student.fullName);
                        }}
                        className="inline-flex p-2 bg-slate-950 hover:bg-rose-950/20 hover:text-rose-455 text-slate-500 border border-slate-850 hover:border-rose-900/50 rounded-lg cursor-pointer transition"
                        title="Xóa Trại sinh"
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

        {/* Pagination Toolbar */}
        {!loading && pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-850 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {page} / {pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-xs font-bold text-slate-400 border border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-xs font-bold text-slate-400 border border-slate-850 rounded-lg cursor-pointer disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE STUDENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-200">Tạo mới trại sinh</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CampID</label>
                <input
                  type="text"
                  value={newCampId}
                  onChange={(e) => setNewCampId(e.target.value)}
                  placeholder="SC2026-CAMP001"
                  required
                  disabled={createLoading}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  disabled={createLoading}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tuổi</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    min={1}
                    required
                    disabled={createLoading}
                    className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quê quán</label>
                  <input
                    type="text"
                    value={newHometown}
                    onChange={(e) => setNewHometown(e.target.value)}
                    placeholder="Hà Nội"
                    disabled={createLoading}
                    className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Error messages */}
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
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 cursor-pointer transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newCampId.trim() || !newFullName.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 transition"
                >
                  {createLoading && <Loader2 className="animate-spin" size={12} />}
                  <span>Thêm mới</span>
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
                <h3 className="font-bold text-slate-200">Xóa Trại sinh?</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Bạn có chắc chắn muốn xóa trại sinh <span className="font-bold text-slate-200">{deleteTargetName}</span>? Hành động này sẽ xóa toàn bộ Album ảnh, Dự án và Giải thưởng liên quan của hồ sơ này.
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
                  onClick={handleDeleteStudent}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 transition"
                >
                  {deleteLoading && <Loader2 className="animate-spin" size={12} />}
                  <span>Xóa hồ sơ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
