import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CMSData,
  HeroData,
  AboutData,
  SkillCategory,
  Project,
  CreativeItem,
  JourneyItem,
  GalleryItem,
  BlogPost,
  ResumeOption,
  ContactInfo,
  ContactMessage,
} from '../types';
import { initialCMSData } from '../data';
import { sendTelegramConsoleLog, sendTelegramInboxMessage } from '../utils/telegram';

interface CMSContextType {
  data: CMSData & { contactMessages: ContactMessage[] };
  updateHero: (hero: HeroData) => void;
  updateAbout: (about: AboutData) => void;
  updateSkills: (skills: SkillCategory[]) => void;

  updateProjects: (projects: Project[]) => void;
  addProject: (project: any) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  reorderProjectItem: (index: number, direction: 'up' | 'down') => void;
  moveProjectItem: (fromIndex: number, toIndex: number) => void;
  swapProjectItems: (index1: number, index2: number) => void;

  updateCreativePortfolio: (items: CreativeItem[]) => void;
  addCreativeItem: (item: any) => void;
  updateCreativeItem: (item: CreativeItem) => void;
  deleteCreativeItem: (id: string) => void;
  reorderCreativeItem: (index: number, direction: 'up' | 'down') => void;
  moveCreativeItem: (fromIndex: number, toIndex: number) => void;
  swapCreativeItems: (index1: number, index2: number) => void;

  updateJourney: (journey: JourneyItem[]) => void;
  addJourneyItem: (item: any) => void;
  updateJourneyItem: (item: JourneyItem) => void;
  deleteJourneyItem: (id: string) => void;
  reorderJourneyItem: (index: number, direction: 'up' | 'down') => void;
  moveJourneyItem: (fromIndex: number, toIndex: number) => void;
  swapJourneyItems: (index1: number, index2: number) => void;

  updateGallery: (gallery: GalleryItem[]) => void;
  addGalleryItem: (item: any) => void;
  updateGalleryItem: (item: GalleryItem) => void;
  deleteGalleryItem: (id: string) => void;
  reorderGalleryItem: (index: number, direction: 'up' | 'down') => void;
  moveGalleryItem: (fromIndex: number, toIndex: number) => void;
  swapGalleryItems: (index1: number, index2: number) => void;

  updateBlogs: (blogs: BlogPost[]) => void;
  addBlogPost: (post: any) => void;
  updateBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (id: string) => void;

  updateResumes: (resumes: ResumeOption[]) => void;
  addResume: (resume: Partial<ResumeOption>) => void;
  updateResumeItem: (resume: ResumeOption) => void;
  deleteResumeItem: (id: string) => void;
  reorderResumeItem: (index: number, direction: 'up' | 'down') => void;
  moveResumeItem: (fromIndex: number, toIndex: number) => void;
  swapResumeItems: (index1: number, index2: number) => void;
  updateContactInfo: (contact: ContactInfo) => void;

  addMessage: (msg: Omit<ContactMessage, 'id' | 'date' | 'time' | 'status'>) => void;
  addContactMessage: (msg: Omit<ContactMessage, 'id' | 'date' | 'time' | 'status'>) => void;
  markMessageStatus: (id: string, status: 'unread' | 'read' | 'archived') => void;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;

  resetToDefaults: () => void;
  isResumeModalOpen: boolean;
  activeResumeId: string | null;
  setIsResumeModalOpen: (open: boolean, resumeId?: string) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  dbConnected: boolean;
  forceSyncToMongoDB: () => Promise<{ success: boolean; message: string; database?: string }>;
}

const STORAGE_KEY = 'dubbaka_sathwik_cms_data_v7';

const CMSContext = createContext<CMSContextType | undefined>(undefined);

