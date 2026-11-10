import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { saveLocalDiskData } from './cms';
import { CMSModel, isDatabaseConnected } from '../db/mongo';
import { requireAuth } from '../middleware/auth';

const router = Router();

const GITHUB_REPO = process.env.GITHUB_REPO || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN_FILE_PATH = path.join(process.cwd(), '.git_token');
const PUSH_HISTORY_FILE = path.join(process.cwd(), 'git_push_history.json');

// Compute standard Git Blob SHA-1 (equivalent to git hash-object)
function computeGitBlobSha(buffer: Buffer): string {
  const header = `blob ${buffer.length}\0`;
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(header), buffer])).digest('hex');
}

// Helper to resolve currently available token
function getActiveToken(): string {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
    return process.env.GITHUB_TOKEN.trim();
  }
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const saved = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8').trim();
      if (saved) return saved;
    }
  } catch (e) {}
  return '';
}

// Helper to compute directory size and file count
function getDirectoryStats(dirPath: string): { count: number; totalBytes: number } {
  let count = 0;
  let totalBytes = 0;
  if (!fs.existsSync(dirPath)) return { count, totalBytes };

  function walk(curr: string) {
    try {
      const items = fs.readdirSync(curr);
      for (const item of items) {
        if (item.startsWith('.')) continue;
        const p = path.join(curr, item);
        try {
          const stat = fs.statSync(p);
          if (stat.isDirectory()) {
            walk(p);
          } else if (stat.isFile()) {
            count++;
            totalBytes += stat.size;
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  walk(dirPath);
  return { count, totalBytes };
}

// Check if git CLI binary is accessible
function hasGitCli(): boolean {
  try {
    execSync('git --version', {
      stdio: 'pipe',
      env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}` },
    });
    return true;
  } catch (e) {
    return false;
  }
}

// Helper to get push logs
interface PushHistoryEntry {
  id: string;
  timestamp: string;
  commitHash: string;
  message: string;
  author: string;
  status: 'success' | 'failed';
  details?: string;
  mode?: 'rest_api' | 'cli';
}

function getPushHistory(): PushHistoryEntry[] {
  try {
    if (fs.existsSync(PUSH_HISTORY_FILE)) {
      const data = fs.readFileSync(PUSH_HISTORY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
}

function appendPushHistory(entry: PushHistoryEntry) {
  try {
    const list = getPushHistory();
    list.unshift(entry);
    const truncated = list.slice(0, 50);
    fs.writeFileSync(PUSH_HISTORY_FILE, JSON.stringify(truncated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write push history:', e);
  }
}

// GitHub REST API commit & push engine (Requires ZERO system git binary)
async function pushViaGitHubRestApi(token: string, message: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Dubbaka-Sathwik-Portfolio-CMS',
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  // 1. Get HEAD commit of target branch
  const refRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`,
    { headers }
  );
  if (!refRes.ok) {
    const errText = await refRes.text();
    throw new Error(`GitHub Ref Error (${refRes.status}): ${errText}`);
  }
  const refJson = await refRes.json();
  const latestCommitSha = refJson.object?.sha;
  if (!latestCommitSha) {
    throw new Error('Could not find latest commit SHA on GitHub');
  }

  // 2. Get tree of current commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/commits/${latestCommitSha}`,
    { headers }
  );
  if (!commitRes.ok) {
    const errText = await commitRes.text();
    throw new Error(`GitHub Commit Read Error (${commitRes.status}): ${errText}`);
  }
  const commitJson = await commitRes.json();
  const baseTreeSha = commitJson.tree?.sha;
  if (!baseTreeSha) {
    throw new Error('Could not find base tree SHA for commit');
  }

  // 3. Inspect existing files on remote tree (including blob SHA to detect changes)
  const existingRemotePaths = new Set<string>();
  const existingRemoteShaByPath = new Map<string, string>();
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${baseTreeSha}?recursive=1`,
      { headers }
    );
    if (treeRes.ok) {
      const treeJson = await treeRes.json();
      if (Array.isArray(treeJson.tree)) {
        treeJson.tree.forEach((t: any) => {
          if (t.path) {
            existingRemotePaths.add(t.path);
            if (t.sha) {
              existingRemoteShaByPath.set(t.path, t.sha);
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Could not pre-fetch remote tree list:', e);
  }

  // 4. Build Tree Items
  const treeItems: any[] = [];

  // A. Primary seed data
  const seedPath = path.join(process.cwd(), 'src', 'seed_data.json');
  let seedContent = '';
  if (fs.existsSync(seedPath)) {
    seedContent = fs.readFileSync(seedPath, 'utf-8');
    treeItems.push({
      path: 'src/seed_data.json',
      mode: '100644',
      type: 'blob',
      content: seedContent,
    });
  }

  // B. Backups (Root & Public)
  const cmsBackupPath = path.join(process.cwd(), 'cms_backup.json');
  let cmsBackupContent = '';
  if (fs.existsSync(cmsBackupPath)) {
    cmsBackupContent = fs.readFileSync(cmsBackupPath, 'utf-8');
    treeItems.push({
      path: 'cms_backup.json',
      mode: '100644',
      type: 'blob',
      content: cmsBackupContent,
    });
  }

  const staticBackupPath = path.join(process.cwd(), 'static_backup.json');
  let staticBackupContent = '';
  if (fs.existsSync(staticBackupPath)) {
    staticBackupContent = fs.readFileSync(staticBackupPath, 'utf-8');
    treeItems.push({
      path: 'static_backup.json',
      mode: '100644',
      type: 'blob',
      content: staticBackupContent,
    });
  }

  const publicStaticBackupPath = path.join(process.cwd(), 'public', 'static_backup.json');
  if (fs.existsSync(publicStaticBackupPath)) {
    treeItems.push({
      path: 'public/static_backup.json',
      mode: '100644',
      type: 'blob',
      content: fs.readFileSync(publicStaticBackupPath, 'utf-8'),
    });
  }

  // Push history file
  if (fs.existsSync(PUSH_HISTORY_FILE)) {
    try {
      treeItems.push({
        path: 'git_push_history.json',
        mode: '100644',
        type: 'blob',
        content: fs.readFileSync(PUSH_HISTORY_FILE, 'utf-8'),
      });
    } catch (e) {}
  }

  // Sequence Section & Rules Manifest (Git Sequence Tracking)
  const srcSequencePath = path.join(process.cwd(), 'src', 'projects_sequence.json');
  if (fs.existsSync(srcSequencePath)) {
    try {
      treeItems.push({
        path: 'src/projects_sequence.json',
        mode: '100644',
        type: 'blob',
        content: fs.readFileSync(srcSequencePath, 'utf-8'),
      });
    } catch (e) {}
  }

  const rootSequencePath = path.join(process.cwd(), 'projects_sequence.json');
  if (fs.existsSync(rootSequencePath)) {
    try {
      treeItems.push({
        path: 'projects_sequence.json',
        mode: '100644',
        type: 'blob',
        content: fs.readFileSync(rootSequencePath, 'utf-8'),
      });
    } catch (e) {}
  }

  // C. Local Image & Media Assets: Profile Avatars, Projects, Gallery, and Uploads
  const candidateRelUrls = new Set<string>();

  // Explicit primary avatar & profile assets
  candidateRelUrls.add('/profile/avatar.jpeg');
  candidateRelUrls.add('/images/profile/sathwik-avatar.jpeg');

  // Extract all asset references from JSON data files
  const searchSources = [seedContent, cmsBackupContent, staticBackupContent].filter(Boolean);
  for (const src of searchSources) {
    const matches = src.match(/"\/(?:uploads|profile|images)\/[^"\\]+"/g) || [];
    for (const m of matches) {
      candidateRelUrls.add(m.replace(/"/g, ''));
    }
  }

  // Also include any files residing in public/uploads and public/uploads/assets
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const topFiles = fs.readdirSync(uploadsDir);
      for (const f of topFiles) {
        if (!f.startsWith('.')) {
          const p = path.join(uploadsDir, f);
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            candidateRelUrls.add(`/uploads/${f}`);
          }
        }
      }
    }
    const assetsDir = path.join(process.cwd(), 'public', 'uploads', 'assets');
    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      for (const f of assetFiles) {
        if (!f.startsWith('.')) {
          const p = path.join(assetsDir, f);
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            candidateRelUrls.add(`/uploads/assets/${f}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local uploads dir:', err);
  }

  // Determine assets that either don't exist on remote or have different local SHA (e.g. updated photo)
  const assetsToUpload: { repoPath: string; localPath: string; buffer: Buffer }[] = [];
  for (const relUrl of candidateRelUrls) {
    const cleanRel = relUrl.startsWith('/') ? relUrl.substring(1) : relUrl;
    const localPath = path.join(process.cwd(), 'public', cleanRel);
    const repoPath = `public/${cleanRel}`;

    if (fs.existsSync(localPath)) {
      try {
        const buffer = fs.readFileSync(localPath);
        const localSha = computeGitBlobSha(buffer);
        const remoteSha = existingRemoteShaByPath.get(repoPath);

        // Upload if missing on GitHub or if local file content changed!
        if (!remoteSha || remoteSha !== localSha) {
          assetsToUpload.push({ repoPath, localPath, buffer });
        }
      } catch (err) {
        console.warn(`Error checking asset file ${localPath}:`, err);
      }
    }
  }

  // Batch upload changed or missing assets in parallel chunks of 5
  const batchSize = 5;
  for (let i = 0; i < assetsToUpload.length; i += batchSize) {
    const batch = assetsToUpload.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ({ repoPath, buffer }) => {
        try {
          const blobRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              content: buffer.toString('base64'),
              encoding: 'base64',
            }),
          });
          if (blobRes.ok) {
            const blobJson = await blobRes.json();
            if (blobJson.sha) {
              treeItems.push({
                path: repoPath,
                mode: '100644',
                type: 'blob',
                sha: blobJson.sha,
              });
            }
          } else {
            console.warn(`GitHub Blob API rejected ${repoPath}:`, await blobRes.text());
          }
        } catch (err) {
          console.warn(`Error uploading asset blob ${repoPath}:`, err);
        }
      })
    );
  }

  // 5. Create new Tree
  const createTreeRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });

  if (!createTreeRes.ok) {
    const errText = await createTreeRes.text();
    throw new Error(`GitHub Tree Creation Error (${createTreeRes.status}): ${errText}`);
  }
  const newTreeJson = await createTreeRes.json();
  const newTreeSha = newTreeJson.sha;

  // 6. Create Commit
  const createCommitRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: message,
      tree: newTreeSha,
      parents: [latestCommitSha],
      author: {
        name: 'Dubbaka Sathwik',
        email: 'dubbakasathwik@gmail.com',
        date: new Date().toISOString(),
      },
    }),
  });

  if (!createCommitRes.ok) {
    const errText = await createCommitRes.text();
    throw new Error(`GitHub Commit Creation Error (${createCommitRes.status}): ${errText}`);
  }
  const newCommitJson = await createCommitRes.json();
  const newCommitSha = newCommitJson.sha;

  // 7. Update Ref (Push)
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    }
  );

  if (!updateRefRes.ok) {
    const errText = await updateRefRes.text();
    throw new Error(`GitHub Branch Push Error (${updateRefRes.status}): ${errText}`);
  }

  // 8. If local git CLI is installed, keep local git in sync silently
  if (hasGitCli()) {
    try {
      execSync(`git fetch origin ${GITHUB_BRANCH} && git reset --soft origin/${GITHUB_BRANCH}`, {
        stdio: 'pipe',
        env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}` },
      });
    } catch (e) {}
  }

  return {
    commitSha: newCommitSha,
    shortHash: newCommitSha.slice(0, 7),
    branch: GITHUB_BRANCH,
    mode: 'rest_api' as const,
  };
}

// 1. Verify GitHub Token Endpoint (Tests user credentials directly with GitHub API)
router.post('/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = (req.body?.token || getActiveToken() || '').trim();
    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'No GitHub token provided to verify.',
      });
    }

    const ghRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Dubbaka-Sathwik-Portfolio-CMS',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!ghRes.ok) {
      return res.json({
        success: false,
        valid: false,
        status: ghRes.status,
        message:
          ghRes.status === 401
            ? 'Invalid Personal Access Token (Bad credentials). Please check that the token is copied completely without spaces.'
            : `GitHub Authentication Error (${ghRes.status})`,
      });
    }

    const userData = await ghRes.json();
    const scopesHeader = ghRes.headers.get('x-oauth-scopes') || '';
    const scopes = scopesHeader.split(',').map((s) => s.trim()).filter(Boolean);
    const hasRepoScope = scopes.includes('repo');

    res.json({
      success: true,
      valid: true,
      login: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      scopes,
      hasRepoScope,
      message: hasRepoScope
        ? `Token is 100% valid for @${userData.login} with full repository access!`
        : `Token is valid for @${userData.login}, but missing the "repo" scope needed to push changes.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      valid: false,
      message: error?.message || 'Failed to verify token against GitHub.',
    });
  }
});

