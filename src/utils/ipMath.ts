import type {
  IpProtocolInfo,
  IpScopeInfo,
  PrivateNetworkAnalysis,
  SubnetInfo,
} from '../types/ip';

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export type ParsedTarget =
  | { kind: 'ipv4'; value: string }
  | { kind: 'ipv6'; value: string }
  | { kind: 'domain'; value: string }
  | { kind: 'invalid'; reason: string };

export function parseTargetInput(raw: string): ParsedTarget {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { kind: 'invalid', reason: 'Enter an IPv4 address, IPv6 address, or hostname.' };
  }

  let candidate = trimmed;

  // Strip URL scheme/path if user pastes a full URL
  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      candidate = parsed.hostname;
    } catch {
      return { kind: 'invalid', reason: 'The provided URL could not be parsed.' };
    }
  } else if (candidate.includes('/')) {
    candidate = candidate.split('/')[0];
  }

  // Handle bracketed IPv6 like [2001:4860:4860::8888]:443
  if (candidate.startsWith('[')) {
    const closingIdx = candidate.indexOf(']');
    if (closingIdx !== -1) {
      candidate = candidate.slice(1, closingIdx);
    }
  } else if (candidate.includes(':') && (candidate.match(/:/g)?.length ?? 0) === 1) {
    // Strip single :port from IPv4 or domain
    const [host, maybePort] = candidate.split(':');
    if (/^\d+$/.test(maybePort)) {
      candidate = host;
    }
  }

  candidate = candidate.trim().replace(/\.+$/, '');

  if (isValidIpv4(candidate)) {
    return { kind: 'ipv4', value: candidate };
  }

  if (isValidIpv6(candidate)) {
    return { kind: 'ipv6', value: compressIpv6(expandIpv6(candidate)) };
  }

  // Hostname validation (supports localhost or standard DNS domain)
  if (
    /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(
      candidate
    )
  ) {
    return { kind: 'domain', value: candidate.toLowerCase() };
  }

  return {
    kind: 'invalid',
    reason: 'Enter a valid IPv4 address (e.g. 8.8.8.8), IPv6 address, or domain name.',
  };
}

export function isValidIpv4(ip: string): boolean {
  return IPV4_REGEX.test(ip.trim());
}

export function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (
    (((parts[0] << 24) >>> 0) +
      ((parts[1] << 16) >>> 0) +
      ((parts[2] << 8) >>> 0) +
      (parts[3] >>> 0)) >>>
    0
  );
}

export function intToIpv4(num: number): string {
  const unsigned = num >>> 0;
  return [
    (unsigned >>> 24) & 255,
    (unsigned >>> 16) & 255,
    (unsigned >>> 8) & 255,
    unsigned & 255,
  ].join('.');
}

export function classifyIpv4Scope(ip: string): IpScopeInfo {
  const n = ipv4ToInt(ip);
  const inRange = (cidrBase: string, prefix: number): boolean => {
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (n & mask) === (ipv4ToInt(cidrBase) & mask);
  };

  if (inRange('10.0.0.0', 8) || inRange('172.16.0.0', 12) || inRange('192.168.0.0', 16)) {
    return {
      isPublic: false,
      label: 'Private Network',
      rfc: 'RFC 1918',
      description: 'Reserved for private internal networks and not routable on the public internet.',
    };
  }
  if (inRange('127.0.0.0', 8)) {
    return {
      isPublic: false,
      label: 'Loopback',
      rfc: 'RFC 1122',
      description: 'Host loopback interface address for local machine traffic.',
    };
  }
  if (inRange('169.254.0.0', 16)) {
    return {
      isPublic: false,
      label: 'Link-Local',
      rfc: 'RFC 3927',
      description: 'Auto-assigned link-local address when DHCP is unavailable.',
    };
  }
  if (inRange('100.64.0.0', 10)) {
    return {
      isPublic: false,
      label: 'Shared CGNAT',
      rfc: 'RFC 6598',
      description: 'Carrier-Grade NAT shared address space used by ISPs.',
    };
  }
  if (
    inRange('192.0.2.0', 24) ||
    inRange('198.51.100.0', 24) ||
    inRange('203.0.113.0', 24)
  ) {
    return {
      isPublic: false,
      label: 'Documentation',
      rfc: 'RFC 5737',
      description: 'Reserved exclusively for documentation and code examples.',
    };
  }
  if (inRange('224.0.0.0', 4)) {
    return {
      isPublic: false,
      label: 'Multicast',
      rfc: 'RFC 5771',
      description: 'Reserved for IPv4 multicast group distribution.',
    };
  }
  if (inRange('0.0.0.0', 8) || inRange('240.0.0.0', 4)) {
    return {
      isPublic: false,
      label: 'Reserved / Special',
      rfc: 'RFC 6890',
      description: 'Special-purpose or future-use reserved IPv4 range.',
    };
  }

  return {
    isPublic: true,
    label: 'Public Routable',
    rfc: 'Global Unicast',
    description: 'Globally routable public IPv4 address.',
  };
}

