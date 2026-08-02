import React, { useState, useRef } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { POPULAR_TECH_SUGGESTIONS } from '../../lib/cms-constants';

interface SmartTagInputProps {
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
  label?: string;
  suggestions?: string[];
}

export function SmartTagInput({
  tags,
  onChange,
  placeholder = 'Type tag and press comma (,) or Enter...',
  label = 'Tech Tags / Technologies',
  suggestions = POPULAR_TECH_SUGGESTIONS,
}: SmartTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;

    // Duplicate check (case insensitive)
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      parts.forEach((p) => {
        if (p.trim()) addTag(p);
      });
      setInputValue('');
    } else {
      setInputValue(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.some((t) => t.toLowerCase() === s.toLowerCase()) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-medium text-zinc-400">{label}</label>
          <span className="text-[10px] font-mono text-zinc-500">Comma (,) or Enter to add</span>
        </div>
      )}

      {/* Main Tags Box */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`p-2.5 rounded-2xl bg-zinc-950 border transition-all flex flex-wrap items-center gap-2 min-h-[48px] cursor-text ${
          isFocused ? 'border-emerald-500 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-zinc-800'
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium shadow-sm animate-scaleIn"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
              className="p-0.5 hover:bg-emerald-800/60 rounded-full text-emerald-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[140px] bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-mono py-1"
        />
      </div>

      {/* Auto Suggestions */}
      {isFocused && filteredSuggestions.length > 0 && (
        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-1.5 animate-fadeIn">
          <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Suggestions:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => addTag(sugg)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-emerald-950/80 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 text-[11px] font-mono transition-all"
              >
                <Plus className="w-3 h-3" />
                {sugg}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