// 2. Get GitHub Sync Status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const activeToken = getActiveToken();
    const hasToken = Boolean(activeToken);
    let lastCommit = '';
    let pendingChangesCount = 0;
    const branch = GITHUB_BRANCH;

    // Try fetching the true latest commit from GitHub REST API first
    if (activeToken) {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&per_page=1`,
          {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'User-Agent': 'Dubbaka-Sathwik-Portfolio-CMS',
            },
          }
        );
        if (ghRes.ok) {
          const commits = await ghRes.json();
          if (commits && commits.length > 0) {
            const c = commits[0];
            const shortSha = c.sha?.slice(0, 7);
            const msg = c.commit?.message?.split('\n')[0];
            lastCommit = `${shortSha} - ${msg}`;
          }
        }
      } catch (e) {}
    }

    // Fallback to local git log if empty and git CLI exists
    if (!lastCommit && hasGitCli()) {
      try {
        lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', {
          stdio: 'pipe',
          env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}` },
        })
          .toString()
          .trim();
      } catch (e) {}
    }

    // Count pending changes if git CLI is present
    if (hasGitCli()) {
      try {
        const status = execSync('git status --short', {
          stdio: 'pipe',
          env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}` },
        })
          .toString()
          .trim();
        pendingChangesCount = status ? status.split('\n').length : 0;
      } catch (e) {}
    }

    let maskedToken = '';
    if (activeToken) {
      maskedToken =
        activeToken.length > 8
          ? `${activeToken.slice(0, 4)}••••••••${activeToken.slice(-4)}`
          : '••••••••';
    }

    res.json({
      success: true,
      configured: hasToken,
      hasSavedToken: fs.existsSync(TOKEN_FILE_PATH),
      maskedToken,
      repo: GITHUB_REPO,
      branch,
      lastCommit: lastCommit || 'Ready to synchronize with GitHub',
      pendingChangesCount,
      repoUrl: `https://github.com/${GITHUB_REPO}`,
      hasGitCli: hasGitCli(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to check GitHub status',
    });
  }
});

