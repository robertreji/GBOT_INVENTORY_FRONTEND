import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiClient, setAccessToken, setRefreshToken } from './client';

test('concurrent expired-token requests share one refresh and both retry', async () => {
  const storage = new Map<string, string>();
  const originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });

  let refreshCount = 0;
  const retriedPaths: string[] = [];
  setAccessToken('expired-access-token');
  setRefreshToken('valid-refresh-token');

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/auth/refresh')) {
      refreshCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(JSON.stringify({
        success: true,
        data: { accessToken: 'fresh-access-token', refreshToken: 'rotated-refresh-token' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const authorization = new Headers(init?.headers).get('Authorization');
    if (authorization === 'Bearer expired-access-token') {
      return new Response(JSON.stringify({ success: false, message: 'Expired' }), { status: 401 });
    }

    retriedPaths.push(new URL(url).pathname);
    return new Response(JSON.stringify({ success: true, data: { ok: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const results = await Promise.all([
      apiClient<{ ok: boolean }>('/borrows'),
      apiClient<{ ok: boolean }>('/reservations'),
    ]);

    assert.equal(refreshCount, 1);
    assert.deepEqual(results, [{ ok: true }, { ok: true }]);
    assert.equal(retriedPaths.length, 2);
    assert.equal(storage.get('gbot_refresh_token'), 'rotated-refresh-token');
  } finally {
    globalThis.fetch = originalFetch;
    setAccessToken(null);
    setRefreshToken(null);
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
