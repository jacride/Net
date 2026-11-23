import { useState, type FormEvent } from 'react';
import { Download } from 'lucide-react';
import type { IpLookupResponse } from '../../types/ip';
import { buildBatchCsv } from '../../utils/formatters';

interface BatchRow {
  ok: boolean;
  target: string;
  data?: IpLookupResponse;
  error?: string;
}

interface BatchLookupViewProps {
  onInspectTarget: (ip: string) => void;
}

export function BatchLookupView({ onInspectTarget }: BatchLookupViewProps) {
  const [rawInput, setRawInput] = useState('8.8.8.8\n1.1.1.1\n192.168.1.1');
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targets = rawInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);

    if (targets.length === 0) {
      setError('Enter at least one IP address or domain name.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/ip/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Batch lookup failed.');
      }
      setRows(payload.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csv = buildBatchCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'netprobe-batch-lookup.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Batch IP Comparison</h2>
          <p className="mt-1 text-sm text-slate-600">
            Inspect up to 10 IPv4, IPv6, or domain targets side-by-side and export results to CSV.
          </p>
        </div>

        {rows.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="batch-targets-input" className="block text-xs font-medium text-slate-700 mb-1.5">
            Targets (one per line or comma-separated, max 10)
          </label>
          <textarea
            id="batch-targets-input"
            rows={4}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="8.8.8.8&#10;1.1.1.1&#10;github.com"
            className="w-full px-3.5 py-2.5 font-mono text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 min-h-[40px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {isLoading ? 'Running Batch...' : 'Run Batch Lookup'}
          </button>

          <button
            type="button"
            onClick={() => setRawInput('8.8.8.8\n1.1.1.1\n9.9.9.9\n2606:4700:4700::1111\n192.168.1.1')}
            className="px-4 py-2.5 min-h-[40px] text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Load Sample Set
          </button>
        </div>
      </form>

      {rows.length > 0 && (
        <div className="pt-4 border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm" data-testid="batch-results-table">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Target</th>
                <th className="py-2.5 pr-4 font-medium">IP & Scope</th>
                <th className="py-2.5 pr-4 font-medium">Location</th>
                <th className="py-2.5 pr-4 font-medium">ASN / ISP</th>
                <th className="py-2.5 pr-4 font-medium">Prefix</th>
                <th className="py-2.5 pr-4 font-medium">Flags</th>
                <th className="py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                if (!row.ok || !row.data) {
                  return (
                    <tr key={`${row.target}-${idx}`}>
                      <td className="py-3 pr-4 font-mono text-slate-900">{row.target}</td>
                      <td colSpan={6} className="py-3 text-red-700">
                        {row.error || 'Lookup failed'}
                      </td>
                    </tr>
                  );
                }
                const d = row.data;
                const flags = [
                  d.security.isBogon ? 'Reserved' : null,
                  d.security.isProxy ? 'Proxy/VPN' : null,
                  d.security.isHosting ? 'Hosting' : null,
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <tr key={`${row.target}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-mono text-slate-900 whitespace-nowrap">
                      {row.target}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-mono tabular-nums text-slate-900">{d.ip}</div>
                      <div className="text-xs text-slate-500">{d.protocol.scope.label}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {[d.geo.city, d.geo.countryCode].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-mono text-xs text-slate-900">
                        {d.network.asn || '—'}
                      </div>
                      <div className="text-xs text-slate-600 truncate max-w-[200px]">
                        {d.network.isp || '—'}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {d.bgp.prefix || '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-700 whitespace-nowrap">
                      {flags || 'Standard'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onInspectTarget(d.ip)}
                        aria-label={`Inspect ${d.ip}`}
                        className="text-xs font-medium text-blue-800 hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