// 3. Retrieve Saved Token (Protected Admin)
router.get('/token', requireAuth, (req: Request, res: Response) => {
  try {
    const activeToken = getActiveToken();
    let maskedToken = '';
    if (activeToken) {
      maskedToken =
        activeToken.length > 8
          ? `${activeToken.slice(0, 4)}••••••••${activeToken.slice(-4)}`
          : '••••••••';
    }
    res.json({
      success: true,
      hasToken: Boolean(activeToken),
      token: activeToken, // accessible only by authenticated super admin
      maskedToken,
      source: process.env.GITHUB_TOKEN
        ? 'env'
        : fs.existsSync(TOKEN_FILE_PATH)
        ? 'saved_file'
        : 'none',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve saved token',
    });
  }
});

// 4. Save GitHub Token (Protected Admin)
router.post('/token', requireAuth, (req: Request, res: Response) => {
  try {
    const token = (req.body?.token || '').trim();
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be empty.',
      });
    }

    fs.writeFileSync(TOKEN_FILE_PATH, token, { encoding: 'utf-8', mode: 0o600 });

    res.json({
      success: true,
      message: 'GitHub Personal Access Token saved successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to save GitHub token.',
    });
  }
});

// 5. Delete Saved Token (Protected Admin)
router.delete('/token', requireAuth, (req: Request, res: Response) => {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
    }
    res.json({
      success: true,
      message: 'Saved GitHub token cleared.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete saved token.',
    });
  }
});

