/** Backend calls in the checkpoint flow must never hold the learner: give up after this long. */
export const CHECKPOINT_BACKEND_TIMEOUT_MS = 6000;

/**
 * Resolves with the promise's value, or with null when it rejects or does not settle within `ms`.
 * A late result is dropped, so the caller's local fallback is never overwritten afterwards.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, ms);
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}
