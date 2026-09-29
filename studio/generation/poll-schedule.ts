/** Docs: start at two seconds and grow to ten, with jitter added by the poller. */
export const POLL_MIN_MS = 2_000
export const POLL_MAX_MS = 10_000

export function nextPollDelay(current: number): number {
  return Math.min(current * 1.5, POLL_MAX_MS)
}
