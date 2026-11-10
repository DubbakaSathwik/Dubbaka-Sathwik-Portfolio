import { Project, ProjectSequenceItem, SequenceSectionData, CreativeItem, GalleryItem } from '../types';

/**
 * Normalizes an item or project title into a clean, human-readable prefix slug.
 * Example:
 * "Nexora-AI" -> "nexora"
 * "INTELLI-Query" -> "intelli-query"
 * "FoodFlow Connect" -> "foodflow"
 * "Menstrual Hygiene Day" -> "menstrual"
 * "World Environment Day" -> "environment"
 * "Hackfest – Winning Team" -> "hackfest"
 * "Cyber Ekathon 2025" -> "cyber"
 */
export function slugifyItemName(title: string, defaultSlug: string = 'card'): string {
  if (!title) return defaultSlug;
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();

  // Special cases for common developer / technical project names
  if (lower.startsWith('nexora')) return 'nexora';
  if (lower.startsWith('intelli')) return 'intelli-query';
  if (lower.startsWith('foodflow')) return 'foodflow';
  if (lower.startsWith('ai hiring') || lower.startsWith('ai-hiring')) return 'ai-hiring';
  if (lower.startsWith('news without')) return 'news';
  if (lower.startsWith('vaultflow')) return 'vaultflow';
  if (lower.startsWith('cobra')) return 'cobra';
  if (lower.startsWith('medlens')) return 'medlens';
  if (lower.startsWith('menstrual')) return 'menstrual';
  if (lower.startsWith('world environment') || lower.startsWith('environment')) return 'environment';
  if (lower.startsWith('hackfest')) return 'hackfest';
  if (lower.startsWith('cyber')) return 'cyber';

  // Replace dashes, slashes, em-dashes with spaces, strip special characters
  const normalized = lower
    .replace(/[–—/\\|:]/g, ' ')
    .replace(/[^a-z0-9\s-_]/g, '')
    .trim();

  const tokens = normalized.split(/[\s_]+/).filter(Boolean);
  if (tokens.length === 0) return defaultSlug;

  // Filter out filler words like 'a', 'an', 'the', 'of', 'for', 'in', 'on', 'at', 'to'
  const meaningfulTokens = tokens.filter(
    (t) => !['a', 'an', 'the', 'of', 'for', 'in', 'on', 'at', 'to', 'day', 'and'].includes(t)
  );
  const primaryTokens = meaningfulTokens.length > 0 ? meaningfulTokens : tokens;

  let first = primaryTokens[0];
  if (first.includes('-')) {
    const sub = first.split('-')[0];
    if (sub && sub.length >= 3) {
      first = sub;
    }
  }

  // If very short token like "ai", join with second token if available
  if (first.length <= 2 && primaryTokens.length > 1) {
    return `${first}-${primaryTokens[1]}`;
  }

  return first;
}

export function slugifyProjectName(title: string): string {
  return slugifyItemName(title, 'project');
}

/**
 * Formats a raw user-input string into {slug-0XX} curly-braced format
 */
export function formatCardId(rawId?: string): string {
  if (!rawId || !rawId.trim()) return '';
  let cleaned = rawId.trim();
  if (!cleaned.startsWith('{')) cleaned = `{${cleaned}`;
  if (!cleaned.endsWith('}')) cleaned = `${cleaned}}`;
  return cleaned;
}

/**
 * Generates a unique Card ID No. in format {slug-0XX}
 * e.g. {nexora-002}, {intelli-query-001}, {menstrual-001}, {hackfest-001}
 */
export function generateCardIdNo(title: string, sequenceNumber: number, defaultSlug: string = 'card'): string {
  const slug = slugifyItemName(title, defaultSlug);
  const numStr = String(sequenceNumber).padStart(3, '0');
  return `{${slug}-${numStr}}`;
}

/**
 * Extracts and formats the Card ID No. from an existing project or generates one
 */
export function getProjectCardId(project: Partial<Project>, fallbackIndex?: number): string {
  if (project.cardIdNo && project.cardIdNo.trim()) {
    return formatCardId(project.cardIdNo);
  }
  const seq = fallbackIndex !== undefined ? fallbackIndex + 1 : 1;
  return generateCardIdNo(project.title || 'project', seq, 'project');
}

/**
 * Extracts and formats Card ID No. for any generic item (Creative, Certificate, etc.)
 */
export function getItemCardId(
  item: { cardIdNo?: string; title?: string },
  fallbackIndex?: number,
  defaultSlug: string = 'card'
): string {
  if (item.cardIdNo && item.cardIdNo.trim()) {
    return formatCardId(item.cardIdNo);
  }
  const seq = fallbackIndex !== undefined ? fallbackIndex + 1 : 1;
  return generateCardIdNo(item.title || defaultSlug, seq, defaultSlug);
}

export const DEFAULT_BACKUP_RULES = {
  preserveSequenceOnBackup: true,
  autoAssignCardId: true,
  snapshotSequenceFile: true,
  dualStorageParity: true,
};

export const DEFAULT_PUSH_RULES = {
  gitPushSequenceSection: true,
  gitCommitSequenceMessage: true,
  safeTreePush: true,
};

/**
 * Builds the canonical sequence section data structure to be saved in JSON and Git
 */
export function buildSequenceSection(
  projects: Project[],
  customBackupRules?: Partial<typeof DEFAULT_BACKUP_RULES>,
  customPushRules?: Partial<typeof DEFAULT_PUSH_RULES>
): SequenceSectionData {
  const sequence: ProjectSequenceItem[] = (projects || []).map((p, idx) => {
    const position = idx + 1;
    const cardIdNo = getProjectCardId(p, idx);
    return {
      position,
      cardIdNo,
      id: p.id,
      title: p.title,
      category: p.category,
      featured: Boolean(p.featured),
      status: p.status || 'Completed',
    };
  });

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    totalProjects: sequence.length,
    sequence,
    backupRules: {
      ...DEFAULT_BACKUP_RULES,
      ...customBackupRules,
    },
    pushRules: {
      ...DEFAULT_PUSH_RULES,
      ...customPushRules,
    },
  };
}

/**
 * Ensures all projects in the list have their cardIdNo properly populated and unique
 */
export function reindexProjectsWithCardIds(projects: Project[]): Project[] {
  return (projects || []).map((p, idx) => {
    const position = idx + 1;
    const cardIdNo = generateCardIdNo(p.title, position, 'project');
    return {
      ...p,
      cardIdNo,
      sequenceNumber: position,
    };
  });
}

/**
 * Ensures all creative portfolio items have their cardIdNo properly populated and unique
 */
export function reindexCreativeItemsWithCardIds(items: CreativeItem[]): CreativeItem[] {
  return (items || []).map((item, idx) => {
    const position = idx + 1;
    const cardIdNo = generateCardIdNo(item.title, position, 'creative');
    return {
      ...item,
      cardIdNo,
      sequenceNumber: position,
    };
  });
}

/**
 * Ensures all certificates & awards (gallery) items have their cardIdNo properly populated and unique
 */
export function reindexGalleryItemsWithCardIds(items: GalleryItem[]): GalleryItem[] {
  return (items || []).map((item, idx) => {
    const position = idx + 1;
    const cardIdNo = generateCardIdNo(item.title, position, 'cert');
    return {
      ...item,
      cardIdNo,
      sequenceNumber: position,
    };
  });
}

