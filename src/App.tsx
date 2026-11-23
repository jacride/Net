import { useCallback, useEffect, useState } from 'react';
import { BatchLookupView } from './components/ip/BatchLookupView';
import { HistoryView } from './components/ip/HistoryView';
import { InspectorView } from './components/ip/InspectorView';
import { SearchBar, type WorkspaceTab } from './components/ip/SearchBar';
import { SubnetCalculatorView } from './components/ip/SubnetCalculatorView';
import { TopNav } from './components/ip/TopNav';
import { UsernameLookupView } from './components/ip/UsernameLookupView';
import type { IpLookupResponse, LookupHistoryItem } from './types/ip';
import { parseTargetInput } from './utils/ipMath';

const HISTORY_STORAGE_KEY = 'netprobe_ip_history_v1';

function readStoredHistory(): LookupHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [query, setQuery] = useState('8.8.8.8');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('inspector');
  const [subnetCidr, setSubnetCidr] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<IpLookupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSelf, setIsLoadingSelf] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [history, setHistory] = useState<LookupHistoryItem[]>(readStoredHistory);

  const pushHistory = useCallback((item: IpLookupResponse) => {
    const entry: LookupHistoryItem = {
      ip: item.ip,
      query: item.query,
      country: item.geo.country,
      countryCode: item.geo.countryCode,
      city: item.geo.city,
      asn: item.network.asn,
      isp: item.network.isp,
      lookedUpAt: item.fetchedAt,
    };

    setHistory((prev) => {
      const next = [entry, ...prev.filter((h) => h.ip !== entry.ip)].slice(0, 20);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const runLookup = useCallback(
    async (rawTarget: string, recordHistory = true) => {
      const parsed = parseTargetInput(rawTarget);
      if (parsed.kind === 'invalid') {
        setValidationError(parsed.reason);
        return;
      }

      setValidationError(null);
      setApiError(null);
      setIsLoading(true);
      setActiveTab('inspector');

      try {
        const res = await fetch(
          `/api/ip/lookup?target=${encodeURIComponent(rawTarget.trim())}`
        );
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to inspect IP target.');
        }
        setReport(payload);
        if (recordHistory) {
          pushHistory(payload);
        }
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Unable to complete IP lookup.');
      } finally {
        setIsLoading(false);
      }
    },
    [pushHistory]
  );

  const handleLookupSelf = async () => {
    setValidationError(null);
    setApiError(null);
    setIsLoadingSelf(true);
    setIsLoading(true);
    setActiveTab('inspector');

    try {
      const res = await fetch('/api/ip/self');
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to detect your public IP.');
      }
      setQuery(payload.ip);
      setReport(payload);
      pushHistory(payload);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to detect your public IP.');
    } finally {
      setIsLoadingSelf(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runLookup('8.8.8.8', false);
  }, [runLookup]);

  const handleOpenSubnet = (cidr: string) => {
    setSubnetCidr(cidr);
    setActiveTab('subnet');
  };

  const handleDeleteHistoryItem = (ip: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.ip !== ip);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopNav
        onLookupSelf={handleLookupSelf}
        isLoadingSelf={isLoadingSelf}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <SearchBar
        query={query}
        onQueryChange={(val) => {
          setQuery(val);
          if (validationError) setValidationError(null);
        }}
        onSubmitSearch={(target) => runLookup(target, true)}
        isLoading={isLoading}
        validationError={validationError}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={history.length}
        onLookupSelf={handleLookupSelf}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'inspector' && (
          <InspectorView
            data={report}
            isLoading={isLoading}
            error={apiError}
            onRetry={() => runLookup(query, false)}
            onInspectIp={(ip) => {
              setQuery(ip);
              runLookup(ip, true);
            }}
            onOpenSubnet={handleOpenSubnet}
          />
        )}

        {activeTab === 'username' && <UsernameLookupView />}

        {activeTab === 'subnet' && <SubnetCalculatorView initialCidr={subnetCidr} />}

        {activeTab === 'batch' && (
          <BatchLookupView
            onInspectTarget={(ip) => {
              setQuery(ip);
              runLookup(ip, true);
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            items={history}
            onSelectTarget={(ip) => {
              setQuery(ip);
              runLookup(ip, true);
            }}
            onDeleteItem={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">NetSIIprobe</span>
            <span aria-hidden="true">·</span>
            <span>IPv4, IPv6, DNS, BGP, RDAP & Social Handle Inspector</span>
          </div>
          <div>
            Data aggregated live from RIR RDAP, RIPEstat, DNS, geolocation registries, and public platform endpoints.
          </div>
        </div>
      </footer>
    </div>
  );
}