// 5b. Comprehensive GitHub Repo Info & Storage Data Usage Tracker
router.get('/repo-info', async (req: Request, res: Response) => {
  try {
    const queryToken = (req.query.token as string)?.trim();
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
    const activeToken = queryToken || authHeader || getActiveToken();

    // 1. Calculate Local Disk Usage (Uploaded Assets & JSON Datastores)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const localUploads = getDirectoryStats(uploadsDir);
    
    const seedDataPath = path.join(process.cwd(), 'src', 'seed_data.json');
    const seedDataBytes = fs.existsSync(seedDataPath) ? fs.statSync(seedDataPath).size : 0;
    
    const cmsBackupPath = path.join(process.cwd(), 'cms_backup.json');
    const cmsBackupBytes = fs.existsSync(cmsBackupPath) ? fs.statSync(cmsBackupPath).size : 0;

    const staticBackupPath = path.join(process.cwd(), 'static_backup.json');
    const staticBackupBytes = fs.existsSync(staticBackupPath) ? fs.statSync(staticBackupPath).size : 0;

    const totalLocalAssetBytes = localUploads.totalBytes + seedDataBytes + cmsBackupBytes + staticBackupBytes;

    const localStats = {
      assetFilesCount: localUploads.count,
      assetsSizeMb: (localUploads.totalBytes / (1024 * 1024)).toFixed(2),
      assetsSizeBytes: localUploads.totalBytes,
      seedDataKb: (seedDataBytes / 1024).toFixed(1),
      backupsKb: ((cmsBackupBytes + staticBackupBytes) / 1024).toFixed(1),
      totalLocalMb: (totalLocalAssetBytes / (1024 * 1024)).toFixed(2),
      totalLocalBytes: totalLocalAssetBytes,
    };

    // 2. Fetch Live Repo Data from GitHub API if token available
    let remoteData: any = null;
    let latestCommit: any = null;
    let rateLimits = {
      limit: 60,
      remaining: 60,
      resetTime: '',
      resetSeconds: 0,
    };
    let tokenValid = false;
    let apiError: string | null = null;

    if (activeToken) {
      try {
        const ghHeaders = {
          Authorization: `Bearer ${activeToken}`,
          'User-Agent': 'Dubbaka-Sathwik-Portfolio-CMS',
          Accept: 'application/vnd.github+json',
        };

        const [repoRes, commitRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers: ghHeaders }),
          fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&per_page=1`, { headers: ghHeaders }),
        ]);

        // Rate limits from headers
        const limitHeader = repoRes.headers.get('x-ratelimit-limit');
        const remainingHeader = repoRes.headers.get('x-ratelimit-remaining');
        const resetHeader = repoRes.headers.get('x-ratelimit-reset');
        if (limitHeader) rateLimits.limit = parseInt(limitHeader, 10);
        if (remainingHeader) rateLimits.remaining = parseInt(remainingHeader, 10);
        if (resetHeader) {
          const resetEpoch = parseInt(resetHeader, 10);
          rateLimits.resetTime = new Date(resetEpoch * 1000).toLocaleTimeString('en-US');
          rateLimits.resetSeconds = Math.max(0, Math.floor(resetEpoch - Date.now() / 1000));
        }

        if (repoRes.ok) {
          remoteData = await repoRes.json();
          tokenValid = true;
        } else {
          const errBody = await repoRes.text();
          apiError = `GitHub Repo Error (${repoRes.status}): ${errBody}`;
        }

        if (commitRes.ok) {
          const commits = await commitRes.json();
          if (Array.isArray(commits) && commits.length > 0) {
            const c = commits[0];
            const dateStr = c.commit?.author?.date || '';
            let relativeDate = dateStr;
            if (dateStr) {
              const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
              if (diffSec < 60) relativeDate = 'just now';
              else if (diffSec < 3600) relativeDate = `${Math.floor(diffSec / 60)} minutes ago`;
              else if (diffSec < 86400) relativeDate = `${Math.floor(diffSec / 3600)} hours ago`;
              else relativeDate = `${Math.floor(diffSec / 86400)} days ago`;
            }
            latestCommit = {
              sha: c.sha || '',
              shortSha: (c.sha || '').slice(0, 7),
              message: (c.commit?.message || '').split('\n')[0],
              author: c.commit?.author?.name || c.author?.login || 'Dubbaka Sathwik',
              authorAvatar: c.author?.avatar_url || '',
              date: dateStr ? new Date(dateStr).toLocaleString('en-US') : '',
              relativeDate,
              url: `https://github.com/${GITHUB_REPO}/commit/${c.sha}`,
            };
          }
        }
      } catch (err: any) {
        apiError = err?.message || 'Failed to query GitHub REST API';
      }
    }

    // 3. Compute Storage Metrics & Limits
    // GitHub API 'size' is in Kilobytes (KB)
    const repoSizeKb = remoteData?.size || 0;
    const repoSizeMb = parseFloat((repoSizeKb / 1024).toFixed(2));
    const softLimitMb = 1000; // 1 GB recommended limit by GitHub
    const hardLimitMb = 5000; // 5 GB standard threshold
    const percentOfSoftLimit = Math.min(100, parseFloat(((repoSizeMb / softLimitMb) * 100).toFixed(1)));
    const remainingSoftLimitMb = Math.max(0, parseFloat((softLimitMb - repoSizeMb).toFixed(1)));

    let healthStatus: 'optimal' | 'good' | 'caution' | 'critical' = 'optimal';
    let healthBadge = 'Excellent (Minimal Usage)';
    let healthRecommendation = 'Safe for lifetime portfolio updates. Plenty of storage capacity available.';

    if (repoSizeMb > 1000) {
      healthStatus = 'critical';
      healthBadge = 'High Usage (>1 GB)';
      healthRecommendation = 'Repository has exceeded GitHub recommended 1 GB soft limit. Enable Git LFS for large media.';
    } else if (repoSizeMb > 750) {
      healthStatus = 'caution';
      healthBadge = 'Caution (>75% Capacity)';
      healthRecommendation = 'Approaching recommended GitHub soft limit. Ensure all image files are compressed.';
    } else if (repoSizeMb > 250) {
      healthStatus = 'good';
      healthBadge = 'Normal Usage';
      healthRecommendation = 'Good storage state with plenty of room for project assets.';
    }

    res.json({
      success: true,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      tokenConfigured: Boolean(activeToken),
      tokenValid,
      apiError,
      storage: {
        repoSizeKb,
        repoSizeMb,
        formattedRepoSize: repoSizeMb >= 1 ? `${repoSizeMb} MB` : `${repoSizeKb} KB`,
        softLimitMb,
        hardLimitMb,
        percentOfSoftLimit,
        remainingSoftLimitMb,
        healthStatus,
        healthBadge,
        healthRecommendation,
      },
      localAssets: localStats,
      repoDetails: remoteData
        ? {
            name: remoteData.name,
            fullName: remoteData.full_name,
            isPrivate: remoteData.private,
            visibility: remoteData.visibility || (remoteData.private ? 'private' : 'public'),
            stars: remoteData.stargazers_count,
            forks: remoteData.forks_count,
            watchers: remoteData.watchers_count,
            openIssues: remoteData.open_issues_count,
            defaultBranch: remoteData.default_branch,
            createdAt: remoteData.created_at ? new Date(remoteData.created_at).toLocaleDateString('en-US') : '',
            updatedAt: remoteData.updated_at ? new Date(remoteData.updated_at).toLocaleDateString('en-US') : '',
            pushedAt: remoteData.pushed_at ? new Date(remoteData.pushed_at).toLocaleString('en-US') : '',
            htmlUrl: remoteData.html_url,
            cloneUrl: remoteData.clone_url,
            sshUrl: remoteData.ssh_url,
            owner: remoteData.owner?.login || '',
            ownerAvatar: remoteData.owner?.avatar_url || '',
            description: remoteData.description || 'Personal Full-Stack Portfolio & CMS Application',
          }
        : null,
      latestCommit,
      rateLimits,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch repository info and data usage',
    });
  }
});