export function isValidIpv6(raw: string): boolean {
  const ip = raw.trim().split('%')[0];
  if (!ip.includes(':')) return false;
  if ((ip.match(/::/g)?.length ?? 0) > 1) return false;

  // Handle IPv4-mapped suffix like ::ffff:8.8.8.8
  let groupsPart = ip;
  let hasIpv4Tail = false;
  if (ip.includes('.')) {
    const lastColon = ip.lastIndexOf(':');
    const tail = ip.slice(lastColon + 1);
    if (!isValidIpv4(tail)) return false;
    groupsPart = ip.slice(0, lastColon);
    hasIpv4Tail = true;
  }

  const parts = groupsPart.split('::');
  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
  const hexGroup = /^[0-9a-fA-F]{1,4}$/;

  if (!left.every((g) => hexGroup.test(g)) || !right.every((g) => hexGroup.test(g))) {
    return false;
  }

  const expectedGroups = hasIpv4Tail ? 6 : 8;
  if (parts.length === 1) {
    return left.length === expectedGroups;
  }
  return left.length + right.length < expectedGroups;
}

export function expandIpv6(raw: string): string {
  let ip = raw.trim().split('%')[0].toLowerCase();

  // Convert IPv4-embedded tail to two hex groups
  if (ip.includes('.')) {
    const lastColon = ip.lastIndexOf(':');
    const v4 = ip.slice(lastColon + 1);
    const octets = v4.split('.').map(Number);
    const g1 = ((octets[0] << 8) | octets[1]).toString(16).padStart(4, '0');
    const g2 = ((octets[2] << 8) | octets[3]).toString(16).padStart(4, '0');
    ip = `${ip.slice(0, lastColon)}:${g1}:${g2}`;
  }

  const parts = ip.split('::');
  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
  const missing = 8 - (left.length + right.length);
  const full = [...left, ...Array(Math.max(0, missing)).fill('0'), ...right];

  return full.map((g) => g.padStart(4, '0')).join(':');
}

export function compressIpv6(expanded: string): string {
  const groups = expanded.split(':').map((g) => g.replace(/^0+/, '') || '0');
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  groups.forEach((g, idx) => {
    if (g === '0') {
      if (curStart === -1) curStart = idx;
      curLen += 1;
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  });

  if (bestLen < 2) {
    return groups.join(':');
  }

  const before = groups.slice(0, bestStart).join(':');
  const after = groups.slice(bestStart + bestLen).join(':');
  return `${before}::${after}`;
}

export function classifyIpv6Scope(expanded: string): IpScopeInfo {
  const groups = expanded.split(':');
  const first = parseInt(groups[0], 16);

  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return {
      isPublic: false,
      label: 'Loopback',
      rfc: 'RFC 4291',
      description: 'IPv6 host loopback address (::1).',
    };
  }
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0000') {
    return {
      isPublic: false,
      label: 'Unspecified',
      rfc: 'RFC 4291',
      description: 'Unspecified IPv6 address (::).',
    };
  }
  if ((first & 0xfe00) === 0xfc00) {
    return {
      isPublic: false,
      label: 'Unique Local (ULA)',
      rfc: 'RFC 4193',
      description: 'Private IPv6 address space for local communications.',
    };
  }
  if ((first & 0xffc0) === 0xfe80) {
    return {
      isPublic: false,
      label: 'Link-Local',
      rfc: 'RFC 4291',
      description: 'Non-routable link-local IPv6 address.',
    };
  }
  if ((first & 0xff00) === 0xff00) {
    return {
      isPublic: false,
      label: 'Multicast',
      rfc: 'RFC 4291',
      description: 'Reserved for IPv6 multicast group traffic.',
    };
  }
  if (groups[0] === '2001' && groups[1] === '0db8') {
    return {
      isPublic: false,
      label: 'Documentation',
      rfc: 'RFC 3849',
      description: 'Reserved for documentation and technical examples.',
    };
  }
  if (
    groups.slice(0, 5).every((g) => g === '0000') &&
    groups[5] === 'ffff'
  ) {
    const v4Int = (parseInt(groups[6], 16) << 16) | parseInt(groups[7], 16);
    const v4 = intToIpv4(v4Int);
    return classifyIpv4Scope(v4);
  }

  return {
    isPublic: true,
    label: 'Global Unicast',
    rfc: 'RFC 4291',
    description: 'Globally routable public IPv6 unicast address.',
  };
}

