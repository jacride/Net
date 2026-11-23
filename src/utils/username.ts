import type {
  SocialCheckStatus,
  SocialPlatformCategory,
  SocialPlatformSpec,
  SocialProfileResult,
} from '../types/username';

export const SOCIAL_PLATFORMS: SocialPlatformSpec[] = [
  {
    id: 'x',
    name: 'X (Twitter)',
    category: 'Social',
    domain: 'x.com',
    buildUrl: (u) => `https://x.com/${encodeURIComponent(u)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social',
    domain: 'instagram.com',
    buildUrl: (u) => `https://www.instagram.com/${encodeURIComponent(u)}/`,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'Video & Audio',
    domain: 'tiktok.com',
    buildUrl: (u) => `https://www.tiktok.com/@${encodeURIComponent(u)}`,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video & Audio',
    domain: 'youtube.com',
    buildUrl: (u) => `https://www.youtube.com/@${encodeURIComponent(u)}`,
  },
  {
    id: 'threads',
    name: 'Threads',
    category: 'Social',
    domain: 'threads.net',
    buildUrl: (u) => `https://www.threads.net/@${encodeURIComponent(u)}`,
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    category: 'Social',
    domain: 'bsky.app',
    buildUrl: (u) =>
      `https://bsky.app/profile/${encodeURIComponent(u.includes('.') ? u : `${u}.bsky.social`)}`,
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    category: 'Social',
    domain: 'mastodon.social',
    buildUrl: (u) => `https://mastodon.social/@${encodeURIComponent(u)}`,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'Social',
    domain: 'reddit.com',
    buildUrl: (u) => `https://www.reddit.com/user/${encodeURIComponent(u)}`,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    category: 'Video & Audio',
    domain: 'twitch.tv',
    buildUrl: (u) => `https://www.twitch.tv/${encodeURIComponent(u)}`,
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    category: 'Video & Audio',
    domain: 'soundcloud.com',
    buildUrl: (u) => `https://soundcloud.com/${encodeURIComponent(u)}`,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Video & Audio',
    domain: 'open.spotify.com',
    buildUrl: (u) => `https://open.spotify.com/user/${encodeURIComponent(u)}`,
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Developer',
    domain: 'github.com',
    buildUrl: (u) => `https://github.com/${encodeURIComponent(u)}`,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'Developer',
    domain: 'gitlab.com',
    buildUrl: (u) => `https://gitlab.com/${encodeURIComponent(u)}`,
  },
  {
    id: 'devto',
    name: 'DEV Community',
    category: 'Developer',
    domain: 'dev.to',
    buildUrl: (u) => `https://dev.to/${encodeURIComponent(u)}`,
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    category: 'Developer',
    domain: 'news.ycombinator.com',
    buildUrl: (u) => `https://news.ycombinator.com/user?id=${encodeURIComponent(u)}`,
  },
  {
    id: 'npm',
    name: 'npm',
    category: 'Developer',
    domain: 'npmjs.com',
    buildUrl: (u) => `https://www.npmjs.com/~${encodeURIComponent(u)}`,
  },
  {
    id: 'pypi',
    name: 'PyPI',
    category: 'Developer',
    domain: 'pypi.org',
    buildUrl: (u) => `https://pypi.org/user/${encodeURIComponent(u)}/`,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'Design & Community',
    domain: 'pinterest.com',
    buildUrl: (u) => `https://www.pinterest.com/${encodeURIComponent(u)}/`,
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    category: 'Design & Community',
    domain: 'dribbble.com',
    buildUrl: (u) => `https://dribbble.com/${encodeURIComponent(u)}`,
  },
  {
    id: 'behance',
    name: 'Behance',
    category: 'Design & Community',
    domain: 'behance.net',
    buildUrl: (u) => `https://www.behance.net/${encodeURIComponent(u)}`,
  },
  {
    id: 'steam',
    name: 'Steam',
    category: 'Design & Community',
    domain: 'steamcommunity.com',
    buildUrl: (u) => `https://steamcommunity.com/id/${encodeURIComponent(u)}`,
  },
  {
    id: 'linktree',
    name: 'Linktree',
    category: 'Design & Community',
    domain: 'linktr.ee',
    buildUrl: (u) => `https://linktr.ee/${encodeURIComponent(u)}`,
  },
  {
    id: 'keybase',
    name: 'Keybase',
    category: 'Developer',
    domain: 'keybase.io',
    buildUrl: (u) => `https://keybase.io/${encodeURIComponent(u)}`,
  },
];

export type ParsedUsername =
  | { valid: true; username: string }
  | { valid: false; reason: string };

export function parseUsernameInput(raw: string): ParsedUsername {
  let cleaned = raw.trim();
  if (!cleaned) {
    return { valid: false, reason: 'Enter a username or @handle to search across platforms.' };
  }

  // Extract handle if user pastes a full profile URL like https://github.com/octocat
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned);
      const segs = parsed.pathname.split('/').filter(Boolean);
      if (segs.length > 0) {
        cleaned = segs[segs.length - 1];
      }
    } catch {
      return { valid: false, reason: 'The provided profile URL could not be parsed.' };
    }
  }

  cleaned = cleaned.replace(/^@+/, '').trim();

  if (cleaned.length < 1 || cleaned.length > 39) {
    return { valid: false, reason: 'Usernames must be between 1 and 39 characters.' };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(cleaned)) {
    return {
      valid: false,
      reason: 'Usernames may only contain letters, numbers, periods, hyphens, and underscores.',
    };
  }

  return { valid: true, username: cleaned };
}

export function filterSocialResults(
  results: SocialProfileResult[],
  category: 'All' | SocialPlatformCategory,
  status: 'All' | SocialCheckStatus
): SocialProfileResult[] {
  return results.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesStatus = status === 'All' || item.status === status;
    return matchesCategory && matchesStatus;
  });
}

export function buildSocialCsv(username: string, results: SocialProfileResult[]): string {
  const header = ['Username', 'Platform', 'Category', 'Status', 'Status Note', 'Profile URL', 'Display Name', 'Metrics', 'Bio'];
  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = results.map((r) =>
    [
      username,
      r.name,
      r.category,
      r.status,
      r.statusNote,
      r.profileUrl,
      r.displayName || '',
      r.metricsLabel || '',
      r.bio || '',
    ]
      .map(escapeCell)
      .join(',')
  );

  return [header.map(escapeCell).join(','), ...rows].join('\n');
}
