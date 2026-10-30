/** Answer and rebuttal calls in the checkpoint flow give up after this long and fall back locally. */
export const CHECKPOINT_CALL_TIMEOUT_MS = 12000;
/** Starting a checkpoint session runs in the background ahead of the answer, so it may take longer. */
export const SESSION_START_TIMEOUT_MS = 20000;

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
