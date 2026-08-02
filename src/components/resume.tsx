import { FileText, Download, Briefcase, GraduationCap, Award, CheckCircle2, Code2, Film, Sparkles } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export function ResumeSection() {
  const { data, setIsResumeModalOpen } = useCMS();
  const resumes = data.resumes || [];
  const primaryResume = resumes[0];

  return (
    <section id="resume" className="py-24 bg-[#08080a] relative overflow-hidden border-t border-zinc-900 scroll-mt-24">
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

        {/* Resume Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((res) => (
            <div
              key={res.id}
              onClick={() => setIsResumeModalOpen(true, res.id)}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/40 shadow-xl cursor-pointer group transition-all transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {res.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {res.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-emerald-400 font-medium">
                <span>View Options</span>
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
