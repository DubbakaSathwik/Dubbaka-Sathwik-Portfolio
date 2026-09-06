import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface DataLoadingStateProps {
  message?: string;
  note?: string;
  className?: string;
}

export function DataLoadingState({
  message = 'Data is Loading.....',
  note = 'if the data is not getting loaded, please reload the website',
  className = '',
}: DataLoadingStateProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className={`w-full py-16 px-6 flex flex-col items-center justify-center text-center rounded-3xl bg-zinc-950/60 border border-emerald-500/20 backdrop-blur-sm space-y-4 my-6 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <Loader2 className="w-5 h-5 text-emerald-400 absolute animate-pulse" />
      </div>

      <div className="space-y-1.5 max-w-lg">
        <h3 className="text-lg sm:text-xl font-bold font-mono text-white tracking-wide">
          {message}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          <span className="text-amber-400/90 font-semibold">(Note:</span> {note}
          <span className="text-amber-400/90 font-semibold">)</span>
        </p>
      </div>

      <button
        onClick={handleReload}
        type="button"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 hover:border-emerald-500/70 text-emerald-300 hover:text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-950/40 transform hover:scale-105 mt-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Reload Website</span>
      </button>
    </div>
  );
}
