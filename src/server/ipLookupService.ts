import dns from 'node:dns/promises';
import type {
  BgpInfo,
  DnsRecordsInfo,
  GeoLocationInfo,
  IpLookupResponse,
  NetworkInfo,
  RdapContact,
  RdapInfo,
  SecuritySignals,
  ThreatIntelInfo,
} from '../types/ip.ts';
import {
  analyzePrivateIp,
  buildIpProtocolInfo,
  extractFirstPublicIp,
  isValidIpv4,
  parseTargetInput,
} from '../utils/ipMath.ts';

export class LookupError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 4000): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'NetSIIprobe-IP-Inspector/1.0' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
  }
  return (await response.json()) as T;
}

async function reverseDnsWithTimeout(ip: string, timeoutMs = 2000): Promise<string[]> {
  try {
    const result = await Promise.race([
      dns.reverse(ip),
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('DNS reverse timeout')), timeoutMs)
      ),
    ]);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

async function resolveDomainRecords(hostname: string): Promise<DnsRecordsInfo> {
  const [aRes, aaaaRes, mxRes, nsRes, txtRes, dmarcRes, caaRes] = await Promise.allSettled([
    dns.resolve4(hostname),
    dns.resolve6(hostname),
    dns.resolveMx(hostname),
    dns.resolveNs(hostname),
    dns.resolveTxt(hostname),
    dns.resolveTxt(`_dmarc.${hostname}`),
    dns.resolveCaa(hostname),
  ]);

  const txtValues =
    txtRes.status === 'fulfilled'
      ? txtRes.value.map((chunks) => chunks.join(''))
      : [];
  const spf =
    txtValues.find((record) => record.toLowerCase().startsWith('v=spf1')) ?? null;

  const dmarcValues =
    dmarcRes.status === 'fulfilled'
      ? dmarcRes.value.map((chunks) => chunks.join(''))
      : [];
  const dmarc =
    dmarcValues.find((record) => record.toLowerCase().startsWith('v=dmarc1')) ?? null;

  const caa =
    caaRes.status === 'fulfilled'
      ? caaRes.value.map((entry) => {
          const criticalFlag = entry.critical ?? 0;
          const key = entry.issue ? 'issue' : entry.issuewild ? 'issuewild' : entry.iodef ? 'iodef' : 'record';
          const val = entry.issue || entry.issuewild || entry.iodef || '';
          return `${criticalFlag} ${key} "${val}"`;
        })
      : [];

  return {
    hostname,
    a: aRes.status === 'fulfilled' ? aRes.value : [],
    aaaa: aaaaRes.status === 'fulfilled' ? aaaaRes.value : [],
    mx:
      mxRes.status === 'fulfilled'
        ? mxRes.value.sort((x, y) => x.priority - y.priority)
        : [],
    ns: nsRes.status === 'fulfilled' ? nsRes.value : [],
    txt: txtValues.slice(0, 6),
    ptr: [],
    spf,
    dmarc,
    caa,
  };
}

interface ShodanInternetDbResponse {
  ports?: number[];
  cpes?: string[];
  vulns?: string[];
  tags?: string[];
  hostnames?: string[];
}

async function fetchShodanInternetDb(
  ip: string
): Promise<{ data: ShodanInternetDbResponse; ok: boolean }> {
  try {
    const response = await fetch(
      `https://internetdb.shodan.io/${encodeURIComponent(ip)}`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'NetSIIprobe-IP-Inspector/1.0' },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (response.status === 404) {
      return { data: {}, ok: true };
    }
    if (!response.ok) {
      return { data: {}, ok: false };
    }
    const json = (await response.json()) as ShodanInternetDbResponse;
    return { data: json, ok: true };
  } catch {
    return { data: {}, ok: false };
  }
}

const DNSBL_PROVIDERS = [
  { name: 'Tor Project Exit Node', zone: 'dnsel.torproject.org', isTor: true },
  { name: 'SpamCop', zone: 'bl.spamcop.net', isTor: false },
  { name: 'Abuseat CBL', zone: 'cbl.abuseat.org', isTor: false },
] as const;