export function buildIpProtocolInfo(ip: string): IpProtocolInfo {
  if (isValidIpv4(ip)) {
    const octets = ip.split('.').map(Number);
    const intVal = ipv4ToInt(ip);
    const hexOctets = octets.map((o) => o.toString(16).padStart(2, '0'));
    const binOctets = octets.map((o) => o.toString(2).padStart(8, '0'));
    const mapped = `::ffff:${hexOctets[0]}${hexOctets[1]}:${hexOctets[2]}${hexOctets[3]}`;
    const sixToFour = `2002:${hexOctets[0]}${hexOctets[1]}:${hexOctets[2]}${hexOctets[3]}::/48`;

    return {
      ip,
      version: 4,
      canonical: ip,
      expanded: ip,
      integer: intVal.toString(10),
      hex: `0x${intVal.toString(16).padStart(8, '0')}`,
      binary: binOctets.join('.'),
      arpa: `${[...octets].reverse().join('.')}.in-addr.arpa`,
      ipv4Mapped: mapped,
      sixToFourPrefix: sixToFour,
      scope: classifyIpv4Scope(ip),
    };
  }

  const expanded = expandIpv6(ip);
  const canonical = compressIpv6(expanded);
  const rawHex = expanded.replace(/:/g, '');
  const bigIntVal = BigInt(`0x${rawHex}`);
  const binGroups = expanded
    .split(':')
    .map((g) => parseInt(g, 16).toString(2).padStart(16, '0'));
  const arpa = `${rawHex.split('').reverse().join('.')}.ip6.arpa`;

  return {
    ip: canonical,
    version: 6,
    canonical,
    expanded,
    integer: bigIntVal.toString(10),
    hex: `0x${rawHex}`,
    binary: binGroups.join(':'),
    arpa,
    ipv4Mapped: null,
    sixToFourPrefix: null,
    scope: classifyIpv6Scope(expanded),
  };
}

export function calculateIpv4Subnet(cidrInput: string): SubnetInfo | { error: string } {
  const trimmed = cidrInput.trim();
  const [ipPart, prefixPart] = trimmed.split('/');

  if (!ipPart || !isValidIpv4(ipPart)) {
    return { error: 'Enter a valid IPv4 CIDR block (e.g. 192.168.1.0/24).' };
  }

  const prefixLength = prefixPart === undefined ? 32 : Number(prefixPart);
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    return { error: 'Prefix length must be an integer between 0 and 32.' };
  }

  const ipInt = ipv4ToInt(ipPart);
  const maskInt = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalAddresses = Math.pow(2, 32 - prefixLength);
  let usableHosts = 0;
  let firstUsableInt = networkInt;
  let lastUsableInt = broadcastInt;

  if (prefixLength === 32) {
    usableHosts = 1;
    firstUsableInt = networkInt;
    lastUsableInt = networkInt;
  } else if (prefixLength === 31) {
    usableHosts = 2;
    firstUsableInt = networkInt;
    lastUsableInt = broadcastInt;
  } else {
    usableHosts = Math.max(0, totalAddresses - 2);
    firstUsableInt = (networkInt + 1) >>> 0;
    lastUsableInt = (broadcastInt - 1) >>> 0;
  }

  const maskIp = intToIpv4(maskInt);
  const binaryMask = maskIp
    .split('.')
    .map((o) => Number(o).toString(2).padStart(8, '0'))
    .join('.');

  return {
    input: `${ipPart}/${prefixLength}`,
    networkAddress: intToIpv4(networkInt),
    broadcastAddress: intToIpv4(broadcastInt),
    firstUsable: intToIpv4(firstUsableInt),
    lastUsable: intToIpv4(lastUsableInt),
    subnetMask: maskIp,
    wildcardMask: intToIpv4(wildcardInt),
    prefixLength,
    totalAddresses: totalAddresses.toLocaleString('en-US'),
    usableHosts: usableHosts.toLocaleString('en-US'),
    binaryMask,
    scope: classifyIpv4Scope(intToIpv4(networkInt)),
  };
}

export function extractFirstPublicIp(candidates: Array<string | undefined | null>): string | null {
  for (const raw of candidates) {
    if (!raw) continue;
    const parts = raw.split(',');
    for (const part of parts) {
      const cleaned = part.trim().replace(/^::ffff:/, '');
      const parsed = parseTargetInput(cleaned);
      if (parsed.kind === 'ipv4' || parsed.kind === 'ipv6') {
        const proto = buildIpProtocolInfo(parsed.value);
        if (proto.scope.isPublic) {
          return proto.canonical;
        }
      }
    }
  }
  return null;
}

