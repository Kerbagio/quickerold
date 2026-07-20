# QuickER

QuickER ranks nearby hospitals by the fastest suitable travel option—not straight-line distance alone. It combines public hospital data, road travel times, emergency-type filters, an optional live-traffic layer, and a clearly labelled demo availability feed.

> QuickER is routing decision support, not a medical service or ambulance dispatcher. It does not diagnose, confirm hospital capability, or replace local emergency services.

## What works with no account or API key

- Browser GPS or a clearly labelled Beirut presentation point.
- Nearby hospital discovery from OpenStreetMap through public Overpass endpoints.
- Road-network ETA ranking and route geometry through the public OSRM demo service.
- General, cardiac, pediatric, and maternity metadata filtering.
- Automatic distance-estimate fallback if public routing is unavailable.
- Simulated availability changes for demonstrating automatic reranking.
- Local-only analytics dashboard and CSV export; precise coordinates are not stored.
- Deterministic agent explanation when the optional AI quota is unavailable.

## Optional free-tier upgrades

Provider keys are stored only as Cloudflare Pages secrets. They are never bundled into frontend JavaScript.

| Secret | Feature | Fallback when missing or limited |
|---|---|---|
| `TOMTOM_API_KEY` | Live-traffic ETA for the five fastest road candidates | OSRM road-network ETA |
| `ORS_API_KEY` | Road-based 5/10/15-minute isochrones | Clearly labelled estimated circles |
| `GEMINI_API_KEY` | Natural-language explanation of a structured decision | Deterministic explanation |
| `GEMINI_MODEL` | Optional Gemini model override | `gemini-3.5-flash` |

Use provider projects with billing disabled if the goal is a strict $0 ceiling. Free quotas can run out and public services do not promise uptime; QuickER degrades visibly instead of inventing data or creating a charge.

## Decision flow

1. Discover hospitals within the selected radius using public map data.
2. Apply the emergency-type metadata filter. If no specialty metadata matches, show general hospitals with a warning.
3. Pre-rank up to 12 nearby candidates with an OSRM road matrix.
4. If configured, compare the fastest five again using live traffic.
5. Rank `accepting`, then `limited`, then `unknown`, and place `diverting` facilities last; sort each group by ETA.
6. Highlight the best option, disclose its source, and render the road path.
7. Store only a small, local decision summary for the dashboard and agent explanation.

The generative AI layer explains a completed structured decision. It cannot change the selected hospital, invent availability, or provide medical advice.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:8080`. Without keys, the complete core flow still works using the free fallbacks.

Run all checks:

```bash
npm run check
```

To test Cloudflare Pages Functions locally, copy `.dev.vars.example` to `.dev.vars`, add only the secrets you want to test, then run:

```bash
npm run build
npx wrangler pages dev dist
```

Never commit `.dev.vars`, `.env`, or real keys.

## Deploy for $0 on Cloudflare Pages

1. Create a Cloudflare Pages project from this GitHub repository.
2. Set the build command to `npm run build` and output directory to `dist`.
3. Deploy once. The app works immediately in road-network fallback mode.
4. Optionally add the free provider keys under Pages project settings → Variables and Secrets.
5. Redeploy and verify the source badges on the Find Hospital and Emergency Options pages.

The `functions/api` directory contains the secret-protecting traffic, isochrone, and Gemini proxies. `public/_redirects` preserves React routes on refresh.

## Demo sequence

1. Open **Find Hospital**, choose **Use Beirut demo point**, and show that hospitals are ranked by road ETA.
2. Open the fastest route and point to the ETA source badge.
3. Open **Dashboard**, select **Run rerouting demo**, and show the diverting hospital move below an accepting alternative.
4. Open **Emergency Options**, change the specialty filter, and show the 5/10/15-minute accessibility layer.
5. Open **Agent**, generate an explanation, and show whether Gemini or the deterministic fallback produced it.
6. End on **About** to explain the $0 architecture and its honest limitations.

## Technology

React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Leaflet, Recharts, OpenStreetMap/Overpass, OSRM, optional TomTom, optional openrouteservice, optional Gemini, and Cloudflare Pages Functions.
