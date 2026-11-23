import type {
  SocialPlatformSpec,
  SocialProfileResult,
  UsernameLookupResponse,
} from '../types/username.ts';
import { parseUsernameInput, SOCIAL_PLATFORMS } from '../utils/username.ts';
import { LookupError } from './ipLookupService.ts';

const USER_AGENT =
  'Mozilla/5.0 (compatible; NetSIIprobeLookup/1.0; +https://netsiiprobe.local)';

async function fetchJsonSafe<T>(
  url: string,
  timeoutMs = 3500
): Promise<{ status: number; data: T | null }> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    return { status: response.status, data: null };
  }
  const data = (await response.json()) as T;
  return { status: response.status, data };
}

function stripHtmlTags(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || null;
}

function makeBaseResult(
  platform: SocialPlatformSpec,
  username: string
): SocialProfileResult {
  return {
    id: platform.id,
    name: platform.name,
    category: platform.category,
    domain: platform.domain,
    profileUrl: platform.buildUrl(username),
    status: 'unverified',
    statusNote: 'Open link to verify manually',
    displayName: null,
    bio: null,
    avatarUrl: null,
    location: null,
    website: null,
    metricsLabel: null,
  };
}

async function checkGithub(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<{
      name?: string;
      login?: string;
      bio?: string;
      avatar_url?: string;
      location?: string;
      blog?: string;
      followers?: number;
      public_repos?: number;
    }>(`https://api.github.com/users/${encodeURIComponent(username)}`);

    if (status === 404) {
      return { ...base, status: 'not_found', statusNote: 'No account found (GitHub API 404)' };
    }
    if (!data) {
      return { ...base, status: 'unverified', statusNote: `GitHub API returned HTTP ${status}` };
    }
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via GitHub API',
      displayName: data.name || data.login || username,
      bio: data.bio || null,
      avatarUrl: data.avatar_url || null,
      location: data.location || null,
      website: data.blog ? data.blog : null,
      metricsLabel: `${data.followers ?? 0} followers · ${data.public_repos ?? 0} repos`,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkBluesky(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  const actor = username.includes('.') ? username : `${username}.bsky.social`;
  try {
    const { status, data } = await fetchJsonSafe<{
      displayName?: string;
      handle?: string;
      description?: string;
      avatar?: string;
      followersCount?: number;
      postsCount?: number;
    }>(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(
        actor
      )}`
    );

    if (status === 400 || status === 404) {
      return { ...base, status: 'not_found', statusNote: 'No profile found (Bluesky API)' };
    }
    if (!data) {
      return { ...base, status: 'unverified', statusNote: `Bluesky API returned HTTP ${status}` };
    }
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via Bluesky API',
      displayName: data.displayName || data.handle || actor,
      bio: data.description || null,
      avatarUrl: data.avatar || null,
      metricsLabel: `${data.followersCount ?? 0} followers · ${data.postsCount ?? 0} posts`,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkGitlab(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<
      Array<{
        username?: string;
        name?: string;
        avatar_url?: string;
        state?: string;
      }>
    >(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`);

    if (!data) {
      return { ...base, status: 'unverified', statusNote: `GitLab API returned HTTP ${status}` };
    }
    if (data.length === 0) {
      return { ...base, status: 'not_found', statusNote: 'No account found (GitLab API)' };
    }
    const user = data[0];
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via GitLab API',
      displayName: user.name || user.username || username,
      avatarUrl: user.avatar_url || null,
      metricsLabel: user.state ? `Status: ${user.state}` : null,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkDevto(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<{
      name?: string;
      summary?: string;
      profile_image?: string;
      location?: string;
      website_url?: string;
    }>(`https://dev.to/api/users/by_username?url=${encodeURIComponent(username)}`);

    if (status === 404) {
      return { ...base, status: 'not_found', statusNote: 'No account found (DEV API 404)' };
    }
    if (!data) {
      return { ...base, status: 'unverified', statusNote: `DEV API returned HTTP ${status}` };
    }
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via DEV Community API',
      displayName: data.name || username,
      bio: data.summary || null,
      avatarUrl: data.profile_image || null,
      location: data.location || null,
      website: data.website_url || null,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkHackerNews(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<{
      id?: string;
      karma?: number;
      about?: string;
    } | null>(
      `https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(username)}.json`
    );

    if (status !== 200) {
      return { ...base, status: 'unverified', statusNote: `HN API returned HTTP ${status}` };
    }
    if (!data || !data.id) {
      return { ...base, status: 'not_found', statusNote: 'No user found (Hacker News API)' };
    }
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via Hacker News API',
      displayName: data.id,
      bio: stripHtmlTags(data.about),
      metricsLabel: `${data.karma ?? 0} karma`,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkMastodon(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<{
      display_name?: string;
      username?: string;
      note?: string;
      avatar?: string;
      followers_count?: number;
      statuses_count?: number;
    }>(
      `https://mastodon.social/api/v1/accounts/lookup?acct=${encodeURIComponent(username)}`
    );

    if (status === 404) {
      return { ...base, status: 'not_found', statusNote: 'Not found on mastodon.social' };
    }
    if (!data) {
      return { ...base, status: 'unverified', statusNote: `Mastodon API returned HTTP ${status}` };
    }
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified on mastodon.social',
      displayName: data.display_name || data.username || username,
      bio: stripHtmlTags(data.note),
      avatarUrl: data.avatar || null,
      metricsLabel: `${data.followers_count ?? 0} followers · ${data.statuses_count ?? 0} posts`,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkReddit(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<{
      data?: {
        name?: string;
        total_karma?: number;
        icon_img?: string;
        subreddit?: { title?: string; public_description?: string };
      };
    }>(`https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`);

    if (status === 404) {
      return { ...base, status: 'not_found', statusNote: 'No account found (Reddit 404)' };
    }
    if (!data?.data) {
      return {
        ...base,
        status: 'unverified',
        statusNote: 'Reddit blocked automated check — open link to verify',
      };
    }
    const r = data.data;
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via Reddit JSON',
      displayName: r.subreddit?.title || r.name || username,
      bio: r.subreddit?.public_description || null,
      avatarUrl: r.icon_img ? r.icon_img.split('?')[0] : null,
      metricsLabel: typeof r.total_karma === 'number' ? `${r.total_karma} karma` : null,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Reddit check timed out — verify manually' };
  }
}

async function checkKeybase(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const { status, data } = await fetchJsonSafe<{
      status?: { code?: number };
      them?: Array<{
        basics?: { username?: string };
        profile?: { full_name?: string; bio?: string; location?: string };
      } | null>;
    }>(
      `https://keybase.io/_/api/1.0/user/lookup.json?usernames=${encodeURIComponent(username)}`
    );

    if (status !== 200 || !data) {
      return { ...base, status: 'unverified', statusNote: `Keybase API returned HTTP ${status}` };
    }
    const user = Array.isArray(data.them) ? data.them[0] : null;
    if (!user) {
      return { ...base, status: 'not_found', statusNote: 'No account found (Keybase API)' };
    }
    return {
      ...base,
      status: 'found',
      statusNote: 'Verified via Keybase API',
      displayName: user.profile?.full_name || user.basics?.username || username,
      bio: user.profile?.bio || null,
      location: user.profile?.location || null,
    };
  } catch {
    return { ...base, status: 'unverified', statusNote: 'Request timed out — verify manually' };
  }
}

async function checkHttpProfile(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  const base = makeBaseResult(platform, username);
  try {
    const response = await fetch(base.profileUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (response.status === 404 || response.status === 410) {
      return {
        ...base,
        status: 'not_found',
        statusNote: `HTTP ${response.status} — Profile not found`,
      };
    }

    if (response.status === 403 || response.status === 429 || response.status === 401) {
      return {
        ...base,
        status: 'unverified',
        statusNote: `HTTP ${response.status} protection — open link to verify`,
      };
    }

    if (response.status >= 200 && response.status < 300) {
      const html = (await response.text()).slice(0, 32000);
      const lower = html.toLowerCase();

      // Detect soft-404 and login wall patterns accurately
      if (
        lower.includes('the specified profile could not be found') ||
        lower.includes("page isn't available") ||
        lower.includes('page you’re looking for doesn’t exist') ||
        lower.includes("this account doesn't exist") ||
        lower.includes('sorry, nobody on reddit goes by that name') ||
        (platform.id === 'twitch' && !lower.includes(`"${username.toLowerCase()}"`))
      ) {
        return {
          ...base,
          status: 'not_found',
          statusNote: 'Profile not found on platform',
        };
      }

      if (
        lower.includes('/accounts/login') ||
        lower.includes('just a moment...') ||
        lower.includes('enable javascript') ||
        platform.id === 'x' ||
        platform.id === 'instagram' ||
        platform.id === 'threads' ||
        platform.id === 'tiktok'
      ) {
        return {
          ...base,
          status: 'unverified',
          statusNote: 'Login or anti-bot wall — open link to check directly',
        };
      }

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const cleanTitle = titleMatch ? stripHtmlTags(titleMatch[1]) : null;

      return {
        ...base,
        status: 'found',
        statusNote: 'Profile page responded (HTTP 200)',
        displayName: cleanTitle && cleanTitle.length < 80 ? cleanTitle : username,
      };
    }

    return {
      ...base,
      status: 'unverified',
      statusNote: `HTTP ${response.status} — open link to verify`,
    };
  } catch {
    return {
      ...base,
      status: 'unverified',
      statusNote: 'Timed out or blocked — open link to verify',
    };
  }
}

async function checkSinglePlatform(
  platform: SocialPlatformSpec,
  username: string
): Promise<SocialProfileResult> {
  switch (platform.id) {
    case 'github':
      return checkGithub(platform, username);
    case 'bluesky':
      return checkBluesky(platform, username);
    case 'gitlab':
      return checkGitlab(platform, username);
    case 'devto':
      return checkDevto(platform, username);
    case 'hackernews':
      return checkHackerNews(platform, username);
    case 'mastodon':
      return checkMastodon(platform, username);
    case 'reddit':
      return checkReddit(platform, username);
    case 'keybase':
      return checkKeybase(platform, username);
    default:
      return checkHttpProfile(platform, username);
  }
}

export async function lookupUsernameAcrossPlatforms(
  rawUsername: string
): Promise<UsernameLookupResponse> {
  const parsed = parseUsernameInput(rawUsername);
  if (!parsed.valid) {
    throw new LookupError(400, parsed.reason);
  }

  const results = await Promise.all(
    SOCIAL_PLATFORMS.map((platform) => checkSinglePlatform(platform, parsed.username))
  );

  // Sort found profiles first, then unverified, then not_found
  const order: Record<SocialProfileResult['status'], number> = {
    found: 0,
    unverified: 1,
    not_found: 2,
  };
  results.sort((a, b) => order[a.status] - order[b.status]);

  const foundCount = results.filter((r) => r.status === 'found').length;
  const notFoundCount = results.filter((r) => r.status === 'not_found').length;
  const unverifiedCount = results.filter((r) => r.status === 'unverified').length;

  const priorityOrder = ['github', 'bluesky', 'mastodon', 'devto', 'gitlab', 'keybase', 'reddit'];
  let bestHighlight: SocialProfileResult | undefined;
  for (const id of priorityOrder) {
    const match = results.find((r) => r.id === id && r.status === 'found');
    if (match) {
      bestHighlight = match;
      break;
    }
  }
  if (!bestHighlight) {
    bestHighlight = results.find((r) => r.status === 'found');
  }

  return {
    username: parsed.username,
    fetchedAt: new Date().toISOString(),
    summary: {
      totalChecked: results.length,
      foundCount,
      notFoundCount,
      unverifiedCount,
    },
    highlights: {
      displayName: bestHighlight?.displayName ?? null,
      bio: bestHighlight?.bio ?? null,
      location: bestHighlight?.location ?? null,
      website: bestHighlight?.website ?? null,
      avatarUrl: bestHighlight?.avatarUrl ?? null,
      sourcePlatform: bestHighlight?.name ?? null,
    },
    results,
  };
}
