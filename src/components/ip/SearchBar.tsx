import type { FormEvent } from 'react';
import { Search } from 'lucide-react';

export type WorkspaceTab = 'inspector' | 'username' | 'subnet' | 'batch' | 'history';

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (target: string) => void;
  isLoading: boolean;
  validationError: string | null;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  historyCount: number;
  onLookupSelf?: () => void;
}

const SAMPLE_TARGETS = [
  { label: '8.8.8.8', hint: 'Google DNS' },
  { label: '1.1.1.1', hint: 'Cloudflare' },
  { label: '2606:4700:4700::1111', hint: 'IPv6' },
  { label: '192.168.1.1', hint: 'Local LAN' },
  { label: 'github.com', hint: 'Domain' },
] as const;

export function SearchBar({
  query,
  onQueryChange,
  onSubmitSearch,
  isLoading,
  validationError,
  activeTab,
  onTabChange,
  historyCount,
  onLookupSelf,
}: SearchBarProps) {
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitSearch(query);
  };

  return (
    <section id="top" className="bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              IP & Social Intelligence Inspector
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 max-w-2xl">
              Look up any IPv4, IPv6, or domain for network intelligence, or search usernames
              across 23 social media and developer platforms.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Workspace tools"
            className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg w-full sm:w-auto self-start lg:self-auto"
          >
            {(
              [
                { id: 'inspector', label: 'IP Inspector' },
                { id: 'username', label: 'Username Lookup' },
                { id: 'subnet', label: 'Subnet Calculator' },
                { id: 'batch', label: 'Batch Lookup' },
                { id: 'history', label: `History (${historyCount})`, fullSpanMobile: true },
              ] as Array<{ id: WorkspaceTab; label: string; fullSpanMobile?: boolean }>
            ).map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-800 ${
                    tab.fullSpanMobile ? 'col-span-2 sm:col-span-1' : ''
                  } ${
                    selected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'inspector' && (
          <form onSubmit={handleFormSubmit} className="mt-5 space-y-3" noValidate>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="ip-search-input" className="sr-only">
                  Search IPv4, IPv6, or domain name
                </label>
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="ip-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Enter IPv4, IPv6, or domain (e.g. 8.8.8.8, 2606:4700:4700::1111, cloudflare.com)"
                  aria-invalid={Boolean(validationError)}
                  aria-describedby={validationError ? 'ip-search-error' : undefined}
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] font-mono text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
              >
                {isLoading ? 'Inspecting...' : 'Lookup IP'}
              </button>
            </div>

            {validationError && (
              <p id="ip-search-error" className="text-xs font-medium text-red-700">
                {validationError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>Examples:</span>
              {SAMPLE_TARGETS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    onQueryChange(sample.label);
                    onSubmitSearch(sample.label);
                  }}
                  className="inline-flex items-center gap-1.5 font-mono text-slate-700 hover:text-blue-800 hover:underline underline-offset-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 rounded-sm"
                >
                  <span>{sample.label}</span>
                  <span className="font-sans text-slate-400">({sample.hint})</span>
                </button>
              ))}
              {onLookupSelf && (
                <button
                  type="button"
                  onClick={onLookupSelf}
                  className="inline-flex items-center gap-1 font-medium text-blue-800 hover:underline underline-offset-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 rounded-sm"
                >
                  Detect My Device IP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
