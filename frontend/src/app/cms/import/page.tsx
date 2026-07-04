'use client';

import React, { useState } from 'react';
import { useSeason } from '../layout';
import { getUploadUrl } from '@/lib/api';
import {
  FolderSync,
  FileText,
  Archive,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Terminal,
} from 'lucide-react';

interface ImportLog {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export default function CMSImport() {
  const { activeSeasonId, activeSeasonCode } = useSeason();

  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [importFinished, setImportFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadataFile || !activeSeasonId) return;

    setLoading(true);
    setLogs([]);
    setImportFinished(false);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('metadata', metadataFile);
    if (zipFile) {
      formData.append('zip', zipFile);
    }

    try {
      const response = await fetch(getUploadUrl(`/import?seasonId=${activeSeasonId}`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi xử lý file upload.');
      }

      const result = await response.json();
      setLogs(result.logs || []);
      setImportFinished(true);

      // Reset file states on success
      setMetadataFile(null);
      setZipFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Hệ thống import gặp sự cố, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <FolderSync size={24} className="text-violet-500" />
          Nhập dữ liệu hàng loạt
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Đưa toàn bộ thông tin trại sinh và tài nguyên ảnh/dự án vào mùa trại{' '}
          <span className="font-bold text-slate-200">{activeSeasonCode}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload Form */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md space-y-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Tải tệp tin dữ liệu</h3>

          <form onSubmit={handleImportSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Metadata file field */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. File Metadata (Excel/CSV)</span>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-6 bg-slate-955/20 hover:bg-slate-950/20 cursor-pointer transition relative group h-40">
                  <FileText className="text-slate-500 group-hover:text-violet-400 mb-2 transition" size={32} />
                  <span className="text-xs text-slate-450 font-semibold text-center truncate max-w-full px-2">
                    {metadataFile ? metadataFile.name : 'Chọn file Excel (.xlsx, .xls) hoặc CSV'}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    required
                    onChange={(e) => setMetadataFile(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* ZIP assets file field */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. Tệp ảnh & dự án (ZIP) - Tùy chọn</span>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-6 bg-slate-955/20 hover:bg-slate-950/20 cursor-pointer transition relative group h-40">
                  <Archive className="text-slate-500 group-hover:text-violet-400 mb-2 transition" size={32} />
                  <span className="text-xs text-slate-450 font-semibold text-center truncate max-w-full px-2">
                    {zipFile ? zipFile.name : 'Chọn file ZIP chứa ảnh/slide'}
                  </span>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Error alerts */}
            {errorMsg && (
              <div className="p-4 bg-rose-955/20 border border-rose-900/50 text-rose-400 rounded-xl flex items-center space-x-2 text-xs">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-850/50">
              <button
                type="submit"
                disabled={loading || !metadataFile}
                className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-violet-650/10 cursor-pointer flex items-center justify-center space-x-2 transition duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Đang tải lên và phân tích...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>BẮT ĐẦU IMPORT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Guideline rules */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
            <HelpCircle size={16} className="text-violet-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Hướng dẫn chuẩn bị</h3>
          </div>

          <div className="text-xs space-y-4 text-slate-400 leading-relaxed">
            <div className="space-y-1.5">
              <p className="font-bold text-slate-300">Excel / CSV template:</p>
              <p>File chứa các cột tiêu đề bắt buộc:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500 font-mono text-[10px]">
                <li>CampID (Ví dụ: SC2026-CAMP001)</li>
                <li>FullName (Nguyễn Văn A)</li>
                <li>Age (12)</li>
                <li>Hometown (Hà Nội)</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <p className="font-bold text-slate-300">File đặt tên trong ZIP:</p>
              <p>Tất cả ảnh/tài liệu của trại sinh phải đặt theo mã CampID làm tiền tố:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500 font-mono text-[10px]">
                <li>Ảnh đại diện: <code className="text-slate-400">SC2026-CAMP001_avatar.jpg</code></li>
                <li>Chứng nhận: <code className="text-slate-400">SC2026-CAMP001_cert.png</code></li>
                <li>Ảnh hoạt động: <code className="text-slate-400">SC2026-CAMP001_act_01.jpg</code></li>
                <li>Slide dự án: <code className="text-slate-400">SC2026-CAMP001_project01.pptx</code></li>
                <li>Tài liệu dự án: <code className="text-slate-400">SC2026-CAMP001_project01.pdf</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Terminal logger */}
      {(logs.length > 0 || loading) && (
        <div className="bg-slate-900/80 border border-slate-850 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-slate-300">
              <Terminal size={16} className="text-violet-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Nhật ký xử lý hệ thống</h3>
            </div>
            {importFinished && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-[10px] font-bold rounded-full">
                <CheckCircle size={10} />
                <span>Hoàn thành</span>
              </span>
            )}
          </div>

          <div className="h-64 overflow-y-auto bg-slate-950/80 rounded-xl p-4 font-mono text-xs space-y-2 scrollbar-thin border border-slate-850/50">
            {logs.length === 0 && loading && (
              <div className="text-slate-500 flex items-center space-x-2">
                <Loader2 className="animate-spin text-violet-500" size={14} />
                <span>Đang xử lý dữ liệu và thiết lập các mối quan hệ portfolio...</span>
              </div>
            )}
            
            {logs.map((log, idx) => {
              let color = 'text-slate-400';
              if (log.type === 'success') color = 'text-emerald-400';
              if (log.type === 'error') color = 'text-rose-400 font-bold';
              if (log.type === 'warning') color = 'text-amber-400';

              return (
                <div key={idx} className={`${color} leading-relaxed`}>
                  {log.type === 'success' && '✓ '}
                  {log.type === 'error' && '✗ '}
                  {log.type === 'warning' && '! '}
                  [{new Date().toLocaleTimeString()}] {log.message}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
