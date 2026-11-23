import test from 'node:test';
import assert from 'node:assert/strict';
import type { SocialProfileResult } from '../types/username';
import {
  buildSocialCsv,
  filterSocialResults,
  parseUsernameInput,
  SOCIAL_PLATFORMS,
} from './username';

test('parseUsernameInput normalizes @handles, URLs, and rejects invalid characters', () => {
  assert.deepEqual(parseUsernameInput('  @octocat  '), { valid: true, username: 'octocat' });
  assert.deepEqual(parseUsernameInput('https://github.com/torvalds'), {
    valid: true,
    username: 'torvalds',
  });
  assert.equal(parseUsernameInput('').valid, false);
  assert.equal(parseUsernameInput('bad handle with spaces!').valid, false);
});

test('SOCIAL_PLATFORMS builds valid profile URLs across major apps', () => {
  const byId = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p]));
  assert.equal(byId.x.buildUrl('nasa'), 'https://x.com/nasa');
  assert.equal(byId.instagram.buildUrl('nasa'), 'https://www.instagram.com/nasa/');
  assert.equal(byId.tiktok.buildUrl('nasa'), 'https://www.tiktok.com/@nasa');
  assert.equal(byId.youtube.buildUrl('nasa'), 'https://www.youtube.com/@nasa');
  assert.equal(byId.github.buildUrl('octocat'), 'https://github.com/octocat');
  assert.equal(byId.bluesky.buildUrl('nasa'), 'https://bsky.app/profile/nasa.bsky.social');
});

test('filterSocialResults filters by category and verification status', () => {
  const sample: SocialProfileResult[] = [
    {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      domain: 'github.com',
      profileUrl: 'https://github.com/octocat',
      status: 'found',
      statusNote: 'Verified via GitHub API',
      displayName: 'The Octocat',
      bio: null,
      avatarUrl: null,
      location: null,
      website: null,
      metricsLabel: '8 repos',
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      category: 'Social',
      domain: 'x.com',
      profileUrl: 'https://x.com/octocat',
      status: 'unverified',
      statusNote: 'Manual check required',
      displayName: null,
      bio: null,
      avatarUrl: null,
      location: null,
      website: null,
      metricsLabel: null,
    },
  ];

  assert.equal(filterSocialResults(sample, 'All', 'All').length, 2);
  assert.equal(filterSocialResults(sample, 'Developer', 'All').length, 1);
  assert.equal(filterSocialResults(sample, 'All', 'found').length, 1);
  assert.equal(filterSocialResults(sample, 'Social', 'found').length, 0);

  const csv = buildSocialCsv('octocat', sample);
  assert.ok(csv.includes('"GitHub"'));
  assert.ok(csv.includes('"https://github.com/octocat"'));
});
