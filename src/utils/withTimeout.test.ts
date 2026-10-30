import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from './withTimeout';

test('passes through a value that arrives in time', async () => {
  assert.equal(await withTimeout(Promise.resolve(42), 50), 42);
});

test('resolves null on rejection', async () => {
  assert.equal(await withTimeout(Promise.reject(new Error('down')), 50), null);
});

test('resolves null when the promise is too slow, and ignores the late value', async () => {
  const slow = new Promise<number>((r) => setTimeout(() => r(1), 80));
  assert.equal(await withTimeout(slow, 10), null);
});
