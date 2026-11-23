export type IpVersion = 4 | 6;

export interface IpScopeInfo {
  isPublic: boolean;
  label: string;
  rfc: string;
  description: string;
}

export interface IpProtocolInfo {
  ip: string;
  version: IpVersion;
  canonical: string;
  expanded: string;
  integer: string;
  hex: string;
  binary: string;
  arpa: string;
  ipv4Mapped: string | null;
  sixToFourPrefix: string | null;
  scope: IpScopeInfo;
}

export interface SubnetInfo {
  input: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  subnetMask: string;
  wildcardMask: string;
  prefixLength: number;
  totalAddresses: string;
  usableHosts: string;
  binaryMask: string;
  scope: IpScopeInfo;
}

export interface DnsRecordsInfo {
  hostname?: string;
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
  ptr: string[];
  spf?: string | null;
  dmarc?: string | null;
  caa?: string[];
}

export interface RdapContact {
  role: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface RdapInfo {
  registry: string | null;
  handle: string | null;
  name: string | null;
  cidr: string | null;
  startAddress: string | null;
  endAddress: string | null;
  parentHandle: string | null;
  type: string | null;
  registrationDate: string | null;
  lastChangedDate: string | null;
  contacts: RdapContact[];
  rawUrl: string | null;
}

export interface BgpInfo {
  prefix: string | null;
  asns: string[];
  rpkiStatus: 'valid' | 'invalid' | 'unknown' | 'not-applicable';
}

export interface SecuritySignals {
  isProxy: boolean | null;
  isHosting: boolean | null;
  isMobile: boolean | null;
  isAnycast: boolean | null;
  isBogon: boolean;
}

export interface GeoLocationInfo {
  continent: string | null;
  continentCode: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  utcOffsetSeconds: number | null;
  currency: string | null;
  callingCode: string | null;
}

export interface NetworkInfo {
  isp: string | null;
  organization: string | null;
  asn: string | null;
  asnName: string | null;
  domain: string | null;
}

export interface PrivateNetworkAnalysis {
  parentBlock: string;
  parentRange: string;
  parentTotalAddresses: string;
  legacyClass: string;
  typicalUsage: string;
  hostRole: string;
  ianaAuthority: string;
  globallyReachable: boolean;
  forwardable: boolean;
  defaultPrefix: number;
  defaultSubnet: SubnetInfo | null;
}

export interface ThreatIntelInfo {
  openPorts: number[];
  cpes: string[];
  vulns: string[];
  tags: string[];
  hostnames: string[];
  dnsblListed: boolean;
  dnsblMatches: string[];
  torExit: boolean;
}

export interface IpLookupResponse {
  query: string;
  resolvedFromDomain: string | null;
  ip: string;
  gatewayIp?: string | null;
  fetchedAt: string;
  protocol: IpProtocolInfo;
  privateAnalysis?: PrivateNetworkAnalysis | null;
  geo: GeoLocationInfo;
  network: NetworkInfo;
  security: SecuritySignals;
  bgp: BgpInfo;
  dns: DnsRecordsInfo;
  rdap: RdapInfo | null;
  threatIntel?: ThreatIntelInfo | null;
  sources: string[];
  warnings: string[];
}

export interface LookupHistoryItem {
  ip: string;
  query: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  asn: string | null;
  isp: string | null;
  lookedUpAt: string;
}
