import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Helper to get remote URL with embedded token securely
function getAuthenticatedRemoteUrl(): string {
  const token = (process.env.GITHUB_TOKEN || '').trim();
  if (!token) return '';
  return `https://DubbakaSathwik:${token}@github.com/${GITHUB_REPO}.git`;
}

// Get GitHub Sync Status
router.get('/status', (req: Request, res: Response) => {
  try {
    const hasToken = Boolean((process.env.GITHUB_TOKEN || '').trim());
    let lastCommit = '';
    let pendingChangesCount = 0;
    let branch = GITHUB_BRANCH;

    try {
      lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"').toString().trim();
    } catch (e) {}

    try {
      const status = execSync('git status --short').toString().trim();
      pendingChangesCount = status ? status.split('\n').length : 0;
    } catch (e) {}

    res.json({
      success: true,
      configured: hasToken,
      repo: GITHUB_REPO,
      branch,
      lastCommit: lastCommit || 'No commits recorded',
      pendingChangesCount,
      repoUrl: `https://github.com/${GITHUB_REPO}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to check GitHub status',
    });
  }
});

// Trigger a Git Sync (Stage, Commit, Push to GitHub)
router.post('/sync', async (req: Request, res: Response) => {
  const token = (req.body?.token || process.env.GITHUB_TOKEN || '').trim();
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'GitHub Personal Access Token is missing or not configured.',
    });
  }

  const message = req.body?.message || `update: sync static portfolio data & assets (${new Date().toLocaleDateString('en-US')})`;

  try {
    // 1. Configure git credentials
    execSync('git config user.name "Dubbaka Sathwik"', { stdio: 'pipe' });
    execSync('git config user.email "dubbakasathwik@gmail.com"', { stdio: 'pipe' });

    // 2. Set remote
    const remoteUrl = `https://DubbakaSathwik:${token}@github.com/${GITHUB_REPO}.git`;
    try {
      execSync(`git remote set-url origin "${remoteUrl}"`, { stdio: 'pipe' });
    } catch (e) {
      execSync(`git remote add origin "${remoteUrl}"`, { stdio: 'pipe' });
    }

    // 3. Stage relevant files
    execSync('git add -A', { stdio: 'pipe' });

    // Check if there are changes to commit
    let hasChanges = true;
    try {
      const status = execSync('git status --short').toString().trim();
      hasChanges = Boolean(status);
    } catch (e) {}

    let commitHash = '';
    if (hasChanges) {
      execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
      commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    } else {
      commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    }

    // 4. Push to remote main
    console.log(`[GitHub Sync] Pushing to ${GITHUB_REPO} branch ${GITHUB_BRANCH}...`);
    execSync(`git push origin ${GITHUB_BRANCH}`, { stdio: 'pipe' });

    res.json({
      success: true,
      message: `Successfully synchronized and pushed to GitHub repository (${GITHUB_REPO})!`,
      commit: commitHash,
      branch: GITHUB_BRANCH,
      repoUrl: `https://github.com/${GITHUB_REPO}`,
    });
  } catch (error: any) {
    console.error('[GitHub Sync Error]:', error);
    res.status(500).json({
      success: false,
      message: error?.stderr?.toString() || error?.message || 'Git push failed',
    });
  }
});

export default router;
