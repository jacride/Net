import type { ProjectCategory, ProjectItem } from '../data/studioData';

export interface InquiryInput {
  name: string;
  email: string;
  scope: string;
  brief: string;
}

export interface InquiryErrors {
  name?: string;
  email?: string;
  scope?: string;
  brief?: string;
}

export const INQUIRY_SCOPES = [
  'Web Application',
  'Design System',
  'Commerce Storefront',
  'Performance Audit',
  'Custom Website',
] as const;

export function filterProjectsByCategory(
  projects: ProjectItem[],
  category: ProjectCategory
): ProjectItem[] {
  if (category === 'All') {
    return projects;
  }
  return projects.filter((project) => project.category === category);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiry(input: InquiryInput): {
  valid: boolean;
  errors: InquiryErrors;
  normalized: InquiryInput;
} {
  const normalized: InquiryInput = {
    name: input.name.trim(),
    email: input.email.trim(),
    scope: input.scope.trim(),
    brief: input.brief.trim(),
  };

  const errors: InquiryErrors = {};

  if (normalized.name.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  if (!EMAIL_PATTERN.test(normalized.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!normalized.scope) {
    errors.scope = 'Please select a project focus.';
  }

  if (normalized.brief.length < 15) {
    errors.brief = 'Please describe what you need in at least 15 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized,
  };
}
