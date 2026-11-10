import { FileText, Download, Briefcase, GraduationCap, Award, CheckCircle2, Code2, Film, Sparkles } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { DataLoadingState } from './ui/data-loading-state';

export function ResumeSection() {
  const { data, setIsResumeModalOpen } = useCMS();
  const resumes = data.resumes || [];
  const primaryResume = resumes[0];

  return (
    <section id="resume" className="pt-8 pb-16 sm:pt-8 sm:pb-20 bg-[#08080a] relative overflow-hidden border-t border-zinc-900 scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume Documents</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Center</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
              Select between Full Stack Developer, Creative Designer, General Resume, or CV formats tailored for recruiters.
            </p>
          </div>

          <button
            onClick={() => setIsResumeModalOpen(true, primaryResume?.id)}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Select & Download Resume</span>
          </button>
        </div>

        {resumes.length === 0 ? (
          <DataLoadingState message="Resume Documents Data is Loading....." />
        ) : (
          <>
            {/* Main Preview Card */}
            {primaryResume && (
              <div className="rounded-3xl bg-zinc-900/40 border border-emerald-500/20 p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-sm mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{data.hero.heading}</h3>
                    <p className="text-emerald-400 font-mono text-xs">{data.about.college} • {data.about.department}</p>
                    <p className="text-zinc-400 text-xs mt-1">{data.contactInfo.location}</p>
                  </div>

                  <button
                    onClick={() => setIsResumeModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-all cursor-pointer"
                  >
                    Choose Resume Type
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Career Objective & Professional Summary
                  </h4>
                  <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80">
                    {primaryResume.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Resume Selection Cards - Expanded wide to fill full container */}
            <div
              className={`grid gap-6 sm:gap-8 ${
                resumes.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : resumes.length === 1
                  ? 'grid-cols-1'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {resumes.map((res) => (
                <div
                  key={res.id}
                  onClick={() => setIsResumeModalOpen(true, res.id)}
                  className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/90 hover:border-emerald-500/50 shadow-xl hover:shadow-[0_10px_35px_rgba(16,185,129,0.12)] cursor-pointer group transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono font-medium px-3 py-1 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 group-hover:border-emerald-500/40 transition-colors">
                        {res.filename || 'PDF Document'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {res.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3 group-hover:text-zinc-300 transition-colors">
                        {res.summary}
                      </p>
                    </div>

                    {res.skills && res.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {res.skills.slice(0, 6).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300/90 group-hover:border-emerald-500/40 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                        {res.skills.length > 6 && (
                          <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-zinc-800/60 text-zinc-400">
                            +{res.skills.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-5 mt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs sm:text-sm font-mono text-emerald-400 font-medium">
                    <span className="group-hover:underline">View Options & Preview</span>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-all font-semibold">
                      <span>View Resume</span>
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
