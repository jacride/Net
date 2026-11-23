export type SocialPlatformCategory =
  | 'Social'
  | 'Developer'
  | 'Video & Audio'
  | 'Design & Community';

export type SocialCheckStatus = 'found' | 'not_found' | 'unverified';

export interface SocialPlatformSpec {
  id: string;
  name: string;
  category: SocialPlatformCategory;
  domain: string;
  buildUrl: (username: string) => string;
}

export interface SocialProfileResult {
  id: string;
  name: string;
  category: SocialPlatformCategory;
  domain: string;
  profileUrl: string;
  status: SocialCheckStatus;
  statusNote: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  website: string | null;
  metricsLabel: string | null;
}

export interface UsernameLookupSummary {
  totalChecked: number;
  foundCount: number;
  notFoundCount: number;
  unverifiedCount: number;
}

export interface UsernameLookupResponse {
  username: string;
  fetchedAt: string;
  summary: UsernameLookupSummary;
  highlights: {
    displayName: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    avatarUrl: string | null;
    sourcePlatform: string | null;
  };
  results: SocialProfileResult[];
}
