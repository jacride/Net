import { useEffect, useState } from 'react';
import { Globe, Info, Network } from 'lucide-react';
import type { IpLookupResponse, PrivateNetworkAnalysis } from '../../types/ip';
import { calculateIpv4Subnet } from '../../utils/ipMath';

interface PrivateIpPanelsProps {
  data: IpLookupResponse;
  analysis: PrivateNetworkAnalysis;
  onInspectPublicIp: (ip: string) => void;
  onOpenSubnet: (cidr: string) => void;
}

const PREFIX_OPTIONS = [24, 22, 16, 8] as const;

export function PrivateIpPanels({
  data,
  analysis,
  onInspectPublicIp,
  onOpenSubnet,
}: PrivateIpPanelsProps) {
  const [selectedPrefix, setSelectedPrefix] = useState<number>(analysis.defaultPrefix);

  useEffect(() => {
    setSelectedPrefix(analysis.defaultPrefix);
  }, [data.ip, analysis.defaultPrefix]);

  const subnet =
    data.protocol.version === 4
      ? calculateIpv4Subnet(`${data.ip}/${selectedPrefix}`)
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-testid="private-ip-panels">
      {/* Left Card: Local Subnet & Host Analysis */}
      <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-800 shrink-0" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-900">
              Local Subnet & Host Breakdown
            </h3>
          </div>

          {data.protocol.version === 4 && (
            <div
              role="group"
              aria-label="Select local subnet prefix length"
              className="inline-flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-md"
            >
              {PREFIX_OPTIONS.map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => setSelectedPrefix(prefix)}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                    selectedPrefix === prefix
                      ? 'bg-white text-slate-900 shadow-xs font-medium'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  /{prefix}
                </button>
              ))}
            </div>
          )}
        </div>

        <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Detected Address Role</dt>
            <dd className="font-medium text-slate-900 text-right">{analysis.hostRole}</dd>
          </div>

          {subnet && !('error' in subnet) ? (
            <>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Local Subnet CIDR</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {subnet.networkAddress}/{subnet.prefixLength}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Likely Router / Gateway</dt>
                <dd className="font-mono tabular-nums text-slate-900">
                  {subnet.firstUsable}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Usable Device Range</dt>
                <dd className="font-mono tabular-nums text-slate-900 text-right">
                  {subnet.firstUsable} – {subnet.lastUsable}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Broadcast Address</dt>
                <dd className="font-mono tabular-nums text-slate-900">
                  {subnet.broadcastAddress}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Subnet Mask / Wildcard</dt>
                <dd className="font-mono tabular-nums text-slate-900 text-right">
                  {subnet.subnetMask} · {subnet.wildcardMask}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-slate-500">Usable Host Capacity</dt>
                <dd className="font-mono tabular-nums font-semibold text-blue-800">
                  {subnet.usableHosts} devices
                </dd>
              </div>
            </>
          ) : (
            <div className="py-3 text-sm text-slate-600">
              Standard IPv6 interface prefix: <span className="font-mono">/64</span>
            </div>
          )}
        </dl>

        {data.protocol.version === 4 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onOpenSubnet(`${data.ip}/${selectedPrefix}`)}
              className="text-xs font-medium text-blue-800 hover:underline cursor-pointer"
            >
              Open {data.ip}/{selectedPrefix} in full Subnet Calculator
            </button>
          </div>
        )}
      </section>

      {/* Right Card: IANA Special-Purpose Allocation & Active Gateway */}
      <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-800 shrink-0" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-900">
              Address Allocation & Gateway Mapping
            </h3>
          </div>

          {data.gatewayIp && (
            <button
              type="button"
              onClick={() => onInspectPublicIp(data.gatewayIp!)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 hover:underline cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Inspect Gateway {data.gatewayIp}</span>
            </button>
          )}
        </div>

        <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Registry Authority</dt>
            <dd className="font-medium text-slate-900 text-right">{analysis.ianaAuthority}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Parent Reserved Block</dt>
            <dd className="font-mono tabular-nums font-semibold text-slate-900">
              {analysis.parentBlock}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Reserved Address Range</dt>
            <dd className="font-mono tabular-nums text-slate-900 text-right">
              {analysis.parentRange}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Total Block Size</dt>
            <dd className="font-mono tabular-nums text-slate-900">
              {analysis.parentTotalAddresses} addresses
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Legacy Classification</dt>
            <dd className="font-medium text-slate-900 text-right">{analysis.legacyClass}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Typical Network Role</dt>
            <dd className="font-medium text-slate-900 text-right">{analysis.typicalUsage}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-slate-500">Active Exit Gateway</dt>
            <dd className="font-mono tabular-nums font-semibold text-slate-900 text-right">
              {data.gatewayIp || 'Direct Public Routing'}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
