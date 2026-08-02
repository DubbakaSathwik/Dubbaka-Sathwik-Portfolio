import { ArrowUp, Lock } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export function Footer() {
  const { setIsAdminModalOpen, data } = useCMS();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadCount = (data.contactMessages || data.messages || []).filter(
    (m: any) => m.status === 'unread' || (!m.read && m.status !== 'read')
  ).length;

  return (
    <footer className="bg-[#030303] border-t border-zinc-900 py-12 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-bold text-sm">Dubbaka Sathwik</p>
            <p className="text-[10px] text-zinc-500 font-mono">Full-Stack Engineer & Senior Video Editor</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center sm:text-left text-zinc-400 font-mono text-[11px]">
          © 2026 Dubbaka Sathwik. All rights reserved. Built with Google Ai Studios
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center gap-2 font-mono text-[11px] relative cursor-pointer"
            title="CMS Admin Portal"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>CMS Admin</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold font-mono text-[10px] leading-none min-w-[18px] text-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={scrollToTop}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center gap-1.5 font-mono text-[11px] cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>
    </footer>
  );
}
