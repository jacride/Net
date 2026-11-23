import type { IpLookupResponse, ThreatIntelInfo } from '../types/ip';

export interface ThreatPostureSummary {
  level: 'low' | 'elevated' | 'high';
  label: string;
  summary: string;
}

export function summarizeThreatPosture(
  threatIntel?: ThreatIntelInfo | null,
  security?: IpLookupResponse['security']
): ThreatPostureSummary {
  const vulnsCount = threatIntel?.vulns.length ?? 0;
  const dnsblCount = threatIntel?.dnsblMatches.length ?? 0;
  const isTor = Boolean(threatIntel?.torExit || threatIntel?.tags.includes('tor'));
  const isProxy = Boolean(security?.isProxy || threatIntel?.tags.includes('vpn'));
  const portsCount = threatIntel?.openPorts.length ?? 0;

  if (dnsblCount > 0 || vulnsCount >= 3) {
    return {
      level: 'high',
      label: 'High Exposure / Flagged',
      summary: `${dnsblCount} blocklist hit(s), ${vulnsCount} CVE(s), and ${portsCount} indexed open port(s).`,
    };
  }

  if (vulnsCount > 0 || isTor || isProxy || portsCount >= 6) {
    return {
      level: 'elevated',
      label: 'Elevated Signals',
      summary: [
        isTor ? 'Tor exit node' : null,
        isProxy ? 'Proxy / VPN relay' : null,
        vulnsCount > 0 ? `${vulnsCount} indexed CVE(s)` : null,
        portsCount > 0 ? `${portsCount} open port(s)` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }

  return {
    level: 'low',
    label: 'No Blocklist Flags',
    summary:
      portsCount > 0
        ? `${portsCount} indexed service port(s), 0 blocklist hits, 0 known CVEs.`
        : 'No blocklist hits, CVEs, or proxy flags reported.',
  };
}

export function findPrimaryAbuseEmail(data: IpLookupResponse): string | null {
  const contacts = data.rdap?.contacts ?? [];
  const abuseContact = contacts.find(
    (c) => c.email && c.role.toLowerCase().includes('abuse')
  );
  if (abuseContact?.email) return abuseContact.email;
  const anyEmail = contacts.find((c) => Boolean(c.email));
  return anyEmail?.email ?? null;
}

export function buildAbuseReportDraft(
  data: IpLookupResponse,
  observedActivity = ''
): string {
  const recipient = findPrimaryAbuseEmail(data) || 'Abuse / NOC Team';
  const ports =
    data.threatIntel && data.threatIntel.openPorts.length > 0
      ? data.threatIntel.openPorts.join(', ')
      : 'None indexed';
  const vulns =
    data.threatIntel && data.threatIntel.vulns.length > 0
      ? data.threatIntel.vulns.join(', ')
      : 'None';
  const dnsbl =
    data.threatIntel && data.threatIntel.dnsblMatches.length > 0
      ? data.threatIntel.dnsblMatches.join(', ')
      : 'Clean';

  const lines = [
    `To: ${recipient}`,
    `Subject: Abuse / Security Incident Report for ${data.ip}`,
    '',
    'Hello Abuse / Security Response Team,',
    '',
    'We observed suspicious network activity originating from an IP address registered to your network:',
    '',
    `- Source IP: ${data.ip}${data.gatewayIp ? ` (Active NAT Gateway: ${data.gatewayIp})` : ''}`,
    `- Report Timestamp (UTC): ${data.fetchedAt}`,
    `- Organization / ISP: ${data.network.organization || data.network.isp || 'Unknown'}`,
    `- ASN / BGP Prefix: ${data.network.asn || 'Unknown'} (${data.bgp.prefix || data.rdap?.cidr || 'Unknown'})`,
    `- RDAP Handle: ${data.rdap?.handle || 'Unknown'} (${data.rdap?.registry || 'RIR'})`,
    `- Passive Open Ports: ${ports}`,
    `- Indexed CVEs / Blocklists: CVEs [${vulns}] | DNSBL [${dnsbl}]`,
    '',
    'Observed Activity / Evidence:',
    observedActivity.trim() || '[Insert timestamps, destination ports, firewall/IDS logs, or request samples here]',
    '',
    'Please investigate and take appropriate mitigation action.',
  ];

  return lines.join('\n');
}