async function checkDnsbl(ip: string): Promise<{ matches: string[]; torExit: boolean }> {
  if (!isValidIpv4(ip)) {
    return { matches: [], torExit: false };
  }
  const reversed = ip.split('.').reverse().join('.');
  const checks = await Promise.allSettled(
    DNSBL_PROVIDERS.map(async (provider) => {
      const result = await Promise.race([
        dns.resolve4(`${reversed}.${provider.zone}`),
        new Promise<string[]>((_, reject) =>
          setTimeout(() => reject(new Error('DNSBL timeout')), 1500)
        ),
      ]);
      // Only treat genuine 127.0.0.x codes as a listing (ignore 127.255.x.x query-refused codes)
      const validListing = result.some(
        (addr) => addr.startsWith('127.0.0.') && !addr.startsWith('127.255.')
      );
      return validListing ? provider : null;
    })
  );

  const matches: string[] = [];
  let torExit = false;
  for (const item of checks) {
    if (item.status === 'fulfilled' && item.value) {
      matches.push(item.value.name);
      if (item.value.isTor) {
        torExit = true;
      }
    }
  }
  return { matches, torExit };
}

function extractVcardField(vcardArray: unknown, fieldName: string): string | null {
  if (!Array.isArray(vcardArray) || vcardArray.length < 2 || !Array.isArray(vcardArray[1])) {
    return null;
  }
  const entries = vcardArray[1] as unknown[];
  for (const item of entries) {
    if (!Array.isArray(item) || item.length < 4) continue;
    if (String(item[0]).toLowerCase() === fieldName.toLowerCase()) {
      const value = item[3];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (Array.isArray(value)) {
        const joined = value.filter((v) => typeof v === 'string' && v.trim()).join(', ');
        if (joined) return joined;
      }
      if (typeof item[1] === 'object' && item[1] !== null && 'label' in item[1]) {
        const label = (item[1] as { label?: unknown }).label;
        if (typeof label === 'string' && label.trim()) {
          return label.replace(/\n+/g, ', ').trim();
        }
      }
    }
  }
  return null;
}

interface RawRdapEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: unknown;
  entities?: RawRdapEntity[];
}

function collectRdapContacts(entities: RawRdapEntity[] | undefined, acc: RdapContact[] = []): RdapContact[] {
  if (!Array.isArray(entities)) return acc;
  for (const entity of entities) {
    const roles = Array.isArray(entity.roles) ? entity.roles : [];
    const fn = extractVcardField(entity.vcardArray, 'fn') || entity.handle || null;
    const email = extractVcardField(entity.vcardArray, 'email');
    const phone = extractVcardField(entity.vcardArray, 'tel');
    const address = extractVcardField(entity.vcardArray, 'adr');

    if (fn || email || phone) {
      acc.push({
        role: roles.length > 0 ? roles.join(', ') : 'entity',
        name: fn || 'Unnamed Entity',
        email,
        phone,
        address,
      });
    }

    if (Array.isArray(entity.entities)) {
      collectRdapContacts(entity.entities, acc);
    }
  }
  return acc;
}

function inferRegistryFromRdap(raw: Record<string, unknown>): string | null {
  const port43 = typeof raw.port43 === 'string' ? raw.port43.toLowerCase() : '';
  if (port43.includes('arin')) return 'ARIN';
  if (port43.includes('ripe')) return 'RIPE NCC';
  if (port43.includes('apnic')) return 'APNIC';
  if (port43.includes('lacnic')) return 'LACNIC';
  if (port43.includes('afrinic')) return 'AFRINIC';

  const links = Array.isArray(raw.links) ? raw.links : [];
  for (const link of links) {
    if (typeof link === 'object' && link !== null && 'href' in link) {
      const href = String((link as { href: unknown }).href).toLowerCase();
      if (href.includes('arin.net')) return 'ARIN';
      if (href.includes('ripe.net')) return 'RIPE NCC';
      if (href.includes('apnic.net')) return 'APNIC';
      if (href.includes('lacnic.net')) return 'LACNIC';
      if (href.includes('afrinic.net')) return 'AFRINIC';
    }
  }
  return null;
}

