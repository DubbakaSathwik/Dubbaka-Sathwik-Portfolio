import fs from 'fs';
import path from 'path';
import { connectMongoDB, CMSModel, isDatabaseConnected } from '../db/mongo';
import { initialCMSData } from '../../src/data';

const BACKUP_FILE_PATH = path.join(process.cwd(), 'cms_backup.json');
const PRE_MIGRATION_DIR = path.join(process.cwd(), 'pre_migration_snapshots');

export interface MigrationReport {
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED_ALREADY_MIGRATED';
  details: {
    hero: { status: string };
    about: { status: string };
    projects: { existingMongo: number; localSource: number; mergedFinal: number };
    creative: { existingMongo: number; localSource: number; mergedFinal: number };
    journey: { existingMongo: number; localSource: number; mergedFinal: number };
    gallery: { existingMongo: number; localSource: number; mergedFinal: number };
    resumes: { existingMongo: number; localSource: number; mergedFinal: number };
    blogs: { existingMongo: number; localSource: number; mergedFinal: number };
    messages: { existingMongo: number; localSource: number; mergedFinal: number };
  };
  databaseVersion: number;
}

function loadDiskBackup(): any {
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const raw = fs.readFileSync(BACKUP_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Migration] Could not parse cms_backup.json:', err);
  }
  return null;
}

