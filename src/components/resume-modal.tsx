import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCMS } from '../context/CMSContext';
import { ResumeOption } from '../types';
import { FileText, Download, X, Check, Code, Palette, Briefcase, GraduationCap, Sparkles, Printer } from 'lucide-react';

export function ResumeModal() {
  const { data, isResumeModalOpen, activeResumeId, setIsResumeModalOpen } = useCMS();
  const resumes = data.resumes || [];
  const [selectedId, setSelectedId] = useState<string>(resumes[0]?.id || 'fullstack');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isResumeModalOpen) {
      if (activeResumeId && resumes.some((r) => r.id === activeResumeId)) {
        setSelectedId(activeResumeId);
      } else if (resumes.length > 0 && !resumes.some((r) => r.id === selectedId)) {
        setSelectedId(resumes[0].id);
      }
    }
  }, [isResumeModalOpen, activeResumeId, resumes]);

  const selectedResume = resumes.find((r) => r.id === selectedId) || resumes[0];

  if (!isResumeModalOpen) return null;

  const handleDownload = (resume: ResumeOption) => {
    setDownloading(true);

    if (resume.pdfUrl) {
      const link = document.createElement('a');
      link.href = resume.pdfUrl;
      link.download = resume.filename || `${resume.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setDownloading(false), 500);
      return;
    }

    // Generate formatted plain text / markdown / PDF blob
    const content = `
================================================================
${data.hero.heading.toUpperCase()} - ${resume.title.toUpperCase()}
================================================================
Location: ${data.about.college} | ${data.contactInfo.location}
Email: ${data.contactInfo.email} | Phone: ${data.contactInfo.phone}
Instagram: @${data.contactInfo.instagram}

SUMMARY
----------------------------------------------------------------
${resume.summary}

SKILLS & CORE COMPETENCIES
----------------------------------------------------------------
${resume.skills.join(' • ')}

${(resume.sections || [])
  .map(
    (sec) => `
${sec.title.toUpperCase()}
----------------------------------------------------------------
${(sec.items || [])
  .map(
    (item) => `
* ${item.heading}${item.subheading ? ' (' + item.subheading + ')' : ''} ${item.date ? '| ' + item.date : ''}
${(item.details || []).map((d) => '  - ' + d).join('\n')}
`
  )
  .join('\n')}`
  )
  .join('\n\n')}

================================================================
Generated via Dubbaka Sathwik Personal Portfolio & CMS
================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = resume.filename || `${resume.id}_resume_sathwik.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloading(false);
    }, 600);
  };

  const handlePrint = () => {
    if (selectedResume?.pdfUrl) {
      const printWindow = window.open(selectedResume.pdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        return;
      }
    }
    window.print();
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'fullstack':
        return <Code className="w-5 h-5 text-emerald-400" />;
      case 'creative':
        return <Palette className="w-5 h-5 text-green-400" />;
      case 'general':
        return <Briefcase className="w-5 h-5 text-teal-400" />;
      case 'cv':
        return <GraduationCap className="w-5 h-5 text-cyan-400" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl sm:max-w-3xl bg-[#0d0d12] rounded-2xl sm:rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Select Resume Document</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Choose an optimized format for Dubbaka Sathwik
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsResumeModalOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Resume Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {resumes.map((r) => {
                const active = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      active
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                        {getIcon(r.id)}
                      </div>
                      {active && (
                        <span className="p-1 rounded-full bg-emerald-500 text-black">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{r.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {r.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Resume Document Preview */}
            {selectedResume && (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6 text-xs text-zinc-300 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      {selectedResume.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Filename: <span className="text-emerald-400">{selectedResume.filename}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-sans font-medium text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => handleDownload(selectedResume)}
                      disabled={downloading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>{downloading ? 'Preparing File...' : 'Download Document'}</span>
                    </button>
                  </div>
                </div>

                {/* Summary & Tech Tags / Key Competencies (Rendered before preview) */}
                <div className="space-y-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
                  {selectedResume.summary && (
                    <div>
                      <span className="text-zinc-400 uppercase tracking-widest text-[10px] font-mono block mb-1 font-bold">
                        Career Objective & Executive Summary
                      </span>
                      <p className="text-zinc-200 leading-relaxed font-sans text-xs sm:text-sm">
                        {selectedResume.summary}
                      </p>
                    </div>
                  )}

                  {selectedResume.skills && selectedResume.skills.length > 0 && (
                    <div>
                      <span className="text-zinc-400 uppercase tracking-widest text-[10px] font-mono block mb-2 font-bold">
                        Key Competencies & Tech Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5 font-sans">
                        {selectedResume.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium shadow-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Document Preview or Structured Resume View */}
                {selectedResume.pdfUrl ? (
                  <div className="space-y-4 pt-2">
                    <div className="w-full h-[580px] rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden relative shadow-inner">
                      <object
                        data={selectedResume.pdfUrl}
                        type="application/pdf"
                        className="w-full h-full"
                      >
                        <iframe
                          src={selectedResume.pdfUrl}
                          className="w-full h-full border-none"
                          title={selectedResume.title}
                        />
                      </object>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-sans text-zinc-400 px-1">
                      <span>Previewing PDF Document: <strong className="text-emerald-400 font-mono">{selectedResume.filename}</strong></span>
                      <a
                        href={selectedResume.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Sections */}
                    {(selectedResume.sections || []).map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-3 pt-3 border-t border-zinc-900">
                        <h5 className="text-zinc-400 uppercase tracking-wider text-[11px] font-bold font-sans">
                          {sec.title}
                        </h5>
                        <div className="space-y-3 font-sans">
                          {(sec.items || []).map((item, iIdx) => (
                            <div key={iIdx} className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 space-y-1.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="font-semibold text-white text-xs">{item.heading}</span>
                                {item.date && (
                                  <span className="text-[10px] font-mono text-emerald-400">{item.date}</span>
                                )}
                              </div>
                              {item.subheading && (
                                <p className="text-[11px] text-zinc-400 font-medium">{item.subheading}</p>
                              )}
                              {item.details && item.details.length > 0 && (
                                <ul className="list-disc list-inside text-[11px] text-zinc-300 space-y-1 pt-1">
                                  {item.details.map((d, dIdx) => (
                                    <li key={dIdx}>{d}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
