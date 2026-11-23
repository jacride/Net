import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  MinusCircle,
  Search,
} from 'lucide-react';
import type {
  SocialCheckStatus,
  SocialPlatformCategory,
  UsernameLookupResponse,
} from '../../types/username';
import {
  buildSocialCsv,
  filterSocialResults,
  parseUsernameInput,
} from '../../utils/username';
import { ResilientImage } from '../ResilientImage';

const SAMPLE_USERNAMES = ['octocat', 'torvalds', 'nasa', 'vercel'] as const;
const CATEGORIES: Array<'All' | SocialPlatformCategory> = [
  'All',
  'Social',
  'Developer',
  'Video & Audio',
  'Design & Community',
];
const STATUS_FILTERS: Array<{ id: 'All' | SocialCheckStatus; label: string }> = [
  { id: 'All', label: 'All Statuses' },
  { id: 'found', label: 'Found' },
  { id: 'unverified', label: 'Check Manually' },
  { id: 'not_found', label: 'Not Found' },
];

export function UsernameLookupView() {
  const [input, setInput] = useState('octocat');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<UsernameLookupResponse | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | SocialPlatformCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SocialCheckStatus>('All');

  const runScan = async (rawHandle: string) => {
    const parsed = parseUsernameInput(rawHandle);
    if (!parsed.valid) {
      setValidationError(parsed.reason);
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/username/lookup?username=${encodeURIComponent(parsed.username)}`
      );
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to scan social platforms.');
      }
      setReport(payload);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Unable to complete username lookup.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runScan(input);
  };

  const handleExportCsv = () => {
    if (!report) return;
    const csv = buildSocialCsv(report.username, report.results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `social-lookup-${report.username}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `social-lookup-${report.username}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleResults = report
    ? filterSocialResults(report.results, categoryFilter, statusFilter)
    : [];

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Social Media & Username Lookup
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Search any username or @handle across 23 social, video, developer, and design
            platforms to inspect public profiles and direct account links.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor="username-search-input" className="sr-only">
                Username or social media handle
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="username-search-input"
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Enter username, @handle, or profile URL (e.g. octocat, nasa)"
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'username-search-error' : undefined}
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] font-mono text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
            >
              {isLoading ? 'Scanning 23 Platforms...' : 'Search Platforms'}
            </button>
          </div>

          {validationError && (
            <p id="username-search-error" className="text-xs font-medium text-red-700">
              {validationError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span>Examples:</span>
            {SAMPLE_USERNAMES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setInput(sample);
                  runScan(sample);
                }}
                className="font-mono text-slate-700 hover:text-blue-800 hover:underline underline-offset-4 cursor-pointer"
              >
                @{sample}
              </button>
            ))}
          </div>
        </form>
      </section>

      {apiError && (
        <div
          role="alert"
          className="bg-white border border-red-200 rounded-xl p-5 text-sm text-red-800"
        >
          {apiError}
        </div>
      )}

      {isLoading && !report && (
        <div
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-pulse"
          aria-busy="true"
          aria-label="Scanning social platforms"
        >
          <div className="h-6 w-64 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
          <div className="h-56 w-full bg-slate-100 rounded" />
        </div>
      )}

      {report && (
        <div className="space-y-6" data-testid="username-report">
          {/* Profile Summary & Highlights */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {report.highlights.avatarUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <ResilientImage
                      src={report.highlights.avatarUrl}
                      alt={`${report.username} public avatar`}
                      fallbackTitle={report.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    Handle Scan <span aria-hidden="true">·</span>{' '}
                    <span className="font-mono">@{report.username}</span>
                    {report.highlights.sourcePlatform && (
                      <>
                        {' '}
                        <span aria-hidden="true">·</span> Highlighted from{' '}
                        {report.highlights.sourcePlatform}
                      </>
                    )}
                  </div>
                  <h3
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono"
                    data-testid="scanned-username-heading"
                  >
                    @{report.username}
                    {report.highlights.displayName &&
                    report.highlights.displayName.toLowerCase() !==
                      report.username.toLowerCase() ? (
                      <span className="font-sans font-semibold text-slate-600 text-lg ml-2">
                        ({report.highlights.displayName})
                      </span>
                    ) : null}
                  </h3>
                  {report.highlights.bio && (
                    <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
                      {report.highlights.bio}
                    </p>
                  )}
                  {(report.highlights.location || report.highlights.website) && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {report.highlights.location && (
                        <span>Location: {report.highlights.location}</span>
                      )}
                      {report.highlights.website && (
                        <a
                          href={
                            report.highlights.website.startsWith('http')
                              ? report.highlights.website
                              : `https://${report.highlights.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-800 hover:underline"
                        >
                          {report.highlights.website}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-slate-500">Platforms Scanned</div>
                <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
                  {report.summary.totalChecked}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Verified Found</div>
                <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-emerald-700">
                  {report.summary.foundCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Check Manually</div>
                <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-amber-700">
                  {report.summary.unverifiedCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Not Found</div>
                <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-600">
                  {report.summary.notFoundCount}
                </div>
              </div>
            </div>
          </section>

          {/* Filters & Results Table */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div
                role="tablist"
                aria-label="Filter platforms by category"
                className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start"
              >
                {CATEGORIES.map((cat) => {
                  const selected = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        selected
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div
                role="tablist"
                aria-label="Filter platforms by verification status"
                className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start"
              >
                {STATUS_FILTERS.map((st) => {
                  const selected = statusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        selected
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {visibleResults.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm font-medium text-slate-900">
                  No platforms match the active filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('All');
                    setStatusFilter('All');
                  }}
                  className="mt-3 text-xs font-medium text-blue-800 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left border-collapse text-xs sm:text-sm"
                  data-testid="social-results-table"
                >
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2.5 pr-4 font-medium">Platform</th>
                      <th className="py-2.5 pr-4 font-medium">Category</th>
                      <th className="py-2.5 pr-4 font-medium">Status</th>
                      <th className="py-2.5 pr-4 font-medium">Profile Details</th>
                      <th className="py-2.5 font-medium text-right">Profile Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleResults.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs font-mono text-slate-500">{item.domain}</div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-600 whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {item.status === 'found' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>Found</span>
                            </span>
                          ) : item.status === 'not_found' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <MinusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>Not Found</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>Check Manually</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 max-w-md">
                          <div className="text-xs text-slate-800">
                            {item.displayName && (
                              <span className="font-medium mr-2">{item.displayName}</span>
                            )}
                            {item.metricsLabel && (
                              <span className="font-mono text-slate-500">
                                {item.metricsLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {item.bio || item.statusNote}
                          </div>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <a
                            href={item.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${item.name} profile for ${report.username}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:underline"
                          >
                            <span>Open Profile</span>
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
