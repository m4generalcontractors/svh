"use server"

import { cookies } from "next/headers"

import { getModel, parseSettings } from "./catalog"
import type { GenerationPlane } from "./catalog/types"
import {
  MissingCredentialsError,
  PLATFORM_KEY_COOKIE,
  PLATFORM_KEY_COOKIE_OPTIONS,
  decodeCredentials,
  encodeCredentials,
  parseCredentialInput,
} from "./credentials"
import {
  claimSubmission,
  holdSubmission,
  releaseSubmission,
  submissionKey,
} from "./inflight"
import {
  classifyStatusError,
  createPlatformClient,
  PlatformError,
} from "./platform"
import type { StatusResult } from "./platform"
import { toPlatform } from "./to-platform"

const AMBIGUOUS_HOLD_MS = 60_000

export async function savePlatformCredentials(data: unknown) {
  const { apiKey } = parseCredentialInput(data)
  const jar = await cookies()
  jar.set(
    PLATFORM_KEY_COOKIE,
    encodeCredentials(apiKey),
    PLATFORM_KEY_COOKIE_OPTIONS
  )
}

export async function clearPlatformCredentials() {
  const jar = await cookies()
  jar.set(PLATFORM_KEY_COOKIE, "", {
    ...PLATFORM_KEY_COOKIE_OPTIONS,
    maxAge: 0,
  })
}

export async function hasPlatformCredentials() {
  return (await readStoredCredentials()) !== null
}

export async function submitGeneration(plane: GenerationPlane) {
  const model = getModel(plane.model)
  const parsed: GenerationPlane = {
    ...plane,
    settings: parseSettings(model, plane.settings),
  }
  const { path, body } = toPlatform(parsed)
  const key = submissionKey({ path, body })
  claimSubmission(key)
  try {
    const queued = await createPlatformClient(await readCredentials()).submit(
      path,
      body
    )
    releaseSubmission(key)
    return queued
  } catch (caught) {
    if (isAmbiguousSubmission(caught)) {
      holdSubmission(key, AMBIGUOUS_HOLD_MS)
      throw caught
    }
    releaseSubmission(key)
    throw caught
  }
}

/** Every request in flight, answered in one round trip. Next dispatches server
    actions one at a time per client, so a poll per run would queue ahead of the
    next submit — the fan-out belongs on this side of the call, where it is
    genuinely parallel. */
export async function getGenerationStatuses(
  data: unknown
): Promise<StatusResult[]> {
  const requestIds = parseRequestIds(data)
  const client = createPlatformClient(await readCredentials())
  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      try {
        return { requestId, status: await client.status(requestId) }
      } catch (caught) {
        return { requestId, ...classifyStatusError(caught) }
      }
    })
  )
}

export async function cancelGeneration(data: unknown) {
  const [requestId] = parseRequestIds(data)
  await createPlatformClient(await readCredentials()).cancel(requestId!)
}

async function readStoredCredentials() {
  const jar = await cookies()
  return decodeCredentials(jar.get(PLATFORM_KEY_COOKIE)?.value)
}

async function readCredentials() {
  const stored = await readStoredCredentials()
  if (!stored) throw new MissingCredentialsError()
  const baseUrl = process.env.HF_API_BASE_URL
  if (!baseUrl) throw new Error("Missing HF_API_BASE_URL")
  return { ...stored, baseUrl }
}

function parseRequestIds(data: unknown): string[] {
  const payload = asObject(data, "Invalid status payload")
  const requestIds = payload.requestIds
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new Error("Invalid request ids")
  }
  return requestIds.map((requestId) => {
    if (typeof requestId !== "string" || !requestId)
      throw new Error("Invalid request id")
    return requestId
  })
}

function isAmbiguousSubmission(caught: unknown): boolean {
  return (
    caught instanceof PlatformError &&
    caught.status === 504 &&
    /was not retried/i.test(caught.message)
  )
}

function asObject(data: unknown, message: string): Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data))
    throw new Error(message)
  return data as Record<string, unknown>
}
