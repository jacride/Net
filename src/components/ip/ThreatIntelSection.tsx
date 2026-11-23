import { useState } from 'react';
import {
  Check,
  Copy,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { IpLookupResponse } from '../../types/ip';
import {
  buildAbuseReportDraft,
  findPrimaryAbuseEmail,
  summarizeThreatPosture,
} from '../../utils/threatReport';

interface ThreatIntelSectionProps {
  data: IpLookupResponse;
}

export function ThreatIntelSection({ data }: ThreatIntelSectionProps) {
  const [observedNote, setObservedNote] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  const threat = data.threatIntel;
  const posture = summarizeThreatPosture(threat, data.security);
  const abuseEmail = findPrimaryAbuseEmail(data);
  const reportDraft = buildAbuseReportDraft(data, observedNote);

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(reportDraft);
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 1500);
    } catch {
      // Clipboard API unavailable
    }
  };

  const mailtoHref = abuseEmail
    ? `mailto:${encodeURIComponent(abuseEmail)}?subject=${encodeURIComponent(
        `Abuse / Security Incident Report for ${data.ip}`
      )}&body=${encodeURIComponent(reportDraft)}`
    : null;

  return (
    <section
      id="threat-intel"
      data-testid="threat-intel-section"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {posture.level === 'high' ? (
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
          ) : posture.level === 'elevated' ? (
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Threat Intelligence, Exposure & Incident Triage
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{posture.summary}</p>
          </div>
        </div>

        <span
          className={`text-xs font-semibold whitespace-nowrap ${
            posture.level === 'high'
              ? 'text-red-700'
              : posture.level === 'elevated'
              ? 'text-amber-700'
              : 'text-emerald-700'
          }`}
        >
          {posture.label}
        </span>
      </div>

      {/* Passive Ports, CVEs, Blocklists & Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
        <div className="lg:col-span-6 space-y-4">
          <h4 className="text-sm font-semibold text-slate-900">
            Passive Service & Reputation Signals
          </h4>

          <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Indexed Open Ports</dt>
              <dd className="font-mono tabular-nums text-slate-900 text-right">
                {threat && threat.openPorts.length > 0
                  ? threat.openPorts.join(', ')
                  : 'None indexed'}
              </dd>
            </div>

            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">DNSBL Blocklists</dt>
              <dd
                className={`font-medium text-right ${
                  threat?.dnsblListed ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {threat?.dnsblListed
                  ? threat.dnsblMatches.join(', ')
                  : 'Clean (SpamCop, Abuseat CBL, Tor)'}
              </dd>
            </div>

            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Tor Exit Node</dt>
              <dd
                className={`font-medium text-right ${
                  threat?.torExit ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {threat?.torExit ? 'Yes (Confirmed Exit Relay)' : 'No'}
              </dd>
            </div>

            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">InternetDB Tags</dt>
              <dd className="font-mono text-slate-900 text-right">
                {threat && threat.tags.length > 0 ? threat.tags.join(', ') : 'None'}
              </dd>
            </div>

            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Software / CPEs</dt>
              <dd className="font-mono text-xs text-slate-800 text-right break-all">
                {threat && threat.cpes.length > 0 ? threat.cpes.join(', ') : 'None fingerprinted'}
              </dd>
            </div>

            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Indexed Hostnames</dt>
              <dd className="font-mono text-xs text-slate-800 text-right break-all">
                {threat && threat.hostnames.length > 0
                  ? threat.hostnames.join(', ')
                  : 'None indexed'}
              </dd>
            </div>

            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 shrink-0">Known CVEs</dt>
              <dd className="text-right font-mono text-xs">
                {threat && threat.vulns.length > 0 ? (
                  <span className="inline-flex flex-wrap justify-end gap-x-2.5 gap-y-1">
                    {threat.vulns.map((cve) => (
                      <a
                        key={cve}
                        href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cve)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 hover:underline font-medium"
                      >
                        {cve}
                      </a>
                    ))}
                  </span>
                ) : (
                  <span className="text-slate-900">0 known CVEs</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Right Column: Copy-Ready Abuse / Incident Report Builder */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              Incident & Abuse Report Builder
            </h4>
            {abuseEmail && (
              <span className="text-xs font-mono text-slate-600">
                Contact: {abuseEmail}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="abuse-observed-note" className="sr-only">
              Observed activity or log evidence
            </label>
            <input
              id="abuse-observed-note"
              type="text"
              value={observedNote}
              onChange={(e) => setObservedNote(e.target.value)}
              placeholder="Add observed evidence (e.g. Repeated SSH brute force on port 22 at 05:15 UTC)"
              className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            />
          </div>

          <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] leading-relaxed font-mono text-slate-800 overflow-x-auto max-h-52 whitespace-pre-wrap">
            {reportDraft}
          </pre>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyDraft}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] text-xs font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Report Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Abuse Report</span>
                </>
              )}
            </button>

            {mailtoHref && (
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open in Email Client</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
