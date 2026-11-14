import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  EventItem,
  PressMention,
  ResumeOption,
  ContactInfo,
  ContactMessage,
  IntroData,
  BackupRulesConfig,
  PushRulesConfig,
  SequenceSectionData,
} from '../types';
import { initialCMSData } from '../data';
import { sendTelegramConsoleLog } from '../utils/telegram';
import {
  getProjectCardId,
  getItemCardId,
  formatCardId,
  generateCardIdNo,
  buildSequenceSection,
  reindexProjectsWithCardIds,
  reindexCreativeItemsWithCardIds,
  reindexGalleryItemsWithCardIds,
  DEFAULT_BACKUP_RULES,
  DEFAULT_PUSH_RULES,
} from '../utils/card-id';
import { auth, db, googleProvider, isAuthorizedAdmin } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { pushToGitHubClientDirect, safeFetchJson } from '../lib/github-client';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CMSContextType {
  data: CMSData & { contactMessages: ContactMessage[] };
  isLoading: boolean;
  dbConnected: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentUser: { email?: string | null; displayName?: string | null; photoURL?: string | null; uid?: string } | null;
  authToken: string | null;
  login: (password?: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string; isAdmin?: boolean }>;
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
  reindexAllProjectCardIds: () => void;
  updateBackupRules: (rules: Partial<BackupRulesConfig>) => void;
  updatePushRules: (rules: Partial<PushRulesConfig>) => void;
  backupRules: BackupRulesConfig;
  pushRules: PushRulesConfig;
  projectsSequence: SequenceSectionData | null;

  updateCreativePortfolio: (items: CreativeItem[]) => void;
  addCreativeItem: (item: any) => void;
  updateCreativeItem: (item: CreativeItem) => void;
  deleteCreativeItem: (id: string) => void;
  reorderCreativeItem: (index: number, direction: 'up' | 'down') => void;
  moveCreativeItem: (fromIndex: number, toIndex: number) => void;
  swapCreativeItems: (index1: number, index2: number) => void;
  reindexAllCreativeCardIds: () => void;

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
  reindexAllGalleryCardIds: () => void;

  updateBlogs: (blogs: BlogPost[]) => void;
  addBlogPost: (post: any) => void;
  updateBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (id: string) => void;

  updateEvents: (events: EventItem[]) => void;
  addEventItem: (event: any) => void;
  updateEventItem: (event: EventItem) => void;
  deleteEventItem: (id: string) => void;

  updatePressMentions: (items: PressMention[]) => void;
  addPressMention: (item: any) => void;
  updatePressMention: (item: PressMention) => void;
  deletePressMention: (id: string) => void;

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

  // GitHub Live Synchronization Methods
  syncToGitHub: (
    commitMessage?: string,
    explicitToken?: string
  ) => Promise<{ success: boolean; message: string; commit?: string; error?: string }>;
  isGitSyncing: boolean;
  lastGitCommit: string | null;
  gitCardOrderPending: boolean;
  setGitCardOrderPending: (val: boolean) => void;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sathwik_portfolio_auth_token';
const CMS_CACHE_KEY = 'sathwik_portfolio_cms_cache_v10';

const LEGACY_SEEDED_PLACEHOLDER_IDS = new Set<string>([
  'blog-1',
  'blog-2',
  'blog-3',
  'event-hackfest-2026',
  'event-cyber-ekathon-2025',
  'event-nss-digital-drive-2026',
  'press-cultivating-art',
  'press-devsemble-profile',
  'press-edupodx-mock2pitch',
]);

const filterLegacySeedItems = <T extends { id?: string }>(items?: T[]): T[] =>
  Array.isArray(items) ? items.filter((item) => item && (!item.id || !LEGACY_SEEDED_PLACEHOLDER_IDS.has(item.id))) : [];

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
    str.includes('photo-1539571696357')
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
          blogs: filterLegacySeedItems(parsed.blogs),
          events: filterLegacySeedItems(parsed.events),
          pressMentions: filterLegacySeedItems(parsed.pressMentions),
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
          const cleaned = formatCMSPayload(cached);
          setData((prev) => {
            if (prev.projects && prev.projects.length >= initialCMSData.projects.length) {
              return {
                ...prev,
                blogs: filterLegacySeedItems(prev.blogs),
                events: filterLegacySeedItems(prev.events),
                pressMentions: filterLegacySeedItems(prev.pressMentions),
              };
            }
            return cleaned;
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

  // Authentication State with Firebase Google Auth & Admin Verification
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAuthorizedAdmin(auth.currentUser?.email));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(auth.currentUser));

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    } catch (e) {
      return null;
    }
  });

  const [firestoreMessages, setFirestoreMessages] = useState<ContactMessage[]>([]);

  // Track Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      const isUserAdmin = isAuthorizedAdmin(user?.email);
      setIsAdmin(isUserAdmin);
      setIsAuthenticated(Boolean(user));

      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          localStorage.setItem(AUTH_STORAGE_KEY, token);
        } catch (e) {}
      } else {
        setAuthToken(null);
        setFirestoreMessages([]);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for visitor contact messages (Super Admin only)
  useEffect(() => {
    if (!isAdmin || !firebaseUser) {
      return;
    }

    const path = 'contact_messages';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ContactMessage[] = snapshot.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: raw.id || d.id,
            name: String(raw.name || ''),
            email: String(raw.email || ''),
            subject: String(raw.subject || 'Portfolio Inquiry'),
            message: String(raw.message || ''),
            date: String(raw.date || ''),
            time: String(raw.time || ''),
            status: (raw.status as 'unread' | 'read' | 'archived') || 'unread',
          };
        });
        setFirestoreMessages(msgs);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (err) {
          console.warn('[Firestore Contact Messages Listener Warning]:', err);
        }
      }
    );

    return () => unsubscribe();
  }, [isAdmin, firebaseUser]);

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

  // Google Sign-In handler
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string; isAdmin?: boolean }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isUserAdmin = isAuthorizedAdmin(user.email);
      setIsAdmin(isUserAdmin);
      setIsAuthenticated(true);
      setFirebaseUser(user);

      const token = await user.getIdToken();
      setAuthToken(token);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, token);
      } catch (e) {}

      if (isUserAdmin) {
        return {
          success: true,
          message: `Welcome back, Dubbaka Sathwik! Admin access granted.`,
          isAdmin: true,
        };
      } else {
        return {
          success: true,
          message: `Signed in as ${user.email}. Unauthorized for CMS admin controls.`,
          isAdmin: false,
        };
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return {
        success: false,
        message: err?.message || 'Google Sign-In was cancelled or failed.',
        isAdmin: false,
      };
    }
  };

  // Compatibility login fallback
  const login = async (_password?: string): Promise<{ success: boolean; message: string }> => {
    const res = await loginWithGoogle();
    return {
      success: res.success && !!res.isAdmin,
      message: res.message,
    };
  };

  // Logout handler
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setFirebaseUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
    setAuthToken(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
  };

  // Static Backup State
  const [staticBackupStats, setStaticBackupStats] = useState<any>(null);
  const [staticBackupFiles, setStaticBackupFiles] = useState<any[]>([]);

  // Backup & Push Rules state
  const [backupRules, setBackupRules] = useState<BackupRulesConfig>(DEFAULT_BACKUP_RULES);
  const [pushRules, setPushRules] = useState<PushRulesConfig>(DEFAULT_PUSH_RULES);

  const updateBackupRules = (newRules: Partial<BackupRulesConfig>) => {
    setBackupRules((prev) => {
      const updated = { ...prev, ...newRules };
      setData((prevData) => {
        const nextSeq = buildSequenceSection(prevData.projects || [], updated, pushRules);
        const next = { ...prevData, projectsSequence: nextSeq };
        persistCMSDataInstantly(next);
        return next;
      });
      return updated;
    });
  };

  const updatePushRules = (newRules: Partial<PushRulesConfig>) => {
    setPushRules((prev) => {
      const updated = { ...prev, ...newRules };
      setData((prevData) => {
        const nextSeq = buildSequenceSection(prevData.projects || [], backupRules, updated);
        const next = { ...prevData, projectsSequence: nextSeq };
        persistCMSDataInstantly(next);
        return next;
      });
      return updated;
    });
  };

  const formatCMSPayload = (rawData: any): CMSData => {
    const rawProjects = Array.isArray(rawData.projects) && rawData.projects.length >= initialCMSData.projects.length
      ? rawData.projects
      : initialCMSData.projects;

    const formattedProjects: Project[] = rawProjects.map((p: any, idx: number) => ({
      ...p,
      cardIdNo: getProjectCardId(p, idx),
      sequenceNumber: typeof p.sequenceNumber === 'number' ? p.sequenceNumber : idx + 1,
    }));

    const rawCreative = Array.isArray(rawData.creativePortfolio) && rawData.creativePortfolio.length >= initialCMSData.creativePortfolio.length
      ? rawData.creativePortfolio
      : initialCMSData.creativePortfolio;

    const formattedCreative: CreativeItem[] = rawCreative.map((c: any, idx: number) => ({
      ...c,
      cardIdNo: getItemCardId(c, idx, 'creative'),
      sequenceNumber: typeof c.sequenceNumber === 'number' ? c.sequenceNumber : idx + 1,
    }));

    const rawGallery = Array.isArray(rawData.gallery) && rawData.gallery.length >= initialCMSData.gallery.length
      ? rawData.gallery
      : initialCMSData.gallery;

    const formattedGallery: GalleryItem[] = rawGallery.map((g: any, idx: number) => ({
      ...g,
      cardIdNo: getItemCardId(g, idx, 'cert'),
      sequenceNumber: typeof g.sequenceNumber === 'number' ? g.sequenceNumber : idx + 1,
    }));

    const sequenceSection = rawData.projectsSequence || buildSequenceSection(formattedProjects, backupRules, pushRules);

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
      projects: formattedProjects,
      projectsSequence: sequenceSection,
      creativePortfolio: formattedCreative,
      gallery: formattedGallery,
      journey: sanitizeJourney(
        Array.isArray(rawData.journey) && rawData.journey.length >= initialCMSData.journey.length
          ? rawData.journey
          : initialCMSData.journey
      ),
      resumes:
        Array.isArray(rawData.resumes) && rawData.resumes.length >= initialCMSData.resumes.length
          ? rawData.resumes
          : initialCMSData.resumes,
      blogs: filterLegacySeedItems(rawData.blogs),
      events: filterLegacySeedItems(rawData.events),
      pressMentions: filterLegacySeedItems(rawData.pressMentions),
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

          // Also merge any newer contact messages from live /api/cms (if backend server is active)
          try {
            const liveCmsRes = await fetch('/api/cms');
            const liveContentType = liveCmsRes.headers.get('content-type') || '';
            if (liveCmsRes.ok && liveContentType.includes('application/json')) {
              const liveJson = await liveCmsRes.json();
              const liveMsgs = Array.isArray(liveJson?.data?.messages) ? liveJson.data.messages : [];
              if (liveMsgs.length > 0) {
                const seen = new Set<string>();
                const merged: ContactMessage[] = [];
                for (const m of [...liveMsgs, ...(formatted.messages || [])]) {
                  if (m?.id && !seen.has(m.id)) {
                    seen.add(m.id);
                    merged.push(m);
                  }
                }
                formatted.messages = merged;
              }
            }
          } catch (e) {}

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

  // Instantly persist data to memory, IDB, localStorage, and backend disk/db
  const persistCMSDataInstantly = (newData: CMSData) => {
    setCachedCMSToIDB(newData).catch(() => {});
    try {
      localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(newData));
    } catch (e) {}

    const token =
      authToken ||
      (typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null);
    if (token) {
      fetch('/api/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newData),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setDbConnected(true);
          }
        })
        .catch((err) => {
          console.warn('[CMS Instant Persist Warning]:', err);
        });
    }
  };

  // GitHub Live Synchronization State
  const [isGitSyncing, setIsGitSyncing] = useState<boolean>(false);
  const [lastGitCommit, setLastGitCommit] = useState<string | null>(null);
  const [gitCardOrderPending, setGitCardOrderPending] = useState<boolean>(false);

  // Reusable Git Sync Function
  const syncToGitHub = async (
    commitMessage?: string,
    explicitToken?: string
  ): Promise<{ success: boolean; message: string; commit?: string; error?: string }> => {
    setIsGitSyncing(true);
    try {
      const token = (explicitToken || '').trim();
      if (!token) {
        setIsGitSyncing(false);
        return {
          success: false,
          message: 'GitHub Personal Access Token is required to push changes.',
          error: 'Token missing',
        };
      }

      const defaultMsg =
        commitMessage?.trim() ||
        `update: reorder technical projects & sync portfolio data (${new Date().toLocaleString('en-US')})`;

      // 1. Try server sync first
      const { ok, data: json } = await safeFetchJson('/api/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          token,
          message: defaultMsg,
          saveToken: false, // Never save token
          data,
        }),
      });

      if (ok && json && json.success) {
        setIsGitSyncing(false);
        setGitCardOrderPending(false);
        if (json.commit) {
          setLastGitCommit(json.commit);
        }
        refreshStaticBackupInfo();
        sendTelegramConsoleLog(
          'GitHub Sync Pushed',
          `Git commit ${json.commit || ''} pushed to GitHub repository:\n${defaultMsg}`,
          'success'
        );
        return {
          success: true,
          message: json.message || `Pushed commit ${json.commit} to GitHub!`,
          commit: json.commit,
        };
      }

      // 2. Client-side fallback via GitHub Git Data API (For Netlify / static hosts)
      const clientPush = await pushToGitHubClientDirect(token, defaultMsg, data);
      setIsGitSyncing(false);
      setGitCardOrderPending(false);
      setLastGitCommit(clientPush.commit);
      refreshStaticBackupInfo();

      sendTelegramConsoleLog(
        'GitHub Sync Pushed (Client API)',
        `Git commit ${clientPush.commit} pushed to GitHub repository via direct browser API:\n${defaultMsg}`,
        'success'
      );

      return {
        success: true,
        message: `Pushed commit ${clientPush.commit} to GitHub! Netlify will redeploy automatically.`,
        commit: clientPush.commit,
      };
    } catch (err: any) {
      setIsGitSyncing(false);
      console.error('[CMSContext] GitHub Sync Error:', err);
      return {
        success: false,
        message: err?.message || 'Network error while syncing with GitHub',
        error: err?.message,
      };
    }
  };

  // Section update handlers
  const updateHero = (hero: HeroData) => {
    setData((prev) => {
      const next = { ...prev, hero };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updateAbout = (about: AboutData) => {
    setData((prev) => {
      const next = { ...prev, about };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updateSkills = (skills: SkillCategory[]) => {
    setData((prev) => {
      const next = { ...prev, skills };
      persistCMSDataInstantly(next);
      return next;
    });
  };

  // Projects
  const updateProjects = (projects: Project[]) => {
    setData((prev) => {
      const next = { ...prev, projects };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
    });
  };
  const addProject = (project: any) => {
    const firstImg =
      project.thumbnail ||
      project.image ||
      (project.images && project.images[0]) ||
      '/uploads/assets/static_projects_0_thumbnail_ae4790213b.png';
    const newProj: Project = {
      id: 'proj-' + Date.now(),
      cardIdNo: generateCardIdNo(project.title || 'Untitled', 1),
      sequenceNumber: 1,
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
      visibility: project.visibility || 'Published',
      seo: project.seo,
    };
    setData((prev) => {
      const existing = (prev.projects || []).map((p, idx) => ({
        ...p,
        sequenceNumber: idx + 2,
        cardIdNo: p.cardIdNo || getProjectCardId(p, idx + 1),
      }));
      const allProjects = [newProj, ...existing];
      const sequenceSection = buildSequenceSection(allProjects, backupRules, pushRules);
      const next = { ...prev, projects: allProjects, projectsSequence: sequenceSection };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
    });
  };
  const updateProject = (project: Project) => {
    setData((prev) => {
      const nextProjects = (prev.projects || []).map((p, idx) => {
        if (p.id === project.id) {
          const updatedCardId = project.cardIdNo && project.cardIdNo.trim()
            ? (project.cardIdNo.trim().startsWith('{') && project.cardIdNo.trim().endsWith('}')
                ? project.cardIdNo.trim()
                : `{${project.cardIdNo.trim()}}`)
            : getProjectCardId(project, idx);
          return {
            ...project,
            cardIdNo: updatedCardId,
            sequenceNumber: typeof project.sequenceNumber === 'number' ? project.sequenceNumber : idx + 1,
          };
        }
        return p;
      });
      const sequenceSection = buildSequenceSection(nextProjects, backupRules, pushRules);
      const next = {
        ...prev,
        projects: nextProjects,
        projectsSequence: sequenceSection,
      };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
    });
  };
  const deleteProject = (id: string) => {
    setData((prev) => {
      const deleted = (prev.projects || []).find((p) => p.id === id);
      const filtered = (prev.projects || []).filter((p) => p.id !== id).map((p, idx) => ({
        ...p,
        sequenceNumber: idx + 1,
      }));
      const sequenceSection = buildSequenceSection(filtered, backupRules, pushRules);
      const next = {
        ...prev,
        projects: filtered,
        projectsSequence: sequenceSection,
      };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
    });
  };
  const reorderProjectItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.projects || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);

      // Re-map sequence numbers and retain/format Card ID No.
      const updatedProjects = items.map((p, pIdx) => ({
        ...p,
        sequenceNumber: pIdx + 1,
        cardIdNo: getProjectCardId(p, pIdx),
      }));

      const sequenceSection = buildSequenceSection(updatedProjects, backupRules, pushRules);
      const next = { ...prev, projects: updatedProjects, projectsSequence: sequenceSection };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
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

      // Re-map sequence numbers and retain/format Card ID No.
      const updatedProjects = items.map((p, pIdx) => ({
        ...p,
        sequenceNumber: pIdx + 1,
        cardIdNo: getProjectCardId(p, pIdx),
      }));

      const sequenceSection = buildSequenceSection(updatedProjects, backupRules, pushRules);
      const next = { ...prev, projects: updatedProjects, projectsSequence: sequenceSection };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
    });
  };
  const swapProjectItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.projects || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;

      // Re-map sequence numbers and retain/format Card ID No.
      const updatedProjects = items.map((p, pIdx) => ({
        ...p,
        sequenceNumber: pIdx + 1,
        cardIdNo: getProjectCardId(p, pIdx),
      }));

      const sequenceSection = buildSequenceSection(updatedProjects, backupRules, pushRules);
      const next = { ...prev, projects: updatedProjects, projectsSequence: sequenceSection };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
    });
  };
  const reindexAllProjectCardIds = () => {
    setData((prev) => {
      const reindexed = reindexProjectsWithCardIds(prev.projects || []);
      const sequenceSection = buildSequenceSection(reindexed, backupRules, pushRules);
      const next = { ...prev, projects: reindexed, projectsSequence: sequenceSection };
      persistCMSDataInstantly(next);
      setGitCardOrderPending(true);
      return next;
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
    const cardId = item.cardIdNo ? formatCardId(item.cardIdNo) : getItemCardId(item, 0, 'creative');
    const newItem: CreativeItem = {
      id: 'cr-' + Date.now(),
      cardIdNo: cardId,
      sequenceNumber: 1,
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
      visibility: item.visibility || 'Published',
      seo: item.seo,
    };
    setData((prev) => {
      const updated = [newItem, ...(prev.creativePortfolio || [])].map((c, idx) => ({
        ...c,
        sequenceNumber: idx + 1,
        cardIdNo: getItemCardId(c, idx, 'creative'),
      }));
      const next = { ...prev, creativePortfolio: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updateCreativeItem = (item: CreativeItem) => {
    setData((prev) => {
      const updated = (prev.creativePortfolio || []).map((c, idx) =>
        c.id === item.id
          ? {
              ...item,
              cardIdNo: item.cardIdNo ? formatCardId(item.cardIdNo) : getItemCardId(item, idx, 'creative'),
              sequenceNumber: typeof item.sequenceNumber === 'number' ? item.sequenceNumber : idx + 1,
            }
          : c
      );
      const next = { ...prev, creativePortfolio: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const deleteCreativeItem = (id: string) => {
    setData((prev) => {
      const filtered = (prev.creativePortfolio || []).filter((c) => c.id !== id);
      const updated = filtered.map((c, idx) => ({
        ...c,
        sequenceNumber: idx + 1,
        cardIdNo: getItemCardId(c, idx, 'creative'),
      }));
      const next = { ...prev, creativePortfolio: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const reorderCreativeItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.creativePortfolio || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      const updated = items.map((c, cIdx) => ({
        ...c,
        sequenceNumber: cIdx + 1,
        cardIdNo: getItemCardId(c, cIdx, 'creative'),
      }));
      const next = { ...prev, creativePortfolio: updated };
      persistCMSDataInstantly(next);
      return next;
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
      const updated = items.map((c, cIdx) => ({
        ...c,
        sequenceNumber: cIdx + 1,
        cardIdNo: getItemCardId(c, cIdx, 'creative'),
      }));
      const next = { ...prev, creativePortfolio: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const swapCreativeItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.creativePortfolio || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      const updated = items.map((c, cIdx) => ({
        ...c,
        sequenceNumber: cIdx + 1,
        cardIdNo: getItemCardId(c, cIdx, 'creative'),
      }));
      const next = { ...prev, creativePortfolio: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const reindexAllCreativeCardIds = () => {
    setData((prev) => {
      const reindexed = reindexCreativeItemsWithCardIds(prev.creativePortfolio || []);
      const next = { ...prev, creativePortfolio: reindexed };
      persistCMSDataInstantly(next);
      return next;
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
      visibility: item.visibility || 'Published',
      seo: item.seo,
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
      const next = { ...prev, journey: items };
      persistCMSDataInstantly(next);
      return next;
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
      const next = { ...prev, journey: items };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const swapJourneyItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.journey || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      const next = { ...prev, journey: items };
      persistCMSDataInstantly(next);
      return next;
    });
  };

  // Gallery / Certificates
  const updateGallery = (gallery: GalleryItem[]) => {
    setData((prev) => {
      const next = { ...prev, gallery };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const addGalleryItem = (item: any) => {
    const firstImg =
      item.image ||
      (item.images && item.images[0]) ||
      '/uploads/assets/static_gallery_0_image_4e182a45cd.jpg';
    const cardId = item.cardIdNo ? formatCardId(item.cardIdNo) : getItemCardId(item, 0, 'cert');
    const newItem: GalleryItem = {
      id: 'gal-' + Date.now(),
      cardIdNo: cardId,
      sequenceNumber: 1,
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
      visibility: item.visibility || 'Published',
      seo: item.seo,
    };
    setData((prev) => {
      const updated = [newItem, ...(prev.gallery || [])].map((g, idx) => ({
        ...g,
        sequenceNumber: idx + 1,
        cardIdNo: getItemCardId(g, idx, 'cert'),
      }));
      const next = {
        ...prev,
        gallery: updated,
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updateGalleryItem = (item: GalleryItem) => {
    setData((prev) => {
      const updated = (prev.gallery || []).map((g, idx) =>
        g.id === item.id
          ? {
              ...item,
              cardIdNo: item.cardIdNo ? formatCardId(item.cardIdNo) : getItemCardId(item, idx, 'cert'),
              sequenceNumber: typeof item.sequenceNumber === 'number' ? item.sequenceNumber : idx + 1,
            }
          : g
      );
      const next = {
        ...prev,
        gallery: updated,
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const deleteGalleryItem = (id: string) => {
    setData((prev) => {
      const filtered = (prev.gallery || []).filter((g) => g.id !== id);
      const updated = filtered.map((g, idx) => ({
        ...g,
        sequenceNumber: idx + 1,
        cardIdNo: getItemCardId(g, idx, 'cert'),
      }));
      const next = {
        ...prev,
        gallery: updated,
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const reorderGalleryItem = (index: number, direction: 'up' | 'down') => {
    setData((prev) => {
      const items = [...(prev.gallery || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(targetIndex, 0, moved);
      const updated = items.map((g, gIdx) => ({
        ...g,
        sequenceNumber: gIdx + 1,
        cardIdNo: getItemCardId(g, gIdx, 'cert'),
      }));
      const next = { ...prev, gallery: updated };
      persistCMSDataInstantly(next);
      return next;
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
      const updated = items.map((g, gIdx) => ({
        ...g,
        sequenceNumber: gIdx + 1,
        cardIdNo: getItemCardId(g, gIdx, 'cert'),
      }));
      const next = { ...prev, gallery: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const swapGalleryItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.gallery || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      const updated = items.map((g, gIdx) => ({
        ...g,
        sequenceNumber: gIdx + 1,
        cardIdNo: getItemCardId(g, gIdx, 'cert'),
      }));
      const next = { ...prev, gallery: updated };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const reindexAllGalleryCardIds = () => {
    setData((prev) => {
      const reindexed = reindexGalleryItemsWithCardIds(prev.gallery || []);
      const next = { ...prev, gallery: reindexed };
      persistCMSDataInstantly(next);
      return next;
    });
  };

  // Blogs & Articles
  const updateBlogs = (blogs: BlogPost[]) => {
    setData((prev) => {
      const next = { ...prev, blogs };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const addBlogPost = (post: any) => {
    const newPost: BlogPost = {
      id: 'blog-' + Date.now(),
      title: post.title || 'New Article',
      slug:
        post.slug ||
        String(post.title || 'article')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      kind: post.kind === 'Article' ? 'Article' : 'Blog',
      difficulty: post.difficulty || 'Intermediate',
      tldr: post.tldr || post.snippet || '',
      snippet: post.snippet || '',
      content: post.content || '',
      date: post.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      readTime: post.readTime || '5 min read',
      category: post.category || 'Web Engineering',
      tags: Array.isArray(post.tags) ? post.tags : ['Article'],
      coverImage:
        post.coverImage ||
        '/uploads/assets/static_creativePortfolio_1_ima_3b559722e8.jpg',
      relatedProjectId: post.relatedProjectId || undefined,
      externalUrl: post.externalUrl || undefined,
      featured: post.featured ?? true,
      status: post.status === 'Draft' ? 'Draft' : 'Published',
      seo: post.seo,
    };
    setData((prev) => {
      const next = {
        ...prev,
        blogs: [newPost, ...(prev.blogs || [])],
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updateBlogPost = (post: BlogPost) => {
    setData((prev) => {
      const next = {
        ...prev,
        blogs: (prev.blogs || []).map((b) => (b.id === post.id ? post : b)),
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const deleteBlogPost = (id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        blogs: (prev.blogs || []).filter((b) => b.id !== id),
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };

  // Events
  const updateEvents = (events: EventItem[]) => {
    setData((prev) => {
      const next = { ...prev, events };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const addEventItem = (event: any) => {
    const newEvent: EventItem = {
      id: 'event-' + Date.now(),
      title: event.title || 'New Event',
      slug:
        event.slug ||
        String(event.title || 'event')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      category: event.category || 'Hackathons',
      role: event.role || 'Coordinator',
      date: event.date || new Date().toISOString().split('T')[0],
      displayDate: event.displayDate || event.date || '2026',
      endDate: event.endDate || undefined,
      eventStatus: event.eventStatus === 'Upcoming' ? 'Upcoming' : 'Past',
      venue: event.venue || 'MVSR Engineering College, Hyderabad',
      summary: event.summary || '',
      detailedDescription: event.detailedDescription || event.summary || '',
      highlights: Array.isArray(event.highlights) ? event.highlights : [],
      stats: Array.isArray(event.stats) ? event.stats : [],
      coverImage:
        event.coverImage ||
        '/uploads/assets/static_asset_gallery_0_image_yrodqodp.jpg',
      images:
        Array.isArray(event.images) && event.images.length > 0
          ? event.images
          : [event.coverImage || '/uploads/assets/static_asset_gallery_0_image_yrodqodp.jpg'],
      videoUrl: event.videoUrl || undefined,
      registrationUrl: event.registrationUrl || undefined,
      relatedProjectId: event.relatedProjectId || undefined,
      certificateUrl: event.certificateUrl || undefined,
      featured: event.featured ?? true,
      visibility: event.visibility === 'Draft' ? 'Draft' : 'Published',
      seo: event.seo,
    };
    setData((prev) => {
      const next = {
        ...prev,
        events: [newEvent, ...(prev.events || [])],
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updateEventItem = (event: EventItem) => {
    setData((prev) => {
      const next = {
        ...prev,
        events: (prev.events || []).map((ev) => (ev.id === event.id ? event : ev)),
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const deleteEventItem = (id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        events: (prev.events || []).filter((ev) => ev.id !== id),
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };

  // Press & Features Mentions
  const updatePressMentions = (pressMentions: PressMention[]) => {
    setData((prev) => {
      const next = { ...prev, pressMentions };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const addPressMention = (item: any) => {
    const newItem: PressMention = {
      id: 'press-' + Date.now(),
      title: item.title || 'Featured Mention',
      slug:
        item.slug ||
        String(item.title || 'feature')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      sourceName: item.sourceName || 'External Publication',
      externalUrl: item.externalUrl || '',
      category: item.category || 'Press & Media',
      date: item.date || '2026',
      summary: item.summary || '',
      detailedNotes: item.detailedNotes || item.summary || '',
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      coverImage: item.coverImage || '/uploads/assets/static_asset_projects_0_thumbnail_hc35tyd7.png',
      relatedProjectId: item.relatedProjectId || undefined,
      featured: item.featured ?? true,
      visibility: item.visibility === 'Draft' ? 'Draft' : 'Published',
      seo: item.seo,
    };
    setData((prev) => {
      const next = {
        ...prev,
        pressMentions: [newItem, ...(prev.pressMentions || [])],
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const updatePressMention = (item: PressMention) => {
    setData((prev) => {
      const next = {
        ...prev,
        pressMentions: (prev.pressMentions || []).map((p) => (p.id === item.id ? item : p)),
      };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const deletePressMention = (id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        pressMentions: (prev.pressMentions || []).filter((p) => p.id !== id),
      };
      persistCMSDataInstantly(next);
      return next;
    });
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
      const next = { ...prev, resumes: items };
      persistCMSDataInstantly(next);
      return next;
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
      const next = { ...prev, resumes: items };
      persistCMSDataInstantly(next);
      return next;
    });
  };
  const swapResumeItems = (index1: number, index2: number) => {
    setData((prev) => {
      const items = [...(prev.resumes || [])];
      if (index1 < 0 || index1 >= items.length || index2 < 0 || index2 >= items.length) return prev;
      const temp = items[index1];
      items[index1] = items[index2];
      items[index2] = temp;
      const next = { ...prev, resumes: items };
      persistCMSDataInstantly(next);
      return next;
    });
  };

  // Intro Loading Animation Data
  const updateIntro = (intro: IntroData) => setData((prev) => ({ ...prev, intro }));

  // Contact Info
  const updateContactInfo = (contactInfo: ContactInfo) =>
    setData((prev) => ({ ...prev, contactInfo }));

  // Contact Messages (Persisted globally to Firestore + Telegram API bridge)
  const addMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'time' | 'status'>) => {
    const now = new Date();
    const safeId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanName = String(msg.name || '').trim().slice(0, 100);
    const cleanEmail = String(msg.email || '').trim().slice(0, 150);
    const cleanSubject = (String(msg.subject || 'Portfolio Inquiry').trim() || 'Portfolio Inquiry').slice(0, 200);
    const cleanMessage = String(msg.message || '').trim().slice(0, 3000);
    const cleanDate = now.toISOString().split('T')[0].slice(0, 40);
    const cleanTime = now.toTimeString().slice(0, 5).slice(0, 30);

    const newMsg: ContactMessage = {
      id: safeId,
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      date: cleanDate,
      time: cleanTime,
      status: 'unread',
    };

    setData((prev) => ({
      ...prev,
      messages: [newMsg, ...(prev.messages || [])],
    }));

    // 1. Save to Cloud Firestore so message appears in Admin Portal CMS across all devices (Netlify & local)
    const docPath = `contact_messages/${newMsg.id}`;
    setDoc(doc(db, 'contact_messages', newMsg.id), {
      ...newMsg,
      createdAt: serverTimestamp(),
    }).catch((err) => {
      try {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      } catch (formattedErr) {
        console.warn('[Firestore Contact Save Warning]:', formattedErr);
      }
    });

    // 2. Post to Express / Netlify Serverless API for instant Telegram notification & DB/disk backup
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: safeId,
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      }),
    })
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          if (!json.telegramSent && json.telegramError) {
            console.warn('[Contact Telegram Bridge Warning]:', json.telegramError);
          }
        }
      })
      .catch((err) => console.warn('Failed to send contact message to Telegram API bridge:', err));
  };

  const markMessageStatus = (id: string, status: 'unread' | 'read' | 'archived') => {
    setData((prev) => {
      const next = {
        ...prev,
        messages: (prev.messages || []).map((m) => (m.id === id ? { ...m, status } : m)),
      };
      persistCMSDataInstantly(next);
      return next;
    });
    setFirestoreMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );

    if (isAdmin && firebaseUser) {
      const docPath = `contact_messages/${id}`;
      updateDoc(doc(db, 'contact_messages', id), { status }).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        } catch (formattedErr) {
          console.warn('[Firestore Message Status Warning]:', formattedErr);
        }
      });
    }
  };

  const markMessageRead = (id: string) => {
    markMessageStatus(id, 'read');
  };

  const deleteMessage = (id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        messages: (prev.messages || []).filter((m) => m.id !== id),
      };
      persistCMSDataInstantly(next);
      return next;
    });
    setFirestoreMessages((prev) => prev.filter((m) => m.id !== id));

    if (isAdmin && firebaseUser) {
      const docPath = `contact_messages/${id}`;
      deleteDoc(doc(db, 'contact_messages', id)).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.DELETE, docPath);
        } catch (formattedErr) {
          console.warn('[Firestore Delete Message Warning]:', formattedErr);
        }
      });
    }
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

  // Merge Firestore live visitor messages with local/backup messages (deduplicated by ID, Firestore authoritative)
  const mergedMessages = React.useMemo(() => {
    const map = new Map<string, ContactMessage>();
    for (const m of firestoreMessages) {
      if (m?.id) map.set(m.id, m);
    }
    for (const m of data.messages || []) {
      if (m?.id && !map.has(m.id)) {
        map.set(m.id, m);
      }
    }
    return Array.from(map.values());
  }, [firestoreMessages, data.messages]);

  const safeData = {
    ...data,
    intro: data.intro || initialCMSData.intro,
    projects: data.projects || [],
    creativePortfolio: data.creativePortfolio || [],
    journey: data.journey || [],
    gallery: data.gallery || [],
    blogs: data.blogs || [],
    events: data.events || [],
    pressMentions: data.pressMentions || [],
    resumes: data.resumes || [],
    messages: mergedMessages,
    contactMessages: mergedMessages,
  };

  return (
    <CMSContext.Provider
      value={{
        data: safeData,
        isLoading,
        dbConnected,
        isAuthenticated,
        isAdmin,
        currentUser: firebaseUser
          ? {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              uid: firebaseUser.uid,
            }
          : null,
        authToken,
        login,
        loginWithGoogle,
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
        reindexAllProjectCardIds,
        updateBackupRules,
        updatePushRules,
        backupRules,
        pushRules,
        projectsSequence: safeData.projectsSequence || buildSequenceSection(safeData.projects || [], backupRules, pushRules),
        updateCreativePortfolio,
        addCreativeItem,
        updateCreativeItem,
        deleteCreativeItem,
        reorderCreativeItem,
        moveCreativeItem,
        swapCreativeItems,
        reindexAllCreativeCardIds,
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
        reindexAllGalleryCardIds,
        updateBlogs,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        updateEvents,
        addEventItem,
        updateEventItem,
        deleteEventItem,
        updatePressMentions,
        addPressMention,
        updatePressMention,
        deletePressMention,
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
        syncToGitHub,
        isGitSyncing,
        lastGitCommit,
        gitCardOrderPending,
        setGitCardOrderPending,
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
