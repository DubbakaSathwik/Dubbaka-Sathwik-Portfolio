import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Check, Trash2, HardDrive, Sparkles, FolderOpen, ChevronLeft, ChevronRight, Plus, Eye } from 'lucide-react';

export interface PresetPhoto {
  label: string;
  category: string;
  url: string;
}

export const PRESET_PHOTOS: PresetPhoto[] = [
  // College & Education
  {
    label: 'College Campus & Students',
    category: 'College',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'University Library & Study Group',
    category: 'College',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Engineering Campus Building',
    category: 'College',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
  },

  // Computer Science & Coding
  {
    label: 'Full-Stack Code on Screen',
    category: 'Coding & Tech',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Laptop Development Workspace',
    category: 'Coding & Tech',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Cyber Security & Data Analytics',
    category: 'Coding & Tech',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000',
  },

  // NSS & Community Service
  {
    label: 'NSS Community Volunteers',
    category: 'NSS & Community',
    url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Blood Donation & Health Drive',
    category: 'NSS & Community',
    url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Tree Plantation & Environmental Drive',
    category: 'NSS & Community',
    url: 'https://images.unsplash.com/photo-1617870952220-431804d9a695?auto=format&fit=crop&q=80&w=1000',
  },

  // Creative & Design
  {
    label: 'Video Editing & Creative Suite',
    category: 'Creative Design',
    url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Graphic Poster Design Station',
    category: 'Creative Design',
    url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1000',
  },

  // Events & Hackathons
  {
    label: 'College Auditorium Event & Stage',
    category: 'Events & Hackathons',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1000',
  },
  {
    label: 'Hackathon Coding Team',
    category: 'Events & Hackathons',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000',
  },

  // Gaming & Minecraft
  {
    label: 'Minecraft & Gaming Rig Setup',
    category: 'Gaming',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000',
  },
];

export interface DevicePhotoItem {
  id: string;
  name: string;
  dataUrl: string;
}

interface PhotoDropdownProps {
  onSelectPhotoUrl?: (url: string) => void;
  currentPhotos?: string[];
  onUpdatePhotoList?: (photos: string[]) => void;
  label?: string;
  multilineMode?: boolean;
}