export function analyzePrivateIp(ip: string): PrivateNetworkAnalysis | null {
  const proto = buildIpProtocolInfo(ip);
  if (proto.scope.isPublic) {
    return null;
  }

  if (proto.version === 4) {
    const octets = ip.split('.').map(Number);
    const last = octets[3];
    let hostRole = 'Client / Host Device';
    if (last === 0) hostRole = 'Network Identifier (.0)';
    else if (last === 1) hostRole = 'Likely Router / Default Gateway (.1)';
    else if (last === 254) hostRole = 'Secondary Gateway / Router (.254)';
    else if (last === 255) hostRole = 'Subnet Broadcast Address (.255)';

    const n = ipv4ToInt(ip);
    const inRange = (cidrBase: string, prefix: number): boolean => {
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      return (n & mask) === (ipv4ToInt(cidrBase) & mask);
    };

    let parentBlock = '0.0.0.0/8';
    let parentRange = '0.0.0.0 – 255.255.255.255';
    let parentTotalAddresses = '16,777,216';
    let legacyClass = 'Special';
    let typicalUsage = 'Reserved special-purpose IPv4 range';
    let defaultPrefix = 24;

    if (inRange('192.168.0.0', 16)) {
      parentBlock = '192.168.0.0/16';
      parentRange = '192.168.0.0 – 192.168.255.255';
      parentTotalAddresses = '65,536';
      legacyClass = 'Class C Private (256 × /24 subnets)';
      typicalUsage = 'Home & office Wi-Fi routers, mobile hotspot LANs';
      defaultPrefix = 24;
    } else if (inRange('10.0.0.0', 8)) {
      parentBlock = '10.0.0.0/8';
      parentRange = '10.0.0.0 – 10.255.255.255';
      parentTotalAddresses = '16,777,216';
      legacyClass = 'Class A Private';
      typicalUsage = 'Enterprise internal networks, VPNs, cloud VPCs, mobile LANs';
      defaultPrefix = 24;
    } else if (inRange('172.16.0.0', 12)) {
      parentBlock = '172.16.0.0/12';
      parentRange = '172.16.0.0 – 172.31.255.255';
      parentTotalAddresses = '1,048,576';
      legacyClass = 'Class B Private (16 × /16 blocks)';
      typicalUsage = 'Corporate subnets, Docker/container bridges, virtual labs';
      defaultPrefix = 24;
    } else if (inRange('100.64.0.0', 10)) {
      parentBlock = '100.64.0.0/10';
      parentRange = '100.64.0.0 – 100.127.255.255';
      parentTotalAddresses = '4,194,304';
      legacyClass = 'Shared CGNAT Space';
      typicalUsage = 'Mobile cellular & ISP Carrier-Grade NAT (behind shared public IP)';
      defaultPrefix = 24;
    } else if (inRange('127.0.0.0', 8)) {
      parentBlock = '127.0.0.0/8';
      parentRange = '127.0.0.0 – 127.255.255.255';
      parentTotalAddresses = '16,777,216';
      legacyClass = 'Class A Loopback';
      typicalUsage = 'Localhost / internal device loopback interface';
      defaultPrefix = 8;
    } else if (inRange('169.254.0.0', 16)) {
      parentBlock = '169.254.0.0/16';
      parentRange = '169.254.0.0 – 169.254.255.255';
      parentTotalAddresses = '65,536';
      legacyClass = 'Class B Link-Local';
      typicalUsage = 'APIPA self-assigned local address & cloud metadata services';
      defaultPrefix = 16;
    }

    const subnetCalc = calculateIpv4Subnet(`${ip}/${defaultPrefix}`);
    const defaultSubnet = 'error' in subnetCalc ? null : subnetCalc;

    return {
      parentBlock,
      parentRange,
      parentTotalAddresses,
      legacyClass,
      typicalUsage,
      hostRole,
      ianaAuthority: `IANA Special-Purpose IPv4 Registry (${proto.scope.rfc})`,
      globallyReachable: false,
      forwardable: false,
      defaultPrefix,
      defaultSubnet,
    };
  }

  // IPv6 private/non-public
  let parentBlock = 'fc00::/7';
  let parentRange = 'fc00:: – fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
  let typicalUsage = 'Private IPv6 local communication (ULA)';
  let hostRole = 'Local IPv6 Interface';

  if (proto.scope.label === 'Loopback') {
    parentBlock = '::1/128';
    parentRange = '::1';
    typicalUsage = 'Localhost IPv6 loopback interface';
    hostRole = 'Loopback Host';
  } else if (proto.scope.label === 'Link-Local') {
    parentBlock = 'fe80::/10';
    parentRange = 'fe80:: – febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
    typicalUsage = 'Single-link neighbor discovery & router solicitation';
    hostRole = 'Link-Local Interface';
  }

  return {
    parentBlock,
    parentRange,
    parentTotalAddresses: '2^121 (IPv6 Block)',
    legacyClass: 'IPv6 Special-Purpose',
    typicalUsage,
    hostRole,
    ianaAuthority: `IANA Special-Purpose IPv6 Registry (${proto.scope.rfc})`,
    globallyReachable: false,
    forwardable: false,
    defaultPrefix: 64,
    defaultSubnet: null,
  };
}


