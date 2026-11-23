import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzePrivateIp,
  buildIpProtocolInfo,
  calculateIpv4Subnet,
  classifyIpv4Scope,
  compressIpv6,
  expandIpv6,
  extractFirstPublicIp,
  parseTargetInput,
} from './ipMath';

test('parseTargetInput handles IPv4, IPv6, URLs, ports, and domains', () => {
  assert.deepEqual(parseTargetInput('8.8.8.8'), { kind: 'ipv4', value: '8.8.8.8' });
  assert.deepEqual(parseTargetInput('1.1.1.1:443'), { kind: 'ipv4', value: '1.1.1.1' });
  assert.deepEqual(parseTargetInput('[2001:4860:4860::8888]:443'), {
    kind: 'ipv6',
    value: '2001:4860:4860::8888',
  });
  assert.deepEqual(parseTargetInput('https://Cloudflare.com/dns/'), {
    kind: 'domain',
    value: 'cloudflare.com',
  });
  assert.equal(parseTargetInput('not valid!').kind, 'invalid');
});

test('classifyIpv4Scope distinguishes public, RFC1918, CGNAT, and loopback ranges', () => {
  assert.equal(classifyIpv4Scope('8.8.8.8').isPublic, true);
  assert.equal(classifyIpv4Scope('192.168.1.1').rfc, 'RFC 1918');
  assert.equal(classifyIpv4Scope('10.42.0.1').isPublic, false);
  assert.equal(classifyIpv4Scope('100.64.0.5').rfc, 'RFC 6598');
  assert.equal(classifyIpv4Scope('127.0.0.1').label, 'Loopback');
});

test('buildIpProtocolInfo computes IPv4 binary, hex, integer, ARPA, and IPv4-mapped IPv6', () => {
  const info = buildIpProtocolInfo('8.8.8.8');
  assert.equal(info.version, 4);
  assert.equal(info.integer, '134744072');
  assert.equal(info.hex, '0x08080808');
  assert.equal(info.binary, '00001000.00001000.00001000.00001000');
  assert.equal(info.arpa, '8.8.8.8.in-addr.arpa');
  assert.equal(info.ipv4Mapped, '::ffff:0808:0808');
  assert.equal(info.sixToFourPrefix, '2002:0808:0808::/48');
});

test('IPv6 expansion, compression, and protocol info work accurately', () => {
  const expanded = expandIpv6('2001:4860:4860::8888');
  assert.equal(expanded, '2001:4860:4860:0000:0000:0000:0000:8888');
  assert.equal(compressIpv6(expanded), '2001:4860:4860::8888');

  const info = buildIpProtocolInfo('::1');
  assert.equal(info.version, 6);
  assert.equal(info.scope.label, 'Loopback');
  assert.equal(info.integer, '1');
});

test('calculateIpv4Subnet handles standard CIDR, /31, /32, and invalid inputs', () => {
  const c24 = calculateIpv4Subnet('192.168.1.42/24');
  assert.ok(!('error' in c24));
  assert.equal(c24.networkAddress, '192.168.1.0');
  assert.equal(c24.broadcastAddress, '192.168.1.255');
  assert.equal(c24.firstUsable, '192.168.1.1');
  assert.equal(c24.lastUsable, '192.168.1.254');
  assert.equal(c24.usableHosts, '254');
  assert.equal(c24.subnetMask, '255.255.255.0');

  const c31 = calculateIpv4Subnet('10.0.0.1/31');
  assert.ok(!('error' in c31));
  assert.equal(c31.usableHosts, '2');

  const c32 = calculateIpv4Subnet('8.8.8.8/32');
  assert.ok(!('error' in c32));
  assert.equal(c32.usableHosts, '1');

  const bad = calculateIpv4Subnet('999.0.0.1/24');
  assert.ok('error' in bad);
});

test('extractFirstPublicIp skips private and loopback entries to find the first public IP', () => {
  assert.equal(
    extractFirstPublicIp(['127.0.0.1, 192.168.1.44, 203.0.113.5, 1.1.1.1', '10.0.0.1']),
    '1.1.1.1'
  );
  assert.equal(extractFirstPublicIp(['::ffff:192.168.0.1', '::1']), null);
});

test('analyzePrivateIp returns full private block and host role details for non-public IPs', () => {
  const lan = analyzePrivateIp('192.168.1.15');
  assert.ok(lan !== null);
  assert.equal(lan.parentBlock, '192.168.0.0/16');
  assert.equal(lan.hostRole, 'Client / Host Device');
  assert.equal(lan.defaultSubnet?.networkAddress, '192.168.1.0');

  const gateway = analyzePrivateIp('10.0.0.1');
  assert.ok(gateway !== null);
  assert.equal(gateway.parentBlock, '10.0.0.0/8');
  assert.equal(gateway.hostRole, 'Likely Router / Default Gateway (.1)');

  const cgnat = analyzePrivateIp('100.64.12.5');
  assert.ok(cgnat !== null);
  assert.equal(cgnat.parentBlock, '100.64.0.0/10');

  assert.equal(analyzePrivateIp('8.8.8.8'), null);
});


