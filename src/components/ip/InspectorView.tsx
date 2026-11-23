import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Info,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { IpLookupResponse } from '../../types/ip';
import {
  formatCoordinates,
  formatIsoDate,
  formatLocalTimeInZone,
  formatUtcOffset,
} from '../../utils/formatters';
import { analyzePrivateIp } from '../../utils/ipMath';
import { PrivateIpPanels } from './PrivateIpPanels';
import { ThreatIntelSection } from './ThreatIntelSection';
import { WorldPinMap } from './WorldPinMap';

interface InspectorViewProps {
  data: IpLookupResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onInspectIp: (ip: string) => void;
  onOpenSubnet: (cidr: string) => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          <span className="text-emerald-700">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function KeyValueRow({
  label,
  value,
  mono = false,
  copyValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
}) {
  return (
    <div className="py-2.5 flex items-start justify-between gap-4 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs sm:text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className="text-right flex items-center justify-end gap-2 min-w-0">
        <span
          className={`text-xs sm:text-sm text-slate-900 break-all ${
            mono ? 'font-mono tabular-nums' : 'font-medium'
          }`}
        >
          {value}
        </span>
        {copyValue && <CopyButton value={copyValue} label={`Copy ${label}`} />}
      </dd>
    </div>
  );
}

export function InspectorView({
  data,
  isLoading,
  error,
  onRetry,
  onInspectIp,
  onOpenSubnet,
}: InspectorViewProps) {
  const [copiedJson, setCopiedJson] = useState(false);

  if (isLoading && !data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading IP intelligence report">
        <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded mb-3" />
          <div className="h-8 w-72 bg-slate-200 rounded mb-4" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 h-80 animate-pulse" />
          <div className="bg-white border border-slate-200 rounded-xl p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-white border border-red-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Lookup failed</h2>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Retry Lookup
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No IP selected</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter an IPv4, IPv6, or domain name above to inspect full network intelligence.
        </p>
      </div>
    );
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedJson(true);
      window.setTimeout(() => setCopiedJson(false), 1500);
    } catch {
      // Ignore
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ip-report-${data.ip.replace(/:/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const rpkiLabel =
    data.bgp.rpkiStatus === 'valid'
      ? 'Valid ROA'
      : data.bgp.rpkiStatus === 'invalid'
      ? 'Invalid ROA'
      : data.bgp.rpkiStatus === 'not-applicable'
      ? 'Not Applicable'
      : 'Unknown / Unsigned';

  const privateAnalysis =
    !data.protocol.scope.isPublic
      ? data.privateAnalysis ?? analyzePrivateIp(data.ip)
      : null;

  return (
    <div className="space-y-6" data-testid="inspector-report">
      {/* Primary Identity & Actions Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-mono">IPv{data.protocol.version}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-medium ${
                  data.protocol.scope.isPublic ? 'text-emerald-700' : 'text-blue-800'
                }`}
              >
                {data.protocol.scope.label}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{data.protocol.scope.rfc}</span>
              {data.gatewayIp && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onInspectIp(data.gatewayIp!)}
                    className="font-mono text-blue-800 hover:underline cursor-pointer"
                  >
                    Gateway: {data.gatewayIp}
                  </button>
                </>
              )}
              {data.resolvedFromDomain && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Resolved from <span className="font-mono text-slate-700">{data.resolvedFromDomain}</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums break-all"
                data-testid="resolved-ip-heading"
              >
                {data.ip}
              </h2>
              <CopyButton value={data.ip} label={`Copy IP address ${data.ip}`} />
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {data.network.organization || data.network.isp || data.protocol.scope.description}
              {data.gatewayIp ? ` · Active exit gateway ${data.gatewayIp}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedJson ? (
                <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{copiedJson ? 'JSON Copied' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Export JSON</span>
            </button>

            {data.bgp.prefix && data.protocol.version === 4 && (
              <button
                type="button"
                onClick={() => onOpenSubnet(data.bgp.prefix!)}
                className="inline-flex items-center px-3.5 py-2 min-h-[40px] text-xs font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Inspect Subnet {data.bgp.prefix}
              </button>
            )}
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500">Location</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {[data.geo.city, data.geo.regionCode, data.geo.countryCode]
                .filter(Boolean)
                .join(', ') || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Autonomous System</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 font-mono tabular-nums">
              {data.network.asn || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">BGP Prefix</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 font-mono tabular-nums">
              {data.bgp.prefix || privateAnalysis?.parentBlock || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Reverse DNS (PTR)</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 font-mono truncate">
              {data.dns.ptr[0] || (data.gatewayIp ? 'Local LAN scope' : 'No PTR record')}
            </div>
          </div>
        </div>

        {data.warnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-amber-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
            <div className="space-y-1">
              {data.warnings.map((warn, i) => (
                <p key={i}>{warn}</p>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Geolocation & Map + Network/Security Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          id="geolocation"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Geolocation & Timezone
            </h3>
            <span className="text-xs text-slate-500">
              {data.gatewayIp
                ? `Active Gateway (${data.gatewayIp})`
                : data.geo.continent || 'Geographic Metadata'}
            </span>
          </div>

          <WorldPinMap
            latitude={data.geo.latitude}
            longitude={data.geo.longitude}
            city={data.geo.city}
            country={data.geo.country}
          />

          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <KeyValueRow
                label="Country"
                value={
                  data.geo.country
                    ? `${data.geo.country} (${data.geo.countryCode || ''})`
                    : '—'
                }
              />
              <KeyValueRow
                label="Region / State"
                value={data.geo.region || '—'}
              />
              <KeyValueRow label="City" value={data.geo.city || '—'} />
              <KeyValueRow
                label="Postal Code"
                value={data.geo.postal || '—'}
                mono
              />
            </div>

            <div>
              <KeyValueRow
                label="Coordinates"
                value={formatCoordinates(data.geo.latitude, data.geo.longitude)}
                mono
                copyValue={
                  data.geo.latitude !== null && data.geo.longitude !== null
                    ? `${data.geo.latitude}, ${data.geo.longitude}`
                    : undefined
                }
              />
              <KeyValueRow
                label="IANA Timezone"
                value={data.geo.timezone || '—'}
                mono
              />
              <KeyValueRow
                label="Local Time"
                value={
                  data.geo.timezone
                    ? `${formatLocalTimeInZone(data.geo.timezone)} (${formatUtcOffset(
                        data.geo.utcOffsetSeconds
                      )})`
                    : '—'
                }
                mono
              />
              <KeyValueRow
                label="Currency / Dial"
                value={
                  [data.geo.currency, data.geo.callingCode].filter(Boolean).join(' · ') || '—'
                }
                mono
              />
            </div>
          </dl>
        </section>

        {/* Network, BGP & Security Signals */}
        <section
          id="routing"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Network, ISP & BGP Routing
            </h3>

            <dl>
              <KeyValueRow label="ISP" value={data.network.isp || '—'} />
              <KeyValueRow label="Organization" value={data.network.organization || '—'} />
              <KeyValueRow label="AS Number" value={data.network.asn || '—'} mono />
              <KeyValueRow label="AS Name" value={data.network.asnName || '—'} />
              <KeyValueRow label="Announced Prefix" value={data.bgp.prefix || '—'} mono />
              <div className="py-2.5 flex items-center justify-between gap-4 border-b border-slate-100">
                <dt className="text-xs sm:text-sm text-slate-500">RPKI Validation</dt>
                <dd className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                  {data.bgp.rpkiStatus === 'valid' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      <span className="text-emerald-700">{rpkiLabel}</span>
                    </>
                  ) : data.bgp.rpkiStatus === 'invalid' ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-red-700" aria-hidden="true" />
                      <span className="text-red-700">{rpkiLabel}</span>
                    </>
                  ) : (
                    <span className="text-slate-700">{rpkiLabel}</span>
                  )}
                </dd>
              </div>
              <KeyValueRow
                label="Operator Domain"
                value={data.network.domain || '—'}
                mono
              />
            </dl>
          </div>

          <div className="pt-5 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              Security & Network Classification
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="py-2 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-slate-600">Proxy / VPN / Relay</span>
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    data.security.isProxy ? 'text-amber-700' : 'text-slate-900'
                  }`}
                >
                  {data.security.isProxy === null ? (
                    'Unknown'
                  ) : data.security.isProxy ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Detected</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>None</span>
                    </>
                  )}
                </span>
              </div>

              <div className="py-2 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-slate-600">Hosting / Cloud</span>
                <span className="font-medium text-slate-900">
                  {data.security.isHosting === null
                    ? 'Unknown'
                    : data.security.isHosting
                    ? 'Datacenter'
                    : 'Residential / Access'}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-600">Mobile Carrier</span>
                <span className="font-medium text-slate-900">
                  {data.security.isMobile === null
                    ? 'Unknown'
                    : data.security.isMobile
                    ? 'Yes'
                    : 'No'}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-slate-600">Bogon / Reserved</span>
                <span
                  className={`font-medium ${
                    data.security.isBogon ? 'text-amber-700' : 'text-slate-900'
                  }`}
                >
                  {data.security.isBogon ? 'Reserved Range' : 'Public Space'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {privateAnalysis && (
        <PrivateIpPanels
          data={data}
          analysis={privateAnalysis}
          onInspectPublicIp={onInspectIp}
          onOpenSubnet={onOpenSubnet}
        />
      )}

      <ThreatIntelSection data={data} />

      {/* DNS Records (PTR + Forward DNS if queried by domain) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          DNS & Reverse Hostname Records
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">
              Reverse DNS (PTR)
            </div>
            {data.dns.ptr.length > 0 ? (
              <ul className="space-y-1.5 font-mono text-xs sm:text-sm text-slate-900">
                {data.dns.ptr.map((host) => (
                  <li key={host} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0">
                    <span className="truncate">{host}</span>
                    <CopyButton value={host} label={`Copy PTR ${host}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No PTR record published for {data.ip}.</p>
            )}
          </div>

          {data.dns.hostname ? (
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-500">
                Domain Records for <span className="font-mono text-slate-800">{data.dns.hostname}</span>
              </div>

              <div className="space-y-2 text-xs">
                {data.dns.a.length > 0 && (
                  <div>
                    <span className="font-mono font-medium text-slate-500 mr-2">A:</span>
                    <span className="inline-flex flex-wrap gap-2">
                      {data.dns.a.map((ip) => (
                        <button
                          key={ip}
                          type="button"
                          onClick={() => onInspectIp(ip)}
                          className="font-mono text-blue-800 hover:underline cursor-pointer"
                        >
                          {ip}
                        </button>
                      ))}
                    </span>
                  </div>
                )}

                {data.dns.aaaa.length > 0 && (
                  <div>
                    <span className="font-mono font-medium text-slate-500 mr-2">AAAA:</span>
                    <span className="inline-flex flex-wrap gap-2">
                      {data.dns.aaaa.map((ip) => (
                        <button
                          key={ip}
                          type="button"
                          onClick={() => onInspectIp(ip)}
                          className="font-mono text-blue-800 hover:underline cursor-pointer"
                        >
                          {ip}
                        </button>
                      ))}
                    </span>
                  </div>
                )}

                {data.dns.ns.length > 0 && (
                  <div>
                    <span className="font-mono font-medium text-slate-500 mr-2">NS:</span>
                    <span className="font-mono text-slate-800">{data.dns.ns.join(', ')}</span>
                  </div>
                )}

                {data.dns.mx.length > 0 && (
                  <div>
                    <span className="font-mono font-medium text-slate-500 mr-2">MX:</span>
                    <span className="font-mono text-slate-800">
                      {data.dns.mx.map((m) => `${m.priority} ${m.exchange}`).join(' · ')}
                    </span>
                  </div>
                )}

                <div>
                  <span className="font-mono font-medium text-slate-500 mr-2">SPF:</span>
                  <span className="font-mono text-slate-800 break-all">
                    {data.dns.spf || 'No SPF policy published'}
                  </span>
                </div>

                <div>
                  <span className="font-mono font-medium text-slate-500 mr-2">DMARC:</span>
                  <span className="font-mono text-slate-800 break-all">
                    {data.dns.dmarc || 'No DMARC policy published'}
                  </span>
                </div>

                <div>
                  <span className="font-mono font-medium text-slate-500 mr-2">CAA:</span>
                  <span className="font-mono text-slate-800 break-all">
                    {data.dns.caa && data.dns.caa.length > 0
                      ? data.dns.caa.join(' · ')
                      : 'No CAA restrictions'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">
                Reverse Lookup Zone
              </div>
              <p className="font-mono text-xs sm:text-sm text-slate-800 break-all">
                {data.protocol.arpa}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Search a domain name directly (e.g. cloudflare.com) to inspect forward A, AAAA, MX, and NS records.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* WHOIS / RDAP Registration & Contacts */}
      <section id="rdap" className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            WHOIS & RDAP Registry Ownership
          </h3>
          {data.rdap?.registry && (
            <span className="text-xs font-medium text-slate-600">
              Registry: <span className="font-mono text-slate-900">{data.rdap.registry}</span>
            </span>
          )}
        </div>

        {data.rdap ? (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
              <div>
                <KeyValueRow label="Network Name" value={data.rdap.name || '—'} mono />
                <KeyValueRow label="Handle" value={data.rdap.handle || '—'} mono />
                <KeyValueRow label="Parent Handle" value={data.rdap.parentHandle || '—'} mono />
              </div>
              <div>
                <KeyValueRow label="Allocated CIDR" value={data.rdap.cidr || '—'} mono />
                <KeyValueRow label="Range Start" value={data.rdap.startAddress || '—'} mono />
                <KeyValueRow label="Range End" value={data.rdap.endAddress || '—'} mono />
              </div>
              <div>
                <KeyValueRow label="Allocation Type" value={data.rdap.type || '—'} />
                <KeyValueRow
                  label="Registered"
                  value={formatIsoDate(data.rdap.registrationDate)}
                  mono
                />
                <KeyValueRow
                  label="Last Changed"
                  value={formatIsoDate(data.rdap.lastChangedDate)}
                  mono
                />
              </div>
            </dl>

            {data.rdap.contacts.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Registered Entities & Abuse Contacts
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2 pr-4 font-medium">Role</th>
                        <th className="py-2 pr-4 font-medium">Name / Entity</th>
                        <th className="py-2 pr-4 font-medium">Email</th>
                        <th className="py-2 font-medium">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.rdap.contacts.map((contact, idx) => (
                        <tr key={`${contact.role}-${contact.name}-${idx}`}>
                          <td className="py-2.5 pr-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                            {contact.role}
                          </td>
                          <td className="py-2.5 pr-4 font-medium text-slate-900">
                            {contact.name}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-xs text-slate-700">
                            {contact.email ? (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-blue-800 hover:underline"
                              >
                                {contact.email}
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 font-mono text-xs text-slate-700 whitespace-nowrap">
                            {contact.phone || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No public RIR RDAP ownership record is available for this address.
          </p>
        )}
      </section>

      {/* Protocol & Binary Representations */}
      <section id="protocol" className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Protocol, Binary & Address Formats
          </h3>
          <span className="text-xs text-slate-500">
            Sources: {data.sources.join(' · ')}
          </span>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <KeyValueRow
              label="Canonical Form"
              value={data.protocol.canonical}
              mono
              copyValue={data.protocol.canonical}
            />
            <KeyValueRow
              label="Expanded Form"
              value={data.protocol.expanded}
              mono
              copyValue={data.protocol.expanded}
            />
            <KeyValueRow
              label={data.protocol.version === 4 ? '32-bit Integer' : '128-bit Integer'}
              value={data.protocol.integer}
              mono
              copyValue={data.protocol.integer}
            />
            <KeyValueRow
              label="Hexadecimal"
              value={data.protocol.hex}
              mono
              copyValue={data.protocol.hex}
            />
          </div>

          <div>
            <KeyValueRow
              label="Binary"
              value={data.protocol.binary}
              mono
              copyValue={data.protocol.binary}
            />
            <KeyValueRow
              label="Reverse ARPA"
              value={data.protocol.arpa}
              mono
              copyValue={data.protocol.arpa}
            />
            {data.protocol.ipv4Mapped && (
              <KeyValueRow
                label="IPv4-Mapped IPv6"
                value={data.protocol.ipv4Mapped}
                mono
                copyValue={data.protocol.ipv4Mapped}
              />
            )}
            {data.protocol.sixToFourPrefix && (
              <KeyValueRow
                label="6to4 Prefix"
                value={data.protocol.sixToFourPrefix}
                mono
                copyValue={data.protocol.sixToFourPrefix}
              />
            )}
          </div>
        </dl>
      </section>
    </div>
  );
}
