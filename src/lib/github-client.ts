/**
 * Client-Side GitHub API Engine
 * Enables token verification, repository stats, and direct REST Git pushes
 * from the browser without requiring a Node.js backend (works seamlessly on Netlify).
 */

export const GITHUB_REPO = 'DubbakaSathwik/Dubbaka-Sathwik-Portfolio';
export const GITHUB_BRANCH = 'main';

export interface VerificationResult {
  valid: boolean;
  login?: string;
  name?: string;
  avatarUrl?: string;
  scopes?: string[];
  hasRepoScope?: boolean;
  message?: string;
}

/**
 * Safely parse JSON from a fetch response, preventing "Unexpected token '<'"
 * when hitting static routes (e.g. Netlify serving index.html for unknown /api routes).
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; isHtml?: boolean; status: number; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        isHtml: true,
        status: res.status,
        error: 'Backend route returned HTML instead of JSON (Running on static hosting)',
      };
    }

    const data = await res.json();
    return {
      ok: res.ok,
      data,
      isHtml: false,
      status: res.status,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network fetch error',
    };
  }
}

/**
 * Direct browser verification of a GitHub Personal Access Token
 * Uses GitHub's CORS-enabled REST API (https://api.github.com/user).
 */
export async function verifyGitHubTokenDirect(token: string): Promise<VerificationResult> {
  const clean = (token || '').trim();
  if (!clean) {
    return { valid: false, message: 'Token cannot be empty' };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${clean}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.ok) {
      const user = await res.json();
      const rawScopes = res.headers.get('x-oauth-scopes') || '';
      const scopes = rawScopes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const hasRepoScope = scopes.some((s) => s === 'repo' || s === 'public_repo');

      return {
        valid: true,
        login: user.login,
        name: user.name || user.login,
        avatarUrl: user.avatar_url,
        scopes,
        hasRepoScope,
        message: hasRepoScope
          ? `Verified! Connected to @${user.login} with full repository write access.`
          : `Verified as @${user.login}, but token is missing "repo" permission scope.`,
      };
    } else {
      const errJson = await res.json().catch(() => ({}));
      return {
        valid: false,
        message: errJson.message || `GitHub returned HTTP ${res.status}: Bad credentials`,
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      message: err?.message || 'Failed to connect to api.github.com. Check internet connection.',
    };
  }
}

/**
 * Direct browser Git Commit & Push using GitHub's Git Data API
 * Directly creates Blobs, Tree, Commit and advances branch ref on GitHub!
 * Triggers automatic redeploy on Netlify once pushed to main.
 */
export async function pushToGitHubClientDirect(
  token: string,
  message: string,
  data: any
): Promise<{ success: boolean; commit: string; fullSha: string; branch: string }> {
  const clean = (token || '').trim();
  if (!clean) {
    throw new Error('GitHub Personal Access Token is required to push');
  }

  const headers = {
    Authorization: `Bearer ${clean}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  // 1. Get HEAD commit of main branch
  const refRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`,
    { headers }
  );
  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch HEAD ref: HTTP ${refRes.status}`);
  }
  const refJson = await refRes.json();
  const latestCommitSha = refJson.object?.sha;
  if (!latestCommitSha) throw new Error('Could not resolve latest commit SHA on GitHub');

  // 2. Get tree of current commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/commits/${latestCommitSha}`,
    { headers }
  );
  if (!commitRes.ok) throw new Error('Failed to fetch latest commit tree');
  const commitJson = await commitRes.json();
  const baseTreeSha = commitJson.tree?.sha;

  // 3. Create tree with updated data files
  const dataString = JSON.stringify(data, null, 2);
  const treePayload = {
    base_tree: baseTreeSha,
    tree: [
      {
        path: 'src/seed_data.json',
        mode: '100644',
        type: 'blob',
        content: dataString,
      },
      {
        path: 'public/static_backup.json',
        mode: '100644',
        type: 'blob',
        content: dataString,
      },
    ],
  };

  const createTreeRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treePayload),
  });
  if (!createTreeRes.ok) {
    const err = await createTreeRes.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create Git tree on GitHub');
  }
  const treeJson = await createTreeRes.json();

  // 4. Create Commit
  const commitMessage =
    message || `sync: portfolio CMS data update via Netlify portal [${new Date().toLocaleDateString()}]`;

  const createCommitRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeJson.sha,
      parents: [latestCommitSha],
    }),
  });
  if (!createCommitRes.ok) {
    const err = await createCommitRes.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create commit on GitHub');
  }
  const newCommitJson = await createCommitRes.json();

  // 5. Update Branch Ref to new commit
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitJson.sha,
        force: false,
      }),
    }
  );
  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to advance branch reference on GitHub');
  }

  return {
    success: true,
    commit: newCommitJson.sha.slice(0, 7),
    fullSha: newCommitJson.sha,
    branch: GITHUB_BRANCH,
  };
}
