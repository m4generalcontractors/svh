import { getGenerationStatuses } from "./actions"
import type { GenerationStatus, StatusResult } from "./platform"
import { nextPollDelay, POLL_MIN_MS } from "./poll-schedule"

/** Statuses the platform never moves off again. */
const TERMINAL = new Set(["completed", "failed", "nsfw", "canceled"])

export const POLL_INTERVAL_MS = POLL_MIN_MS
export const POLL_DEADLINE_MS = 10 * 60_000

type Waiter = {
  deadline: number
  resolve: (status: GenerationStatus) => void
  reject: (reason: Error) => void
}

const waiting = new Map<string, Waiter>()
const inflight = new Map<string, Promise<GenerationStatus>>()
let timer: ReturnType<typeof setTimeout> | null = null
let polling = false
let delayMs = POLL_MIN_MS

/** Resolves when the platform reports a terminal status for this request.
    Every request in flight is asked for together, in one server action per
    interval: Next dispatches server actions one at a time per client, so a
    poll per run would queue ahead of the next submit and the composer would
    stall again — with the lock gone and the queue doing the same work. */
export function watchRequest(
  requestId: string,
  opts?: { deadline?: number }
): Promise<GenerationStatus> {
  const existing = inflight.get(requestId)
  if (existing) return existing
  const promise = new Promise<GenerationStatus>((resolve, reject) => {
    waiting.set(requestId, {
      deadline: opts?.deadline ?? Date.now() + POLL_DEADLINE_MS,
      resolve: (status) => {
        inflight.delete(requestId)
        resolve(status)
      },
      reject: (reason) => {
        inflight.delete(requestId)
        reject(reason)
      },
    })
    schedule()
  })
  inflight.set(requestId, promise)
  return promise
}

/** Drops every watch without settling it: the studio unmounted and there is
    nobody left to hand a result to. In-flight jobs stay in history and the
    next mount starts a fresh watch. */
export function stopWatching(): void {
  if (timer !== null) clearTimeout(timer)
  timer = null
  delayMs = POLL_MIN_MS
  waiting.clear()
  inflight.clear()
}

function schedule(): void {
  if (timer !== null || polling || waiting.size === 0) return
  const jitter = Math.random() * 500
  timer = setTimeout(() => void round(), delayMs + jitter)
}

async function round(): Promise<void> {
  timer = null
  polling = true
  try {
    const results = await getGenerationStatuses({
      requestIds: [...waiting.keys()],
    })
    for (const result of results) deliver(result)
    sweep()
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    if (/connect your higgsfield api key/i.test(message)) {
      settleAll(caught instanceof Error ? caught : new Error(message))
      return
    }
    sweep()
  } finally {
    polling = false
    delayMs =
      waiting.size === 0 ? POLL_MIN_MS : nextPollDelay(delayMs)
    schedule()
  }
}

function deliver(result: StatusResult): void {
  const waiter = waiting.get(result.requestId)
  if (!waiter) return
  if ("error" in result) {
    if (result.retryable) return
    waiting.delete(result.requestId)
    waiter.reject(new Error(result.error))
    return
  }
  if (!TERMINAL.has(result.status.status)) return
  waiting.delete(result.requestId)
  waiter.resolve(result.status)
}

/* A run the platform never finishes would otherwise hold its skeleton open for
   the rest of the session. */
function sweep(): void {
  const now = Date.now()
  for (const [requestId, waiter] of [...waiting]) {
    if (now <= waiter.deadline) continue
    waiting.delete(requestId)
    waiter.reject(new Error("timed out waiting for the platform"))
  }
}

function settleAll(reason: Error): void {
  const waiters = [...waiting.values()]
  waiting.clear()
  delayMs = POLL_MIN_MS
  for (const waiter of waiters) waiter.reject(reason)
}
