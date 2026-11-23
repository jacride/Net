import test from 'node:test';
import assert from 'node:assert/strict';
import type { IpLookupResponse } from '../types/ip.ts';
import {
  buildAbuseReportDraft,
  findPrimaryAbuseEmail,
  summarizeThreatPosture,
} from './threatReport.ts';

function makeSampleResponse(overrides: Partial<IpLookupResponse> = {}): IpLookupResponse {
  return {
    query: '203.0.113.10',
    resolvedFromDomain: null,
    ip: '203.0.113.10',
    fetchedAt: '2026-11-23T12:00:00.000Z',
    protocol: {
      ip: '203.0.113.10',
      version: 4,
      canonical: '203.0.113.10',
      expanded: '203.0.113.10',
      integer: '3405803786',
      hex: '0xc000020a',
      binary: '11001011.00000000.01110001.00001010',
      arpa: '10.113.0.203.in-addr.arpa',
      ipv4Mapped: '::ffff:cb00:710a',
      sixToFourPrefix: '2002:cb00:710a::/48',
      scope: {
        isPublic: true,
        label: 'Public Routable',
        rfc: 'Global Unicast',
        description: 'Public IPv4',
      },
    },
    geo: {
      continent: 'North America',
      continentCode: 'NA',
      country: 'United States',
      countryCode: 'US',
      region: 'California',
      regionCode: 'CA',
      city: 'San Francisco',
      postal: '94107',
      latitude: 37.7749,
      longitude: -122.4194,
      timezone: 'America/Los_Angeles',
      utcOffsetSeconds: -28800,
      currency: 'USD',
      callingCode: '+1',
    },
    network: {
      isp: 'Example ISP',
      organization: 'Example Network',
      asn: 'AS64512',
      asnName: 'EXAMPLE-AS',
      domain: 'example.net',
    },
    security: {
      isProxy: false,
      isHosting: true,
      isMobile: false,
      isAnycast: false,
      isBogon: false,
    },
    bgp: {
      prefix: '203.0.113.0/24',
      asns: ['AS64512'],
      rpkiStatus: 'valid',
    },
    dns: {
      a: [],
      aaaa: [],
      mx: [],
      ns: [],
      txt: [],
      ptr: [],
    },
    rdap: {
      registry: 'ARIN',
      handle: 'NET-203-0-113-0-1',
      name: 'EXAMPLE-NET',
      cidr: '203.0.113.0/24',
      startAddress: '203.0.113.0',
      endAddress: '203.0.113.255',
      parentHandle: null,
      type: 'DIRECT ALLOCATION',
      registrationDate: '2020-01-01',
      lastChangedDate: '2025-01-01',
      contacts: [
        {
          role: 'technical',
          name: 'NOC Team',
          email: 'noc@example.net',
          phone: null,
          address: null,
        },
        {
          role: 'abuse',
          name: 'Abuse Desk',
          email: 'abuse@example.net',
          phone: null,
          address: null,
        },
      ],
      rawUrl: 'https://rdap.arin.net/registry/ip/203.0.113.10',
    },
    threatIntel: {
      openPorts: [22, 443],
      cpes: ['cpe:/a:openbsd:openssh:8.9'],
      vulns: ['CVE-2023-38408'],
      tags: ['cloud'],
      hostnames: ['edge.example.net'],
      dnsblListed: false,
      dnsblMatches: [],
      torExit: false,
    },
    sources: ['Local Protocol Analyzer', 'Shodan InternetDB'],
    warnings: [],
    ...overrides,
  };
}

test('summarizeThreatPosture distinguishes low, elevated, and high signals', () => {
  const elevated = summarizeThreatPosture({
    openPorts: [22, 443],
    cpes: [],
    vulns: ['CVE-2023-38408'],
    tags: [],
    hostnames: [],
    dnsblListed: false,
    dnsblMatches: [],
    torExit: false,
  });
  assert.equal(elevated.level, 'elevated');

  const high = summarizeThreatPosture({
    openPorts: [22],
    cpes: [],
    vulns: [],
    tags: [],
    hostnames: [],
    dnsblListed: true,
    dnsblMatches: ['SpamCop'],
    torExit: false,
  });
  assert.equal(high.level, 'high');

  const low = summarizeThreatPosture({
    openPorts: [443],
    cpes: [],
    vulns: [],
    tags: [],
    hostnames: [],
    dnsblListed: false,
    dnsblMatches: [],
    torExit: false,
  });
  assert.equal(low.level, 'low');
});

test('findPrimaryAbuseEmail prioritizes abuse contacts and buildAbuseReportDraft includes key fields', () => {
  const sample = makeSampleResponse();
  assert.equal(findPrimaryAbuseEmail(sample), 'abuse@example.net');

  const draft = buildAbuseReportDraft(sample, 'SSH brute force on port 22 at 12:00 UTC');
  assert.match(draft, /To: abuse@example\.net/);
  assert.match(draft, /Source IP: 203\.0\.113\.10/);
  assert.match(draft, /AS64512 \(203\.0\.113\.0\/24\)/);
  assert.match(draft, /CVE-2023-38408/);
  assert.match(draft, /SSH brute force on port 22 at 12:00 UTC/);
});
