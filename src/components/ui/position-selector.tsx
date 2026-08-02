import React, { useState, useEffect } from 'react';
import { PREDEFINED_POSITIONS } from '../../lib/cms-constants';
import { NeonIcon } from './neon-icon';

interface PositionSelectorProps {
  selectedPosition: string;
  onSelectPosition: (pos: string) => void;
  label?: string;
}

export function PositionSelector({
  selectedPosition,
  onSelectPosition,
  label = 'Select Role / Position',
}: PositionSelectorProps) {
  const isPredefined = PREDEFINED_POSITIONS.some(
    (p) => p.id !== 'Custom Position' && (p.id === selectedPosition || p.label === selectedPosition)
  );

  const [activeChip, setActiveChip] = useState<string>(
    isPredefined ? selectedPosition : selectedPosition ? 'Custom Position' : 'Student'
  );

  const [customValue, setCustomValue] = useState<string>(
    !isPredefined && selectedPosition ? selectedPosition : ''
  );

  useEffect(() => {
    if (isPredefined) {
      setActiveChip(selectedPosition);
    } else if (selectedPosition) {
      setActiveChip('Custom Position');
      setCustomValue(selectedPosition);
    }
  }, [selectedPosition]);

  const handleChipClick = (chipId: string) => {
    setActiveChip(chipId);
    if (chipId === 'Custom Position') {
      onSelectPosition(customValue || 'Custom Role');
    } else {
      onSelectPosition(chipId);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    onSelectPosition(val);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-mono font-medium text-zinc-400">{label}</label>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PREDEFINED_POSITIONS.map((p) => {
          const isSelected = activeChip === p.id || activeChip === p.label;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleChipClick(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 text-left border ${
                isSelected
                  ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <NeonIcon name={p.label} className="w-4 h-4 shrink-0" />
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>

      {activeChip === 'Custom Position' && (
        <div className="pt-2 animate-fadeIn">
          <input
            type="text"
            required
            placeholder="Type custom role or position..."
            value={customValue}
            onChange={handleCustomChange}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-emerald-500/50 text-xs text-white focus:outline-none focus:border-emerald-400 placeholder-zinc-500 font-mono shadow-[0_0_10px_rgba(16,185,129,0.15)]"
          />
        </div>
      )}
    </div>
  );
}
