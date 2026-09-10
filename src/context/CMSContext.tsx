import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  IntroData,
} from '../types';
import { initialCMSData } from '../data';
import { sendTelegramConsoleLog } from '../utils/telegram';

interface CMSContextType {
  data: CMSData & { contactMessages: ContactMessage[] };
  isLoading: boolean;
  dbConnected: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  login: (password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;

  updateHero: (hero: HeroData) => void;
  updateIntro: (intro: IntroData) => void;
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
  updateData: (newData: any) => void;
  isResumeModalOpen: boolean;
  activeResumeId: string | null;
  setIsResumeModalOpen: (open: boolean, resumeId?: string) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  forceSyncToMongoDB: () => Promise<{ success: boolean; message: string; database?: string }>;

  // Static Backup Methods
  loadStaticBackup: (silent?: boolean) => Promise<{ success: boolean; message: string; data?: any }>;
  saveAsStaticBackup: (filename?: string) => Promise<{ success: boolean; message: string }>;
  selectStaticBackup: (filenameOrId: string) => Promise<{ success: boolean; message: string; data?: any }>;
  staticBackupStats: any;
  staticBackupFiles: any[];
  refreshStaticBackupInfo: () => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sathwik_portfolio_auth_token';
const CMS_CACHE_KEY = 'sathwik_portfolio_cms_cache_v9';

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

const isStaleCMSData = (d: any): boolean => {
  if (!d) return true;
  const str = JSON.stringify(d);
  return (
    str.includes('images.unsplash.com') ||
    str.includes('photo-1539571696357') ||
    str.includes('static_asset_about_avatarUrl')
  );
};

// Native Promise-based IndexedDB caching (zero quota limits, fast reload persistence)
const IDB_DB_NAME = 'sathwik_portfolio_cms_idb';
const IDB_STORE_NAME = 'cms_data_store';
const IDB_KEY = 'authoritative_cms_data';

function openCMSDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedCMSFromIDB(): Promise<CMSData | null> {
  try {
    const db = await openCMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function setCachedCMSToIDB(cmsData: CMSData): Promise<void> {
  try {
    const db = await openCMSDB();
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    store.put(cmsData, IDB_KEY);
  } catch (e) {
    console.warn('[CMS IDB Cache Error]:', e);
  }
}

// Helper to load cached CMS data instantly (0ms latency, zero flash)
function getInitialCachedCMSData(): CMSData {
  try {
    const cached = localStorage.getItem(CMS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && parsed.hero && Array.isArray(parsed.projects)) {
        if (isStaleCMSData(parsed)) {
          localStorage.removeItem(CMS_CACHE_KEY);
          return initialCMSData;
        }
        return {
          hero: { ...initialCMSData.hero, ...(parsed.hero || {}) },
          about: {
            ...initialCMSData.about,
            ...(parsed.about || {}),
            avatarUrl: isValidAvatarUrl(parsed.about?.avatarUrl)
              ? parsed.about.avatarUrl
              : initialCMSData.about.avatarUrl,
          },
          skills:
            Array.isArray(parsed.skills) && parsed.skills.length >= initialCMSData.skills.length
              ? parsed.skills
              : initialCMSData.skills,
          projects:
            Array.isArray(parsed.projects) && parsed.projects.length >= initialCMSData.projects.length
              ? parsed.projects
              : initialCMSData.projects,
          creativePortfolio:
            Array.isArray(parsed.creativePortfolio) && parsed.creativePortfolio.length >= initialCMSData.creativePortfolio.length
              ? parsed.creativePortfolio
              : initialCMSData.creativePortfolio,
          gallery:
            Array.isArray(parsed.gallery) && parsed.gallery.length >= initialCMSData.gallery.length
              ? parsed.gallery
              : initialCMSData.gallery,
          journey: sanitizeJourney(
            Array.isArray(parsed.journey) && parsed.journey.length >= initialCMSData.journey.length
              ? parsed.journey
              : initialCMSData.journey
          ),
          resumes:
            Array.isArray(parsed.resumes) && parsed.resumes.length >= initialCMSData.resumes.length
              ? parsed.resumes
              : initialCMSData.resumes,
          blogs:
            Array.isArray(parsed.blogs) && parsed.blogs.length >= initialCMSData.blogs.length
              ? parsed.blogs
              : initialCMSData.blogs,
          contactInfo: { ...initialCMSData.contactInfo, ...(parsed.contactInfo || {}) },
          intro: { ...initialCMSData.intro, ...(parsed.intro || {}), enabled: parsed.intro?.enabled !== false },
          messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        };
      }
    }
  } catch (e) {}
  return initialCMSData;
}

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CMSData>(getInitialCachedCMSData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(true);

  // Fast-path IndexedDB check on mount (loads in <10ms)
  useEffect(() => {
    getCachedCMSFromIDB()
      .then((cached) => {
        if (cached && isStaleCMSData(cached)) {
          setCachedCMSToIDB(initialCMSData);
          setData(initialCMSData);
          return;
        }
        if (cached && cached.hero && Array.isArray(cached.projects) && cached.projects.length >= initialCMSData.projects.length) {
          setData((prev) => {
            if (prev.projects && prev.projects.length >= initialCMSData.projects.length) return prev;
            return formatCMSPayload(cached);
          });
        }
      })
      .catch(() => {});
  }, []);

  // Helper to persist to IndexedDB and localStorage whenever data changes
  useEffect(() => {
    try {
      if (data && data.hero) {
        setCachedCMSToIDB(data);
        try {
          localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(data));
        } catch (storageErr) {
          // localStorage has 5MB quota; IndexedDB handles large backups
        }
      }
    } catch (e) {}
  }, [data]);

  // Authentication State: Strictly locked on every page reload
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Modals state
  const [isResumeModalOpen, setIsResumeModalOpenState] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const setIsResumeModalOpen = (open: boolean, resumeId?: string) => {
    setIsResumeModalOpenState(open);
    if (open && resumeId) {
      setActiveResumeId(resumeId);
    }
  };

  // Login handler
  const login = async (password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();

      if (json.success && json.token) {
        setAuthToken(json.token);
        setIsAuthenticated(true);
        return { success: true, message: 'Admin authentication successful' };
      } else {
        return {
          success: false,
          message: json.error?.message || 'Incorrect Password. Please try again.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Server connection error during login.',
      };
    }
  };

  // Logout handler
  const logout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  // Static Backup State
  const [staticBackupStats, setStaticBackupStats] = useState<any>(null);
  const [staticBackupFiles, setStaticBackupFiles] = useState<any[]>([]);

  const formatCMSPayload = (rawData: any): CMSData => {
    return {
      hero: { ...initialCMSData.hero, ...(rawData.hero || {}) },
      about: {
        ...initialCMSData.about,
        ...(rawData.about || {}),
        avatarUrl: isValidAvatarUrl(rawData.about?.avatarUrl)
          ? rawData.about.avatarUrl
          : initialCMSData.about.avatarUrl,
      },
      skills:
        Array.isArray(rawData.skills) && rawData.skills.length >= initialCMSData.skills.length
          ? rawData.skills
          : initialCMSData.skills,
      projects:
        Array.isArray(rawData.projects) && rawData.projects.length >= initialCMSData.projects.length
          ? rawData.projects
          : initialCMSData.projects,
      creativePortfolio:
        Array.isArray(rawData.creativePortfolio) && rawData.creativePortfolio.length >= initialCMSData.creativePortfolio.length
          ? rawData.creativePortfolio
          : initialCMSData.creativePortfolio,
      gallery:
        Array.isArray(rawData.gallery) && rawData.gallery.length >= initialCMSData.gallery.length
          ? rawData.gallery
          : initialCMSData.gallery,
      journey: sanitizeJourney(
        Array.isArray(rawData.journey) && rawData.journey.length >= initialCMSData.journey.length
          ? rawData.journey
          : initialCMSData.journey
      ),
      resumes:
        Array.isArray(rawData.resumes) && rawData.resumes.length >= initialCMSData.resumes.length
          ? rawData.resumes
          : initialCMSData.resumes,
      blogs:
        Array.isArray(rawData.blogs) && rawData.blogs.length >= initialCMSData.blogs.length
          ? rawData.blogs
          : initialCMSData.blogs,
      contactInfo: { ...initialCMSData.contactInfo, ...(rawData.contactInfo || {}) },
      intro: { ...initialCMSData.intro, ...(rawData.intro || {}), enabled: rawData.intro?.enabled !== false },
      messages: Array.isArray(rawData.messages) ? rawData.messages : [],
    };
  };

  const refreshStaticBackupInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/static-backup');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStaticBackupStats({
            filename: json.filename,
            sizeFormatted: json.sizeFormatted,
            lastModified: json.lastModified,
            recordCounts: json.recordCounts,
          });
          if (json.availableFiles) {
            setStaticBackupFiles(json.availableFiles);
          }
        }
      }
    } catch (e) {
      console.warn('[CMSContext] Failed to fetch static backup info:', e);
    }
  }, []);

  // 1. Initial Fetch from Static Backup / MongoDB (Runs on every page load & reload)
  const fetchFromMongoDB = useCallback(async () => {
    setIsLoading(true);
    try {
      // Tier 1: Try authoritative Static Backup API
      let staticRes: Response | null = null;
      try {
        staticRes = await fetch('/api/cms/static-backup');
      } catch (e) {}

      // Tier 2: Fallback to direct static JSON file if API fails
      if (!staticRes || !staticRes.ok) {
        try {
          staticRes = await fetch('/static_backup.json');
        } catch (e) {}
      }

      if (staticRes && staticRes.ok) {
        const staticJson = await staticRes.json();
        const payloadData = staticJson.data || staticJson;
        if (payloadData && typeof payloadData === 'object' && payloadData.hero && !isStaleCMSData(payloadData)) {
          const formatted = formatCMSPayload(payloadData);
          setData(formatted);
          setDbConnected(true);
          await setCachedCMSToIDB(formatted);
          try {
            localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(formatted));
          } catch (e) {}

          setStaticBackupStats({
            filename: staticJson.filename || 'static_backup.json',
            sizeFormatted: staticJson.sizeFormatted || '12.1 MB',
            lastModified: staticJson.lastModified || new Date().toISOString(),
            recordCounts: staticJson.recordCounts || {
              projects: formatted.projects.length,
              journey: formatted.journey.length,
              certificates: formatted.gallery.length,
              creative: formatted.creativePortfolio.length,
              resumes: formatted.resumes.length,
              messages: formatted.messages.length,
            },
          });
          if (staticJson.availableFiles) {
            setStaticBackupFiles(staticJson.availableFiles);
          }
          setIsLoading(false);
          setIsInitialLoaded(true);
          return;
        }
      }

      // Tier 3: Fallback to standard /api/cms
      const res = await fetch('/api/cms');
      if (res.ok) {
        const json = await res.json();
        setDbConnected(!!json.data);
        if (json.data && typeof json.data === 'object' && !isStaleCMSData(json.data)) {
          const formatted = formatCMSPayload(json.data);
          setData(formatted);
          await setCachedCMSToIDB(formatted);
        } else {
          setData(initialCMSData);
          await setCachedCMSToIDB(initialCMSData);
        }
      }
    } catch (e) {
      console.warn('[CMSContext] Static Backup / MongoDB API connection:', e);
      setDbConnected(false);
    } finally {
      setIsLoading(false);
      setIsInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchFromMongoDB();
    refreshStaticBackupInfo();
  }, [fetchFromMongoDB, refreshStaticBackupInfo]);

  // Load Static Backup explicitly (e.g. on Logo click or button click)
  const loadStaticBackup = async (silent: boolean = false): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      let res: Response | null = null;
      try {
        res = await fetch('/api/cms/static-backup');
      } catch (e) {}

      if (!res || !res.ok) {
        try {
          res = await fetch('/static_backup.json');
        } catch (e) {}
      }

      if (res && res.ok) {
        const json = await res.json();
        const payloadData = json.data || json;
        if (payloadData && typeof payloadData === 'object' && payloadData.hero) {
          const formatted = formatCMSPayload(payloadData);
          setData(formatted);
          await setCachedCMSToIDB(formatted);
          try {
            localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(formatted));
          } catch (e) {}

          if (!silent) {
            sendTelegramConsoleLog(
              'Static Backup Loaded',
              'Static backup state loaded into portfolio via user trigger / logo click.',
              'info'
            );
          }

          return {
            success: true,
            message: 'Static backup successfully loaded and applied',
            data: formatted,
          };
        }
      }
      return { success: false, message: 'Could not fetch static backup from server' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error loading static backup' };
    }
  };

  // Save current portfolio as Static Backup
  const saveAsStaticBackup = async (filename?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/cms/static-backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data, filename }),
      });
      const json = await res.json();
      if (json.success) {
        await setCachedCMSToIDB(data);
        refreshStaticBackupInfo();
        return { success: true, message: json.message || 'Static backup saved successfully!' };
      }
      return { success: false, message: json.error?.message || 'Failed to save static backup' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error saving static backup' };
    }
  };

  // Select a static backup from available dropdown
  const selectStaticBackup = async (filenameOrId: string): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/cms/static-backup/select', {
        method: 'POST',
        headers,
        body: JSON.stringify({ filename: filenameOrId, id: filenameOrId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const formatted = formatCMSPayload(json.data);
        setData(formatted);
        await setCachedCMSToIDB(formatted);
        try {
          localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(formatted));
        } catch (e) {}
        refreshStaticBackupInfo();
        return { success: true, message: json.message || 'Switched static backup', data: formatted };
      }
      return { success: false, message: json.error?.message || 'Failed to switch static backup' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error selecting static backup' };
    }
  };

  // 2. Auto-sync to MongoDB Atlas when authenticated admin makes edits
  useEffect(() => {
    if (!isInitialLoaded || !isAuthenticated || !authToken) return;

    const timer = setTimeout(() => {
      fetch('/api/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setDbConnected(true);
          }
        })
        .catch((err) => {
          console.warn('[CMS Auto-Sync Error]:', err);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [data, isInitialLoaded, isAuthenticated, authToken]);

  // Force manual sync to MongoDB
  const forceSyncToMongoDB = async (): Promise<{ success: boolean; message: string; database?: string }> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/cms', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (json.success) {
        setDbConnected(true);
        sendTelegramConsoleLog(
          'CMS Content Saved',
          `Portfolio content updated by Admin.\nTotal Projects: ${data.projects?.length || 0}\nTotal Messages: ${data.messages?.length || 0}`,
          'info'
        );
        return {
          success: true,
          message: 'Data saved successfully to portfolio storage',
          database: 'Portfolio Storage',
        };
      } else {
        return {
          success: false,
          message: json.error?.message || 'Failed to save portfolio data',
          database: 'Storage Error',
        };
      }
    } catch (err: any) {
      console.error('Failed to save portfolio data:', err);
      return {
        success: false,
        message: err?.message || 'Network error while saving portfolio data',
        database: 'Offline',
      };
    }
  };

  // Section update handlers
  const updateHero = (hero: HeroData) => setData((prev) => ({ ...prev, hero }));
  const updateAbout = (about: AboutData) => setData((prev) => ({ ...prev, about }));
  const updateSkills = (skills: SkillCategory[]) => setData((prev) => ({ ...prev, skills }));

  // Projects
  const updateProjects = (projects: Project[]) => setData((prev) => ({ ...prev, projects }));
  const addProject = (project: any) => {
    const firstImg =
      project.thumbnail ||
      project.image ||
      (project.images && project.images[0]) ||
      '/uploads/assets/static_projects_0_thumbnail_ae4790213b.png';
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
      if (
        fromIndex < 0 ||
        fromIndex >= items.length ||
        toIndex < 0 ||
        toIndex >= items.length ||
        fromIndex === toIndex
      )
        return prev;
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

  // Creative Portfolio
  const updateCreativePortfolio = (items: CreativeItem[]) =>
    setData((prev) => ({ ...prev, creativePortfolio: items }));
  const addCreativeItem = (item: any) => {
    const firstImg =
      item.thumbnail ||
      item.image ||
      (item.images && item.images[0]) ||
      '/uploads/assets/static_creativePortfolio_0_thu_9ebbff8284.jpg';
    const newItem: CreativeItem = {
      id: 'cr-' + Date.now(),
      title: item.title || 'Untitled Work',
      category: item.category || 'UI/UX',
      thumbnail: firstImg,
      images: item.images && item.images.length > 0 ? item.images : [firstImg],
      shortDescription: item.shortDescription || item.description || '',
      detailedDescription: item.detailedDescription || item.description || '',
      softwareUsed: item.softwareUsed || ['Figma'],
      tags: item.tags || [],
      completionDate: item.completionDate || item.year || '2026',
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
      if (
        fromIndex < 0 ||
        fromIndex >= items.length ||
        toIndex < 0 ||
        toIndex >= items.length ||
        fromIndex === toIndex
      )
        return prev;
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

  // Journey
  const updateJourney = (journey: JourneyItem[]) =>
    setData((prev) => ({ ...prev, journey: sanitizeJourney(journey) }));
  const addJourneyItem = (item: any) => {
    const firstImg =
      item.image ||
      (item.images && item.images[0]) ||
      '/uploads/assets/static_journey_0_image_e4ecfb2a63.jpg';
    const newItem: JourneyItem = {
      id: 'jour-' + Date.now(),
      year: item.year || '2026',
      title: item.title || 'Milestone',
      organization: item.organization || 'MVSR Engineering College',
      role: item.role || 'Member',
      category: item.category || 'Achievement',
      description: item.description || '',
      detailedDescription: item.detailedDescription || item.description || '',
      image: firstImg,
      images: item.images && item.images.length > 0 ? item.images : [firstImg],
      tags: item.tags || [item.category || 'Achievement'],
    };
    setData((prev) => ({
      ...prev,
      journey: sanitizeJourney([newItem, ...(prev.journey || [])]),
    }));
  };
  const updateJourneyItem = (item: JourneyItem) => {
    setData((prev) => ({
      ...prev,
      journey: sanitizeJourney((prev.journey || []).map((j) => (j.id === item.id ? item : j))),
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
      if (
        fromIndex < 0 ||
        fromIndex >= items.length ||
        toIndex < 0 ||
        toIndex >= items.length ||
        fromIndex === toIndex
      )
        return prev;
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

  // Gallery / Certificates
  const updateGallery = (gallery: GalleryItem[]) => setData((prev) => ({ ...prev, gallery }));
  const addGalleryItem = (item: any) => {
    const firstImg =
      item.image ||
      (item.images && item.images[0]) ||
      '/uploads/assets/static_gallery_0_image_4e182a45cd.jpg';
    const newItem: GalleryItem = {
      id: 'gal-' + Date.now(),
      title: item.title || 'Certificate / Award',
      category: item.category || 'Certificates',
      description: item.description || '',
      detailedDescription: item.detailedDescription || item.description || '',
      image: firstImg,
      images: item.images && item.images.length > 0 ? item.images : [firstImg],
      date: item.date || '2026',
      location: item.location || 'Online',
      credentialUrl: item.credentialUrl || '',
      featured: item.featured ?? true,
      tags: item.tags || [item.category || 'Certificates'],
      technologies: item.technologies || [],
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
      if (
        fromIndex < 0 ||
        fromIndex >= items.length ||
        toIndex < 0 ||
        toIndex >= items.length ||
        fromIndex === toIndex
      )
        return prev;
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

  // Blogs
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
      coverImage:
        post.coverImage ||
        '/uploads/assets/static_creativePortfolio_1_ima_3b559722e8.jpg',
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

  // Resumes
  const updateResumes = (resumes: ResumeOption[]) => setData((prev) => ({ ...prev, resumes }));
  const addResume = (item: Partial<ResumeOption>) => {
    const title = item.title || 'Untitled Resume';
    const id = item.id || 'res-' + Date.now();
    const filename =
      item.filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_Resume.pdf`;
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
      if (
        fromIndex < 0 ||
        fromIndex >= items.length ||
        toIndex < 0 ||
        toIndex >= items.length ||
        fromIndex === toIndex
      )
        return prev;
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

  // Intro Loading Animation Data
  const updateIntro = (intro: IntroData) => setData((prev) => ({ ...prev, intro }));

  // Contact Info
  const updateContactInfo = (contactInfo: ContactInfo) =>
    setData((prev) => ({ ...prev, contactInfo }));

  // Contact Messages
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

    // Post to backend API (which automatically dispatches Telegram alerts & persists to DB)
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    }).catch((err) => console.warn('Failed to send contact message to API:', err));
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
    try {
      localStorage.removeItem(CMS_CACHE_KEY);
    } catch (e) {}
  };

  const updateData = (newData: any) => {
    if (newData && typeof newData === 'object') {
      setData((prev) => {
        const next = {
          ...prev,
          ...newData,
        };
        try {
          localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  };

  const safeData = {
    ...data,
    intro: data.intro || initialCMSData.intro,
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
        isLoading,
        dbConnected,
        isAuthenticated,
        authToken,
        login,
        logout,
        updateHero,
        updateIntro,
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
        updateData,
        isResumeModalOpen,
        activeResumeId,
        setIsResumeModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        forceSyncToMongoDB,
        loadStaticBackup,
        saveAsStaticBackup,
        selectStaticBackup,
        staticBackupStats,
        staticBackupFiles,
        refreshStaticBackupInfo,
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
