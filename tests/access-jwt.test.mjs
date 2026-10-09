import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, generateKeyPairSync, sign } from 'node:crypto';
import { verifyAccess } from '../src/worker.js';

const issuer = 'https://team-test.cloudflareaccess.com';
const audience = 'expected-access-application-audience';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'synthetic-key', alg: 'RS256', use: 'sig' };
const base64url = object => Buffer.from(JSON.stringify(object)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const baseClaims = {
  iss: issuer, aud: [audience], exp: now + 3600, iat: now - 60,
  email: 'TEST@EXAMPLE.INVALID'
};
function jwt(overrides = {}, key = privateKey) {
  const header = base64url({ alg: 'RS256', typ: 'JWT', kid: 'synthetic-key' });
  const body = base64url({ ...baseClaims, ...overrides });
  const content = header + '.' + body;
  const signature = sign('RSA-SHA256', Buffer.from(content), key).toString('base64url');
  return content + '.' + signature;
}
async function verify(token) {
  const originalFetch = globalThis.fetch;
  const originalCrypto = globalThis.crypto;
  const mockFetch = async (url, options) => {
    assert.equal(url, issuer + '/cdn-cgi/access/certs');
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => ({ keys: [jwk] }) };
  };
  // Tests run without network access. Only synthetic JWKS and signing keys.
  globalThis.fetch = mockFetch;
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  try {
    return await verifyAccess(new Request('https://app.example.invalid/api/me', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    }), { ACCESS_TEAM_DOMAIN: issuer, ACCESS_AUD: audience });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCrypto !== globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { configurable: true, value: originalCrypto });
  }
}
test('Cloudflare Access signed JWT with aud array validates exact audience', async () => {
  assert.deepEqual(await verify(jwt()), { email: 'test@example.invalid' });
  assert.deepEqual(await verify(jwt({ aud: ['unrelated', audience] })), { email: 'test@example.invalid' });
});
test('wrong audience in aud array or string audience rejected', async () => {
  assert.equal(await verify(jwt({ aud: ['other-application'] })), null);
  assert.equal(await verify(jwt({ aud: 'expected-access-application-audience' })), null);
  assert.equal(await verify(jwt({ aud: ['expected-access-application-audience-suffix'] })), null);
});
test('expired signed JWT rejected', async () => {
  assert.equal(await verify(jwt({ exp: now - 1 })), null);
});
test('invalid signature rejected', async () => {
  const otherKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  assert.equal(await verify(jwt({}, otherKey)), null);
});
test('nbf in the future rejected and current nbf accepted', async () => {
  assert.equal(await verify(jwt({ nbf: now + 120 })), null);
  assert.deepEqual(await verify(jwt({ nbf: now - 1 })), { email: 'test@example.invalid' });
  assert.equal(await verify(jwt({ nbf: 'invalid' })), null);
});
test('issuer mismatch, missing token, invalid iat rejected', async () => {
  assert.equal(await verify(jwt({ iss: 'https://wrong.cloudflareaccess.com' })), null);
  assert.equal(await verify(jwt({ iat: now + 300 })), null);
  assert.equal(await verify('invalid-token'), null);
});
