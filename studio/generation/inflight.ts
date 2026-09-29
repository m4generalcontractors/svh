/** Blocks a second generation POST for the same plane while one is in flight,
    and for a short hold after an ambiguous timeout. A confirmed HTTP error
    releases the claim so a corrected request can be sent. */

const held = new Map<string, number>()

export function submissionKey(value: unknown): string {
  return JSON.stringify(value)
}

export function claimSubmission(key: string, now = Date.now()): void {
  const until = held.get(key)
  if (until !== undefined && until > now) {
    throw new Error(
      "This generation is already being submitted. Wait for it to finish before trying the same prompt again."
    )
  }
  held.set(key, Number.POSITIVE_INFINITY)
}

export function releaseSubmission(key: string): void {
  held.delete(key)
}

export function holdSubmission(key: string, ms: number, now = Date.now()): void {
  held.set(key, now + ms)
}

export function resetSubmissions(): void {
  held.clear()
}
