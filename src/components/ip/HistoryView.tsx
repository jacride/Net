import { Trash2 } from 'lucide-react';
import type { LookupHistoryItem } from '../../types/ip';

interface HistoryViewProps {
  items: LookupHistoryItem[];
  onSelectTarget: (target: string) => void;
  onDeleteItem: (ip: string) => void;
  onClearAll: () => void;
}

export function HistoryView({
  items,
  onSelectTarget,
  onDeleteItem,
  onClearAll,
}: HistoryViewProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Lookups</h2>
          <p className="mt-1 text-sm text-slate-600">
            Saved locally in your browser so you can revisit any address across sessions.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear All History
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm font-medium text-slate-900">No lookup history yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Search any IP address or domain above and it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm" data-testid="history-table">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">IP / Target</th>
                <th className="py-2.5 pr-4 font-medium">Location</th>
                <th className="py-2.5 pr-4 font-medium">ASN & ISP</th>
                <th className="py-2.5 pr-4 font-medium">Looked Up</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.ip} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => onSelectTarget(item.ip)}
                      className="font-mono font-semibold text-blue-800 hover:underline cursor-pointer"
                    >
                      {item.ip}
                    </button>
                    {item.query !== item.ip && (
                      <div className="text-xs font-mono text-slate-500">{item.query}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {[item.city, item.countryCode].filter(Boolean).join(', ') || 'Non-public'}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {[item.asn, item.isp].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {new Date(item.lookedUpAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.ip)}
                      aria-label={`Delete ${item.ip} from history`}
                      className="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
