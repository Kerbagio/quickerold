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
- Local-only analytics dashboard and CSV export; decision history excludes precise coordinates.
- In-app page memory preserves searches, filters, routes, onboarding progress, Scenario Lab settings, and generated decision briefs while navigating. Every destination opens at the top.
- A closest-versus-fastest evidence layer that proves when road ETA changes the recommendation.
- A clearly labelled Scenario Lab that reruns the real ranking pipeline after a simulated availability change.
- On-device AI Decision Brief with validation and an immediate deterministic fallback.

## Optional free-tier upgrades

The GitHub Pages build needs no secrets. Optional provider keys belong only in a managed server-side environment; they are never bundled into frontend JavaScript.

| Secret | Feature | Fallback when missing or limited |
|---|---|---|
| `TOMTOM_API_KEY` | Live-traffic ETA for the five fastest road candidates | OSRM road-network ETA |
| `ORS_API_KEY` | Road-based 5/10/15-minute isochrones | Clearly labelled estimated circles |

Do not enable billing when the goal is a strict $0 ceiling. Free quotas can run out and public services do not promise uptime; QuickER degrades visibly instead of inventing data or creating a charge. The default GitHub Pages deployment uses the no-key fallbacks and cannot call the optional secret-backed traffic or isochrone functions.

## Decision flow

1. Discover hospitals within the selected radius using public map data.
2. Apply the emergency-type metadata filter. If no specialty metadata matches, show general hospitals with a warning.
3. Pre-rank up to 12 nearby candidates with an OSRM road matrix.
4. If configured, compare the fastest five again using live traffic.
5. Rank `accepting`, then `limited`, then `unknown`, and place `diverting` facilities last; sort each group by ETA.
6. Highlight the best option, disclose its source, and render the road path.
7. Compare the selected hospital with the closest route and fastest ETA so the recommendation is auditable.
8. Store only a small, location-free decision summary for the dashboard and optional AI explanation.

Interactive page state—including precise GPS coordinates needed to restore a search—stays only in volatile JavaScript memory for the current browser tab. It is never written to `localStorage` or decision history and disappears on reload or tab close. Preferences and non-location decision summaries can remain in browser storage until the user clears them.

The open FLAN-T5 Small model is downloaded on demand and runs inside a browser worker. After the routing engine has made its choice, the **Decision Brief** receives only a non-location summary of that result. It cannot change the selected hospital. QuickER rejects a generated brief if it drops core facts or adds unsupported medical claims, then displays the verified deterministic explanation instead. The first model download is about 100 MB and can be reused from the browser cache.

The **Scenario Lab** demonstrates a realistic operational handoff without faking live capacity. It marks the current recommendation as diverting in a clearly labelled local demo feed, reruns the same specialty, availability, and ETA pipeline, and shows the before/event/after decision plus its travel-time trade-off. Its accessibility view distinguishes explicit public tags from missing or unknown data.

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

Never commit `.dev.vars`, `.env`, or real keys.

## Deploy for $0 on GitHub Pages

1. In this repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
2. Merge the feature branch into `main`.
3. The included **Deploy GitHub Pages** workflow builds the correct repository path and publishes the site.
4. Open `https://kerbagio.github.io/quickerold/` and verify the road-network and fallback source badges.

The static deployment needs no account beyond the existing GitHub repository, no API key, and no billing. The `functions/api` directory remains an optional integration example for an eligible organization that later wants to manage TomTom or openrouteservice secrets after reviewing those providers' terms. `public/_redirects` preserves React routes on compatible function hosts; GitHub Pages receives its own generated SPA fallback.

## Demo sequence

1. Open **Find Hospital**, choose **Use Beirut demo point**, and show that hospitals are ranked by road ETA.
2. Open the fastest route and point to the ETA source badge.
3. Point to **Closest route**, **Fastest ETA**, and **Fastest suitable** to prove why the result was selected.
4. Select **Generate AI Decision Brief** and keep the validated **On-device AI** badge visible. Warm the model cache before recording.
5. Open **Scenario**, run the availability rerouting scenario, and show the before/event/after result plus access evidence.
6. Open **Dashboard** to show local decision evidence and metadata coverage, then finish on **About** for the $0 architecture and honest limitations.

## Technology

React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Leaflet, Recharts, OpenStreetMap/Overpass, OSRM, optional TomTom, optional openrouteservice, Transformers.js, FLAN-T5 Small, and Cloudflare Pages Functions.
