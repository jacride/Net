import type { IpLookupResponse } from '../types/ip';

export function formatUtcOffset(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  const sign = seconds >= 0 ? '+' : '-';
  const abs = Math.abs(seconds);
  const hours = Math.floor(abs / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatLocalTimeInZone(timezone: string | null): string {
  if (!timezone) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return '—';
  }
}

export function formatIsoDate(iso: string | null): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toISOString().slice(0, 10);
}

export function formatCoordinates(lat: number | null, lon: number | null): string {
  if (lat === null || lon === null) return '—';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

export function buildBatchCsv(
  rows: Array<{ target: string; ok: boolean; data?: IpLookupResponse; error?: string }>
): string {
  const header = [
    'Target',
    'Status',
    'IP',
    'Version',
    'Scope',
    'Country',
    'City',
    'ASN',
    'ISP',
    'BGP Prefix',
    'Proxy/VPN',
    'Hosting',
    'Error',
  ];

  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const lines = rows.map((row) => {
    if (!row.ok || !row.data) {
      return [row.target, 'Error', '', '', '', '', '', '', '', '', '', '', row.error || 'Failed']
        .map(escapeCell)
        .join(',');
    }
    const d = row.data;
    return [
      row.target,
      'OK',
      d.ip,
      `IPv${d.protocol.version}`,
      d.protocol.scope.label,
      d.geo.country || '',
      d.geo.city || '',
      d.network.asn || '',
      d.network.isp || '',
      d.bgp.prefix || '',
      d.security.isProxy === null ? 'Unknown' : d.security.isProxy ? 'Yes' : 'No',
      d.security.isHosting === null ? 'Unknown' : d.security.isHosting ? 'Yes' : 'No',
      '',
    ]
      .map(escapeCell)
      .join(',');
  });

  return [header.map(escapeCell).join(','), ...lines].join('\n');
}
