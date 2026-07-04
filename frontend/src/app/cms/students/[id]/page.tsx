'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Image as ImageIcon,
  FileBadge,
  FolderOpen,
  Award as AwardIcon,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Play,
  FileText,
  Presentation,
  Check,
  Eye,
  X,
} from 'lucide-react';
import { apiGet, apiPut, apiPost, apiDelete, getUploadUrl } from '@/lib/api';

export default function StudentDetailEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'scrapbook' | 'certificate' | 'projects' | 'awards'>('basic');

  // Basic Info Form states
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState(10);
  const [hometown, setHometown] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [basicSaving, setBasicSaving] = useState(false);
  const [basicSuccess, setBasicSuccess] = useState(false);

  // Scrapbook States
  const [scrapbookUploading, setScrapbookUploading] = useState(false);

  // Certificate States
  const [certUploading, setCertUploading] = useState(false);

  // Project Modal / form states
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projVideoUrl, setProjVideoUrl] = useState('');
  const [projCover, setProjCover] = useState<File | null>(null);
  const [projPpt, setProjPpt] = useState<File | null>(null);
  const [projPdf, setProjPdf] = useState<File | null>(null);
  const [projSaving, setProjSaving] = useState(false);

  // Award Modal / form states
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [awardTitle, setAwardTitle] = useState('');
  const [awardDesc, setAwardDesc] = useState('');
  const [awardIcon, setAwardIcon] = useState('trophy');
  const [awardImage, setAwardImage] = useState<File | null>(null);
  const [awardSaving, setAwardSaving] = useState(false);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/students/${id}`);
      setStudent(data);
      setFullName(data.fullName);
      setAge(data.age);
      setHometown(data.hometown);
    } catch (err: any) {
      console.error(err);
      setError('Không tải được thông tin trại sinh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  // --- Basic Info Update ---
  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setBasicSaving(true);
    setBasicSuccess(false);
    try {
      const data = await apiPut(`/students/${id}`, {
        fullName,
        age: Number(age),
        hometown,
      });
      setStudent((prev: any) => ({ ...prev, ...data }));
      setBasicSuccess(true);
      setTimeout(() => setBasicSuccess(false), 3050);
    } catch (err) {
      console.error(err);
      alert('Không lưu được thông tin cơ bản.');
    } finally {
      setBasicSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(getUploadUrl(`/students/${id}/avatar`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload avatar failed');

      const data = await response.json();
      setStudent((prev: any) => ({ ...prev, avatarUrl: data.avatarUrl }));
    } catch (err) {
      console.error(err);
      alert('Không upload được avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // --- Scrapbook (Activities) ---
  const handleScrapbookUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setScrapbookUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const response = await fetch(getUploadUrl(`/students/${id}/activities`), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });
        if (!response.ok) throw new Error('Upload scrapbook image failed');
      }

      // Reload student details to fetch updated album
      const data = await apiGet(`/students/${id}`);
      setStudent(data);
    } catch (err) {
      console.error(err);
      alert('Không upload được ảnh scrapbook.');
    } finally {
      setScrapbookUploading(false);
    }
  };

  const handleDeleteActivity = async (actId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi album?')) return;
    try {
      await apiDelete(`/students/${id}/activities/${actId}`);
      setStudent((prev: any) => ({
        ...prev,
        activities: prev.activities.filter((a: any) => a.id !== actId),
      }));
    } catch (err) {
      console.error(err);
      alert('Xóa ảnh thất bại.');
    }
  };

  // --- Certificate ---
  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCertUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(getUploadUrl(`/students/${id}/certificate`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload certificate failed');

      const data = await response.json();
      setStudent((prev: any) => ({
        ...prev,
        certificates: [data],
      }));
    } catch (err) {
      console.error(err);
      alert('Upload chứng nhận thất bại.');
    } finally {
      setCertUploading(false);
    }
  };

  const handleDeleteCert = async () => {
    if (!confirm('Xóa chứng nhận hiện tại?')) return;
    try {
      await apiDelete(`/students/${id}/certificate`);
      setStudent((prev: any) => ({ ...prev, certificates: [] }));
    } catch (err) {
      console.error(err);
      alert('Xóa chứng nhận thất bại.');
    }
  };

  // --- Projects ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    setProjSaving(true);
    const formData = new FormData();
    formData.append('title', projTitle.trim());
    formData.append('description', projDesc.trim());
    formData.append('videoUrl', projVideoUrl.trim());
    if (projCover) formData.append('cover', projCover);
    if (projPpt) formData.append('ppt', projPpt);
    if (projPdf) formData.append('pdf', projPdf);

    try {
      const response = await fetch(getUploadUrl(`/students/${id}/projects`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Create project failed');

      const newProj = await response.json();
      setStudent((prev: any) => ({
        ...prev,
        projects: [...(prev.projects || []), newProj],
      }));

      // Close modal & reset states
      setProjectModalOpen(false);
      setProjTitle('');
      setProjDesc('');
      setProjVideoUrl('');
      setProjCover(null);
      setProjPpt(null);
      setProjPdf(null);
    } catch (err) {
      console.error(err);
      alert('Thêm dự án thất bại.');
    } finally {
      setProjSaving(false);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!confirm('Xóa dự án này?')) return;
    try {
      await apiDelete(`/students/${id}/projects/${projId}`);
      setStudent((prev: any) => ({
        ...prev,
        projects: prev.projects.filter((p: any) => p.id !== projId),
      }));
    } catch (err) {
      console.error(err);
      alert('Xóa dự án thất bại.');
    }
  };

  // --- Awards ---
  const handleCreateAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardTitle.trim()) return;

    setAwardSaving(true);
    const formData = new FormData();
    formData.append('title', awardTitle.trim());
    formData.append('description', awardDesc.trim());
    formData.append('icon', awardIcon);
    if (awardImage) formData.append('file', awardImage);

    try {
      const response = await fetch(getUploadUrl(`/students/${id}/awards`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Create award failed');

      const newAward = await response.json();
      setStudent((prev: any) => ({
        ...prev,
        awards: [...(prev.awards || []), newAward],
      }));

      setAwardModalOpen(false);
      setAwardTitle('');
      setAwardDesc('');
      setAwardIcon('trophy');
      setAwardImage(null);
    } catch (err) {
      console.error(err);
      alert('Thêm giải thưởng thất bại.');
    } finally {
      setAwardSaving(false);
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!confirm('Xóa giải thưởng này?')) return;
    try {
      await apiDelete(`/students/${id}/awards/${awardId}`);
      setStudent((prev: any) => ({
        ...prev,
        awards: prev.awards.filter((a: any) => a.id !== awardId),
      }));
    } catch (err) {
      console.error(err);
      alert('Xóa giải thưởng thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500 mr-2" size={24} />
        <span className="text-slate-400 text-sm">Đang tải hồ sơ trại sinh...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-10 space-y-4">
        <AlertCircle className="mx-auto text-rose-500" size={40} />
        <p className="text-slate-300 font-bold">{error}</p>
        <button
          onClick={() => router.push('/cms/students')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const tabItems = [
    { id: 'basic', name: 'Thông tin cơ bản', icon: UserIcon },
    { id: 'scrapbook', name: 'Scrapbook Album', icon: ImageIcon },
    { id: 'certificate', name: 'Chứng nhận', icon: FileBadge },
    { id: 'projects', name: 'Dự án / Slide', icon: FolderOpen },
    { id: 'awards', name: 'Giải thưởng', icon: AwardIcon },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/cms/students')}
            className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              Chỉnh sửa chi tiết hồ sơ
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Họ tên: <span className="font-bold text-slate-200">{student.fullName}</span> | CampID:{' '}
              <span className="font-mono font-bold text-slate-200">{student.campId}</span>
            </p>
          </div>
        </div>

        {/* View portfolio directly */}
        <a
          href={`/p/${student.publicId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-center inline-flex items-center space-x-2 px-4 py-2 bg-slate-905 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer"
        >
          <Eye size={14} />
          <span>Xem portfolio thực tế</span>
        </a>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side Tab Navigation */}
        <div className="w-full lg:w-64 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 pb-2 lg:pb-0">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 flex items-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-600/20 to-violet-850/5 text-violet-400 border-l-4 border-violet-500 pl-3'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side Tab panels */}
        <div className="flex-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-md min-h-[50vh]">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-2">
                Thông tin cơ bản
              </h3>

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Avatar uploader frame */}
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border border-slate-700 bg-slate-950 relative group">
                    {student.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={student.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-3xl">
                        {fullName.charAt(0)}
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-350 cursor-pointer transition">
                    <Upload size={12} />
                    <span>Upload ảnh đại diện</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSaveBasic} className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CampID (Mã trại sinh)</label>
                      <input
                        type="text"
                        value={student.campId}
                        disabled
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 text-slate-500 font-mono text-sm rounded-xl cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={basicSaving}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tuổi</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        required
                        disabled={basicSaving}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quê quán</label>
                      <input
                        type="text"
                        value={hometown}
                        onChange={(e) => setHometown(e.target.value)}
                        required
                        disabled={basicSaving}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {basicSuccess && (
                    <div className="p-3 bg-emerald-955/20 border border-emerald-900/50 text-emerald-400 rounded-xl flex items-center space-x-2 text-xs">
                      <Check size={16} className="flex-shrink-0" />
                      <span>Đã cập nhật thông tin cơ bản thành công!</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={basicSaving}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow cursor-pointer transition"
                    >
                      {basicSaving && <Loader2 className="animate-spin" size={12} />}
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: SCRAPBOOK */}
          {activeTab === 'scrapbook' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-350">Scrapbook Album ảnh</h3>
                
                {/* Upload action */}
                <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-bold text-white cursor-pointer shadow transition">
                  {scrapbookUploading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>Tải ảnh album mới</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleScrapbookUpload}
                    disabled={scrapbookUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Album grid view */}
              {!student.activities || student.activities.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <ImageIcon size={36} className="mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">Album trống</p>
                  <p className="text-[10px] text-slate-600">Hãy thêm một vài bức ảnh hoạt động của trại sinh.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {student.activities.map((act: any, index: number) => (
                    <div
                      key={act.id}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={act.imageUrl} alt="Album activity" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white transition cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/85 text-[10px] text-slate-400 rounded">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CERTIFICATE */}
          {activeTab === 'certificate' && (
            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-2">
                Chứng nhận hoàn thành
              </h3>

              {!student.certificates || student.certificates.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-4">
                  <FileBadge size={40} className="mx-auto text-slate-750" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400">Trại sinh chưa có chứng nhận</p>
                    <p className="text-[10px] text-slate-650">Tải lên chứng nhận để người dùng có thể tải về.</p>
                  </div>
                  <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-bold text-white cursor-pointer shadow transition">
                    {certUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    <span>Tải chứng nhận lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCertUpload}
                      disabled={certUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={student.certificates[0].imageUrl}
                      alt="Chứng nhận"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-450 rounded-xl cursor-pointer transition">
                      {certUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                      <span>Thay thế</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCertUpload}
                        disabled={certUploading}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleDeleteCert}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Xóa chứng nhận</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-350">Bài thuyết trình / Dự án</h3>
                <button
                  onClick={() => setProjectModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition"
                >
                  <Plus size={14} />
                  <span>Thêm dự án mới</span>
                </button>
              </div>

              {/* Projects list */}
              {!student.projects || student.projects.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <FolderOpen size={36} className="mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">Chưa có dự án nào</p>
                  <p className="text-[10px] text-slate-650">Trại sinh có thể upload slide thuyết trình, file PDF sản phẩm và video.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {student.projects.map((project: any) => (
                    <div
                      key={project.id}
                      className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:border-slate-800 transition"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center text-slate-500">
                          {project.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <Presentation size={24} />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-bold text-slate-200 text-sm truncate">{project.title}</h4>
                          <p className="text-xs text-slate-450 truncate">{project.description}</p>
                          <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                            {project.pptUrl && <span className="flex items-center space-x-0.5 text-orange-400"><Presentation size={10} /> <span>Slide PPT</span></span>}
                            {project.pdfUrl && <span className="flex items-center space-x-0.5 text-rose-455"><FileText size={10} /> <span>Tài liệu PDF</span></span>}
                            {project.videoUrl && <span className="flex items-center space-x-0.5 text-emerald-450"><Play size={10} /> <span>Video</span></span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="inline-flex p-2 bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 text-slate-500 border border-slate-850 hover:border-rose-900/50 rounded-lg cursor-pointer transition self-end md:self-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AWARDS */}
          {activeTab === 'awards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-350">Giải thưởng & Thành tích</h3>
                <button
                  onClick={() => setAwardModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition"
                >
                  <Plus size={14} />
                  <span>Thêm giải thưởng</span>
                </button>
              </div>

              {/* Awards list */}
              {!student.awards || student.awards.length === 0 ? (
                <div className="py-12 text-center text-slate-550 space-y-2">
                  <AwardIcon size={36} className="mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">Chưa có giải thưởng nào</p>
                  <p className="text-[10px] text-slate-650">Lưu lại các danh hiệu như Trại sinh Xuất sắc, Giải Nhất cuộc thi,...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {student.awards.map((award: any) => (
                    <div
                      key={award.id}
                      className="p-4 bg-slate-955/40 border border-slate-850 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:border-slate-800 transition"
                    >
                      <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-violet-955/20 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">
                          <AwardIcon size={24} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-bold text-slate-200 text-sm truncate">{award.title}</h4>
                          <p className="text-xs text-slate-450 truncate">{award.description}</p>
                          {award.imageUrl && (
                            <a
                              href={award.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-[10px] text-violet-400 underline font-semibold"
                            >
                              Xem ảnh giấy khen
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAward(award.id)}
                        className="inline-flex p-2 bg-slate-900 hover:bg-rose-950/20 hover:text-rose-455 text-slate-500 border border-slate-850 hover:border-rose-900/50 rounded-lg cursor-pointer transition self-end md:self-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      {projectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-200">Thêm dự án / Slide</h3>
              <button
                onClick={() => setProjectModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tên dự án</label>
                <input
                  type="text"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="Ví dụ: STEM Robot Car project"
                  required
                  disabled={projSaving}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả dự án</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Viết một đoạn ngắn giới thiệu sản phẩm của bạn..."
                  rows={3}
                  disabled={projSaving}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Link Video thuyết trình (Youtube/Vimeo)</label>
                <input
                  type="url"
                  value={projVideoUrl}
                  onChange={(e) => setProjVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={projSaving}
                  className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              {/* Upload cover */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ảnh Cover dự án (Ảnh đại diện sản phẩm)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProjCover(e.target.files?.[0] || null)}
                  disabled={projSaving}
                  className="w-full text-xs text-slate-400 border border-slate-800 bg-slate-955 rounded-xl px-3 py-2"
                />
              </div>

              {/* Slide and PDF files */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slide thuyết trình (PPTX)</label>
                  <input
                    type="file"
                    accept=".pptx,.ppt"
                    onChange={(e) => setProjPpt(e.target.files?.[0] || null)}
                    disabled={projSaving}
                    className="w-full text-[10px] text-slate-400 border border-slate-800 bg-slate-955 rounded-xl p-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tài liệu sản phẩm (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setProjPdf(e.target.files?.[0] || null)}
                    disabled={projSaving}
                    className="w-full text-[10px] text-slate-400 border border-slate-800 bg-slate-955 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  disabled={projSaving}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={projSaving || !projTitle.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 transition"
                >
                  {projSaving && <Loader2 className="animate-spin" size={12} />}
                  <span>Thêm dự án</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE AWARD MODAL */}
      {awardModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-200">Thêm giải thưởng / danh hiệu</h3>
              <button
                onClick={() => setAwardModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAward} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tên giải thưởng</label>
                <input
                  type="text"
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  placeholder="Ví dụ: Trại sinh Xuất sắc nhất"
                  required
                  disabled={awardSaving}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  value={awardDesc}
                  onChange={(e) => setAwardDesc(e.target.value)}
                  placeholder="Vinh danh vì tinh thần đồng đội xuất sắc,..."
                  rows={3}
                  disabled={awardSaving}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Icon đại diện</label>
                  <select
                    value={awardIcon}
                    onChange={(e) => setAwardIcon(e.target.value)}
                    disabled={awardSaving}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold cursor-pointer focus:outline-none"
                  >
                    <option value="trophy">🏆 Cúp vàng (Trophy)</option>
                    <option value="medal">🏅 Huy chương (Medal)</option>
                    <option value="star">⭐ Ngôi sao (Star)</option>
                    <option value="badge">🎖️ Huy hiệu (Badge)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ảnh giấy khen (Tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAwardImage(e.target.files?.[0] || null)}
                    disabled={awardSaving}
                    className="w-full text-[10px] text-slate-400 border border-slate-800 bg-slate-955 rounded-xl px-2 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAwardModalOpen(false)}
                  disabled={awardSaving}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={awardSaving || !awardTitle.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 transition"
                >
                  {awardSaving && <Loader2 className="animate-spin" size={12} />}
                  <span>Thêm giải thưởng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
