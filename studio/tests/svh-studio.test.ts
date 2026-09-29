import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { getModel, MODELS, parseSettings } from "@/generation/catalog"
import {
  claimSubmission,
  holdSubmission,
  releaseSubmission,
  resetSubmissions,
  submissionKey,
} from "@/generation/inflight"
import { nextPollDelay, POLL_MAX_MS, POLL_MIN_MS } from "@/generation/poll-schedule"
import {
  classifyStatusError,
  createPlatformClient,
  PlatformError,
} from "@/generation/platform"
import { toAuthorizationHeader, parseCredentialInput } from "@/generation/credentials"
import { toPlatform } from "@/generation/to-platform"
import {
  aspectFor,
  IMAGE_MODEL_ID,
  kindFor,
  modelFor,
  settingsFor,
  SVH_DAYS,
  SVH_IMAGE_PROMPT,
  svhImagePrompt,
  VIDEO_MODEL_ID,
} from "@/lib/studio/svh-plan"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

describe("SVH October presets", () => {
  it("has one preset for each day from October 1 through October 30", () => {
    expect(SVH_DAYS).toHaveLength(30)
    expect(SVH_DAYS.map((day) => day.day)).toEqual(
      Array.from({ length: 30 }, (_, index) => index + 1)
    )
    expect(new Set(SVH_DAYS.map((day) => day.date)).size).toBe(30)
  })

  it("uses a video model at 9:16 for Reels and an image model for the other days", () => {
    for (const day of SVH_DAYS) {
      const settings = settingsFor(day)
      expect(kindFor(day.format)).toBe(day.format === "Reel" ? "video" : "image")
      expect(modelFor(day.format)).toBe(
        day.format === "Reel" ? VIDEO_MODEL_ID : IMAGE_MODEL_ID
      )
      expect(settings.aspectRatio).toBe(aspectFor(day.format))
      if (day.format === "Reel") {
        expect(settings.aspectRatio).toBe("9:16")
        expect(settings.resolution).toBe("720p")
        expect(settings.generateAudio).toBe(true)
        expect(day.duration).toBeGreaterThanOrEqual(4)
        expect(day.duration).toBeLessThanOrEqual(15)
      } else if (day.format === "Story") {
        expect(settings.aspectRatio).toBe("9:16")
        expect(settings.renderingSpeed).toBe("QUALITY")
      } else {
        expect(settings.aspectRatio).toBe("4:5")
        expect(settings.renderingSpeed).toBe("QUALITY")
      }
    }
  })

  it("fills the plan image prompt and avoids price claims", () => {
    for (const day of SVH_DAYS) {
      const prompt = svhImagePrompt(day.subject)
      expect(prompt).toBe(
        SVH_IMAGE_PROMPT.replace("{room/exterior}", day.subject)
      )
      expect(prompt).not.toContain("{room/exterior}")
      expect(prompt.toLowerCase()).not.toMatch(
        /\$|price|priced|cheap|affordable|discount|percent off|%\s*off/
      )
      expect(`${day.title} ${day.subject}`.toLowerCase()).not.toMatch(
        /\$|price|priced|cheap|affordable|discount/
      )
    }
  })

  it("submits documented Ideogram and Seedance bodies", () => {
    const photo = SVH_DAYS.find((day) => day.format === "Photo")
    const reel = SVH_DAYS.find((day) => day.format === "Reel")
    if (!photo || !reel) throw new Error("missing presets")

    const imageModel = getModel(IMAGE_MODEL_ID)
    const imagePlane = {
      model: imageModel.id,
      prompt: { text: svhImagePrompt(photo.subject) },
      media: {},
      settings: parseSettings(imageModel, settingsFor(photo)),
    }
    const imageRequest = toPlatform(imagePlane)
    expect(imageRequest.path).toBe("ideogram/v4.0")
    expect(imageRequest.body).toEqual({
      prompt: imagePlane.prompt.text,
      aspect_ratio: "4:5",
      rendering_speed: "QUALITY",
    })
    expect(imageRequest.body).not.toHaveProperty("resolution")

    const story = SVH_DAYS.find((day) => day.format === "Story")
    if (!story) throw new Error("missing story")
    expect(
      toPlatform({
        ...imagePlane,
        settings: parseSettings(imageModel, settingsFor(story)),
      }).body.aspect_ratio
    ).toBe("9:16")

    const videoModel = getModel(VIDEO_MODEL_ID)
    const videoRequest = toPlatform({
      model: videoModel.id,
      prompt: { text: svhImagePrompt(reel.subject) },
      media: {},
      settings: parseSettings(videoModel, settingsFor(reel)),
    })
    expect(videoRequest.path).toBe("bytedance/seedance-2.0/text-to-video")
    expect(videoRequest.body).toMatchObject({
      prompt: svhImagePrompt(reel.subject),
      resolution: "720p",
      generate_audio: true,
      duration: reel.duration,
      aspect_ratio: "9:16",
    })
  })
})

