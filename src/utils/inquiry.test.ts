import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../data/studioData';
import { filterProjectsByCategory, validateInquiry } from './inquiry';

test('filterProjectsByCategory returns all projects when category is All', () => {
  const result = filterProjectsByCategory(PROJECTS, 'All');
  assert.equal(result.length, PROJECTS.length);
});

test('filterProjectsByCategory filters strictly by category', () => {
  const webApps = filterProjectsByCategory(PROJECTS, 'Web Apps');
  assert.equal(webApps.length, 1);
  assert.equal(webApps[0].id, 'kinetix-desk');

  const commerce = filterProjectsByCategory(PROJECTS, 'Commerce');
  assert.equal(commerce.length, 1);
  assert.equal(commerce[0].id, 'forma-objects');
});

test('validateInquiry rejects empty or malformed fields', () => {
  const result = validateInquiry({
    name: ' ',
    email: 'not-an-email',
    scope: '',
    brief: 'too short',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.scope);
  assert.ok(result.errors.brief);
});

test('validateInquiry accepts complete trimmed input', () => {
  const result = validateInquiry({
    name: '  Elena Vance  ',
    email: ' elena@example.com ',
    scope: 'Web Application',
    brief: 'We need a clean booking portal for our architecture firm.',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.equal(result.normalized.name, 'Elena Vance');
  assert.equal(result.normalized.email, 'elena@example.com');
});