// 6. Get Git History (Directly from GitHub API with local fallback)
router.get('/history', async (req: Request, res: Response) => {
  try {
    const activeToken = getActiveToken();
    const commits: Array<{
      hash: string;
      shortHash: string;
      message: string;
      author: string;
      avatarUrl?: string;
      date: string;
      relativeDate: string;
      commitUrl: string;
    }> = [];

    // First try: Fetch directly from GitHub REST API
    let fetchedFromApi = false;
    if (activeToken) {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&per_page=30`,
          {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'User-Agent': 'Dubbaka-Sathwik-Portfolio-CMS',
              Accept: 'application/vnd.github+json',
            },
          }
        );

        if (ghRes.ok) {
          const rawCommits = await ghRes.json();
          if (Array.isArray(rawCommits)) {
            for (const c of rawCommits) {
              const fullHash = c.sha || '';
              const shortHash = fullHash.slice(0, 7);
              const message = (c.commit?.message || '').split('\n')[0];
              const author = c.commit?.author?.name || c.author?.login || 'Dubbaka Sathwik';
              const avatarUrl = c.author?.avatar_url;
              const dateStr = c.commit?.author?.date || '';
              const date = dateStr ? new Date(dateStr).toLocaleString('en-US') : '';

              // Calculate relative time
              let relativeDate = dateStr;
              if (dateStr) {
                const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
                if (diffSec < 60) relativeDate = 'just now';
                else if (diffSec < 3600) relativeDate = `${Math.floor(diffSec / 60)} minutes ago`;
                else if (diffSec < 86400) relativeDate = `${Math.floor(diffSec / 3600)} hours ago`;
                else relativeDate = `${Math.floor(diffSec / 86400)} days ago`;
              }

              commits.push({
                hash: fullHash,
                shortHash,
                message,
                author,
                avatarUrl,
                date,
                relativeDate,
                commitUrl: `https://github.com/${GITHUB_REPO}/commit/${fullHash}`,
              });
            }
            fetchedFromApi = true;
          }
        }
      } catch (err) {
        console.warn('Could not fetch commits from GitHub REST API:', err);
      }
    }

    // Fallback: If not fetched from API, try local git CLI
    if (!fetchedFromApi && hasGitCli()) {
      try {
        const rawLog = execSync(
          'git log -30 --pretty=format:"%H%x09%h%x09%s%x09%an%x09%ad%x09%cr" --date=iso',
          {
            stdio: 'pipe',
            env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}` },
          }
        )
          .toString()
          .trim();

        if (rawLog) {
          const lines = rawLog.split('\n');
          for (const line of lines) {
            const parts = line.split('\t');
            if (parts.length >= 6) {
              const [hash, shortHash, message, author, date, relativeDate] = parts;
              commits.push({
                hash,
                shortHash,
                message,
                author,
                date,
                relativeDate,
                commitUrl: `https://github.com/${GITHUB_REPO}/commit/${hash}`,
              });
            }
          }
        }
      } catch (e) {}
    }

    const pushEvents = getPushHistory();

    res.json({
      success: true,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      repoUrl: `https://github.com/${GITHUB_REPO}`,
      commits,
      pushEvents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load git history',
    });
  }
});