const sanitizeJourney = (items: JourneyItem[]): JourneyItem[] => {
  return (items || []).map((item) => {
    let cat = item.category;
    if (item.tags && item.tags.length > 0) {
      const primaryInTags = item.tags.find((t) =>
        ['Achievement', 'NSS', 'IEEE', 'College', 'Event', 'Hackathon'].includes(t)
      );
      if (primaryInTags && (cat === 'Engineering' || !cat) && primaryInTags !== 'Engineering') {
        cat = primaryInTags;
      } else if (!cat) {
        cat = item.tags[0];
      }
    }
    return {
      ...item,
      category: cat || 'College',
    };
  });
};

const DUMMY_FEMALE_PHOTO = 'photo-1534528741775-53994a69daeb';
const BROKEN_UPLOAD_PATH = '/uploads/1000118668_jpg_1785864603279_app2.jpg';

const isValidAvatarUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  if (url.includes(DUMMY_FEMALE_PHOTO)) return false;
  if (url === BROKEN_UPLOAD_PATH) return false;
  return true;
};

// Helper to sanitize data for LocalStorage so large base64 strings never cause QuotaExceededError
const sanitizeForLocalStorage = (dataToSave: CMSData): CMSData => {
  const sanitizeUrl = (url?: string, maxLen = 2500000) => {
    if (url && url.startsWith('data:') && url.length > maxLen) {
      return ''; // keep in RAM & Mongo, strip giant base64 from local storage
    }
    return url || '';
  };

  return {
    ...dataToSave,
    hero: { ...dataToSave.hero },
    about: {
      ...dataToSave.about,
      avatarUrl: dataToSave.about?.avatarUrl || '',
    },
    projects: (dataToSave.projects || []).map((p) => ({
      ...p,
      thumbnail: sanitizeUrl(p.thumbnail),
      image: sanitizeUrl(p.image),
      images: (p.images || []).map((img) => sanitizeUrl(img)),
    })),
    creativePortfolio: (dataToSave.creativePortfolio || []).map((c) => ({
      ...c,
      thumbnail: sanitizeUrl(c.thumbnail),
      images: (c.images || []).map((img) => sanitizeUrl(img)),
    })),
    gallery: (dataToSave.gallery || []).map((g) => ({
      ...g,
      image: sanitizeUrl(g.image),
    })),
    journey: (dataToSave.journey || []).map((j) => ({
      ...j,
      image: sanitizeUrl(j.image),
      images: (j.images || []).map((img) => sanitizeUrl(img)),
    })),
    resumes: (dataToSave.resumes || []).map((r) => ({
      ...r,
      pdfUrl: sanitizeUrl(r.pdfUrl, 100000),
    })),
  };
};

// Clean up obsolete / corrupted keys from LocalStorage on load
const purgeUnwantedLocalStorage = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k.includes('backup') ||
        k.includes('temp') ||
        (k.startsWith('dubbaka_sathwik_cms_data_') && k !== STORAGE_KEY)
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('LocalStorage purge error:', e);
  }
};