describe("installed model catalog", () => {
  it("keeps every model file in the picker for its surface", () => {
    const dir = path.join(ROOT, "generation/catalog/models")
    const ids = new Set<string>()
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".ts") || file.endsWith(".d.ts")) continue
      const source = readFileSync(path.join(dir, file), "utf8")
      for (const match of source.matchAll(/^\s{2}id:\s*"([^"]+)"/gm))
        ids.add(match[1]!)
      for (const match of source.matchAll(
        /(?:imageModel|videoModel)\(\s*"([^"]+)"/g
      ))
        ids.add(match[1]!)
    }
    const installed = new Set(MODELS.map((model) => model.id))
    expect(installed).toEqual(ids)
    expect(ids.size).toBeGreaterThan(20)

    const image = MODELS.filter((model) => model.surface === "image")
    const video = MODELS.filter((model) => model.surface === "video")
    expect(image.length + video.length).toBe(MODELS.length)
    expect(image.some((model) => model.id === IMAGE_MODEL_ID)).toBe(true)
    expect(video.some((model) => model.id === VIDEO_MODEL_ID)).toBe(true)

    const registry = JSON.parse(
      readFileSync(path.join(dir, "registry.json"), "utf8")
    ) as { items: Array<{ meta?: { ids?: string[] } }> }
    const exported = new Set(
      registry.items.flatMap((item) => item.meta?.ids ?? [])
    )
    expect(exported).toEqual(ids)
  })
})

describe("credentials and platform safety", () => {
  it("stores one complete key and sends it unchanged after Key", () => {
    const parsed = parseCredentialInput({ apiKey: "copied-key-without-a-colon" })
    expect(parsed.apiKey).toBe("copied-key-without-a-colon")
    expect(toAuthorizationHeader("id:secret")).toBe("Key id:secret")
  })

  it("does not retry a generation POST after an ambiguous timeout", async () => {
    let calls = 0
    const client = createPlatformClient({
      apiKey: "id:secret",
      baseUrl: "https://api.higgsfield.ai",
      fetch: async () => {
        calls += 1
        throw new Error("network timeout")
      },
    })
    await expect(
      client.submit("bytedance/seedance-2.0/text-to-video", {
        prompt: "a porch",
      })
    ).rejects.toThrow(/not retried/)
    expect(calls).toBe(1)
  })

  it("cancels by POSTing to the platform", async () => {
    const calls: Array<{ url: string; method: string }> = []
    const client = createPlatformClient({
      apiKey: "id:secret",
      baseUrl: "https://api.higgsfield.ai",
      fetch: async (url, init) => {
        calls.push({ url: String(url), method: init?.method ?? "GET" })
        return new Response(null, { status: 202 })
      },
    })
    await client.cancel("req-1")
    expect(calls).toEqual([
      {
        url: "https://api.higgsfield.ai/requests/req-1/cancel",
        method: "POST",
      },
    ])
  })

  it("retries status failures only when the response is transient", () => {
    expect(
      classifyStatusError(new PlatformError(429, { detail: "slow down" }))
    ).toMatchObject({ retryable: true })
    expect(
      classifyStatusError(new PlatformError(401, { detail: "Invalid credentials" }))
    ).toMatchObject({ retryable: false, error: "Invalid credentials" })
    expect(classifyStatusError(new Error("socket hang up")).retryable).toBe(true)
  })

  it("blocks a duplicate submission until it is released or the hold expires", () => {
    resetSubmissions()
    const key = submissionKey({ prompt: "same" })
    claimSubmission(key, 1_000)
    expect(() => claimSubmission(key, 1_001)).toThrow(/already being submitted/)
    releaseSubmission(key)
    claimSubmission(key, 2_000)
    holdSubmission(key, 60_000, 2_000)
    expect(() => claimSubmission(key, 3_000)).toThrow(/already being submitted/)
    claimSubmission(key, 62_001)
    releaseSubmission(key)
  })
})

describe("polling backoff", () => {
  it("grows from two seconds and stops at ten", () => {
    expect(POLL_MIN_MS).toBe(2_000)
    expect(POLL_MAX_MS).toBe(10_000)
    let delay = POLL_MIN_MS
    const seen = [delay]
    for (let i = 0; i < 8; i += 1) {
      delay = nextPollDelay(delay)
      seen.push(delay)
    }
    expect(seen[1]).toBe(3_000)
    expect(seen.at(-1)).toBe(10_000)
    expect(nextPollDelay(10_000)).toBe(10_000)
  })
})