// 6b. Get Projects Sequence Status & Git Tracking Info
router.get('/sequence', async (req: Request, res: Response) => {
  try {
    const seqPath = path.join(process.cwd(), 'src', 'projects_sequence.json');
    if (fs.existsSync(seqPath)) {
      const content = fs.readFileSync(seqPath, 'utf-8');
      res.json({
        success: true,
        sequenceData: JSON.parse(content),
        gitSyncReady: true,
        trackedFiles: ['src/projects_sequence.json', 'projects_sequence.json'],
        repo: GITHUB_REPO,
        branch: GITHUB_BRANCH,
      });
      return;
    }
    res.json({
      success: false,
      message: 'Sequence file not yet generated on disk',
      gitSyncReady: false,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Failed to read sequence file',
    });
  }
});

// 7. Trigger Git Sync (Protected Admin)
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  const token = (req.body?.token || getActiveToken() || '').trim();
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'GitHub Personal Access Token is missing or not configured.',
    });
  }

  // If user passed a token and opted to save it
  if (req.body?.saveToken && req.body?.token) {
    try {
      fs.writeFileSync(TOKEN_FILE_PATH, req.body.token.trim(), { encoding: 'utf-8', mode: 0o600 });
    } catch (e) {}
  }

  // 1. If payload contains live in-memory CMS state, flush to disk and MongoDB before git commit
  if (req.body?.data && typeof req.body.data === 'object') {
    try {
      saveLocalDiskData(req.body.data);
      if (isDatabaseConnected()) {
        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { schemaVersion: 1, version: Date.now(), data: req.body.data, updatedAt: new Date() },
          { upsert: true }
        ).exec();
      }
    } catch (persistErr) {
      console.warn('[Git Sync] Error saving live payload to disk/db:', persistErr);
    }
  }

  const message =
    req.body?.message?.trim() ||
    `update: portfolio projects, media assets & static data (${new Date().toLocaleDateString('en-US')})`;

  try {
    // Execute synchronization directly through GitHub REST API
    // This requires ZERO git CLI binaries on the system and works everywhere
    const result = await pushViaGitHubRestApi(token, message);

    appendPushHistory({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      commitHash: result.shortHash,
      message,
      author: 'Dubbaka Sathwik',
      status: 'success',
      mode: 'rest_api',
    });

    res.json({
      success: true,
      message: `Successfully pushed commit ${result.shortHash} to ${GITHUB_REPO} on branch ${result.branch}!`,
      commit: result.shortHash,
      commitSha: result.commitSha,
      branch: result.branch,
      repoUrl: `https://github.com/${GITHUB_REPO}`,
      mode: 'rest_api',
    });
  } catch (error: any) {
    console.error('[GitHub Sync Error]:', error);

    const errorMsg = error?.message || 'Failed to push to GitHub';

    appendPushHistory({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      commitHash: 'failed',
      message,
      author: 'Dubbaka Sathwik',
      status: 'failed',
      details: errorMsg,
      mode: 'rest_api',
    });

    res.status(500).json({
      success: false,
      message: errorMsg,
    });
  }
});

export default router;
