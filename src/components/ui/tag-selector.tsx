import React from 'react';
import { PREDEFINED_TAGS } from '../../lib/cms-constants';
import { NeonIcon } from './neon-icon';

interface TagSelectorProps {
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  label?: string;
}

export function TagSelector({ selectedTag, onSelectTag, label = 'Select Tag' }: TagSelectorProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-medium text-zinc-400">{label}</label>
          <span className="text-[10px] font-mono text-emerald-400">Single Primary Tag</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PREDEFINED_TAGS.map((item) => {
          const isSelected = selectedTag === item.id || selectedTag === item.label;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTag(item.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200 text-left border ${
                isSelected
                  ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <NeonIcon name={item.label} className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
