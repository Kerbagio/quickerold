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
- In-app page memory preserves searches, filters, routes, onboarding progress, and Agent conversations while navigating. Every destination opens at the top.
- A typed dispatch agent that executes location, hospital discovery, ETA ranking, and result-verification tools inside the conversation.
- On-device AI explanation with an immediate verified deterministic fallback.

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
7. Store only a small, local decision summary for the dashboard and agent explanation.

Interactive page state—including precise GPS coordinates needed to restore a search—stays only in volatile JavaScript memory for the current browser tab. It is never written to `localStorage` or decision history and disappears on reload or tab close. Preferences and non-location decision summaries can remain in browser storage until the user clears them.

The open FLAN-T5 Small model is downloaded on demand and runs inside a browser worker. It receives only the non-location decision summary, cannot change the selected hospital, and is rejected if it omits core facts or adds unsupported medical claims. The first model download is about 100 MB; the browser can reuse its cache. If loading or validation fails, QuickER displays the deterministic explanation.

The Agent page accepts plain-language routing commands. For a request such as “Find an available ER hospital with the fastest ETA,” it requests GPS, retrieves OpenStreetMap hospitals, automatically expands the search radius when necessary, calculates and ranks ETAs, and returns the recommended hospital plus alternatives directly in chat. The labelled Beirut point provides a reproducible presentation fallback when GPS is unavailable. Eligible explanation questions can then be refined by the local model. The visible activity trace shows observable tools and validation steps, not hidden chain-of-thought.

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
3. Open **Dashboard**, select **Run rerouting demo**, and show the diverting hospital move below an accepting alternative.
4. Open **Emergency Options**, change the specialty filter, and show the 5/10/15-minute accessibility layer.
5. Open **Agent**, type **Find ER hospitals using the Beirut demo**, and show the agent execute discovery and ETA tools before returning the best result and alternatives in chat. Select **Explain choice** to show the account-free on-device AI badge. Warm the model cache before recording.
6. End on **About** to explain the $0 architecture and its honest limitations.

## Technology

React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Leaflet, Recharts, OpenStreetMap/Overpass, OSRM, optional TomTom, optional openrouteservice, Transformers.js, FLAN-T5 Small, and Cloudflare Pages Functions.
