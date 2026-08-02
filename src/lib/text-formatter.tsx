import React, { useRef } from 'react';
import { Bold, Highlighter, Sparkles } from 'lucide-react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Parses formatting markers:
 * {bold & highlight}text{bold & highlight} -> Bold + Emerald Highlight
 * {bold}text{bold} -> Bold White Text
 * {highlight}text{highlight} -> Emerald Highlighted Tag
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Split string by formatting tokens
  const regex = /(\{bold & highlight\}.*?\{bold & highlight\}|\{bold\}.*?\{bold\}|\{highlight\}.*?\{highlight\})/g;
  const parts = text.split(regex);

  return (
    <span className={`whitespace-pre-line ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('{bold & highlight}') && part.endsWith('{bold & highlight}')) {
          const content = part.slice(18, -18);
          return (
            <span
              key={index}
              className="font-bold text-emerald-400"
            >
              {content}
            </span>
          );
        }
        if (part.startsWith('{bold}') && part.endsWith('{bold}')) {
          const content = part.slice(6, -6);
          return (
            <strong key={index} className="font-bold text-white">
              {content}
            </strong>
          );
        }
        if (part.startsWith('{highlight}') && part.endsWith('{highlight}')) {
          const content = part.slice(11, -11);
          return (
            <span key={index} className="text-emerald-400 font-semibold">
              {content}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter description...',
  rows = 3,
  label,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (type: 'bold' | 'highlight' | 'both') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let markerStart = '';
    let markerEnd = '';

    if (type === 'bold') {
      markerStart = '{bold}';
      markerEnd = '{bold}';
    } else if (type === 'highlight') {
      markerStart = '{highlight}';
      markerEnd = '{highlight}';
    } else if (type === 'both') {
      markerStart = '{bold & highlight}';
      markerEnd = '{bold & highlight}';
    }

    const replacement = selectedText
      ? `${markerStart}${selectedText}${markerEnd}`
      : `${markerStart}Highlighted Text${markerEnd}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + markerStart.length + (selectedText ? selectedText.length : 16);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-mono font-medium text-zinc-400">{label}</label>}

      {/* Editor Container */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden focus-within:border-emerald-500/60 transition-colors">
        {/* Floating Formatting Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800/80 text-xs">
          <span className="text-[10px] font-mono text-zinc-400">Select text & click format:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] transition-colors"
              title="Add Bold Marker"
            >
              <Bold className="w-3 h-3 text-zinc-300" />
              <span>Bold</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat('highlight')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors"
              title="Add Highlight Marker"
            >
              <Highlighter className="w-3 h-3 text-emerald-400" />
              <span>Highlight</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat('both')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-[11px] shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-colors"
              title="Add Bold + Highlight Marker"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Bold + Highlight</span>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-3 bg-zinc-950 text-xs text-white placeholder-zinc-600 focus:outline-none resize-y font-sans leading-relaxed"
        />

        {/* Live Preview Box */}
        {value && (
          <div className="p-3 bg-zinc-900/60 border-t border-zinc-800/80">
            <div className="text-[10px] font-mono text-emerald-400/80 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Render Preview:
            </div>
            <div className="text-xs text-zinc-200 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <FormattedText text={value} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
