import type { GenerationPlane, ModelEntry, PlatformRequest } from "../types"

/**
 * Ideogram 4.0 input schema, verified from
 * https://dash.higgsfield.ai/models/ideogram/v4.0/llms.txt
 * (linked from the open.higgsfield.ai playground).
 * `additionalProperties` is false. There is no `resolution` field.
 * `4:5` and `9:16` are documented aspect ratios.
 */
const IDEOGRAM_ASPECT = [
  "1:1",
  "1:2",
  "2:1",
  "2:3",
  "3:2",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "5:8",
  "8:5",
  "3:4",
  "4:3",
  "9:22",
  "22:9",
  "9:23",
  "23:9",
  "3:8",
  "8:3",
  "5:12",
  "12:5",
  "1:3",
  "3:1",
] as const

const IDEOGRAM_SPEED = ["TURBO", "DEFAULT", "QUALITY"] as const
const PATH = "ideogram/v4.0"

function mapIdeogram(plane: GenerationPlane): PlatformRequest {
  const prompt = plane.prompt.text.trim()
  if (prompt.length < 2 || prompt.length > 2048)
    throw new Error("Ideogram prompts must be between 2 and 2048 characters.")
  const image = plane.media.reference?.[0]?.url
  return {
    path: PATH,
    body: {
      prompt,
      aspect_ratio: plane.settings.aspectRatio,
      rendering_speed: plane.settings.renderingSpeed,
      ...(image ? { image_url: image } : {}),
    },
  }
}

const ideogram4: ModelEntry = {
  id: "ideogram-4",
  surface: "image",
  label: "Ideogram 4.0",
  roles: { reference: 1 },
  settings: {
    aspectRatio: { type: "enum", values: IDEOGRAM_ASPECT, default: "4:5" },
    renderingSpeed: {
      type: "enum",
      values: IDEOGRAM_SPEED,
      default: "DEFAULT",
    },
  },
  icon: "ideogram",
  order: 42,
  toPlatform: mapIdeogram,
}

export default ideogram4