function saveSafetySnapshot(data: any): string | null {
  try {
    if (!fs.existsSync(PRE_MIGRATION_DIR)) {
      fs.mkdirSync(PRE_MIGRATION_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(PRE_MIGRATION_DIR, `snapshot_${timestamp}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2), 'utf-8');
    return snapshotPath;
  } catch (e) {
    console.warn('[Migration] Safety snapshot creation warning:', e);
    return null;
  }
}

function deduplicateAndMergeArrays<T extends { id?: string; title?: string }>(
  mongoArr: T[] | undefined,
  localArr: T[] | undefined,
  defaultArr: T[] | undefined
): T[] {
  const map = new Map<string, T>();

  const addItems = (arr?: T[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (!item) continue;
      const key = item.id || item.title || JSON.stringify(item);
      // If item already exists, overwrite with newer/more detailed item if present
      if (!map.has(key)) {
        map.set(key, item);
      } else {
        const existing = map.get(key)!;
        map.set(key, { ...existing, ...item });
      }
    }
  };

  // Merge in order of priority: Defaults -> Local Disk Backup -> MongoDB
  addItems(defaultArr);
  addItems(localArr);
  addItems(mongoArr);

  return Array.from(map.values());
}

export async function runStorageMigration(force: boolean = false): Promise<MigrationReport> {
  const isConnected = await connectMongoDB();
  if (!isConnected) {
    throw new Error('Cannot run migration: MongoDB Atlas is currently offline or unreachable.');
  }

  console.log('[Migration] Starting idempotent MongoDB-first storage migration...');

  // 1. Fetch current MongoDB document
  const currentMongoDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
  const mongoData = currentMongoDoc ? currentMongoDoc.data : null;

  // If MongoDB document is already present and valid, skip unnecessary migration writes
  if (mongoData && mongoData.hero && !force) {
    return {
      timestamp: new Date().toISOString(),
      status: 'SKIPPED_ALREADY_MIGRATED',
      details: {
        hero: { status: 'EXISTS' },
        about: { status: 'EXISTS' },
        projects: { existingMongo: mongoData.projects?.length || 0, localSource: 0, mergedFinal: mongoData.projects?.length || 0 },
        creative: { existingMongo: mongoData.creativePortfolio?.length || 0, localSource: 0, mergedFinal: mongoData.creativePortfolio?.length || 0 },
        journey: { existingMongo: mongoData.journey?.length || 0, localSource: 0, mergedFinal: mongoData.journey?.length || 0 },
        gallery: { existingMongo: mongoData.gallery?.length || 0, localSource: 0, mergedFinal: mongoData.gallery?.length || 0 },
        resumes: { existingMongo: mongoData.resumes?.length || 0, localSource: 0, mergedFinal: mongoData.resumes?.length || 0 },
        blogs: { existingMongo: mongoData.blogs?.length || 0, localSource: 0, mergedFinal: mongoData.blogs?.length || 0 },
        messages: { existingMongo: mongoData.messages?.length || 0, localSource: 0, mergedFinal: mongoData.messages?.length || 0 },
      },
      databaseVersion: currentMongoDoc?.version || 1,
    };
  }

  console.log('[Migration] Starting idempotent MongoDB-first storage migration...');
  const localDiskData = loadDiskBackup();

  // 3. Normalize and merge all datasets
  const mergedProjects = deduplicateAndMergeArrays(
    mongoData?.projects,
    localDiskData?.projects,
    initialCMSData.projects
  );

  const mergedCreative = deduplicateAndMergeArrays(
    mongoData?.creativePortfolio,
    localDiskData?.creativePortfolio,
    initialCMSData.creativePortfolio
  );

  const mergedJourney = deduplicateAndMergeArrays(
    mongoData?.journey,
    localDiskData?.journey,
    initialCMSData.journey
  );

  const mergedGallery = deduplicateAndMergeArrays(
    mongoData?.gallery,
    localDiskData?.gallery,
    initialCMSData.gallery
  );

  const mergedResumes = deduplicateAndMergeArrays(
    mongoData?.resumes,
    localDiskData?.resumes,
    initialCMSData.resumes
  );

  const mergedBlogs = deduplicateAndMergeArrays(
    mongoData?.blogs,
    localDiskData?.blogs,
    initialCMSData.blogs
  );

  const mergedMessages = deduplicateAndMergeArrays(
    mongoData?.messages,
    localDiskData?.messages,
    initialCMSData.messages
  );

  const mergedHero = {
    ...initialCMSData.hero,
    ...(localDiskData?.hero || {}),
    ...(mongoData?.hero || {}),
  };

  const mergedAbout = {
    ...initialCMSData.about,
    ...(localDiskData?.about || {}),
    ...(mongoData?.about || {}),
  };

  const mergedSkills =
    (mongoData?.skills && mongoData.skills.length > 0)
      ? mongoData.skills
      : (localDiskData?.skills && localDiskData.skills.length > 0)
      ? localDiskData.skills
      : initialCMSData.skills;

  const mergedContactInfo = {
    ...initialCMSData.contactInfo,
    ...(localDiskData?.contactInfo || {}),
    ...(mongoData?.contactInfo || {}),
  };

  const canonicalCMSData = {
    hero: mergedHero,
    about: mergedAbout,
    skills: mergedSkills,
    projects: mergedProjects,
    creativePortfolio: mergedCreative,
    journey: mergedJourney,
    gallery: mergedGallery,
    blogs: mergedBlogs,
    resumes: mergedResumes,
    contactInfo: mergedContactInfo,
    messages: mergedMessages,
  };

  const nextVersion = (currentMongoDoc?.version || 0) + 1;

  // 4. Save canonical authoritative document to MongoDB Atlas
  const updatedDoc = await CMSModel.findOneAndUpdate(
    { key: 'portfolio_cms_v1' },
    {
      schemaVersion: 1,
      version: nextVersion,
      data: canonicalCMSData,
      updatedAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' }
  ).exec();

  console.log(`[Migration] MongoDB document updated to version ${nextVersion}`);

  // 5. Build report
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    details: {
      hero: { status: 'Preserved & Synced' },
      about: { status: 'Preserved & Synced' },
      projects: {
        existingMongo: mongoData?.projects?.length || 0,
        localSource: localDiskData?.projects?.length || 0,
        mergedFinal: canonicalCMSData.projects.length,
      },
      creative: {
        existingMongo: mongoData?.creativePortfolio?.length || 0,
        localSource: localDiskData?.creativePortfolio?.length || 0,
        mergedFinal: canonicalCMSData.creativePortfolio.length,
      },
      journey: {
        existingMongo: mongoData?.journey?.length || 0,
        localSource: localDiskData?.journey?.length || 0,
        mergedFinal: canonicalCMSData.journey.length,
      },
      gallery: {
        existingMongo: mongoData?.gallery?.length || 0,
        localSource: localDiskData?.gallery?.length || 0,
        mergedFinal: canonicalCMSData.gallery.length,
      },
      resumes: {
        existingMongo: mongoData?.resumes?.length || 0,
        localSource: localDiskData?.resumes?.length || 0,
        mergedFinal: canonicalCMSData.resumes.length,
      },
      blogs: {
        existingMongo: mongoData?.blogs?.length || 0,
        localSource: localDiskData?.blogs?.length || 0,
        mergedFinal: canonicalCMSData.blogs.length,
      },
      messages: {
        existingMongo: mongoData?.messages?.length || 0,
        localSource: localDiskData?.messages?.length || 0,
        mergedFinal: canonicalCMSData.messages.length,
      },
    },
    databaseVersion: updatedDoc.version,
  };

  return report;
}
