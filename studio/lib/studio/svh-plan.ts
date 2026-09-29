/**
 * October 2026 Instagram plan for Southern View Homes.
 * Image prompts use the plan's template with the day's subject filled in.
 * Reel days use Seedance 2.0 at 9:16. Photo and carousel days use Ideogram 4.0
 * at 4:5. Stories use Ideogram 4.0 at 9:16. Both ratios are in those models'
 * documented input schemas.
 */

export const SVH_IMAGE_PROMPT =
  "Bright, high-end real estate photo of {room/exterior} in a new Carolina custom home, natural light, wide angle, clean staging, warm neutral palette, no people, no text."

export const IMAGE_MODEL_ID = "ideogram-4"
export const VIDEO_MODEL_ID = "seedance-2"

export type SvhFormat = "Reel" | "Carousel" | "Photo" | "Story"
export type SvhCta = "DM TOUR" | "link in bio" | "book a private tour"

export type SvhDay = {
  day: number
  date: string
  format: SvhFormat
  pillar: string
  title: string
  subject: string
  cta: SvhCta
  /** Seedance text-to-video duration. The documented range is 4–15 seconds. */
  duration: number | null
  images: [string, string, string]
}

const twilight = "/presets/twilight.svg"
const kitchen = "/presets/kitchen.svg"
const bath = "/presets/bath.svg"
const porch = "/presets/porch.svg"
const detail = "/presets/detail.svg"
const framing = "/presets/framing.svg"
const neighborhood = "/presets/neighborhood.svg"
const selections = "/presets/selections.svg"

export function svhImagePrompt(subject: string): string {
  return SVH_IMAGE_PROMPT.replace("{room/exterior}", subject)
}

export function aspectFor(format: SvhFormat): "4:5" | "9:16" {
  return format === "Photo" || format === "Carousel" ? "4:5" : "9:16"
}

export function kindFor(format: SvhFormat): "image" | "video" {
  return format === "Reel" ? "video" : "image"
}

export function modelFor(format: SvhFormat): string {
  return format === "Reel" ? VIDEO_MODEL_ID : IMAGE_MODEL_ID
}

export function settingsFor(day: SvhDay): Record<string, unknown> {
  if (day.format === "Reel") {
    if (day.duration == null)
      throw new Error(`Day ${day.day} is a Reel and needs a duration.`)
    return {
      aspectRatio: "9:16",
      resolution: "720p",
      duration: day.duration,
      generateAudio: true,
    }
  }
  return {
    aspectRatio: aspectFor(day.format),
    renderingSpeed: "QUALITY",
  }
}

