'use client';

import React, { use, useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Image as ImageIcon,
  Award as AwardIcon,
  Download,
  FileText,
  Presentation,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

export default function PortfolioPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Lightbox state for scrapbook
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Video modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Copy CampID state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const data = await apiGet(`/students/p/${publicId}`);
        setStudent(data);
      } catch (err: any) {
        console.error(err);
        setError('Không tìm thấy Portfolio hoặc liên kết đã hết hạn.');
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, [publicId]);

  const copyCampId = () => {
    if (!student?.campId) return;
    navigator.clipboard.writeText(student.campId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-violet-500 mb-4" size={48} />
        <p className="text-slate-400 text-sm font-semibold tracking-wider">ĐANG TẢI HỒ SƠ CÁ NHÂN...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 text-center">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">Lỗi truy cập hồ sơ</h1>
        <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">{error}</p>
        <a
          href="/"
          className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-355 hover:bg-slate-800 transition-all duration-300"
        >
          Quay lại Trang Chủ
        </a>
      </div>
    );
  }

  const { fullName, age, hometown, campId, avatarUrl, qrCodeUrl, activities, certificates, projects, awards, season } = student;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-600/30 selection:text-violet-200">
      {/* Dynamic SEO robots tag injection */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-[40%] h-[30%] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[50%] right-0 w-[40%] h-[30%] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Banner / Header details */}
      <div className="relative border-b border-slate-900 bg-slate-900/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8">
          {/* Avatar frame */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-violet-600 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-slate-950 border-4 border-slate-950">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover transform hover:scale-105 transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 font-extrabold text-3xl">
                  {fullName.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Student metadata info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold mb-2">
                <span>{season?.name || 'Summer Camp'}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400">
                {fullName}
              </h1>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm text-slate-400">
              <div className="flex items-center space-x-1">
                <Calendar size={16} className="text-violet-400" />
                <span>{age} tuổi</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin size={16} className="text-emerald-400" />
                <span>{hometown}</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-850">
                <span className="font-mono text-slate-300 font-bold">{campId}</span>
                <button
                  onClick={copyCampId}
                  className="text-slate-500 hover:text-slate-300 transition-colors duration-250 cursor-pointer"
                  title="Copy CampID"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Section: Certificate */}
        {certificates && certificates.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
              <Award className="text-violet-500" size={24} />
              <h2 className="text-xl font-bold tracking-wide uppercase text-slate-200">Chứng nhận hoàn thành</h2>
            </div>
            <div className="max-w-2xl mx-auto bg-slate-900/30 border border-slate-850 p-4 rounded-2xl backdrop-blur-xl">
              <div className="relative group overflow-hidden rounded-xl border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificates[0].imageUrl}
                  alt="Chứng Nhận Hoàn Thành"
                  className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-350"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={certificates[0].imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`Certificate_${campId}.png`}
                  className="inline-flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:shadow-violet-600/10 cursor-pointer"
                >
                  <Download size={16} />
                  <span>Tải Chứng Nhận</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Section: Projects (PPT / PDF / Video) */}
        {projects && projects.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
              <BookOpen className="text-emerald-500" size={24} />
              <h2 className="text-xl font-bold tracking-wide uppercase text-slate-200">Dự án / Bài thuyết trình</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all duration-300 group"
                >
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    {project.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                        <Presentation size={48} />
                      </div>
                    )}
                    {project.videoUrl && (
                      <button
                        onClick={() => setActiveVideoUrl(project.videoUrl)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 transform hover:scale-110 transition duration-300">
                          <Play size={20} className="fill-current ml-1" />
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold group-hover:text-emerald-400 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {project.pptUrl && (
                        <a
                          href={project.pptUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-slate-100 transition cursor-pointer"
                        >
                          <Presentation size={14} className="text-orange-400" />
                          <span>Tải Slide (PPT)</span>
                        </a>
                      )}
                      {project.pdfUrl && (
                        <a
                          href={project.pdfUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[120px] inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-slate-100 transition cursor-pointer"
                        >
                          <FileText size={14} className="text-rose-400" />
                          <span>Xem PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Scrapbook Album */}
        {activities && activities.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
              <ImageIcon className="text-fuchsia-500" size={24} />
              <h2 className="text-xl font-bold tracking-wide uppercase text-slate-200">Scrapbook Album</h2>
            </div>
            {/* Scrapbook masonry style grid */}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {activities.map((act: any, idx: number) => (
                <div
                  key={act.id}
                  onClick={() => {
                    setActivePhotoIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className="break-inside-avoid relative overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/10 hover:border-slate-700 cursor-pointer group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={act.imageUrl}
                    alt={`Scrapbook photo ${idx + 1}`}
                    className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-300 rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                    <span className="text-xs font-bold text-white/80">Ảnh Scrapbook #{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Awards */}
        {awards && awards.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
              <AwardIcon className="text-violet-500" size={24} />
              <h2 className="text-xl font-bold tracking-wide uppercase text-slate-200">Giải thưởng & Thành tích</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {awards.map((award: any) => (
                <div
                  key={award.id}
                  className="p-6 bg-slate-900/30 border border-slate-850 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row gap-6 hover:border-slate-750 transition duration-300 group"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 text-violet-400 group-hover:text-fuchsia-400 transition-colors">
                    <Award size={32} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold group-hover:text-violet-400 transition-colors">
                      {award.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {award.description}
                    </p>
                    {award.imageUrl && (
                      <div className="mt-3 relative w-32 aspect-[4/3] rounded-lg overflow-hidden border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={award.imageUrl}
                          alt={award.title}
                          className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Personal QR Code scan footer */}
        {qrCodeUrl && (
          <section className="border-t border-slate-900 pt-12 text-center flex flex-col items-center space-y-4">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl w-36 h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeUrl} alt="Mã QR Portfolio" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Mã QR Hồ Sơ Cá Nhân</h3>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed mx-auto">
                Quét mã này để xem trực tiếp hồ sơ điện tử này trên điện thoại hoặc các thiết bị di động.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Component for scrapbook photos */}
      {lightboxOpen && activities && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between select-none">
          <div className="p-4 flex justify-between items-center text-slate-400 z-10">
            <span className="text-sm font-bold">
              Ảnh {activePhotoIndex + 1} / {activities.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 bg-slate-900/50 rounded-full hover:text-white transition duration-200 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between px-4 md:px-8 relative">
            <button
              onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : activities.length - 1))}
              className="p-3 bg-slate-900/50 hover:bg-slate-800 rounded-full text-white cursor-pointer select-none"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activities[activePhotoIndex].imageUrl}
                alt="Fullscreen Lightbox"
                className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl animate-fade-in"
              />
            </div>

            <button
              onClick={() => setActivePhotoIndex((prev) => (prev < activities.length - 1 ? prev + 1 : 0))}
              className="p-3 bg-slate-900/50 hover:bg-slate-800 rounded-full text-white cursor-pointer select-none"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="py-6 text-center text-xs text-slate-500">
            Sử dụng các phím mũi tên hoặc click để duyệt ảnh scrapbook.
          </div>
        </div>
      )}

      {/* Presentation Video Player Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-850 shadow-2xl">
            <button
              onClick={() => setActiveVideoUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/80 rounded-full text-slate-400 hover:text-white transition z-10 cursor-pointer"
            >
              <X size={20} />
            </button>

            <iframe
              src={getYoutubeEmbedUrl(activeVideoUrl)}
              title="Presentation Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Public Footer */}
      <footer className="py-12 border-t border-slate-950 text-center text-xs text-slate-600 bg-slate-950">
        <p>© 2026 Summer Camp Hub. Hệ thống Hồ sơ Điện tử Trại sinh.</p>
        <p className="mt-1">Nghiêm cấm sao chép dữ liệu hoặc thu thập trái phép hồ sơ trại sinh.</p>
      </footer>
    </div>
  );
}
