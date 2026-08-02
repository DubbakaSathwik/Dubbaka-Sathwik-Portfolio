import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  GraduationCap,
  Compass,
  Lightbulb,
  Quote,
  MapPin,
  Laptop,
  Users,
  Github,
  Linkedin,
  Mail,
  FileText,
  Rocket,
  CheckCircle2,
  Cpu,
  Building,
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { FormattedText } from '../lib/text-formatter';

export function AboutSection() {
  const { data, setIsResumeModalOpen } = useCMS();
  const about = data.about;
  const skillCategories = data.skills || [];

  const githubUrl =
    data.contactInfo?.socials?.find((s) => s.platform.toLowerCase().includes('github'))?.url ||
    'https://github.com/dubbakasathwik';
  const linkedinUrl =
    data.contactInfo?.socials?.find((s) => s.platform.toLowerCase().includes('linkedin'))?.url ||
    'https://linkedin.com/in/dubbakasathwik';

  return (
    <section id="about" className="py-24 bg-[#080808] relative overflow-hidden border-t border-zinc-900 scroll-mt-24">
      {/* Background Subtle Green Accents */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-950/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-white text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Student • Developer • Creative</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Me</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed whitespace-pre-line">
            {about.subheading}
          </p>
        </div>

        {/* PROFILE CARD AT THE TOP */}
        {about.showProfileCard !== false && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-emerald-950/20 border border-emerald-500/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-60 h-60 bg-emerald-600/15 blur-3xl rounded-full pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left 1/3: Photo covering the left frame */}
              <div className="lg:col-span-4 flex flex-col h-full">
                <div className="relative w-full h-full min-h-[280px] sm:min-h-[320px] lg:min-h-full rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-zinc-950">
                  <img
                    src={about.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'}
                    alt={data.hero.heading}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Right 2/3: Quick Profile & Recruiter Information */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
                {/* Header & Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {data.hero.heading}
                    </h3>
                    <p className="text-xs sm:text-sm font-mono text-emerald-400 font-medium">
                      {about.degree || 'B.E. Computer Science & Information Technology'}
                    </p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{about.location || `${about.college} • Hyderabad, Telangana, India`}</span>
                    </p>
                  </div>

                  {/* Quick Actions 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 flex-shrink-0 w-full sm:w-auto">
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub Profile"
                      className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-zinc-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium group"
                    >
                      <Github className="w-3.5 h-3.5 text-emerald-400" />
                      <span>GitHub</span>
                    </a>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn Profile"
                      className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-zinc-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium group"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>LinkedIn</span>
                    </a>
                    <a
                      href={`mailto:${data.contactInfo.email}`}
                      title="Send Email"
                      className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-zinc-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium group"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Email</span>
                    </a>
                    <button
                      onClick={() => setIsResumeModalOpen(true)}
                      title="View & Download Resume"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/50 text-white transition-all flex items-center justify-center gap-2 text-xs font-mono font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)] group"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  </div>
                </div>

                {/* Quick Profile Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {/* 🎓 Education */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                      <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Education</span>
                    </div>
                    <div className="text-xs text-zinc-300 space-y-0.5 font-sans">
                      <p className="font-semibold text-white">{about.department || 'Computer Science & Info Tech'}</p>
                      <p className="text-zinc-400">{about.college || 'MVSR Engineering College'}</p>
                      <p className="text-emerald-400/90 font-mono text-[11px]">{about.yearOfStudy || '3rd Year'}</p>
                    </div>
                  </div>

                  {/* 💻 Role */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                      <Laptop className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Role</span>
                    </div>
                    <div className="text-xs text-zinc-300 space-y-0.5 font-sans">
                      <p className="font-semibold text-white">Student</p>
                      <p className="text-zinc-400">Full-Stack Developer</p>
                      <p className="text-zinc-400">Creative Designer</p>
                    </div>
                  </div>

                  {/* 📍 Location */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                      <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Location</span>
                    </div>
                    <div className="text-xs text-zinc-300 space-y-0.5 font-sans">
                      <p className="font-semibold text-white">Hyderabad, Telangana</p>
                      <p className="text-zinc-400">India</p>
                    </div>
                  </div>

                  {/* 🤝 Leadership & Community */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                      <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Leadership & Community</span>
                    </div>
                    <ul className="text-xs text-zinc-300 space-y-0.5 font-sans text-[11px] sm:text-xs">
                      {(about.leadership && about.leadership.length > 0
                        ? about.leadership
                        : ['NSS Digital Co-Lead', 'IEEE Student Member', 'Student Coordinator']
                      ).map((item, idx) => (
                        <li key={idx} className={idx === 0 ? 'text-white font-medium' : 'text-zinc-400'}>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 🚀 Current Focus */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                      <Rocket className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Current Focus</span>
                    </div>
                    <ul className="text-xs text-zinc-300 space-y-0.5 font-sans text-[11px] sm:text-xs">
                      {(about.currentFocus && about.currentFocus.length > 0
                        ? about.currentFocus
                        : ['Full-Stack Development', 'Artificial Intelligence', 'Creative Design', 'AI-powered Applications']
                      ).map((item, idx) => (
                        <li key={idx} className={idx === 0 ? 'text-white font-medium' : 'text-zinc-400'}>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 💼 Availability */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-1.5 bg-emerald-950/20">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>Availability</span>
                    </div>
                    <div className="text-xs text-zinc-300 space-y-1 font-sans pt-0.5">
                      {(about.availability && about.availability.length > 0
                        ? about.availability
                        : ['Open for Internships', 'Freelance Projects']
                      ).map((item, idx) => (
                        <p key={idx} className="font-semibold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{item}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Professional Tags Badges */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="flex flex-wrap gap-2 items-center">
                    {(about.tags && about.tags.length > 0
                      ? about.tags
                      : [
                          'Full-Stack Development',
                          'Artificial Intelligence',
                          'React',
                          'Node.js',
                          'Creative Design',
                          'Open Source Learner',
                          'Problem Solver',
                          'Continuous Learner',
                        ]
                    ).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 text-[11px] font-mono transition-all duration-200 cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONTENT BELOW THE PROFILE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-12"
        >
          {/* HIGHLIGHTED PARAGRAPH / QUOTE */}
          {about.showQuote !== false && (
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-zinc-900/90 to-zinc-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
              <Quote className="absolute -top-3 -right-3 w-20 h-20 text-emerald-500/10 pointer-events-none" />
              <p className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-white drop-shadow-sm">
                <FormattedText text={about.quote || "I don't believe great developers are defined by the number of technologies they know - they're defined by their curiosity to keep learning."} />
                {about.quoteHighlight && (
                  <span className="block mt-2 text-emerald-400 font-bold text-[1.08em]">
                    {about.quoteHighlight}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* MY JOURNEY SECTION */}
          {about.showJourney !== false && (
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl space-y-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 border-b border-zinc-800 pb-4">
                <Compass className="w-6 h-6 text-emerald-400" />
                <span>{about.journeyTitle || 'My Journey'}</span>
              </h3>

              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-zinc-300">
                {[
                  about.bioParagraph1,
                  about.bioParagraph2,
                  about.bioParagraph3,
                  about.bioParagraph4,
                  about.bioParagraph5,
                ]
                  .filter((p): p is string => Boolean(p && p.trim().length > 0))
                  .map((p, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      <FormattedText text={p} />
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* MY PHILOSOPHY SECTION */}
          {about.showPhilosophy !== false && (
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl space-y-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 border-b border-zinc-800 pb-4">
                <Lightbulb className="w-6 h-6 text-emerald-400" />
                <span>{about.philosophyTitle || 'My Philosophy'}</span>
              </h3>

              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-zinc-300">
                {[
                  about.philosophyParagraph1,
                  about.philosophyParagraph2,
                  about.philosophyParagraph3,
                ]
                  .filter((p): p is string => Boolean(p && p.trim().length > 0))
                  .map((p, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      <FormattedText text={p} />
                    </p>
                  ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Skills Section */}
        {about.showSkills !== false && (
          <div id="skills" className="space-y-8 pt-8 border-t border-zinc-800/80 scroll-mt-24">
            {/* Centered Header */}
            <div className="text-center max-w-xl mx-auto space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-white text-xs font-mono font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Cpu className="w-3.5 h-3.5 text-white" />
                <span>Technical Stack</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center justify-center gap-2.5">
                <span className="text-emerald-400">Skills</span>
                <span className="text-white">&amp;</span>
                <span className="text-emerald-400">Technologies</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans">
                Core frameworks, languages, databases, and creative tools powering my software solutions.
              </p>
            </div>

            {/* Skill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {skillCategories.map((sc, idx) => {
                const isLastSingle =
                  idx === skillCategories.length - 1 && skillCategories.length % 3 === 1;
                return (
                  <div
                    key={sc.id}
                    className={`p-3.5 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-2.5 sm:space-y-3.5 group hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] overflow-hidden ${
                      isLastSingle ? 'sm:col-span-2 lg:col-span-1 lg:col-start-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2 gap-2 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-1.5 min-w-0 group-hover:text-emerald-300 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{sc.category}</span>
                      </h4>
                      <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                        {sc.skills.length} Items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {sc.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-zinc-900/90 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 text-[10px] sm:text-xs font-mono transition-all duration-200 cursor-default truncate max-w-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