export function PhotoDropdownSelector({
  onSelectPhotoUrl,
  currentPhotos = [],
  onUpdatePhotoList,
  label = 'Select Photo from Device or Dropdown',
  multilineMode = false,
}: PhotoDropdownProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [devicePhotos, setDevicePhotos] = useState<DevicePhotoItem[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [lastAddedLabel, setLastAddedLabel] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // Helper to append a single photo URL to existing list without duplicates
  const addPhotoToList = (url: string, sourceLabel: string) => {
    if (!url) return;
    if (onUpdatePhotoList) {
      if (multilineMode) {
        if (!currentPhotos.includes(url)) {
          onUpdatePhotoList([...currentPhotos, url]);
        }
      } else {
        onUpdatePhotoList([url]);
      }
    } else if (onSelectPhotoUrl) {
      onSelectPhotoUrl(url);
    }
    setLastAddedLabel(sourceLabel);
    setTimeout(() => setLastAddedLabel(''), 3000);
  };

  // Delete a specific photo at index
  const handleDeletePhoto = (index: number) => {
    if (!onUpdatePhotoList) return;
    const updated = currentPhotos.filter((_, i) => i !== index);
    onUpdatePhotoList(updated);
  };

  // Move photo left/up
  const handleMoveLeft = (index: number) => {
    if (index === 0 || !onUpdatePhotoList) return;
    const updated = [...currentPhotos];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onUpdatePhotoList(updated);
  };

  // Move photo right/down
  const handleMoveRight = (index: number) => {
    if (index >= currentPhotos.length - 1 || !onUpdatePhotoList) return;
    const updated = [...currentPhotos];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onUpdatePhotoList(updated);
  };

  // Compress high-res image files to prevent exceeding browser localStorage quota
  const compressImageFile = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        if (!rawUrl) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(rawUrl);
          }
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper to upload image to server endpoint or fallback to data URL
  const uploadToServerOrFallback = async (fileName: string, dataUrl: string): Promise<string> => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName, dataUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    } catch (err) {
      console.warn('Server asset upload fallback to dataUrl:', err);
    }
    return dataUrl;
  };

  // Process files from input or drop in batch mode
  const processFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileList.length === 0) return;

    const readPromises = fileList.map(async (file) => {
      const maxDim = multilineMode ? 1200 : 800;
      const compressedDataUrl = await compressImageFile(file, maxDim, maxDim, 0.82);
      const finalUrl = await uploadToServerOrFallback(file.name, compressedDataUrl);
      return { name: file.name, dataUrl: finalUrl };
    });

    const results = await Promise.all(readPromises);
    const validResults = results.filter((r) => r.dataUrl && r.dataUrl.length > 0);
    if (validResults.length === 0) return;

    const newDeviceItems: DevicePhotoItem[] = validResults.map((r) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: r.name,
      dataUrl: r.dataUrl,
    }));

    setDevicePhotos((prev) => [...newDeviceItems, ...prev]);

    const newUrls = validResults.map((r) => r.dataUrl);

    if (onUpdatePhotoList) {
      if (multilineMode) {
        const combined = [...currentPhotos];
        newUrls.forEach((u) => {
          if (!combined.includes(u)) {
            combined.push(u);
          }
        });
        onUpdatePhotoList(combined);
      } else {
        onUpdatePhotoList([newUrls[newUrls.length - 1]]);
      }
    } else if (onSelectPhotoUrl) {
      newUrls.forEach((u) => onSelectPhotoUrl(u));
    }

    const labelText =
      validResults.length === 1
        ? `Device File: ${validResults[0].name}`
        : `${validResults.length} Device Files`;
    setLastAddedLabel(labelText);
    setTimeout(() => setLastAddedLabel(''), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = e.target.value;
    setSelectedUrl(url);
    if (url) {
      const deviceMatch = devicePhotos.find((p) => p.dataUrl === url);
      const presetMatch = PRESET_PHOTOS.find((p) => p.url === url);
      const labelText = deviceMatch ? `Device: ${deviceMatch.name}` : presetMatch ? presetMatch.label : 'Photo Option';
      
      addPhotoToList(url, labelText);
      setSelectedUrl('');
    }
  };

  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    addPhotoToList(customUrlInput.trim(), 'Custom Link');
    setCustomUrlInput('');
  };

  return (
    <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <label className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{label}</span>
        </label>
        {lastAddedLabel && (
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 animate-fadeIn">
            <Check className="w-3 h-3 text-emerald-400" /> Added {lastAddedLabel}
          </span>
        )}
      </div>

      {/* 1. VISUAL MANAGER: EXISTING & ATTACHED PHOTOS PREVIEW GRID */}
      {currentPhotos.length > 0 ? (
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              <span>Attached Photos ({currentPhotos.length})</span>
            </span>
            {currentPhotos.length > 1 && onUpdatePhotoList && (
              <button
                type="button"
                onClick={() => onUpdatePhotoList([])}
                className="text-[10px] font-mono text-red-400 hover:text-red-300 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
            {currentPhotos.filter(Boolean).map((photoUrl, idx) => (
              <div
                key={`${idx}-${photoUrl.substring(0, 30)}`}
                className="relative group rounded-xl overflow-hidden border border-emerald-500/40 bg-black aspect-video flex flex-col justify-between p-1 shadow-md hover:border-emerald-400 transition-all"
              >
                {/* Background Image */}
                <img
                  src={photoUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=400'}
                  alt={`Photo ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />

                {/* Top Badge & Delete */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="px-1.5 py-0.5 rounded bg-black/80 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/40">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(photoUrl)}
                      className="p-1 bg-black/80 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white cursor-pointer"
                      title="Preview Full Image"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {onUpdatePhotoList && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="p-1 bg-red-600/90 hover:bg-red-500 rounded text-white shadow-lg cursor-pointer"
                        title="Delete this photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Reorder Controls */}
                {onUpdatePhotoList && currentPhotos.length > 1 && (
                  <div className="relative z-10 flex items-center justify-between w-full bg-black/80 p-0.5 rounded mt-auto">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveLeft(idx)}
                      className="p-0.5 disabled:opacity-30 text-zinc-300 hover:text-emerald-400 cursor-pointer"
                      title="Move Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[8px] font-mono text-zinc-400">Reorder</span>
                    <button
                      type="button"
                      disabled={idx === currentPhotos.length - 1}
                      onClick={() => handleMoveRight(idx)}
                      className="p-0.5 disabled:opacity-30 text-zinc-300 hover:text-emerald-400 cursor-pointer"
                      title="Move Right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[11px] font-mono text-zinc-400 text-center">
          📷 No photos attached yet. Select device photo file(s) or options below to add.
        </div>
      )}

      {/* 2. DEVICE FILE INPUT & DRAG/DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-3.5 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]'
            : 'border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/60 hover:bg-zinc-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold text-xs">
          <FolderOpen className="w-4 h-4 animate-bounce" />
          <span>Upload Photo File(s) from Device Storage</span>
        </div>
        <p className="text-[10px] font-mono text-zinc-400">
          Click to browse computer / mobile files OR drag & drop images here
        </p>
      </div>

      {/* 3. DROPDOWN CONTAINING BOTH DEVICE FILES & PRESETS */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-zinc-400 block">
          Select from Preset Category Library or Device Uploads Dropdown:
        </label>
        <select
          value={selectedUrl}
          onChange={handleDropdownChange}
          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="">-- Choose Photo from Preset Dropdown List --</option>

          {devicePhotos.length > 0 && (
            <optgroup label="📱 RECENT DEVICE UPLOADS">
              {devicePhotos.map((item) => (
                <option key={item.id} value={item.dataUrl}>
                  📄 [Device File] {item.name}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="🎓 PRESET COLLEGE & CAMPUS PHOTOS">
            {PRESET_PHOTOS.filter((p) => p.category === 'College').map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="💻 PRESET CODING & TECH PHOTOS">
            {PRESET_PHOTOS.filter((p) => p.category === 'Coding & Tech').map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="🤝 PRESET NSS & COMMUNITY PHOTOS">
            {PRESET_PHOTOS.filter((p) => p.category === 'NSS & Community').map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="🎨 PRESET CREATIVE & DESIGN">
            {PRESET_PHOTOS.filter((p) => p.category === 'Creative Design').map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="🏆 PRESET EVENTS & HACKATHONS">
            {PRESET_PHOTOS.filter((p) => p.category === 'Events & Hackathons').map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 4. CUSTOM URL LINK INPUT */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          placeholder="Or paste direct image URL (https://...)"
          value={customUrlInput}
          onChange={(e) => setCustomUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomUrl(e);
            }
          }}
          className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          type="button"
          onClick={handleAddCustomUrl}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-3xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-2 overflow-hidden">
            <img src={previewModalUrl} alt="Preview" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 px-3 py-1 bg-black/80 hover:bg-red-600 text-white font-mono text-xs rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
