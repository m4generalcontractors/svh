# SVH Content Studio

Instagram image and Reel renderings for Southern View Homes, a custom and spec home builder in the Carolinas. The app uses the Higgsfield generative media API. AI output is a rendering, not a listing photo, and the studio does not make price claims.

## Run

```bash
cd studio
pnpm install
pnpm dev
```

Open http://localhost:3000. In the sidebar, choose **Connect API key** and paste the complete key copied from [open.higgsfield.ai](https://open.higgsfield.ai/api-keys). Paste it as-is. The key stays in an HTTP-only cookie and is used only by the server.

`HF_API_BASE_URL` must be `https://api.higgsfield.ai` (see `.env.example`). Do not set a shared `HF_API_KEY`.

## October plan

Home lists one preset per day for October 1–30, 2026. Reel days open Seedance 2.0 at 9:16. Photo and carousel days open Ideogram 4.0 at 4:5. Stories open Ideogram 4.0 at 9:16. The prompt is the plan's image template with that day's subject filled in. Use a real Southern View project photo or clip when you have one. The full Higgsfield model catalog stays available in the picker.