// Deep recovery function to scan ALL localStorage keys and recover lost user cards
const loadAndRecoverCMSData = (): CMSData => {
  purgeUnwantedLocalStorage();

  const candidateKeys = [
    STORAGE_KEY,
    'dubbaka_sathwik_cms_data_v6',
    'dubbaka_sathwik_cms_data_v5',
    'dubbaka_sathwik_cms_data_v4',
    'dubbaka_sathwik_cms_data_v3',
    'dubbaka_sathwik_cms_data_v2',
    'dubbaka_sathwik_cms_data_v1',
    'portfolio_cms_v1',
    'cms_data',
  ];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes('cms') || k.includes('dubbaka') || k.includes('portfolio')) && !candidateKeys.includes(k)) {
        candidateKeys.push(k);
      }
    }
  } catch (e) {
    console.warn('Unable to list localStorage keys:', e);
  }

  let mergedHero: Partial<HeroData> = {};
  let mergedAbout: Partial<AboutData> = {};
  let mergedContactInfo: Partial<ContactInfo> = {};

  const projectMap = new Map<string, Project>();
  const creativeMap = new Map<string, CreativeItem>();
  const galleryMap = new Map<string, GalleryItem>();
  const journeyMap = new Map<string, JourneyItem>();
  const resumeMap = new Map<string, ResumeOption>();
  const blogMap = new Map<string, BlogPost>();

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') continue;

      if (parsed.hero && Object.keys(parsed.hero).length > 0) {
        mergedHero = { ...mergedHero, ...parsed.hero };
      }
      if (parsed.about && Object.keys(parsed.about).length > 0) {
        if (!isValidAvatarUrl(parsed.about.avatarUrl)) {
          delete parsed.about.avatarUrl;
        }
        mergedAbout = { ...mergedAbout, ...parsed.about };
      }
      if (parsed.contactInfo && Object.keys(parsed.contactInfo).length > 0) {
        mergedContactInfo = { ...mergedContactInfo, ...parsed.contactInfo };
      }

      if (Array.isArray(parsed.projects)) {
        parsed.projects.forEach((p: Project) => {
          if (p && p.id) projectMap.set(p.id, p);
        });
      }
      if (Array.isArray(parsed.creativePortfolio)) {
        parsed.creativePortfolio.forEach((c: CreativeItem) => {
          if (c && c.id) creativeMap.set(c.id, c);
        });
      }
      if (Array.isArray(parsed.gallery)) {
        parsed.gallery.forEach((g: GalleryItem) => {
          if (g && g.id) galleryMap.set(g.id, g);
        });
      }
      if (Array.isArray(parsed.journey)) {
        parsed.journey.forEach((j: JourneyItem) => {
          if (j && j.id) journeyMap.set(j.id, j);
        });
      }
      if (Array.isArray(parsed.resumes)) {
        parsed.resumes.forEach((r: ResumeOption) => {
          if (r && r.id) resumeMap.set(r.id, r);
        });
      }
      if (Array.isArray(parsed.blogs)) {
        parsed.blogs.forEach((b: BlogPost) => {
          if (b && b.id) blogMap.set(b.id, b);
        });
      }
    } catch (e) {
      console.warn('Error recovering from localStorage key:', key, e);
    }
  }

  return {
    ...initialCMSData,
    hero: { ...initialCMSData.hero, ...mergedHero },
    about: { ...initialCMSData.about, ...mergedAbout },
    contactInfo: { ...initialCMSData.contactInfo, ...mergedContactInfo },
    projects: projectMap.size > 0 ? Array.from(projectMap.values()) : initialCMSData.projects,
    creativePortfolio: creativeMap.size > 0 ? Array.from(creativeMap.values()) : initialCMSData.creativePortfolio,
    gallery: galleryMap.size > 0 ? Array.from(galleryMap.values()) : initialCMSData.gallery,
    journey: sanitizeJourney(journeyMap.size > 0 ? Array.from(journeyMap.values()) : initialCMSData.journey),
    resumes: resumeMap.size > 0 ? Array.from(resumeMap.values()) : initialCMSData.resumes,
    blogs: blogMap.size > 0 ? Array.from(blogMap.values()) : initialCMSData.blogs,
    messages: initialCMSData.messages || [],
  };
};

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CMSData>(() => {
    return loadAndRecoverCMSData();
  });

  const [isResumeModalOpen, setIsResumeModalOpenState] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const setIsResumeModalOpen = (open: boolean, resumeId?: string) => {
    setIsResumeModalOpenState(open);
    if (open && resumeId) {
      setActiveResumeId(resumeId);
    }
  };
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  // Initial Fetch from MongoDB Atlas with smart merging so custom user items are never overwritten with dummy data
  useEffect(() => {
    let isMounted = true;
    async function loadFromMongoDB() {
      try {
        const res = await fetch('/api/cms');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setDbConnected(json.database === 'MongoDB Atlas');
          if (json.data && typeof json.data === 'object' && isMounted) {
            const mongoData = json.data;

            setData((prev) => {
              // Smart merge array helper: prefer mongo array unless it's identical to default dummy data while prev has custom items
              const mergeArray = <T extends { id: string }>(mongoArr: T[] | undefined, prevArr: T[], defaultArr: T[]): T[] => {
                if (Array.isArray(mongoArr) && mongoArr.length > 0) {
                  const isDefault =
                    mongoArr.length === defaultArr.length &&
                    mongoArr.every((m, idx) => m.id === defaultArr[idx]?.id);
                  const prevHasCustom = prevArr.some((p) => !defaultArr.some((d) => d.id === p.id));
                  if (isDefault && prevHasCustom) {
                    return prevArr; // preserve user's custom created items!
                  }
                  return mongoArr;
                }
                return prevArr.length > 0 ? prevArr : defaultArr;
              };

              return {
                ...prev,
                ...mongoData,
                hero: { ...prev.hero, ...(mongoData.hero || {}) },
                about: {
                  ...prev.about,
                  ...(mongoData.about || {}),
                  avatarUrl: isValidAvatarUrl(mongoData.about?.avatarUrl)
                    ? mongoData.about!.avatarUrl
                    : isValidAvatarUrl(prev.about?.avatarUrl)
                    ? prev.about!.avatarUrl
                    : initialCMSData.about.avatarUrl,
                },
                contactInfo: { ...prev.contactInfo, ...(mongoData.contactInfo || {}) },
                projects: mergeArray(mongoData.projects, prev.projects, initialCMSData.projects),
                creativePortfolio: mergeArray(mongoData.creativePortfolio, prev.creativePortfolio, initialCMSData.creativePortfolio),
                gallery: mergeArray(mongoData.gallery, prev.gallery, initialCMSData.gallery),
                journey: sanitizeJourney(mergeArray(mongoData.journey, prev.journey, initialCMSData.journey)),
                resumes: mergeArray(mongoData.resumes, prev.resumes, initialCMSData.resumes),
                blogs: mergeArray(mongoData.blogs, prev.blogs, initialCMSData.blogs),
                messages: mongoData.messages || prev.messages || initialCMSData.messages,
              };
            });
          }
        }
      } catch (e) {
        console.warn('MongoDB API not responding yet or in offline mode:', e);
      } finally {
        if (isMounted) setIsInitialLoaded(true);
      }
    }
    loadFromMongoDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safely save to LocalStorage with automatic quota error handling
  const saveToLocalStorage = (dataToSave: CMSData) => {
    try {
      const cleanData = sanitizeForLocalStorage(dataToSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  };

  // Sync to LocalStorage AND MongoDB Atlas on data changes
  useEffect(() => {
    saveToLocalStorage(data);

    // Auto sync to MongoDB Atlas
    if (isInitialLoaded) {
      const timer = setTimeout(() => {
        fetch('/api/cms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
          .then((res) => res.json())
          .then((json) => {
            if (json.success) setDbConnected(true);
          })
          .catch((err) => console.warn('Sync to MongoDB Atlas error:', err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, isInitialLoaded]);

  const forceSyncToMongoDB = async (): Promise<{ success: boolean; message: string; database?: string }> => {
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setDbConnected(json.database === 'MongoDB Atlas' || dbConnected);
        sendTelegramConsoleLog(
          'CMS Content Saved & Synced',
          `Portfolio content updated by Admin.\nTarget DB: ${json.database || 'MongoDB Atlas'}\nTotal Projects: ${data.projects?.length || 0}\nTotal Messages: ${data.messages?.length || 0}`,
          'info'
        );
      }
      return {
        success: !!json.success,
        message: json.message || 'Data saved and synced with MongoDB Atlas',
        database: json.database || (dbConnected ? 'MongoDB Atlas' : 'Server Memory'),
      };
    } catch (err: any) {
      console.error('Failed to sync to MongoDB Atlas:', err);
      return {
        success: false,
        message: err?.message || 'Failed to sync to MongoDB Atlas',
        database: 'Offline Fallback',
      };
    }
  };

  const updateHero = (hero: HeroData) => setData((prev) => ({ ...prev, hero }));
  const updateAbout = (about: AboutData) => setData((prev) => ({ ...prev, about }));
  const updateSkills = (skills: SkillCategory[]) => setData((prev) => ({ ...prev, skills }));

  const updateProjects = (projects: Project[]) => setData((prev) => ({ ...prev, projects }));
  const addProject = (project: any) => {
    const firstImg = project.thumbnail || project.image || (project.images && project.images[0]) || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000';
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      title: project.title || 'Untitled Project',
      summary: project.summary || project.description || '',
      description: project.description || project.summary || '',
      longDescription: project.longDescription || project.description || project.summary || '',
      category: project.category || 'Full-Stack',
      tags: project.tags || [],
      technologies: project.technologies || project.tags || [],
      thumbnail: firstImg,
      image: firstImg,
      images: project.images && project.images.length > 0 ? project.images : [firstImg],
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      featured: project.featured ?? true,
      status: project.status || 'Completed',
      year: project.year || '2026',
    };
    setData((prev) => ({ ...prev, projects: [newProj, ...(prev.projects || [])] }));
  };
  const updateProject = (project: Project) => {
    setData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => (p.id === project.id ? project : p)),
    }));
  };
  const deleteProject = (id: string) => {
    setData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((p) => p.id !== id),
    }));
  };
  const reorderProjectItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.projects || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, projects: items };
    });
  };
  const moveProjectItem = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const items = [...(prev.projects || [])];
      if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return prev;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, projects: items };
    });
  };
  const swapProjectItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.projects || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      return { ...prev, projects: items };
    });
  };

  const updateCreativePortfolio = (creativePortfolio: CreativeItem[]) =>
    setData((prev) => ({ ...prev, creativePortfolio }));
  const addCreativeItem = (item: any) => {
    const firstImg = item.thumbnail || item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000';
    const newItem: CreativeItem = {
      id: 'cr-' + Date.now(),
      title: item.title || 'Untitled Creative',
      category: item.category || 'Poster Design',
      shortDescription: item.shortDescription || item.description || '',
      detailedDescription: item.detailedDescription || item.shortDescription || item.description || '',
      softwareUsed: item.softwareUsed || ['Canva'],
      tags: item.tags || ['Design'],
      thumbnail: firstImg,
      images: item.images && item.images.length > 0 ? item.images : [firstImg],
      videoUrl: item.videoUrl || '',
      platformUrl: item.platformUrl || '',
      completionDate: item.completionDate || item.date || '2026',
      featured: item.featured ?? true,
      status: item.status || 'Published',
    };
    setData((prev) => ({
      ...prev,
      creativePortfolio: [newItem, ...(prev.creativePortfolio || [])],
    }));
  };
  const updateCreativeItem = (item: CreativeItem) => {
    setData((prev) => ({
      ...prev,
      creativePortfolio: (prev.creativePortfolio || []).map((c) => (c.id === item.id ? item : c)),
    }));
  };
  const deleteCreativeItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      creativePortfolio: (prev.creativePortfolio || []).filter((c) => c.id !== id),
    }));
  };
  const reorderCreativeItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.creativePortfolio || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, creativePortfolio: items };
    });
  };
  const moveCreativeItem = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const items = [...(prev.creativePortfolio || [])];
      if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return prev;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, creativePortfolio: items };
    });
  };
  const swapCreativeItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.creativePortfolio || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      return { ...prev, creativePortfolio: items };
    });
  };

  const updateJourney = (journey: JourneyItem[]) => setData((prev) => ({ ...prev, journey }));
  const addJourneyItem = (item: any) => {
    const newItem: JourneyItem = {
      id: 'j-' + Date.now(),
      year: item.year || '2026',
      title: item.title || 'New Milestone',
      organization: item.organization || '',
      role: item.role || '',
      category: item.category || item.primaryTag || (item.tags && item.tags[0]) || 'College',
      description: item.description || '',
      detailedDescription: item.detailedDescription || item.description || '',
      tags: item.tags || [],
      images: item.images || [],
      image: item.image || '',
    };
    setData((prev) => ({
      ...prev,
      journey: [...(prev.journey || []), newItem],
    }));
  };
  const updateJourneyItem = (item: JourneyItem) => {
    setData((prev) => ({
      ...prev,
      journey: (prev.journey || []).map((j) => (j.id === item.id ? item : j)),
    }));
  };
  const deleteJourneyItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      journey: (prev.journey || []).filter((j) => j.id !== id),
    }));
  };
  const reorderJourneyItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.journey || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, journey: items };
    });
  };
  const moveJourneyItem = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const items = [...(prev.journey || [])];
      if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return prev;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, journey: items };
    });
  };
  const swapJourneyItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.journey || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      return { ...prev, journey: items };
    });
  };

  const updateGallery = (gallery: GalleryItem[]) => setData((prev) => ({ ...prev, gallery }));
  const addGalleryItem = (item: any) => {
    const mainImg = item.image || item.thumbnail || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000';
    const newItem: GalleryItem = {
      id: 'g-' + Date.now(),
      title: item.title || 'New Certificate / Award',
      category: item.category || 'Certificates',
      image: mainImg,
      images: item.images && item.images.length > 0 ? item.images : [mainImg],
      description: item.description || item.summary || '',
      detailedDescription: item.detailedDescription || item.description || '',
      date: item.date || item.year || '2026',
      location: item.location || '',
      credentialUrl: item.credentialUrl || '',
      tags: item.tags || ['Certificate'],
      technologies: item.technologies || item.skills || [],
      featured: item.featured ?? true,
    };
    setData((prev) => ({
      ...prev,
      gallery: [newItem, ...(prev.gallery || [])],
    }));
  };
  const updateGalleryItem = (item: GalleryItem) => {
    setData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((g) => (g.id === item.id ? item : g)),
    }));
  };
  const deleteGalleryItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((g) => g.id !== id),
    }));
  };
  const reorderGalleryItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.gallery || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, gallery: items };
    });
  };
  const moveGalleryItem = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const items = [...(prev.gallery || [])];
      if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return prev;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, gallery: items };
    });
  };
  const swapGalleryItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.gallery || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      return { ...prev, gallery: items };
    });
  };

  const updateBlogs = (blogs: BlogPost[]) => setData((prev) => ({ ...prev, blogs }));
  const addBlogPost = (post: any) => {
    const newPost: BlogPost = {
      id: 'blog-' + Date.now(),
      title: post.title || 'New Article',
      slug: post.slug || (post.title || 'article').toLowerCase().replace(/\s+/g, '-'),
      snippet: post.snippet || '',
      content: post.content || '',
      date: post.date || 'July 2026',
      readTime: post.readTime || '5 min read',
      category: post.category || 'Tech',
      tags: post.tags || ['Article'],
      coverImage: post.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      status: post.status || 'Published',
    };
    setData((prev) => ({
      ...prev,
      blogs: [newPost, ...(prev.blogs || [])],
    }));
  };
  const updateBlogPost = (post: BlogPost) => {
    setData((prev) => ({
      ...prev,
      blogs: (prev.blogs || []).map((b) => (b.id === post.id ? post : b)),
    }));
  };
  const deleteBlogPost = (id: string) => {
    setData((prev) => ({
      ...prev,
      blogs: (prev.blogs || []).filter((b) => b.id !== id),
    }));
  };

  const updateResumes = (resumes: ResumeOption[]) => setData((prev) => ({ ...prev, resumes }));
  const addResume = (item: Partial<ResumeOption>) => {
    const title = item.title || 'Untitled Resume';
    const id = item.id || 'res-' + Date.now();
    const filename = item.filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_Resume.pdf`;
    const newResume: ResumeOption = {
      id,
      title,
      filename,
      summary: item.summary || '',
      pdfUrl: item.pdfUrl || '',
      skills: item.skills || [],
      sections: item.sections || [
        {
          title: 'Document Overview',
          items: [
            {
              heading: title,
              details: [item.summary || 'Resume document details.'],
            },
          ],
        },
      ],
    };
    setData((prev) => ({
      ...prev,
      resumes: [...(prev.resumes || []), newResume],
    }));
  };
  const updateResumeItem = (item: ResumeOption) => {
    setData((prev) => ({
      ...prev,
      resumes: (prev.resumes || []).map((r) => (r.id === item.id ? item : r)),
    }));
  };
  const deleteResumeItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      resumes: (prev.resumes || []).filter((r) => r.id !== id),
    }));
  };
  const reorderResumeItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.resumes || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      return { ...prev, resumes: items };
    });
  };
  const moveResumeItem = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const items = [...(prev.resumes || [])];
      if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return prev;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, resumes: items };
    });
  };
  const swapResumeItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.resumes || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      return { ...prev, resumes: items };
    });
  };
  const updateContactInfo = (contactInfo: ContactInfo) => setData((prev) => ({ ...prev, contactInfo }));

  const addMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'time' | 'status'>) => {
    const now = new Date();
    const newMsg: ContactMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      status: 'unread',
    };
    setData((prev) => ({
      ...prev,
      messages: [newMsg, ...(prev.messages || [])],
    }));

    // Dispatch Telegram Inbox Notification & Console Log
    sendTelegramInboxMessage({
      name: msg.name,
      email: msg.email,
      subject: msg.subject || 'General Inquiry',
      message: msg.message,
    });
    sendTelegramConsoleLog(
      'New Inbox Message Received',
      `Sender: ${msg.name} <${msg.email}>\nSubject: ${msg.subject || 'N/A'}\nMessage: ${msg.message}`,
      'success'
    );
  };

  const markMessageStatus = (id: string, status: 'unread' | 'read' | 'archived') => {
    setData((prev) => ({
      ...prev,
      messages: (prev.messages || []).map((m) => (m.id === id ? { ...m, status } : m)),
    }));
  };

  const markMessageRead = (id: string) => {
    markMessageStatus(id, 'read');
  };

  const deleteMessage = (id: string) => {
    setData((prev) => ({
      ...prev,
      messages: (prev.messages || []).filter((m) => m.id !== id),
    }));
  };

  const resetToDefaults = () => {
    setData(initialCMSData);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Safe data object with contactMessages alias and safe arrays
  const safeData = {
    ...data,
    projects: data.projects || [],
    creativePortfolio: data.creativePortfolio || [],
    journey: data.journey || [],
    gallery: data.gallery || [],
    blogs: data.blogs || [],
    resumes: data.resumes || [],
    messages: data.messages || [],
    contactMessages: data.messages || [],
  };

  return (
    <CMSContext.Provider
      value={{
        data: safeData,
        updateHero,
        updateAbout,
        updateSkills,
        updateProjects,
        addProject,
        updateProject,
        deleteProject,
        reorderProjectItem,
        moveProjectItem,
        swapProjectItems,
        updateCreativePortfolio,
        addCreativeItem,
        updateCreativeItem,
        deleteCreativeItem,
        reorderCreativeItem,
        moveCreativeItem,
        swapCreativeItems,
        updateJourney,
        addJourneyItem,
        updateJourneyItem,
        deleteJourneyItem,
        reorderJourneyItem,
        moveJourneyItem,
        swapJourneyItems,
        updateGallery,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        reorderGalleryItem,
        moveGalleryItem,
        swapGalleryItems,
        updateBlogs,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        updateResumes,
        addResume,
        updateResumeItem,
        deleteResumeItem,
        reorderResumeItem,
        moveResumeItem,
        swapResumeItems,
        updateContactInfo,
        addMessage,
        addContactMessage: addMessage,
        markMessageStatus,
        markMessageRead,
        deleteMessage,
        resetToDefaults,
        isResumeModalOpen,
        activeResumeId,
        setIsResumeModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        dbConnected,
        forceSyncToMongoDB,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
