interface TopNavProps {
  onLookupSelf: () => void;
  isLoadingSelf: boolean;
  onNavigateTab: (tab: 'inspector' | 'username') => void;
}

export function TopNav({
  onLookupSelf,
  isLoadingSelf,
  onNavigateTab,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 rounded-sm"
        >
          NetSIIprobe
        </a>

        <nav
          aria-label="Report sections"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#geolocation"
            onClick={() => onNavigateTab('inspector')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Geolocation
          </a>
          <a
            href="#routing"
            onClick={() => onNavigateTab('inspector')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Network & BGP
          </a>
          <a
            href="#threat-intel"
            onClick={() => onNavigateTab('inspector')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Threat Intel
          </a>
          <a
            href="#rdap"
            onClick={() => onNavigateTab('inspector')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            WHOIS & RDAP
          </a>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNavigateTab('username');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Social Lookup
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLookupSelf}
            disabled={isLoadingSelf}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[38px] text-xs sm:text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          >
            {isLoadingSelf ? 'Detecting...' : 'My Public IP'}
          </button>
        </div>
      </div>
    </header>
  );
}