function parseRdapPayload(raw: Record<string, unknown>, ip: string): RdapInfo {
  const cidrList = Array.isArray(raw.cidr0_cidrs) ? raw.cidr0_cidrs : [];
  let cidr: string | null = null;
  if (cidrList.length > 0 && typeof cidrList[0] === 'object' && cidrList[0] !== null) {
    const first = cidrList[0] as { v4prefix?: string; v6prefix?: string; length?: number };
    const prefix = first.v4prefix || first.v6prefix;
    if (prefix && typeof first.length === 'number') {
      cidr = `${prefix}/${first.length}`;
    }
  }

  const events = Array.isArray(raw.events) ? raw.events : [];
  let registrationDate: string | null = null;
  let lastChangedDate: string | null = null;
  for (const ev of events) {
    if (typeof ev !== 'object' || ev === null) continue;
    const action = String((ev as { eventAction?: unknown }).eventAction || '').toLowerCase();
    const date = typeof (ev as { eventDate?: unknown }).eventDate === 'string'
      ? (ev as { eventDate: string }).eventDate
      : null;
    if (!date) continue;
    if (action === 'registration') registrationDate = date;
    if (action === 'last changed') lastChangedDate = date;
  }

  const rawContacts = collectRdapContacts(raw.entities as RawRdapEntity[] | undefined);
  const seen = new Set<string>();
  const contacts = rawContacts.filter((c) => {
    const key = `${c.role}|${c.name}|${c.email || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);

  return {
    registry: inferRegistryFromRdap(raw),
    handle: typeof raw.handle === 'string' ? raw.handle : null,
    name: typeof raw.name === 'string' ? raw.name : null,
    cidr,
    startAddress: typeof raw.startAddress === 'string' ? raw.startAddress : null,
    endAddress: typeof raw.endAddress === 'string' ? raw.endAddress : null,
    parentHandle: typeof raw.parentHandle === 'string' ? raw.parentHandle : null,
    type: typeof raw.type === 'string' ? raw.type : null,
    registrationDate,
    lastChangedDate,
    contacts,
    rawUrl: `https://rdap.arin.net/registry/ip/${encodeURIComponent(ip)}`,
  };
}

interface IpApiResponse {
  status: 'success' | 'fail';
  message?: string;
  continent?: string;
  continentCode?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  offset?: number;
  currency?: string;
  isp?: string;
  org?: string;
  as?: string;
  asname?: string;
  reverse?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  query?: string;
}

interface IpWhoIsResponse {
  success?: boolean;
  continent?: string;
  continent_code?: string;
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  calling_code?: string;
  timezone?: { id?: string; offset?: number };
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  currency?: { code?: string };
}

interface RipeNetworkInfoResponse {
  data?: {
    asns?: string[];
    prefix?: string;
  };
}

interface RipeRpkiResponse {
  data?: {
    status?: 'valid' | 'invalid' | 'unknown';
  };
}

export interface CallerNetworkContext {
  forwarded?: string;
  remoteAddress?: string;
}

export async function lookupTarget(
  rawTarget: string,
  callerContext?: CallerNetworkContext
): Promise<IpLookupResponse> {
  const parsed = parseTargetInput(rawTarget);
  if (parsed.kind === 'invalid') {
    throw new LookupError(400, parsed.reason);
  }

  let resolvedFromDomain: string | null = null;
  let targetIp = parsed.value;
  let dnsRecords: DnsRecordsInfo = {
    a: [],
    aaaa: [],
    mx: [],
    ns: [],
    txt: [],
    ptr: [],
  };

  if (parsed.kind === 'domain') {
    resolvedFromDomain = parsed.value;
    dnsRecords = await resolveDomainRecords(parsed.value);
    if (dnsRecords.a.length > 0) {
      targetIp = dnsRecords.a[0];
    } else if (dnsRecords.aaaa.length > 0) {
      targetIp = dnsRecords.aaaa[0];
    } else {
      throw new LookupError(
        404,
        `Domain "${parsed.value}" did not resolve to any A or AAAA IP records.`
      );
    }
  }

  const protocol = buildIpProtocolInfo(targetIp);
  const privateAnalysis = !protocol.scope.isPublic ? analyzePrivateIp(targetIp) : null;
  const sources: string[] = ['Local Protocol Analyzer'];
  const warnings: string[] = [];

  let gatewayIp: string | null = null;
  let routingIp = protocol.canonical;
  if (!protocol.scope.isPublic) {
    gatewayIp = await detectCallerPublicIp(
      callerContext?.forwarded,
      callerContext?.remoteAddress
    );
    routingIp = gatewayIp;
    sources.push('Active NAT Gateway');
  }

  const encodedTargetIp = encodeURIComponent(protocol.canonical);
  const encodedRoutingIp = encodeURIComponent(routingIp);
  const ipApiUrl = `http://ip-api.com/json/${encodedRoutingIp}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;
  const ipWhoUrl = `https://ipwho.is/${encodedRoutingIp}`;
  const rdapUrl = `https://rdap.arin.net/registry/ip/${encodedTargetIp}`;
  const ripeNetUrl = `https://stat.ripe.net/data/network-info/data.json?resource=${encodedRoutingIp}`;

  const [ipApiRes, ipWhoRes, rdapRes, ripeNetRes, ptrRes, internetDbRes, dnsblRes] =
    await Promise.allSettled([
      fetchJsonWithTimeout<IpApiResponse>(ipApiUrl, 4000),
      fetchJsonWithTimeout<IpWhoIsResponse>(ipWhoUrl, 4000),
      fetchJsonWithTimeout<Record<string, unknown>>(rdapUrl, 4500),
      fetchJsonWithTimeout<RipeNetworkInfoResponse>(ripeNetUrl, 4000),
      reverseDnsWithTimeout(protocol.canonical, 2000),
      fetchShodanInternetDb(routingIp),
      checkDnsbl(routingIp),
    ]);

  const ipApi =
    ipApiRes.status === 'fulfilled' && ipApiRes.value.status === 'success'
      ? ipApiRes.value
      : null;
  const ipWho =
    ipWhoRes.status === 'fulfilled' && ipWhoRes.value.success !== false
      ? ipWhoRes.value
      : null;

  if (ipApi) sources.push('ip-api.com');
  if (ipWho) sources.push('ipwho.is');
  if (internetDbRes.status === 'fulfilled' && internetDbRes.value.ok) {
    sources.push('Shodan InternetDB');
  }
  if (!ipApi && !ipWho) {
    warnings.push('Upstream geolocation providers timed out or were unreachable.');
  }

  let rdap: RdapInfo | null = null;
  if (rdapRes.status === 'fulfilled') {
    rdap = parseRdapPayload(rdapRes.value, protocol.canonical);
    sources.push(rdap.registry ? `RDAP (${rdap.registry})` : 'RDAP');
  } else if (gatewayIp) {
    try {
      const gwRdapRaw = await fetchJsonWithTimeout<Record<string, unknown>>(
        `https://rdap.arin.net/registry/ip/${encodedRoutingIp}`,
        3500
      );
      rdap = parseRdapPayload(gwRdapRaw, routingIp);
      sources.push(rdap.registry ? `RDAP (${rdap.registry})` : 'RDAP');
    } catch {
      warnings.push('RIR RDAP registry lookup did not return a record.');
    }
  } else {
    warnings.push('RIR RDAP registry lookup did not return a record.');
  }

  const bgpPrefix =
    ripeNetRes.status === 'fulfilled' ? ripeNetRes.value.data?.prefix || null : null;
  const bgpAsns =
    ripeNetRes.status === 'fulfilled' && Array.isArray(ripeNetRes.value.data?.asns)
      ? ripeNetRes.value.data.asns
      : [];
  if (ripeNetRes.status === 'fulfilled' && (bgpPrefix || bgpAsns.length > 0)) {
    sources.push('RIPEstat Routing');
  }

  let rpkiStatus: BgpInfo['rpkiStatus'] = 'unknown';
  if (bgpPrefix && bgpAsns.length > 0) {
    try {
      const rpkiRes = await fetchJsonWithTimeout<RipeRpkiResponse>(
        `https://stat.ripe.net/data/rpki-validation/data.json?resource=${encodeURIComponent(
          bgpAsns[0]
        )}&prefix=${encodeURIComponent(bgpPrefix)}`,
        2500
      );
      if (rpkiRes.data?.status) {
        rpkiStatus = rpkiRes.data.status;
      }
    } catch {
      rpkiStatus = 'unknown';
    }
  }

  const ptrSet = new Set<string>(
    ptrRes.status === 'fulfilled' ? ptrRes.value : []
  );
  if (ipApi?.reverse && !gatewayIp) {
    ptrSet.add(ipApi.reverse);
  }
  dnsRecords.ptr = Array.from(ptrSet);

  const asnRaw = ipApi?.as ? ipApi.as.split(' ')[0] : null;
  const asnFormatted =
    asnRaw ||
    (ipWho?.connection?.asn ? `AS${ipWho.connection.asn}` : null) ||
    (bgpAsns.length > 0 ? `AS${bgpAsns[0]}` : null);

  const geo: GeoLocationInfo = {
    continent: ipApi?.continent ?? ipWho?.continent ?? null,
    continentCode: ipApi?.continentCode ?? ipWho?.continent_code ?? null,
    country: ipApi?.country ?? ipWho?.country ?? null,
    countryCode: ipApi?.countryCode ?? ipWho?.country_code ?? null,
    region: ipApi?.regionName ?? ipWho?.region ?? null,
    regionCode: ipApi?.region ?? ipWho?.region_code ?? null,
    city: ipApi?.city ?? ipWho?.city ?? null,
    postal: ipApi?.zip ?? ipWho?.postal ?? null,
    latitude: ipApi?.lat ?? ipWho?.latitude ?? null,
    longitude: ipApi?.lon ?? ipWho?.longitude ?? null,
    timezone: ipApi?.timezone ?? ipWho?.timezone?.id ?? null,
    utcOffsetSeconds: ipApi?.offset ?? ipWho?.timezone?.offset ?? null,
    currency: ipApi?.currency ?? ipWho?.currency?.code ?? null,
    callingCode: ipWho?.calling_code ? `+${ipWho.calling_code}` : null,
  };

  const network: NetworkInfo = {
    isp: ipApi?.isp ?? ipWho?.connection?.isp ?? null,
    organization: ipApi?.org ?? ipWho?.connection?.org ?? rdap?.name ?? null,
    asn: asnFormatted,
    asnName: ipApi?.asname ?? (ipApi?.as ? ipApi.as.split(' ').slice(1).join(' ') : null) ?? null,
    domain: ipWho?.connection?.domain ?? null,
  };

  const security: SecuritySignals = {
    isProxy: ipApi?.proxy ?? null,
    isHosting: ipApi?.hosting ?? null,
    isMobile: ipApi?.mobile ?? null,
    isAnycast: null,
    isBogon: !protocol.scope.isPublic,
  };

  const bgp: BgpInfo = {
    prefix: bgpPrefix ?? rdap?.cidr ?? null,
    asns: bgpAsns.map((a) => (a.startsWith('AS') ? a : `AS${a}`)),
    rpkiStatus,
  };

  const internetDb =
    internetDbRes.status === 'fulfilled' && internetDbRes.value.ok
      ? internetDbRes.value.data
      : {};
  const dnsbl =
    dnsblRes.status === 'fulfilled'
      ? dnsblRes.value
      : { matches: [], torExit: false };
  const tags = Array.isArray(internetDb.tags) ? internetDb.tags : [];
  const threatIntel: ThreatIntelInfo = {
    openPorts: Array.isArray(internetDb.ports) ? internetDb.ports.slice(0, 32) : [],
    cpes: Array.isArray(internetDb.cpes) ? internetDb.cpes.slice(0, 12) : [],
    vulns: Array.isArray(internetDb.vulns) ? internetDb.vulns.slice(0, 20) : [],
    tags,
    hostnames: Array.isArray(internetDb.hostnames) ? internetDb.hostnames.slice(0, 10) : [],
    dnsblListed: dnsbl.matches.length > 0,
    dnsblMatches: dnsbl.matches,
    torExit: dnsbl.torExit || tags.includes('tor'),
  };

  return {
    query: rawTarget.trim(),
    resolvedFromDomain,
    ip: protocol.canonical,
    gatewayIp,
    fetchedAt: new Date().toISOString(),
    protocol,
    privateAnalysis,
    geo,
    network,
    security,
    bgp,
    dns: dnsRecords,
    rdap,
    threatIntel,
    sources,
    warnings,
  };
}

export async function detectCallerPublicIp(forwardedHeader: string | undefined, remoteAddress: string | undefined): Promise<string> {
  const detected = extractFirstPublicIp([forwardedHeader, remoteAddress]);
  if (detected) {
    return detected;
  }

  try {
    const res = await fetchJsonWithTimeout<{ ip?: string }>('https://api64.ipify.org?format=json', 3000);
    if (res.ip) return res.ip;
  } catch {
    // Fallback to ip-api self query
  }

  try {
    const res = await fetchJsonWithTimeout<{ query?: string }>('http://ip-api.com/json/?fields=query', 3000);
    if (res.query) return res.query;
  } catch {
    // Fallback if offline
  }

  return '8.8.8.8';
}
