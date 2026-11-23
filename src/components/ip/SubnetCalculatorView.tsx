import { useEffect, useState } from 'react';
import { calculateIpv4Subnet } from '../../utils/ipMath';

interface SubnetCalculatorViewProps {
  initialCidr?: string;
}

const PRESET_CIDRS = [
  '192.168.1.0/24',
  '10.20.0.0/16',
  '8.8.8.0/24',
  '172.16.40.12/22',
  '10.0.0.0/31',
  '1.1.1.1/32',
] as const;

export function SubnetCalculatorView({ initialCidr }: SubnetCalculatorViewProps) {
  const [cidrInput, setCidrInput] = useState(initialCidr || '192.168.1.0/24');

  useEffect(() => {
    if (initialCidr) {
      setCidrInput(initialCidr);
    }
  }, [initialCidr]);

  const result = calculateIpv4Subnet(cidrInput);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">IPv4 Subnet & CIDR Calculator</h2>
        <p className="mt-1 text-sm text-slate-600">
          Calculate network boundaries, usable host range, subnet masks, and RFC scope for any IPv4 CIDR block.
        </p>
      </div>

      <div className="space-y-3">
        <div className="max-w-md">
          <label htmlFor="cidr-input" className="block text-xs font-medium text-slate-700 mb-1.5">
            IPv4 CIDR Notation
          </label>
          <input
            id="cidr-input"
            type="text"
            value={cidrInput}
            onChange={(e) => setCidrInput(e.target.value)}
            placeholder="192.168.1.0/24"
            className="w-full px-3.5 py-2.5 min-h-[44px] font-mono text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>Presets:</span>
          {PRESET_CIDRS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setCidrInput(preset)}
              className="font-mono text-slate-700 hover:text-blue-800 hover:underline underline-offset-4 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {'error' in result ? (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-sm text-red-800">
          {result.error}
        </div>
      ) : (
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <dl>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Network Address</dt>
              <dd className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                {result.networkAddress}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Broadcast Address</dt>
              <dd className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                {result.broadcastAddress}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">First Usable Host</dt>
              <dd className="text-sm font-mono tabular-nums text-slate-900">
                {result.firstUsable}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Last Usable Host</dt>
              <dd className="text-sm font-mono tabular-nums text-slate-900">
                {result.lastUsable}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-sm text-slate-500">Address Scope</dt>
              <dd className="text-sm font-medium text-slate-900">
                {result.scope.label} ({result.scope.rfc})
              </dd>
            </div>
          </dl>

          <dl>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Subnet Mask</dt>
              <dd className="text-sm font-mono tabular-nums text-slate-900">
                {result.subnetMask} (/{result.prefixLength})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Wildcard Mask</dt>
              <dd className="text-sm font-mono tabular-nums text-slate-900">
                {result.wildcardMask}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Total IP Addresses</dt>
              <dd className="text-sm font-mono tabular-nums font-semibold text-slate-900">
                {result.totalAddresses}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 border-b border-slate-100">
              <dt className="text-sm text-slate-500">Usable Hosts</dt>
              <dd className="text-sm font-mono tabular-nums font-semibold text-blue-800">
                {result.usableHosts}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-sm text-slate-500">Binary Mask</dt>
              <dd className="text-xs font-mono tabular-nums text-slate-800 break-all text-right">
                {result.binaryMask}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
