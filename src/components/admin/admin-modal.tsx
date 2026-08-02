import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderPlus,
  Camera,
  Calendar,
  User,
  Mail,
  Plus,
  Trash2,
  KeyRound,
  LayoutDashboard,
  Palette,
  Inbox,
  Sparkles,
  Save,
  BookOpen,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Award,
  FileText,
  Upload,
  Download,
  Eye,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import { CreativeItem } from '../../types';
import { TagSelector } from '../ui/tag-selector';
import { PositionSelector } from '../ui/position-selector';
import { SmartTagInput } from '../ui/smart-tag-input';
import { RichTextEditor } from '../../lib/text-formatter';
import { NeonIcon } from '../ui/neon-icon';
import { PhotoDropdownSelector } from '../ui/photo-dropdown';

function PdfDropzoneSelector({
  pdfUrl,
  filename,
  onPdfChange,
}: {
  pdfUrl: string;
  filename: string;
  onPdfChange: (pdfUrl: string, filename: string) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF document file (.pdf)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onPdfChange(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
          Upload PDF Document File from Device *
        </label>
        {pdfUrl && (
          <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> PDF File Attached
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
          }
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-950/40 text-white scale-[1.01]'
            : pdfUrl
            ? 'border-emerald-500/50 bg-emerald-950/20 text-zinc-300 hover:border-emerald-400'
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
        }`}
      >
        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400">
          <Upload className="w-6 h-6" />
        </div>

        <div>
          <p className="font-bold text-white text-xs mb-1">
            {pdfUrl ? 'Click or Drop a new PDF to replace document' : 'Click or Drop your PDF Resume file here'}
          </p>
          <p className="text-[11px] text-zinc-400">
            Supports local PDF files directly from your computer or device
          </p>
        </div>

        {filename && (
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{filename}</span>
          </div>
        )}
      </div>

      {pdfUrl && (
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>PDF Reader Live Preview:</span>
            <button
              type="button"
              onClick={() => onPdfChange('', '')}
              className="text-red-400 hover:underline text-[10px]"
            >
              Remove PDF
            </button>
          </div>
          <div className="w-full h-48 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
            <object data={pdfUrl} type="application/pdf" className="w-full h-full">
              <iframe src={pdfUrl} className="w-full h-full border-none" title="PDF Preview" />
            </object>
          </div>
        </div>
      )}

      {/* Or PDF Web URL Input */}
      <div className="pt-1">
        <span className="text-[10px] text-zinc-500 block mb-1">Or enter direct PDF Web URL:</span>
        <input
          type="url"
          placeholder="https://example.com/my-resume.pdf"
          value={pdfUrl.startsWith('data:') ? '' : pdfUrl}
          onChange={(e) => onPdfChange(e.target.value, filename || 'resume.pdf')}
          className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
        />
      </div>
    </div>
  );
}

export function AdminPortalModal() {
  const {
    data,
    updateHero,
    updateAbout,
    addProject,
    updateProject,
    deleteProject,
    reorderProjectItem,
    swapProjectItems,
    addCreativeItem,
    updateCreativeItem,
    deleteCreativeItem,
    reorderCreativeItem,
    swapCreativeItems,
    addJourneyItem,
    updateJourneyItem,
    deleteJourneyItem,
    reorderJourneyItem,
    swapJourneyItems,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    reorderGalleryItem,
    swapGalleryItems,
    addResume,
    updateResumeItem,
    deleteResumeItem,
    reorderResumeItem,
    swapResumeItems,
    updateContactInfo,
    markMessageRead,
    deleteMessage,
    isAdminModalOpen,
    setIsAdminModalOpen,
    setIsResumeModalOpen,
    dbConnected,
  } = useCMS();

  const isOpen = isAdminModalOpen;
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<
    'journey' | 'projects' | 'creative' | 'gallery' | 'resumes' | 'hero' | 'about' | 'contact' | 'inbox'
  >('journey');

  // Resume Form State
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [newResume, setNewResume] = useState({
    title: '',
    filename: '',
    summary: '',
    pdfUrl: '',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
  });

  const handleSaveResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResume.title.trim()) return;

    const title = newResume.title.trim();
    const filename =
      newResume.filename.trim() ||
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_Resume.pdf`;

    if (editingResumeId) {
      const existing = (data.resumes || []).find((r: any) => r.id === editingResumeId);
      updateResumeItem({
        id: editingResumeId as any,
        title,
        filename,
        summary: newResume.summary,
        pdfUrl: newResume.pdfUrl,
        skills: newResume.skills,
        sections: existing?.sections || [
          {
            title: 'Document Overview',
            items: [
              {
                heading: title,
                details: [newResume.summary || 'Uploaded resume document.'],
              },
            ],
          },
        ],
      });
      setEditingResumeId(null);
    } else {
      addResume({
        id: ('res-' + Date.now()) as any,
        title,
        filename,
        summary: newResume.summary,
        pdfUrl: newResume.pdfUrl,
        skills: newResume.skills,
      });
    }

    setNewResume({
      title: '',
      filename: '',
      summary: '',
      pdfUrl: '',
      skills: ['React', 'Node.js', 'Full-Stack'],
    });
  };

  const handleStartEditResume = (resume: any) => {
    setEditingResumeId(resume.id);
    setNewResume({
      title: resume.title || '',
      filename: resume.filename || '',
      summary: resume.summary || '',
      pdfUrl: resume.pdfUrl || '',
      skills: resume.skills || [],
    });
  };

  const handleCancelEditResume = () => {
    setEditingResumeId(null);
    setNewResume({
      title: '',
      filename: '',
      summary: '',
      pdfUrl: '',
      skills: ['React', 'Node.js', 'Full-Stack'],
    });
  };

  // Hero form state
  const [heroForm, setHeroForm] = useState(data.hero);

  // About form state
  const [aboutForm, setAboutForm] = useState(data.about);

  // Journey Form State
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [newJourney, setNewJourney] = useState({
    year: '2025',
    title: '',
    organization: 'MVSR Engineering College',
    role: 'Student Coordinator',
    primaryTag: 'College',
    category: 'College' as any,
    tags: ['Full Stack', 'Leadership'],
    description: '',
    detailedDescription: '',
    photoUrlsInput: '',
  });

  // Project Form State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    category: 'Full-Stack' as string,
    customCategoryInput: '',
    primaryTag: 'Full-Stack',
    tags: ['React', 'Node.js', 'MongoDB'],
    description: '',
    longDescription: '',
    photoUrlsInput: '',
    demoUrl: '',
    githubUrl: '',
    featured: true,
  });

  // Creative Item Form State
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [newCreative, setNewCreative] = useState({
    title: '',
    category: 'Poster Design',
    featured: true,
    completionDate: '2026',
    photoUrlsInput: '',
    videoUrl: '',
    platformUrl: '',
    softwareUsed: ['Canva', 'Photoshop'],
    tags: ['Poster', 'Design'],
    shortDescription: '',
    detailedDescription: '',
  });

  // Certificates & Awards Form State
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [newGallery, setNewGallery] = useState({
    title: '',
    category: 'Certificates',
    featured: true,
    date: '2025',
    location: 'MVSR / Online',
    credentialUrl: '',
    photoUrlsInput: '',
    technologies: ['React', 'Node.js'],
    tags: ['Certificates', 'Full-Stack'],
    description: '',
    detailedDescription: '',
  });

  // Contact Info Form
  const [contactForm, setContactForm] = useState(data.contactInfo);

  useEffect(() => {
    if (data.about) setAboutForm(data.about);
    if (data.hero) setHeroForm(data.hero);
    if (data.contactInfo) setContactForm(data.contactInfo);
  }, [data]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'bachi200') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect password. Please try again.');
    }
  };

  const handleClose = () => {
    setIsAdminModalOpen(false);
    setPassword('');
    setErrorMsg('');
  };

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    updateHero(heroForm);
    alert('Hero section updated successfully!');
  };

  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    updateAbout(aboutForm);
    alert('About section updated successfully!');
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateContactInfo(contactForm);
    alert('Contact details updated successfully!');
  };

  const handleStartEditJourney = (item: any) => {
    setEditingJourneyId(item.id);
    const photoList = item.images && item.images.length > 0
      ? item.images.join('\n')
      : item.image
      ? item.image
      : '';

    const selectedCat = (item.tags && item.tags.length > 0 && item.tags[0] !== 'Engineering' ? item.tags[0] : item.category) || item.category || 'Achievement';

    setNewJourney({
      year: item.year || '2026',
      title: item.title || '',
      organization: item.organization || '',
      role: item.role || '',
      primaryTag: selectedCat,
      category: selectedCat as any,
      tags: item.tags || [],
      description: item.description || '',
      detailedDescription: item.detailedDescription || item.description || '',
      photoUrlsInput: photoList,
    });
  };

  const handleCancelEditJourney = () => {
    setEditingJourneyId(null);
    setNewJourney({
      year: '2026',
      title: '',
      organization: 'MVSR Engineering College',
      role: 'Student Coordinator',
      primaryTag: 'College',
      category: 'College',
      tags: ['Full Stack', 'Leadership'],
      description: '',
      detailedDescription: '',
      photoUrlsInput: '',
    });
  };

  const handleAddJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJourney.title) return;
    const chosenCategory = newJourney.primaryTag || newJourney.category || 'Achievement';
    const combinedTags = Array.from(new Set([chosenCategory, ...newJourney.tags])).filter(Boolean);
    const photoList = newJourney.photoUrlsInput
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 5);

    if (editingJourneyId) {
      updateJourneyItem({
        id: editingJourneyId,
        year: newJourney.year,
        title: newJourney.title,
        organization: newJourney.organization,
        role: newJourney.role,
        description: newJourney.description,
        detailedDescription: newJourney.detailedDescription || newJourney.description,
        category: chosenCategory as any,
        tags: combinedTags,
        images: photoList,
        image: photoList[0] || '',
      });
      setEditingJourneyId(null);
    } else {
      addJourneyItem({
        year: newJourney.year,
        title: newJourney.title,
        organization: newJourney.organization,
        role: newJourney.role,
        description: newJourney.description,
        detailedDescription: newJourney.detailedDescription || newJourney.description,
        category: chosenCategory as any,
        tags: combinedTags,
        images: photoList,
        image: photoList[0] || '',
      });
    }

    setNewJourney({
      year: '2026',
      title: '',
      organization: 'MVSR Engineering College',
      role: 'Student Coordinator',
      primaryTag: 'College',
      category: 'College',
      tags: ['Full Stack', 'Leadership'],
      description: '',
      detailedDescription: '',
      photoUrlsInput: '',
    });
  };

  const handleStartEditProject = (item: any) => {
    setEditingProjectId(item.id);
    const photoList = item.images && item.images.length > 0
      ? item.images.join('\n')
      : item.thumbnail || item.image || '';

    const cat = item.category || 'Full-Stack';

    setNewProject({
      title: item.title || '',
      category: cat,
      customCategoryInput: ['Full-Stack', 'AI & ML', 'Web Apps', 'Tools', 'College Projects'].includes(cat) ? '' : cat,
      primaryTag: cat,
      tags: item.tags || item.technologies || ['React', 'Node.js'],
      description: item.description || item.summary || '',
      longDescription: item.longDescription || item.detailedDescription || item.description || '',
      photoUrlsInput: photoList,
      demoUrl: item.demoUrl || item.liveUrl || '',
      githubUrl: item.githubUrl || '',
      featured: item.featured ?? true,
    });
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setNewProject({
      title: '',
      category: 'Full-Stack',
      customCategoryInput: '',
      primaryTag: 'Full-Stack',
      tags: ['React', 'Node.js', 'MongoDB'],
      description: '',
      longDescription: '',
      photoUrlsInput: '',
      demoUrl: '',
      githubUrl: '',
      featured: true,
    });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title) return;

    const finalCategory = (newProject.customCategoryInput && newProject.customCategoryInput.trim() !== '')
      ? newProject.customCategoryInput.trim()
      : newProject.category || 'Full-Stack';

    const combinedTags = Array.from(new Set([finalCategory, ...newProject.tags])).filter(Boolean);

    const photoList = newProject.photoUrlsInput
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 5);

    const firstImage = photoList[0] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000';

    if (editingProjectId) {
      updateProject({
        id: editingProjectId,
        title: newProject.title,
        summary: newProject.description,
        description: newProject.description,
        longDescription: newProject.longDescription || newProject.description,
        category: finalCategory as any,
        tags: combinedTags,
        technologies: combinedTags,
        thumbnail: firstImage,
        image: firstImage,
        images: photoList.length > 0 ? photoList : [firstImage],
        demoUrl: newProject.demoUrl,
        githubUrl: newProject.githubUrl,
        featured: newProject.featured,
        status: 'Completed',
        year: '2026',
      });
      setEditingProjectId(null);
    } else {
      addProject({
        title: newProject.title,
        summary: newProject.description,
        description: newProject.description,
        longDescription: newProject.longDescription || newProject.description,
        category: finalCategory,
        tags: combinedTags,
        technologies: combinedTags,
        thumbnail: firstImage,
        image: firstImage,
        images: photoList.length > 0 ? photoList : [firstImage],
        demoUrl: newProject.demoUrl,
        githubUrl: newProject.githubUrl,
        featured: newProject.featured,
        status: 'Completed',
        year: '2026',
      });
    }

    setNewProject({
      title: '',
      category: 'Full-Stack',
      customCategoryInput: '',
      primaryTag: 'Full-Stack',
      tags: ['React', 'Node.js', 'MongoDB'],
      description: '',
      longDescription: '',
      photoUrlsInput: '',
      demoUrl: '',
      githubUrl: '',
      featured: true,
    });
  };

  const handleSaveCreative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreative.title) return;

    const photoList = newCreative.photoUrlsInput
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 5);

    const firstImage = photoList[0] || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000';
    const combinedTags = Array.from(new Set([newCreative.category, ...newCreative.tags])).filter(Boolean);

    if (editingCreativeId) {
      updateCreativeItem({
        id: editingCreativeId,
        title: newCreative.title,
        category: newCreative.category as any,
        shortDescription: newCreative.shortDescription,
        detailedDescription: newCreative.detailedDescription || newCreative.shortDescription,
        thumbnail: firstImage,
        images: photoList.length > 0 ? photoList : [firstImage],
        videoUrl: newCreative.videoUrl,
        platformUrl: newCreative.platformUrl,
        softwareUsed: newCreative.softwareUsed,
        tags: combinedTags,
        completionDate: newCreative.completionDate || '2026',
        featured: newCreative.featured,
        status: 'Published',
      });
      setEditingCreativeId(null);
    } else {
      addCreativeItem({
        title: newCreative.title,
        category: newCreative.category,
        shortDescription: newCreative.shortDescription,
        detailedDescription: newCreative.detailedDescription || newCreative.shortDescription,
        thumbnail: firstImage,
        images: photoList.length > 0 ? photoList : [firstImage],
        videoUrl: newCreative.videoUrl,
        platformUrl: newCreative.platformUrl,
        softwareUsed: newCreative.softwareUsed,
        tags: combinedTags,
        completionDate: newCreative.completionDate || '2026',
        featured: newCreative.featured,
        status: 'Published',
      });
    }

    setNewCreative({
      title: '',
      category: 'Poster Design',
      featured: true,
      completionDate: '2026',
      photoUrlsInput: '',
      videoUrl: '',
      platformUrl: '',
      softwareUsed: ['Canva', 'Photoshop'],
      tags: ['Poster', 'Design'],
      shortDescription: '',
      detailedDescription: '',
    });
  };

  const handleEditCreative = (item: CreativeItem) => {
    setEditingCreativeId(item.id);
    const existingPhotos = item.images && item.images.length > 0 ? item.images.join('\n') : item.thumbnail || '';
    setNewCreative({
      title: item.title,
      category: item.category || 'Poster Design',
      featured: item.featured ?? true,
      completionDate: item.completionDate || '2026',
      photoUrlsInput: existingPhotos,
      videoUrl: item.videoUrl || '',
      platformUrl: item.platformUrl || '',
      softwareUsed: item.softwareUsed || ['Canva'],
      tags: item.tags || ['Design'],
      shortDescription: item.shortDescription || '',
      detailedDescription: item.detailedDescription || item.shortDescription || '',
    });
  };

  const handleCancelEditCreative = () => {
    setEditingCreativeId(null);
    setNewCreative({
      title: '',
      category: 'Poster Design',
      featured: true,
      completionDate: '2026',
      photoUrlsInput: '',
      videoUrl: '',
      platformUrl: '',
      softwareUsed: ['Canva', 'Photoshop'],
      tags: ['Poster', 'Design'],
      shortDescription: '',
      detailedDescription: '',
    });
  };

  const handleStartEditGallery = (item: any) => {
    setEditingGalleryId(item.id);
    const photoList = item.images && item.images.length > 0
      ? item.images.join('\n')
      : item.image || '';

    setNewGallery({
      title: item.title || '',
      category: item.category || 'Certificates',
      featured: item.featured ?? true,
      date: item.date || '2025',
      location: item.location || '',
      credentialUrl: item.credentialUrl || '',
      photoUrlsInput: photoList,
      technologies: item.technologies || item.skills || ['React'],
      tags: item.tags || ['Certificates'],
      description: item.description || '',
      detailedDescription: item.detailedDescription || item.description || '',
    });
  };

  const handleCancelEditGallery = () => {
    setEditingGalleryId(null);
    setNewGallery({
      title: '',
      category: 'Certificates',
      featured: true,
      date: '2025',
      location: 'MVSR / Online',
      credentialUrl: '',
      photoUrlsInput: '',
      technologies: ['React', 'Node.js'],
      tags: ['Certificates', 'Full-Stack'],
      description: '',
      detailedDescription: '',
    });
  };

  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGallery.title) return;

    const photoList = newGallery.photoUrlsInput
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 5);

    const mainImage = photoList[0] || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000';
    const combinedTags = Array.from(new Set([newGallery.category, ...newGallery.tags])).filter(Boolean);

    if (editingGalleryId) {
      updateGalleryItem({
        id: editingGalleryId,
        title: newGallery.title,
        category: newGallery.category,
        featured: newGallery.featured,
        date: newGallery.date,
        location: newGallery.location,
        credentialUrl: newGallery.credentialUrl,
        image: mainImage,
        images: photoList.length > 0 ? photoList : [mainImage],
        technologies: newGallery.technologies,
        tags: combinedTags,
        description: newGallery.description,
        detailedDescription: newGallery.detailedDescription || newGallery.description,
      });
      setEditingGalleryId(null);
    } else {
      addGalleryItem({
        title: newGallery.title,
        category: newGallery.category,
        featured: newGallery.featured,
        date: newGallery.date,
        location: newGallery.location,
        credentialUrl: newGallery.credentialUrl,
        image: mainImage,
        images: photoList.length > 0 ? photoList : [mainImage],
        technologies: newGallery.technologies,
        tags: combinedTags,
        description: newGallery.description,
        detailedDescription: newGallery.detailedDescription || newGallery.description,
      });
    }

    setNewGallery({
      title: '',
      category: 'Certificates',
      featured: true,
      date: '2025',
      location: 'MVSR / Online',
      credentialUrl: '',
      photoUrlsInput: '',
      technologies: ['React', 'Node.js'],
      tags: ['Certificates', 'Full-Stack'],
      description: '',
      detailedDescription: '',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto"
        >
          {!isAuthenticated ? (
            /* LOGIN SCREEN */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0c0c0f] rounded-3xl border border-emerald-500/30 shadow-2xl p-8 space-y-6"
            >
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Dubbaka Sathwik CMS</h3>
                <p className="text-xs font-mono text-zinc-400">Enter Admin Password</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full px-4 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-center font-mono tracking-widest text-white text-base transition-colors"
                  />
                  {errorMsg && (
                    <p className="text-xs text-red-400 text-center font-mono">{errorMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                >
                  Login to CMS
                </button>
              </form>
            </motion.div>
          ) : (
            /* CMS DASHBOARD */
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-6xl bg-[#0a0a0d] rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden my-6 flex flex-col h-[90vh]"
            >
              {/* Header */}
              <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Smart CMS Portal</span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {dbConnected ? '⚡ MongoDB Atlas Live' : 'MongoDB Sync Active'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">Dynamic Content Management for Dubbaka Sathwik</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono"
                  >
                    Lock CMS
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="md:col-span-3 bg-zinc-950/90 border-r border-zinc-800 p-4 space-y-1 overflow-y-auto">
                  {[
                    { id: 'journey', label: `Journey (${(data.journey || []).length})`, icon: Calendar },
                    { id: 'projects', label: `Projects (${(data.projects || []).length})`, icon: FolderPlus },
                    { id: 'creative', label: `Creative (${(data.creativePortfolio || []).length})`, icon: Palette },
                    { id: 'gallery', label: `Certificates & Awards (${(data.gallery || []).length})`, icon: Award },
                    { id: 'resumes', label: `Resumes (${(data.resumes || []).length})`, icon: FileText },
                    { id: 'hero', label: 'Hero Section', icon: Sparkles },
                    { id: 'about', label: 'About Details', icon: User },
                    { id: 'contact', label: 'Contact Details', icon: Mail },
                    {
                      id: 'inbox',
                      label: `Inbox (${(data.contactMessages || data.messages || []).filter((m: any) => m.status === 'unread' || (!m.read && m.status !== 'read')).length})`,
                      icon: Inbox,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left ${
                          activeTab === tab.id
                            ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-950/50'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Content Editor View */}
                <div className="md:col-span-9 p-6 sm:p-8 overflow-y-auto space-y-8 bg-[#0a0a0d]">
                  {/* JOURNEY TAB */}
                  {activeTab === 'journey' && (
                    <div className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4">
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Manage Journey Milestones</span>
                          <span className="text-xs font-mono font-normal text-emerald-400">🎓 NSS • IEEE • College</span>
                        </h4>
                        <p className="text-xs text-zinc-400">Roadmap entries, education, roles & achievements.</p>
                      </div>

                      <form onSubmit={handleAddJourney} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
                        <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Add Journey Milestone
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-mono text-zinc-400">Year / Timeline</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 2025 or 2023 - Present"
                              value={newJourney.year}
                              onChange={(e) => setNewJourney({ ...newJourney, year: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400">Milestone Title</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 3rd Year CSE & NSS Lead"
                              value={newJourney.title}
                              onChange={(e) => setNewJourney({ ...newJourney, title: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-mono text-zinc-400">Organization / College</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. MVSR Engineering College"
                            value={newJourney.organization}
                            onChange={(e) => setNewJourney({ ...newJourney, organization: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white mt-1"
                          />
                        </div>

                        {/* Tag Selection Component */}
                        <TagSelector
                          selectedTag={newJourney.primaryTag || newJourney.category}
                          onSelectTag={(tag) => setNewJourney((prev) => ({ ...prev, primaryTag: tag, category: tag as any }))}
                          label="Select Milestone Tag / Category"
                        />

                        {/* Position Selection Component */}
                        <PositionSelector
                          selectedPosition={newJourney.role}
                          onSelectPosition={(role) => setNewJourney({ ...newJourney, role })}
                          label="Select Role / Position"
                        />

                        {/* Tech Tag Input */}
                        <SmartTagInput
                          tags={newJourney.tags}
                          onChange={(tags) => setNewJourney({ ...newJourney, tags })}
                          label="Milestone Skills / Tech Tags"
                          placeholder="Type tag and press comma (,)"
                        />

                        {/* Photo Dropdown & Device Selector */}
                        <div className="space-y-3">
                          <PhotoDropdownSelector
                            label="Select / Manage Milestone Photos (Device Files, Presets or URLs)"
                            multilineMode={true}
                            currentPhotos={newJourney.photoUrlsInput.split('\n').map((u) => u.trim()).filter(Boolean)}
                            onUpdatePhotoList={(newPhotos) => {
                              setNewJourney((prev) => ({
                                ...prev,
                                photoUrlsInput: Array.from(new Set(newPhotos)).join('\n'),
                              }));
                            }}
                          />

                          <div>
                            <label className="text-xs font-mono text-emerald-400 font-medium block mb-1">
                              Milestone Photo URLs List (Raw list - syncs automatically with cards above)
                            </label>
                            <textarea
                              rows={2}
                              placeholder={`Select from photo dropdown above OR paste custom image URLs here (one URL per line).`}
                              value={newJourney.photoUrlsInput}
                              onChange={(e) => setNewJourney({ ...newJourney, photoUrlsInput: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                            />
                            <p className="text-[10px] font-mono text-zinc-500 mt-1">
                              Note: Photos do NOT show on the timeline card. They display inside the popup slideshow when clicked.
                            </p>
                          </div>
                        </div>

                        {/* Description 1: Card Description */}
                        <RichTextEditor
                          value={newJourney.description}
                          onChange={(val) => setNewJourney({ ...newJourney, description: val })}
                          label="1. Card Description (Reflects directly on timeline card)"
                          placeholder="Short summary for timeline card... Supports toolbar markers!"
                        />

                        {/* Description 2: Popup Description */}
                        <RichTextEditor
                          value={newJourney.detailedDescription}
                          onChange={(val) => setNewJourney({ ...newJourney, detailedDescription: val })}
                          label="2. Popup Description (Reflects inside detail popup modal)"
                          placeholder="Detailed breakdown for modal popup... Supports toolbar markers!"
                        />

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                          >
                            {editingJourneyId ? (
                              <>
                                <Save className="w-4 h-4" /> Update Milestone Entry
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Save New Milestone Entry
                              </>
                            )}
                          </button>

                          {editingJourneyId && (
                            <button
                              type="button"
                              onClick={handleCancelEditJourney}
                              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700/60 transition-all cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Existing Journey List with Position Change & Swap Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono font-semibold text-zinc-400">
                            Existing Milestones ({data.journey.length}) — Click <Pencil className="w-3 h-3 inline text-emerald-400" /> to edit
                          </p>
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            ▲▼ Move or Swap Roadmap Position
                          </span>
                        </div>
                        {data.journey.map((item, idx) => {
                          const photoCount = item.images ? item.images.length : item.image ? 1 : 0;
                          const isEditingThis = editingJourneyId === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isEditingThis
                                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Position Index Badge */}
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shrink-0">
                                    #{idx + 1}
                                  </span>

                                  <NeonIcon name={item.category || item.role} className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span className="text-sm font-bold text-white truncate">{item.title}</span>
                                  <span className="text-xs font-mono text-emerald-400 font-normal shrink-0">({item.year})</span>
                                  {isEditingThis && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40 animate-pulse shrink-0">
                                      Editing Now...
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap">
                                  <span>{item.organization} {item.role && `• ${item.role}`}</span>
                                  {photoCount > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                      📷 {photoCount} Photo{photoCount > 1 ? 's' : ''} (Popup)
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* Position Reordering & Action Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                                {/* Move Up / Down Buttons */}
                                <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => reorderJourneyItem(idx, 'up')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Up in Roadmap Timeline"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === data.journey.length - 1}
                                    onClick={() => reorderJourneyItem(idx, 'down')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Down in Roadmap Timeline"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Swap Position Dropdown */}
                                <div className="flex items-center gap-1 bg-zinc-900 rounded-lg border border-zinc-800 px-2 py-1">
                                  <ArrowUpDown className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">Swap:</span>
                                  <select
                                    value={idx}
                                    onChange={(e) => {
                                      const targetIndex = parseInt(e.target.value, 10);
                                      if (targetIndex !== idx) {
                                        swapJourneyItems(idx, targetIndex);
                                      }
                                    }}
                                    className="bg-transparent text-xs font-mono font-semibold text-emerald-400 border-none focus:outline-none cursor-pointer"
                                    title="Swap position with another roadmap item"
                                  >
                                    {data.journey.map((_, pos) => (
                                      <option key={pos} value={pos} className="bg-zinc-900 text-white">
                                        Pos #{pos + 1}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Edit & Delete Buttons */}
                                <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditJourney(item)}
                                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Milestone Details"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteJourneyItem(item.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Milestone"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PROJECTS TAB */}
                  {activeTab === 'projects' && (
                    <div className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>Manage Technical Projects</span>
                            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                              {data.projects.length} Projects
                            </span>
                          </h4>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            Full-Stack, Web Apps, AI & Tool projects with live demo/git links & position reordering.
                          </p>
                        </div>
                        {editingProjectId && (
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono border border-emerald-500/40 animate-pulse">
                            Editing Project Entry #{data.projects.findIndex((p) => p.id === editingProjectId) + 1}
                          </span>
                        )}
                      </div>

                      {/* Add/Edit Form */}
                      <form onSubmit={handleAddProject} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            {editingProjectId ? 'Edit Technical Project Entry' : 'Add New Technical Project'}
                          </h5>
                          {editingProjectId && (
                            <button
                              type="button"
                              onClick={handleCancelEditProject}
                              className="text-xs font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">
                              Project Title <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. MVSR Campus Hub, AI Portfolio"
                              value={newProject.title}
                              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>

                          {/* Featured Toggle Button */}
                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Featured Badge Status</label>
                            <button
                              type="button"
                              onClick={() => setNewProject({ ...newProject, featured: !newProject.featured })}
                              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-mono font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                                newProject.featured
                                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <Sparkles className={`w-3.5 h-3.5 ${newProject.featured ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                Featured on Showcase Card
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                newProject.featured ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                {newProject.featured ? 'Featured' : 'Standard'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Main Tag / Category Selection */}
                        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          <label className="text-xs font-mono text-emerald-400 font-semibold block">
                            Main Tag / Category (Reflects in website navigation filter tabs)
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            {['Full-Stack', 'Web Apps', 'Tools', 'Personal', 'College Projects'].map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setNewProject({ ...newProject, category: cat, customCategoryInput: '' })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                                  newProject.category === cat && !newProject.customCategoryInput
                                    ? 'bg-emerald-600 text-white font-bold border border-emerald-500'
                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <div className="pt-1">
                            <input
                              type="text"
                              placeholder="Or type a custom Main Tag (e.g. Blockchain, Mobile Apps, Cybersecurity)..."
                              value={newProject.customCategoryInput}
                              onChange={(e) => setNewProject({ ...newProject, customCategoryInput: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                            />
                            <p className="text-[10px] font-mono text-zinc-500 mt-1">
                              Note: Any custom main tag typed here will automatically appear in the filter navbar next to Tech Projects on the website!
                            </p>
                          </div>
                        </div>

                        {/* Smart Tech Tags Input */}
                        <SmartTagInput
                          tags={newProject.tags}
                          onChange={(tags) => setNewProject({ ...newProject, tags })}
                          label="Technologies & Tech Stack Tags"
                          placeholder="Type tech (e.g. React, Node.js, MongoDB) and press comma (,)"
                        />

                        {/* Photo Dropdown & Device Selector */}
                        <div className="space-y-3">
                          <PhotoDropdownSelector
                            label="Select / Manage Project Photos (Device Files, Presets or URLs)"
                            multilineMode={true}
                            currentPhotos={newProject.photoUrlsInput.split('\n').map((u) => u.trim()).filter(Boolean)}
                            onUpdatePhotoList={(newPhotos) => {
                              setNewProject((prev) => ({
                                ...prev,
                                photoUrlsInput: Array.from(new Set(newPhotos)).join('\n'),
                              }));
                            }}
                          />

                          <div>
                            <label className="text-xs font-mono text-emerald-400 font-medium block mb-1">
                              Project Photo URLs List (Syncs automatically with device upload above)
                            </label>
                            <textarea
                              rows={2}
                              placeholder={`Select from photo dropdown above OR paste custom image URLs here (one URL per line).`}
                              value={newProject.photoUrlsInput}
                              onChange={(e) => setNewProject({ ...newProject, photoUrlsInput: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                            />
                            <p className="text-[10px] font-mono text-zinc-500 mt-1">
                              Photo Logic: If multiple photos are added, cards & popup modal will automatically auto-rotate photos every 4 seconds!
                            </p>
                          </div>
                        </div>

                        {/* Short Description (For Card) */}
                        <RichTextEditor
                          value={newProject.description}
                          onChange={(val) => setNewProject({ ...newProject, description: val })}
                          label="1. Short Description (Reflects directly on project card)"
                          placeholder="Short summary for card view... Supports toolbar markers!"
                        />

                        {/* Detailed Overview (For Popup Modal) */}
                        <RichTextEditor
                          value={newProject.longDescription}
                          onChange={(val) => setNewProject({ ...newProject, longDescription: val })}
                          label="2. Detailed Overview (Reflects inside detail popup modal)"
                          placeholder="Comprehensive breakdown, feature highlights, architectural details... Supports toolbar markers!"
                        />

                        {/* External Action Links */}
                        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                          <label className="text-xs font-mono text-emerald-400 font-semibold block">
                            External Action Links (Git & Live Deployment)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-mono text-zinc-400 block mb-1">Live Product Demo Link</label>
                              <input
                                type="text"
                                placeholder="https://my-app.vercel.app (Optional)"
                                value={newProject.demoUrl}
                                onChange={(e) => setNewProject({ ...newProject, demoUrl: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-zinc-400 block mb-1">GitHub Repository Link</label>
                              <input
                                type="text"
                                placeholder="https://github.com/username/project (Optional)"
                                value={newProject.githubUrl}
                                onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500">
                            Note: If link is provided, the button appears in popup modal. If omitted, the button will automatically stay hidden.
                          </p>
                        </div>

                        {/* Submit & Cancel Edit Buttons */}
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                          >
                            {editingProjectId ? (
                              <>
                                <Save className="w-4 h-4" /> Update Technical Project
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Add Technical Project
                              </>
                            )}
                          </button>

                          {editingProjectId && (
                            <button
                              type="button"
                              onClick={handleCancelEditProject}
                              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700/60 transition-all cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Existing Projects List with Reordering & Swapping Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono font-semibold text-zinc-400">
                            Existing Technical Projects ({data.projects.length}) — Click <Pencil className="w-3 h-3 inline text-emerald-400" /> to edit
                          </p>
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            ▲▼ Reorder Position in Showcase
                          </span>
                        </div>

                        {data.projects.map((p, idx) => {
                          const photoCount = p.images ? p.images.length : p.thumbnail || p.image ? 1 : 0;
                          const isEditingThis = editingProjectId === p.id;

                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isEditingThis
                                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Position Badge */}
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shrink-0">
                                    #{idx + 1}
                                  </span>

                                  <NeonIcon name={p.category} className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span className="text-sm font-bold text-white truncate">{p.title}</span>

                                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 shrink-0">
                                    {p.category}
                                  </span>

                                  {p.featured && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-600/80 text-white text-[10px] font-mono font-bold shrink-0">
                                      ★ Featured
                                    </span>
                                  )}

                                  {isEditingThis && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40 animate-pulse shrink-0">
                                      Editing Now...
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap">
                                  <span>Tags: {(p.tags || []).join(', ')}</span>
                                  {photoCount > 0 && (
                                    <span className="text-emerald-400/80">• 📷 {photoCount} Photo{photoCount > 1 ? 's (Auto 4s)' : ''}</span>
                                  )}
                                  {p.demoUrl && <span className="text-emerald-400/80">• 🌐 Live Demo</span>}
                                  {p.githubUrl && <span className="text-emerald-400/80">• 🐙 GitHub Repo</span>}
                                </p>
                              </div>

                              {/* Position Reordering & Action Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                                {/* Up / Down Buttons */}
                                <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => reorderProjectItem(idx, 'up')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Up in Technical Projects Grid"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === data.projects.length - 1}
                                    onClick={() => reorderProjectItem(idx, 'down')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Down in Technical Projects Grid"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Swap Position Dropdown */}
                                <div className="flex items-center gap-1 bg-zinc-900 rounded-lg border border-zinc-800 px-2 py-1">
                                  <ArrowUpDown className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">Swap:</span>
                                  <select
                                    value={idx}
                                    onChange={(e) => {
                                      const targetIndex = parseInt(e.target.value, 10);
                                      if (targetIndex !== idx) {
                                        swapProjectItems(idx, targetIndex);
                                      }
                                    }}
                                    className="bg-transparent text-xs font-mono font-semibold text-emerald-400 border-none focus:outline-none cursor-pointer"
                                    title="Swap position with another project"
                                  >
                                    {data.projects.map((_, pos) => (
                                      <option key={pos} value={pos} className="bg-zinc-900 text-white">
                                        Pos #{pos + 1}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Edit & Delete Buttons */}
                                <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditProject(p)}
                                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Technical Project Details"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteProject(p.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Technical Project"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CREATIVE PORTFOLIO TAB */}
                  {activeTab === 'creative' && (
                    <div className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4">
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-emerald-400" />
                          <span>Manage Creative Portfolio</span>
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Posters, video edits, social media, NSS designs, and creative media.
                        </p>
                      </div>

                      <form onSubmit={handleSaveCreative} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                            {editingCreativeId ? (
                              <>
                                <Pencil className="w-3.5 h-3.5" /> Editing Creative Work (#{data.creativePortfolio.findIndex((c) => c.id === editingCreativeId) + 1})
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> Add New Creative Work
                              </>
                            )}
                          </h5>

                          {/* Featured Toggle Button */}
                          <button
                            type="button"
                            onClick={() => setNewCreative({ ...newCreative, featured: !newCreative.featured })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              newCreative.featured
                                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                            }`}
                          >
                            ★ {newCreative.featured ? 'Featured Work' : 'Mark as Featured'}
                          </button>
                        </div>

                        {/* Title & Category & Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-1 space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Title</label>
                            <input
                              type="text"
                              placeholder="Creative Work Title"
                              required
                              value={newCreative.title}
                              onChange={(e) => setNewCreative({ ...newCreative, title: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-emerald-500/50 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Category</label>
                            <select
                              value={newCreative.category}
                              onChange={(e) => setNewCreative({ ...newCreative, category: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-emerald-500/50 outline-none"
                            >
                              <option value="Poster Design">Poster Design</option>
                              <option value="Video Editing">Video Editing</option>
                              <option value="Photo Editing">Photo Editing</option>
                              <option value="Advertisements">Advertisements</option>
                              <option value="Instagram Creatives">Instagram Creatives</option>
                              <option value="NSS Works">NSS Works</option>
                              <option value="College Event Designs">College Event Designs</option>
                              <option value="Thumbnail Design">Thumbnail Design</option>
                              <option value="Personal Creative Works">Personal Creative Works</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Date Posted / Year</label>
                            <input
                              type="text"
                              placeholder="e.g. May 2026 or 2026"
                              value={newCreative.completionDate}
                              onChange={(e) => setNewCreative({ ...newCreative, completionDate: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-emerald-500/50 outline-none"
                            />
                          </div>
                        </div>

                        {/* Photo Dropdown Selector */}
                        <PhotoDropdownSelector
                          onSelectPhotoUrl={(url) =>
                            setNewCreative((prev) => ({
                              ...prev,
                              photoUrlsInput: prev.photoUrlsInput ? `${prev.photoUrlsInput}\n${url}` : url,
                            }))
                          }
                          label="Quick Pick Creative Photo / Graphic"
                        />

                        {/* Photo URLs Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center justify-between">
                            <span>Image / Thumbnail URLs (One URL per line)</span>
                            <span className="text-emerald-400 font-normal">Supports multiple photos</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="https://images.unsplash.com/photo-..."
                            value={newCreative.photoUrlsInput}
                            onChange={(e) => setNewCreative({ ...newCreative, photoUrlsInput: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                          />
                        </div>

                        {/* Video URL & Posted on Platform Link */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Video URL / Embed Link (Optional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://www.youtube.com/embed/..."
                              value={newCreative.videoUrl}
                              onChange={(e) => setNewCreative({ ...newCreative, videoUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Posted on Platform Link (Button appears when provided)
                            </label>
                            <input
                              type="url"
                              placeholder="https://instagram.com/p/... or https://linkedin.com/..."
                              value={newCreative.platformUrl}
                              onChange={(e) => setNewCreative({ ...newCreative, platformUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>
                        </div>

                        {/* Software & Tools Tags */}
                        <SmartTagInput
                          tags={newCreative.softwareUsed}
                          onChange={(software) => setNewCreative({ ...newCreative, softwareUsed: software })}
                          label="Tools & Software Used (e.g. Photoshop, Canva, Premiere, CapCut)"
                          placeholder="Type tool name and press comma (,)"
                        />

                        {/* General Tags */}
                        <SmartTagInput
                          tags={newCreative.tags}
                          onChange={(tags) => setNewCreative({ ...newCreative, tags })}
                          label="Additional Tags"
                          placeholder="Type tag and press comma (,)"
                        />

                        {/* Rich Text Editor for Description */}
                        <RichTextEditor
                          value={newCreative.shortDescription}
                          onChange={(val) => setNewCreative({ ...newCreative, shortDescription: val })}
                          label="Short Description (Supports Formatting Toolbar)"
                        />

                        <RichTextEditor
                          value={newCreative.detailedDescription}
                          onChange={(val) => setNewCreative({ ...newCreative, detailedDescription: val })}
                          label="Detailed Description (Optional extended details)"
                        />

                        {/* Form Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                          >
                            {editingCreativeId ? (
                              <>
                                <Save className="w-4 h-4" /> Update Creative Work
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Add Creative Work
                              </>
                            )}
                          </button>

                          {editingCreativeId && (
                            <button
                              type="button"
                              onClick={handleCancelEditCreative}
                              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700/60 transition-all cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Existing Creative Items List with Reordering & Swapping Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono font-semibold text-zinc-400">
                            Existing Creative Items ({data.creativePortfolio.length}) — Click <Pencil className="w-3 h-3 inline text-emerald-400" /> to edit
                          </p>
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            ▲▼ Reorder Showcase Items
                          </span>
                        </div>

                        {data.creativePortfolio.map((c, idx) => {
                          const isEditingThis = editingCreativeId === c.id;

                          return (
                            <div
                              key={c.id}
                              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isEditingThis
                                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Position Badge */}
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shrink-0">
                                    #{idx + 1}
                                  </span>

                                  <NeonIcon name={c.category} className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span className="text-sm font-bold text-white truncate">{c.title}</span>

                                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 shrink-0">
                                    {c.category}
                                  </span>

                                  {c.featured && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-600/80 text-white text-[10px] font-mono font-bold shrink-0">
                                      ★ Featured
                                    </span>
                                  )}

                                  {isEditingThis && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40 animate-pulse shrink-0">
                                      Editing Now...
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap">
                                  <span>Tools: {(c.softwareUsed || []).join(', ')}</span>
                                  {c.completionDate && <span className="text-emerald-400/80">• 📅 {c.completionDate}</span>}
                                  {c.platformUrl && <span className="text-emerald-400/80">• 🌐 Platform Link Attached</span>}
                                  {c.videoUrl && <span className="text-emerald-400/80">• 🎬 Video Attached</span>}
                                </p>
                              </div>

                              {/* Position Reordering & Action Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                                {/* Up / Down Buttons */}
                                <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => reorderCreativeItem(idx, 'up')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Up in Creative Showcase"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === data.creativePortfolio.length - 1}
                                    onClick={() => reorderCreativeItem(idx, 'down')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Down in Creative Showcase"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Edit & Delete Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditCreative(c)}
                                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Creative Work Details"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteCreativeItem(c.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Creative Work"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CERTIFICATES & AWARDS TAB */}
                  {activeTab === 'gallery' && (
                    <div className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-400" />
                            <span>Manage Certificates & Awards</span>
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Add, edit, reorder, and update official certifications, hackathon awards, and NSS honors.
                          </p>
                        </div>
                        {editingGalleryId && (
                          <button
                            type="button"
                            onClick={handleCancelEditGallery}
                            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700/60 transition-all cursor-pointer"
                          >
                            Cancel Editing
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleSaveGallery} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            {editingGalleryId ? 'Edit Certificate / Award Entry' : 'Add New Certificate / Award Entry'}
                          </h5>
                          {editingGalleryId && (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                              Editing ID: {editingGalleryId}
                            </span>
                          )}
                        </div>

                        {/* Title & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Certificate / Award Title *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Full-Stack Web Engineering Certification"
                              required
                              value={newGallery.title}
                              onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Category
                            </label>
                            <select
                              value={newGallery.category}
                              onChange={(e) => setNewGallery({ ...newGallery, category: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            >
                              <option value="Certificates">Certificates</option>
                              <option value="Awards">Awards</option>
                              <option value="Hackathons">Hackathons</option>
                              <option value="NSS and IEEE">NSS and IEEE</option>
                              <option value="Academics">Academics</option>
                            </select>
                          </div>
                        </div>

                        {/* Date, Location, Credential URL, Featured Button */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Date / Year
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2025"
                              value={newGallery.date}
                              onChange={(e) => setNewGallery({ ...newGallery, date: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Location / Institution
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. MVSR College, Hyderabad"
                              value={newGallery.location}
                              onChange={(e) => setNewGallery({ ...newGallery, location: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Credential / Verification URL
                            </label>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={newGallery.credentialUrl}
                              onChange={(e) => setNewGallery({ ...newGallery, credentialUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>
                        </div>

                        {/* Featured Button Toggle */}
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setNewGallery({ ...newGallery, featured: !newGallery.featured })}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                              newGallery.featured
                                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {newGallery.featured ? '★ Featured Button Active' : '☆ Standard Entry'}
                          </button>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {newGallery.featured ? 'Featured badge will be displayed on the certificate card.' : 'Click button to feature this certificate.'}
                          </span>
                        </div>

                        {/* Certificate Photo Dropzone & Selector */}
                        <PhotoDropdownSelector
                          label="Certificate Photo Dropzone (Upload from device, pick presets, or enter URLs)"
                          multilineMode={true}
                          currentPhotos={
                            newGallery.photoUrlsInput
                              ? newGallery.photoUrlsInput
                                  .split('\n')
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : []
                          }
                          onUpdatePhotoList={(photos) => setNewGallery({ ...newGallery, photoUrlsInput: photos.join('\n') })}
                        />

                        {/* Software / Tech Tags */}
                        <SmartTagInput
                          tags={newGallery.technologies}
                          onChange={(techs) => setNewGallery({ ...newGallery, technologies: techs })}
                          label="Technologies & Skills (e.g. React, Python, Leadership)"
                          placeholder="Type tech/skill and press comma (,)"
                        />

                        {/* Additional Category Tags */}
                        <SmartTagInput
                          tags={newGallery.tags}
                          onChange={(tags) => setNewGallery({ ...newGallery, tags })}
                          label="General Tags"
                          placeholder="Type tag and press comma (,)"
                        />

                        {/* Rich Text Editor for Description */}
                        <RichTextEditor
                          value={newGallery.description}
                          onChange={(val) => setNewGallery({ ...newGallery, description: val })}
                          label="Short Description"
                        />

                        <RichTextEditor
                          value={newGallery.detailedDescription}
                          onChange={(val) => setNewGallery({ ...newGallery, detailedDescription: val })}
                          label="Detailed Description (Optional extended details)"
                        />

                        {/* Submit & Cancel Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                          >
                            {editingGalleryId ? (
                              <>
                                <Save className="w-4 h-4" /> Update Certificate / Award
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Add Certificate / Award
                              </>
                            )}
                          </button>

                          {editingGalleryId && (
                            <button
                              type="button"
                              onClick={handleCancelEditGallery}
                              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700/60 transition-all cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Existing Certificates & Awards List with Reordering */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono font-semibold text-zinc-400">
                            Existing Certificates & Awards ({data.gallery.length}) — Click <Pencil className="w-3 h-3 inline text-emerald-400" /> to edit
                          </p>
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            ▲▼ Reorder Items
                          </span>
                        </div>

                        {data.gallery.map((g, idx) => {
                          const isEditingThis = editingGalleryId === g.id;

                          return (
                            <div
                              key={g.id}
                              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isEditingThis
                                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Position Badge */}
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shrink-0">
                                    #{idx + 1}
                                  </span>

                                  <Award className="w-4 h-4 shrink-0 text-emerald-400" />
                                  <span className="text-sm font-bold text-white truncate">{g.title}</span>

                                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 shrink-0">
                                    {g.category}
                                  </span>

                                  {g.featured && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-600/80 text-white text-[10px] font-mono font-bold shrink-0">
                                      ★ Featured
                                    </span>
                                  )}

                                  {isEditingThis && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40 animate-pulse shrink-0">
                                      Editing Now...
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap">
                                  {g.date && <span>📅 {g.date}</span>}
                                  {g.location && <span>• 📍 {g.location}</span>}
                                  {g.technologies && g.technologies.length > 0 && <span>• Tech: {g.technologies.join(', ')}</span>}
                                  {g.credentialUrl && <span className="text-emerald-400/80">• 🔗 Credential Attached</span>}
                                </p>
                              </div>

                              {/* Position Reordering & Action Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                                {/* Up / Down Buttons */}
                                <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => reorderGalleryItem(idx, 'up')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Up in List"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === data.gallery.length - 1}
                                    onClick={() => reorderGalleryItem(idx, 'down')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Down in List"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Edit & Delete Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditGallery(g)}
                                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Certificate / Award Details"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteGalleryItem(g.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Certificate / Award"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* RESUMES CMS TAB */}
                  {activeTab === 'resumes' && (
                    <div className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            <span>Manage Resume Documents CMS</span>
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Drop and upload your 4 types of PDF resumes from device, name them, write short descriptions, and configure competencies.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsResumeModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Test Live Resume Modal</span>
                          </button>
                          {editingResumeId && (
                            <button
                              type="button"
                              onClick={handleCancelEditResume}
                              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700/60 transition-all cursor-pointer"
                            >
                              Cancel Editing
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Resume Add/Edit Form */}
                      <form onSubmit={handleSaveResume} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            {editingResumeId ? 'Edit Resume Document Entry' : 'Add / Drop New Resume Type'}
                          </h5>
                          {editingResumeId && (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                              Editing ID: {editingResumeId}
                            </span>
                          )}
                        </div>

                        {/* Title & Filename */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              Resume Title / Document Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Full Stack Developer Resume"
                              required
                              value={newResume.title}
                              onChange={(e) => {
                                const titleVal = e.target.value;
                                const autoFilename = titleVal
                                  ? `${titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_Resume.pdf`
                                  : '';
                                setNewResume({
                                  ...newResume,
                                  title: titleVal,
                                  filename: newResume.filename || autoFilename,
                                });
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                              File Name (e.g. Dubbaka_Sathwik_FullStack.pdf)
                            </label>
                            <input
                              type="text"
                              placeholder="Dubbaka_Sathwik_Resume.pdf"
                              value={newResume.filename}
                              onChange={(e) => setNewResume({ ...newResume, filename: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none"
                            />
                          </div>
                        </div>

                        {/* Short Description */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                            Short Description / Target Role Overview
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Write a brief description of this resume focus (e.g. 3rd Year CSE Student proficient in React, Node.js, Express, MongoDB...)"
                            value={newResume.summary}
                            onChange={(e) => setNewResume({ ...newResume, summary: e.target.value })}
                            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-emerald-500/50 outline-none resize-none"
                          />
                        </div>

                        {/* PDF File Drop Zone from Device */}
                        <PdfDropzoneSelector
                          pdfUrl={newResume.pdfUrl}
                          filename={newResume.filename}
                          onPdfChange={(pdfUrl, filename) => {
                            setNewResume((prev) => ({
                              ...prev,
                              pdfUrl,
                              filename: filename || prev.filename,
                            }));
                          }}
                        />

                        {/* Key Competencies & Skills */}
                        <SmartTagInput
                          tags={newResume.skills}
                          onChange={(skills) => setNewResume({ ...newResume, skills })}
                          label="Key Competencies & Core Skills (e.g. React, Node.js, Java, Canva)"
                          placeholder="Type skill and press comma (,)"
                        />

                        {/* Submit & Cancel Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                          >
                            {editingResumeId ? (
                              <>
                                <Save className="w-4 h-4" /> Save Resume Document
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Add Resume Document
                              </>
                            )}
                          </button>

                          {editingResumeId && (
                            <button
                              type="button"
                              onClick={handleCancelEditResume}
                              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700/60 transition-all cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Existing Resumes List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono font-semibold text-zinc-400">
                            Current Active Resumes ({data.resumes.length}) — Click <Pencil className="w-3 h-3 inline text-emerald-400" /> to edit
                          </p>
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            ▲▼ Reorder Documents
                          </span>
                        </div>

                        {data.resumes.map((r, idx) => {
                          const isEditingThis = editingResumeId === r.id;

                          return (
                            <div
                              key={r.id}
                              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isEditingThis
                                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5 flex-1 pr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>{r.title}</span>
                                  </h5>

                                  {r.pdfUrl ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> PDF Attached
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30">
                                      Generated View
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                                  {r.summary}
                                </p>

                                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 flex-wrap pt-0.5">
                                  <span>Filename: <strong className="text-emerald-400">{r.filename}</strong></span>
                                  {r.skills && r.skills.length > 0 && <span>• Skills: {r.skills.join(', ')}</span>}
                                </p>
                              </div>

                              {/* Action Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                                {/* Up / Down Buttons */}
                                <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => reorderResumeItem(idx, 'up')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Up in List"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === data.resumes.length - 1}
                                    onClick={() => reorderResumeItem(idx, 'down')}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 disabled:opacity-25 disabled:hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="Move Down in List"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Edit & Delete Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditResume(r)}
                                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Resume Details"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteResumeItem(r.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Resume Document"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* HERO TAB */}
                  {activeTab === 'hero' && (
                    <form onSubmit={handleSaveHero} className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4">
                        <h4 className="text-xl font-bold text-white">Edit Hero Section</h4>
                        <p className="text-xs text-zinc-400">Greeting, heading name, subtitle, and tagline.</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-mono text-zinc-400">Heading Name</label>
                          <input
                            type="text"
                            value={heroForm.heading}
                            onChange={(e) => setHeroForm({ ...heroForm, heading: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-mono text-zinc-400">Subtitle</label>
                          <input
                            type="text"
                            value={heroForm.subtitle}
                            onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-mono text-zinc-400">Tagline</label>
                          <input
                            type="text"
                            value={heroForm.tagline}
                            onChange={(e) => setHeroForm({ ...heroForm, tagline: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                          />
                        </div>

                        <RichTextEditor
                          value={heroForm.description}
                          onChange={(val) => setHeroForm({ ...heroForm, description: val })}
                          label="Hero Bio Description"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Save Hero Section
                      </button>
                    </form>
                  )}

                  {/* ABOUT TAB */}
                  {activeTab === 'about' && (
                    <form onSubmit={handleSaveAbout} className="space-y-8">
                      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            <span>About Page CMS Portal</span>
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Manage profile card, avatar photo, journey story, philosophy, and section visibility toggles.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Syncs with MongoDB</span>
                        </span>
                      </div>

                      {/* SECTION VISIBILITY TOGGLES (ON / OFF SWITCHES) */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                          <label className="text-xs font-mono text-emerald-400 font-bold block">
                            SECTION VISIBILITY TOGGLES (ON / OFF)
                          </label>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Toggle sections on/off on the live website
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Profile Card Toggle */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-white">About Profile Card</span>
                            <button
                              type="button"
                              onClick={() => setAboutForm({ ...aboutForm, showProfileCard: aboutForm.showProfileCard === false })}
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                aboutForm.showProfileCard !== false
                                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                              }`}
                            >
                              {aboutForm.showProfileCard !== false ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          {/* Highlighted Quote Toggle */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-white">Highlight Quote Box</span>
                            <button
                              type="button"
                              onClick={() => setAboutForm({ ...aboutForm, showQuote: aboutForm.showQuote === false })}
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                aboutForm.showQuote !== false
                                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                              }`}
                            >
                              {aboutForm.showQuote !== false ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          {/* My Journey Toggle */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-white">My Journey Story</span>
                            <button
                              type="button"
                              onClick={() => setAboutForm({ ...aboutForm, showJourney: aboutForm.showJourney === false })}
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                aboutForm.showJourney !== false
                                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                              }`}
                            >
                              {aboutForm.showJourney !== false ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          {/* My Philosophy Toggle */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-white">My Philosophy</span>
                            <button
                              type="button"
                              onClick={() => setAboutForm({ ...aboutForm, showPhilosophy: aboutForm.showPhilosophy === false })}
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                aboutForm.showPhilosophy !== false
                                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                              }`}
                            >
                              {aboutForm.showPhilosophy !== false ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          {/* Skills Grid Toggle */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between sm:col-span-2 lg:col-span-1">
                            <span className="text-xs font-mono font-medium text-white">Technical Skills Grid</span>
                            <button
                              type="button"
                              onClick={() => setAboutForm({ ...aboutForm, showSkills: aboutForm.showSkills === false })}
                              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                aboutForm.showSkills !== false
                                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                              }`}
                            >
                              {aboutForm.showSkills !== false ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* MAIN PROFILE CARD & AVATAR DETAILS */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <label className="text-xs font-mono text-emerald-400 font-bold block border-b border-zinc-800/80 pb-2">
                          1. ABOUT CARD DETAILS & AVATAR IMAGE
                        </label>

                        {/* Photo Dropdown & Selector for Avatar */}
                        <PhotoDropdownSelector
                          label="Select / Manage Profile Avatar Photo (Device Files or Presets)"
                          multilineMode={false}
                          currentPhotos={aboutForm.avatarUrl ? [aboutForm.avatarUrl] : []}
                          onUpdatePhotoList={(newPhotos) => {
                            if (newPhotos.length > 0) {
                              setAboutForm((prev) => ({ ...prev, avatarUrl: newPhotos[0] }));
                            }
                          }}
                        />

                        <div>
                          <label className="text-xs font-mono text-zinc-400 block mb-1">Profile Avatar Image URL</label>
                          <input
                            type="text"
                            value={aboutForm.avatarUrl || ''}
                            onChange={(e) => setAboutForm({ ...aboutForm, avatarUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Main Heading Tagline</label>
                            <input
                              type="text"
                              value={aboutForm.heading || ''}
                              onChange={(e) => setAboutForm({ ...aboutForm, heading: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Subheading / Role Title</label>
                            <input
                              type="text"
                              value={aboutForm.subheading || ''}
                              onChange={(e) => setAboutForm({ ...aboutForm, subheading: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Degree Title</label>
                            <input
                              type="text"
                              value={aboutForm.degree || 'B.E. Computer Science & Information Technology'}
                              onChange={(e) => setAboutForm({ ...aboutForm, degree: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">College Name</label>
                            <input
                              type="text"
                              value={aboutForm.college || ''}
                              onChange={(e) => setAboutForm({ ...aboutForm, college: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Department</label>
                            <input
                              type="text"
                              value={aboutForm.department || ''}
                              onChange={(e) => setAboutForm({ ...aboutForm, department: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Year of Study</label>
                            <input
                              type="text"
                              value={aboutForm.yearOfStudy || ''}
                              onChange={(e) => setAboutForm({ ...aboutForm, yearOfStudy: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Location Line</label>
                            <input
                              type="text"
                              value={aboutForm.location || 'MVSR Engineering College • Hyderabad, Telangana, India'}
                              onChange={(e) => setAboutForm({ ...aboutForm, location: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Leadership & Current Focus Lists */}
                        <div className="space-y-3 pt-2">
                          <SmartTagInput
                            tags={aboutForm.leadership || ['NSS Digital Co-Lead', 'IEEE Student Member', 'Student Coordinator']}
                            onChange={(tags) => setAboutForm({ ...aboutForm, leadership: tags })}
                            label="Leadership & Community Items"
                            placeholder="Type leadership role and press comma (,)"
                          />

                          <SmartTagInput
                            tags={aboutForm.currentFocus || ['Full-Stack Development', 'Artificial Intelligence', 'Creative Design', 'AI-powered Applications']}
                            onChange={(tags) => setAboutForm({ ...aboutForm, currentFocus: tags })}
                            label="Current Focus Items"
                            placeholder="Type focus area and press comma (,)"
                          />

                          <SmartTagInput
                            tags={aboutForm.availability || ['Open for Internships', 'Freelance Projects']}
                            onChange={(tags) => setAboutForm({ ...aboutForm, availability: tags })}
                            label="Availability Status Items"
                            placeholder="Type availability item and press comma (,)"
                          />

                          <SmartTagInput
                            tags={aboutForm.tags || ['Full-Stack Development', 'Artificial Intelligence', 'React', 'Node.js', 'Creative Design', 'Open Source Learner']}
                            onChange={(tags) => setAboutForm({ ...aboutForm, tags })}
                            label="About Card Tech Tags & Badges"
                            placeholder="Type tag and press comma (,)"
                          />
                        </div>
                      </div>

                      {/* HIGHLIGHTED QUOTE / STANDOUT STATEMENT */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <label className="text-xs font-mono text-emerald-400 font-bold block border-b border-zinc-800/80 pb-2">
                          2. STANDOUT STATEMENT / HIGHLIGHTED QUOTE
                        </label>

                        <RichTextEditor
                          value={aboutForm.quote || ''}
                          onChange={(val) => setAboutForm({ ...aboutForm, quote: val })}
                          label="Main Quote Text (Supports toolbar markers)"
                          placeholder="Quote or standout motivation text..."
                        />

                        <div>
                          <label className="text-xs font-mono text-zinc-400 block mb-1">Quote Accent / Closing Badge Highlight</label>
                          <input
                            type="text"
                            value={aboutForm.quoteHighlight || ''}
                            onChange={(e) => setAboutForm({ ...aboutForm, quoteHighlight: e.target.value })}
                            placeholder="e.g. Curiosity has always been my biggest motivation..."
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* MY JOURNEY STORY SECTION */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <label className="text-xs font-mono text-emerald-400 font-bold block border-b border-zinc-800/80 pb-2">
                          3. MY JOURNEY STORY PARAGRAPH
                        </label>

                        <div>
                          <label className="text-xs font-mono text-zinc-400 block mb-1">Section Title</label>
                          <input
                            type="text"
                            value={aboutForm.journeyTitle || 'My Journey'}
                            onChange={(e) => setAboutForm({ ...aboutForm, journeyTitle: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-3">
                          <RichTextEditor
                            value={aboutForm.bioParagraph1 || ''}
                            onChange={(val) => setAboutForm({ ...aboutForm, bioParagraph1: val, bioParagraph2: '', bioParagraph3: '', bioParagraph4: '', bioParagraph5: '' })}
                            label="Journey Paragraph (Supports toolbar markers & formatting)"
                            placeholder="Write your journey story here..."
                          />
                        </div>
                      </div>

                      {/* MY PHILOSOPHY SECTION */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <label className="text-xs font-mono text-emerald-400 font-bold block border-b border-zinc-800/80 pb-2">
                          4. MY PHILOSOPHY PARAGRAPH
                        </label>

                        <div>
                          <label className="text-xs font-mono text-zinc-400 block mb-1">Section Title</label>
                          <input
                            type="text"
                            value={aboutForm.philosophyTitle || 'My Philosophy'}
                            onChange={(e) => setAboutForm({ ...aboutForm, philosophyTitle: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-3">
                          <RichTextEditor
                            value={aboutForm.philosophyParagraph1 || ''}
                            onChange={(val) => setAboutForm({ ...aboutForm, philosophyParagraph1: val, philosophyParagraph2: '', philosophyParagraph3: '' })}
                            label="Philosophy Paragraph (Supports toolbar markers & formatting)"
                            placeholder="Write your philosophy here..."
                          />
                        </div>
                      </div>

                      {/* QUICK STATS ITEMS */}
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <label className="text-xs font-mono text-emerald-400 font-bold block border-b border-zinc-800/80 pb-2">
                          5. ABOUT CARD QUICK STATS (4 HIGHLIGHT BOXES)
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(aboutForm.stats || []).map((st, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold block">Stat Box #{idx + 1}</span>
                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Value / Highlight</label>
                                <input
                                  type="text"
                                  value={st.value}
                                  onChange={(e) => {
                                    const newStats = [...(aboutForm.stats || [])];
                                    newStats[idx] = { ...newStats[idx], value: e.target.value };
                                    setAboutForm({ ...aboutForm, stats: newStats });
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Label / Subtext</label>
                                <input
                                  type="text"
                                  value={st.label}
                                  onChange={(e) => {
                                    const newStats = [...(aboutForm.stats || [])];
                                    newStats[idx] = { ...newStats[idx], label: e.target.value };
                                    setAboutForm({ ...aboutForm, stats: newStats });
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SUBMIT BUTTON */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                        >
                          <Save className="w-4 h-4" /> Save About Page CMS (Syncs to MongoDB)
                        </button>
                      </div>
                    </form>
                  )}

                  {/* CONTACT INFO TAB */}
                  {activeTab === 'contact' && (
                    <form onSubmit={handleSaveContact} className="space-y-8">
                      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-emerald-400" />
                            <span>Contact Details & Follow & Connect CMS</span>
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Manage direct contact channels, availability status banner, and social media URLs.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Syncs Live with Portfolio & MongoDB</span>
                        </span>
                      </div>

                      {/* Direct Contact Channels */}
                      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <label className="text-xs font-mono text-emerald-400 font-bold block border-b border-zinc-800/80 pb-2">
                          1. DIRECT CONTACT CHANNELS
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Direct Email Address</label>
                            <input
                              type="email"
                              value={contactForm.email || ''}
                              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-xs text-white"
                              placeholder="e.g. dubbakasathwik@gmail.com"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Phone Number / WhatsApp</label>
                            <input
                              type="text"
                              value={contactForm.phone || ''}
                              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-xs text-white"
                              placeholder="e.g. +91 8527564839"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Location</label>
                            <input
                              type="text"
                              value={contactForm.location || ''}
                              onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-xs text-white"
                              placeholder="e.g. Hyderabad, Telangana, India"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-mono text-zinc-400 block mb-1">Instagram Handle (Username)</label>
                            <input
                              type="text"
                              value={contactForm.instagram || ''}
                              onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-xs text-white"
                              placeholder="e.g. wilder_sathwik"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-mono text-zinc-400 block mb-1">Availability & Response Status Banner</label>
                          <input
                            type="text"
                            value={contactForm.availability || ''}
                            onChange={(e) => setContactForm({ ...contactForm, availability: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-xs text-white"
                            placeholder="e.g. Open for Internship Opportunities & Freelance Projects"
                          />
                        </div>
                      </div>

                      {/* Follow & Connect Social Links */}
                      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 flex-wrap gap-2">
                          <div>
                            <label className="text-xs font-mono text-emerald-400 font-bold block">
                              2. FOLLOW & CONNECT SOCIAL LINKS
                            </label>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              Add or edit social platform links displayed in your "Get In Touch" section.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const current = contactForm.socials || [];
                              setContactForm({
                                ...contactForm,
                                socials: [...current, { platform: 'LinkedIn', url: 'https://' }],
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Custom Social Link</span>
                          </button>
                        </div>

                        {/* Preset Quick Add Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-500">Quick Add Presets:</span>
                          {[
                            { platform: 'GitHub', defaultUrl: 'https://github.com/dubbakasathwik' },
                            { platform: 'LinkedIn', defaultUrl: 'https://linkedin.com/in/dubbakasathwik' },
                            { platform: 'Instagram', defaultUrl: 'https://instagram.com/wilder_sathwik' },
                            { platform: 'Twitter / X', defaultUrl: 'https://twitter.com/dubbakasathwik' },
                            { platform: 'YouTube', defaultUrl: 'https://youtube.com/@dubbakasathwik' },
                            { platform: 'WhatsApp', defaultUrl: 'https://wa.me/918527564839' },
                            { platform: 'Discord', defaultUrl: 'https://discord.com' },
                          ].map((preset) => {
                            const exists = (contactForm.socials || []).some(
                              (s) => s.platform.toLowerCase() === preset.platform.toLowerCase()
                            );
                            return (
                              <button
                                key={preset.platform}
                                type="button"
                                disabled={exists}
                                onClick={() => {
                                  const current = contactForm.socials || [];
                                  setContactForm({
                                    ...contactForm,
                                    socials: [...current, { platform: preset.platform, url: preset.defaultUrl }],
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
                                  exists
                                    ? 'bg-zinc-900 text-zinc-600 border-zinc-800 opacity-60 cursor-not-allowed'
                                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 hover:border-emerald-500/40'
                                }`}
                              >
                                + {preset.platform} {exists ? '(Added)' : ''}
                              </button>
                            );
                          })}
                        </div>

                        {/* Social Links List */}
                        <div className="space-y-3 pt-2">
                          {(contactForm.socials || []).map((soc, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center gap-3"
                            >
                              <div className="w-full sm:w-1/3">
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Platform Name</label>
                                <input
                                  type="text"
                                  value={soc.platform}
                                  onChange={(e) => {
                                    const newSocials = [...(contactForm.socials || [])];
                                    newSocials[idx] = { ...newSocials[idx], platform: e.target.value };
                                    setContactForm({ ...contactForm, socials: newSocials });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-medium"
                                  placeholder="e.g. GitHub"
                                />
                              </div>

                              <div className="w-full sm:flex-1">
                                <label className="text-[10px] font-mono text-zinc-500 block mb-0.5">Full URL Link</label>
                                <input
                                  type="url"
                                  value={soc.url}
                                  onChange={(e) => {
                                    const newSocials = [...(contactForm.socials || [])];
                                    newSocials[idx] = { ...newSocials[idx], url: e.target.value };
                                    setContactForm({ ...contactForm, socials: newSocials });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-emerald-400 font-mono"
                                  placeholder="https://..."
                                />
                              </div>

                              <div className="self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSocials = (contactForm.socials || []).filter((_, i) => i !== idx);
                                    setContactForm({ ...contactForm, socials: newSocials });
                                  }}
                                  className="p-2 rounded-lg bg-zinc-950 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 transition-all cursor-pointer"
                                  title="Delete social link"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {(!contactForm.socials || contactForm.socials.length === 0) && (
                            <p className="text-xs font-mono text-zinc-500 text-center py-4">
                              No social links configured yet. Click above to add your profiles!
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                        >
                          <Save className="w-4 h-4" /> Save Contact Details & Follow Links (Syncs to MongoDB)
                        </button>
                      </div>
                    </form>
                  )}

                  {/* INBOX MESSAGES TAB */}
                  {activeTab === 'inbox' && (
                    <div className="space-y-6">
                      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-white">Contact Form Inbox</h4>
                          <p className="text-xs text-zinc-400">Direct inquiries submitted by visitors.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {(data.contactMessages || data.messages || []).length} Messages
                        </span>
                      </div>

                      {(data.contactMessages || data.messages || []).length === 0 ? (
                        <p className="text-zinc-500 text-xs text-center py-8 font-mono">No messages received yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {(data.contactMessages || data.messages || []).map((msg: any) => {
                            const isRead = msg.status === 'read' || msg.read === true;
                            return (
                              <div
                                key={msg.id}
                                className={`p-5 rounded-2xl border transition-all ${
                                  isRead
                                    ? 'bg-zinc-950/60 border-zinc-800/80'
                                    : 'bg-emerald-950/20 border-emerald-500/40 shadow-lg'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div>
                                    <h5 className="text-sm font-bold text-white">{msg.name}</h5>
                                    <p className="text-xs font-mono text-emerald-400">{msg.email}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-zinc-500">{msg.date}</span>
                                    {!isRead && (
                                      <button
                                        onClick={() => markMessageRead(msg.id)}
                                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-mono hover:bg-emerald-500"
                                      >
                                        Mark Read
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteMessage(msg.id)}
                                      className="p-1.5 text-zinc-500 hover:text-emerald-400"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs font-semibold text-zinc-300 mt-2">{msg.subject}</p>
                                <p className="text-xs text-zinc-400 leading-relaxed mt-1">{msg.message}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