export const SVH_DAYS: readonly SvhDay[] = [
  {
    day: 1,
    date: "Oct 1",
    format: "Reel",
    pillar: "Available Homes",
    title: "Available home walkthrough",
    subject:
      "an available home, from the front door through the kitchen to the primary suite",
    cta: "DM TOUR",
    duration: 15,
    images: [twilight, kitchen, bath],
  },
  {
    day: 2,
    date: "Oct 2",
    format: "Carousel",
    pillar: "Craftsmanship Details",
    title: "Upgrades in every home",
    subject: "cabinets, counters, trim, lighting, and flooring",
    cta: "link in bio",
    duration: null,
    images: [selections, kitchen, detail],
  },
  {
    day: 3,
    date: "Oct 3",
    format: "Photo",
    pillar: "Available Homes",
    title: "Twilight exterior",
    subject: "a twilight exterior with the front porch and the lot beyond",
    cta: "link in bio",
    duration: null,
    images: [twilight, porch, neighborhood],
  },
  {
    day: 4,
    date: "Oct 4",
    format: "Reel",
    pillar: "Process and Trust",
    title: "Framing to finish",
    subject: "one room moving from open framing to a finished space",
    cta: "link in bio",
    duration: 12,
    images: [framing, kitchen, detail],
  },
  {
    day: 5,
    date: "Oct 5",
    format: "Story",
    pillar: "Craftsmanship Details",
    title: "Kitchen or dining",
    subject: "an open kitchen opening toward a separate dining room",
    cta: "link in bio",
    duration: null,
    images: [kitchen, twilight, porch],
  },
  {
    day: 6,
    date: "Oct 6",
    format: "Carousel",
    pillar: "Build On Your Lot",
    title: "Build on your lot",
    subject: "a custom home rising on the owner's own lot",
    cta: "link in bio",
    duration: null,
    images: [neighborhood, framing, twilight],
  },
  {
    day: 7,
    date: "Oct 7",
    format: "Photo",
    pillar: "Client Stories",
    title: "A room for a client story",
    subject: "a finished living room ready for a family's own story",
    cta: "link in bio",
    duration: null,
    images: [kitchen, porch, twilight],
  },
  {
    day: 8,
    date: "Oct 8",
    format: "Reel",
    pillar: "Craftsmanship Details",
    title: "Details we sweat",
    subject: "trim, tile, and hardware in close detail",
    cta: "link in bio",
    duration: 8,
    images: [detail, bath, selections],
  },
  {
    day: 9,
    date: "Oct 9",
    format: "Photo",
    pillar: "Available Homes",
    title: "How the plan lives",
    subject: "a bright great room that shows how the floor plan lives",
    cta: "link in bio",
    duration: null,
    images: [kitchen, twilight, porch],
  },
  {
    day: 10,
    date: "Oct 10",
    format: "Carousel",
    pillar: "Process and Trust",
    title: "Building new, clearly",
    subject: "a finished Carolina home that feels clear and welcoming",
    cta: "link in bio",
    duration: null,
    images: [twilight, kitchen, neighborhood],
  },
  {
    day: 11,
    date: "Oct 11",
    format: "Reel",
    pillar: "Process and Trust",
    title: "On site with the builder",
    subject: "a quiet job site at the front of a home under construction",
    cta: "link in bio",
    duration: 15,
    images: [framing, twilight, detail],
  },
  {
    day: 12,
    date: "Oct 12",
    format: "Photo",
    pillar: "Craftsmanship Details",
    title: "Primary bathroom",
    subject: "a spa-inspired primary bathroom",
    cta: "link in bio",
    duration: null,
    images: [bath, detail, selections],
  },
  {
    day: 13,
    date: "Oct 13",
    format: "Story",
    pillar: "Process and Trust",
    title: "Ask the builder",
    subject: "a front porch set for a conversation with the builder",
    cta: "link in bio",
    duration: null,
    images: [porch, twilight, neighborhood],
  },
  {
    day: 14,
    date: "Oct 14",
    format: "Carousel",
    pillar: "Craftsmanship Details",
    title: "Selections day",
    subject: "tile, counter, paint, and lighting samples laid out for selections",
    cta: "link in bio",
    duration: null,
    images: [selections, kitchen, bath],
  },
  {
    day: 15,
    date: "Oct 15",
    format: "Reel",
    pillar: "Process and Trust",
    title: "The question families ask",
    subject: "a finished living room where a builder would answer a question",
    cta: "link in bio",
    duration: 12,
    images: [kitchen, porch, twilight],
  },
  {
    day: 16,
    date: "Oct 16",
    format: "Photo",
    pillar: "Community and Lifestyle",
    title: "Life around the home",
    subject:
      "the neighborhood just beyond the porch, near water and a tree-lined street",
    cta: "link in bio",
    duration: null,
    images: [neighborhood, porch, twilight],
  },
  {
    day: 17,
    date: "Oct 17",
    format: "Carousel",
    pillar: "Process and Trust",
    title: "After move-in",
    subject: "a cared-for finished home after move-in",
    cta: "link in bio",
    duration: null,
    images: [twilight, kitchen, detail],
  },
  {
    day: 18,
    date: "Oct 18",
    format: "Reel",
    pillar: "Build On Your Lot",
    title: "From lot to home",
    subject: "a raw lot becoming a finished home",
    cta: "link in bio",
    duration: 12,
    images: [framing, neighborhood, twilight],
  },
  {
    day: 19,
    date: "Oct 19",
    format: "Photo",
    pillar: "Craftsmanship Details",
    title: "Kitchen island",
    subject: "a kitchen island with generous storage",
    cta: "link in bio",
    duration: null,
    images: [kitchen, detail, selections],
  },
  {
    day: 20,
    date: "Oct 20",
    format: "Carousel",
    pillar: "Process and Trust",
    title: "What shapes the home",
    subject: "the craft and choices inside a new home",
    cta: "link in bio",
    duration: null,
    images: [selections, framing, kitchen],
  },
  {
    day: 21,
    date: "Oct 21",
    format: "Reel",
    pillar: "Available Homes",
    title: "Another home to tour",
    subject:
      "a second available home, from the front door into the main living spaces",
    cta: "DM TOUR",
    duration: 15,
    images: [twilight, kitchen, porch],
  },
  {
    day: 22,
    date: "Oct 22",
    format: "Photo",
    pillar: "Community and Lifestyle",
    title: "Outdoor living",
    subject: "a porch, patio, and backyard made for time outside",
    cta: "link in bio",
    duration: null,
    images: [porch, neighborhood, twilight],
  },
  {
    day: 23,
    date: "Oct 23",
    format: "Story",
    pillar: "Craftsmanship Details",
    title: "This finish or that",
    subject: "two finish directions side by side, warm oak and soft stone",
    cta: "link in bio",
    duration: null,
    images: [selections, detail, kitchen],
  },
  {
    day: 24,
    date: "Oct 24",
    format: "Carousel",
    pillar: "Craftsmanship Details",
    title: "Comfort built in",
    subject:
      "a comfortable room shaped by insulation, windows, and quiet heating and cooling",
    cta: "link in bio",
    duration: null,
    images: [kitchen, detail, twilight],
  },
  {
    day: 25,
    date: "Oct 25",
    format: "Reel",
    pillar: "Process and Trust",
    title: "Morning on the job site",
    subject: "a job site in morning light",
    cta: "link in bio",
    duration: 12,
    images: [framing, detail, twilight],
  },
  {
    day: 26,
    date: "Oct 26",
    format: "Photo",
    pillar: "Client Stories",
    title: "Closing day",
    subject: "a front door and a set of keys on a console at closing",
    cta: "link in bio",
    duration: null,
    images: [twilight, porch, kitchen],
  },
  {
    day: 27,
    date: "Oct 27",
    format: "Carousel",
    pillar: "Build On Your Lot",
    title: "Land ready to build",
    subject: "open land and a homesite ready for a custom build",
    cta: "link in bio",
    duration: null,
    images: [neighborhood, framing, twilight],
  },
  {
    day: 28,
    date: "Oct 28",
    format: "Reel",
    pillar: "Available Homes",
    title: "Three favorite features",
    subject: "a porch, a kitchen island, and a primary suite in one continuous look",
    cta: "link in bio",
    duration: 7,
    images: [porch, kitchen, bath],
  },
  {
    day: 29,
    date: "Oct 29",
    format: "Photo",
    pillar: "Craftsmanship Details",
    title: "Craft in the details",
    subject: "a craftsmanship close-up of trim and hardware",
    cta: "link in bio",
    duration: null,
    images: [detail, selections, kitchen],
  },
  {
    day: 30,
    date: "Oct 30",
    format: "Carousel",
    pillar: "Available Homes",
    title: "Book a private tour",
    subject: "a finished Southern View home at the front door, ready for a private tour",
    cta: "book a private tour",
    duration: null,
    images: [twilight, kitchen, porch],
  },
]
