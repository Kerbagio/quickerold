# QuickER Submission Draft

Copy these answers into the hackathon form after checking the project links and personal bio. Each answer meets the minimum length listed in the official [submission instructions](https://try.ka.nz/hack/submit/instructions).

## Project identity

**Project name:** QuickER — Fastest Suitable Hospital Routing

**One-line pitch:** A free-first decision-support app that proves which suitable hospital is fastest by road ETA, reroutes around availability changes, and explains the verified choice on-device.

**GitHub:** https://github.com/Kerbagio/quickerold

**Live app:** `Add the final GitHub Pages URL after deployment`

**Demo video:** `Add the uploaded MP4 link or form upload`

**Team name:** `Choose one exact spelling and give it to every teammate`

## Problem — minimum 40 words

During emergencies, people may choose the hospital that looks closest on a map even when road conditions make another suitable facility faster to reach. Public specialty information can be incomplete, and real hospital capacity is rarely available to patients or ambulance teams in one clear view. These gaps can waste critical travel time and make routing decisions harder.

## Solution — minimum 40 words

QuickER is a free-first web prototype that ranks nearby hospitals by available road ETA, emergency-type suitability, and clearly labelled availability status instead of straight-line distance alone. It highlights the recommended route, shows alternatives, maps reachable areas, and discloses every data source. A simulator demonstrates how an authorized hospital feed could automatically reroute users when a facility becomes diverting without pretending that the prototype has live capacity data.

## How You Built It — minimum 40 words

I built QuickER with React, TypeScript, Leaflet, OpenStreetMap Overpass, and OSRM for the no-key core. A deterministic decision engine applies specialty metadata, availability tiers, and road ETA before drawing the selected route. A decision-evidence layer compares the closest route, fastest ETA, and fastest suitable option so the result is auditable. A Scenario Lab reruns that pipeline after a clearly labelled simulated availability change. Transformers.js runs an open FLAN-T5 model on-device to explain only the verified, non-location routing facts. Validation and an immediate deterministic fallback prevent the model from changing the result or adding unsupported claims.

## Who Benefits — minimum 20 words

Patients, families, ambulance teams, emergency planners, hospitals, and communities with limited access to reliable traffic-aware care routing can benefit from QuickER.

## Future Vision — minimum 20 words

Next, QuickER could integrate authorized hospital capacity feeds, verified specialty registries, live traffic services, ambulance dispatch systems, multilingual voice access, and regional accessibility forecasting.

## Professional Bio — minimum 20 words

I am an emerging technology builder focused on responsible AI, accessible digital services, and practical products that solve high-impact community problems through thoughtful design.

Personalize that sentence before submission if you want to mention your school, country, role, technical interests, or previous projects. Do not add qualifications you cannot verify.

## Honest cost and data statement

The deployed core uses GitHub Pages, OpenStreetMap data, public OSRM routing, local browser storage, and an on-device open model, so it requires no billing or secret key. Public endpoints are best-effort and may be rate-limited or unavailable. Live traffic and authoritative hospital availability are not claimed in the static prototype; those require approved provider access and an authorized hospital data source.

## Claims to use in the demo

- “Fastest suitable option by the best available road ETA.”
- “Real public hospital map records.”
- “Availability is simulated for this prototype.”
- “The routing engine decides; on-device AI explains the verified result but cannot change it.”
- “The Scenario Lab reruns the real ranking pipeline with a clearly labelled simulated availability feed.”
- “The core has a $0 deployment path with no billing.”
- “Free public services have limits, and every fallback is labelled.”

## Claims not to use

- “Guaranteed fastest hospital.”
- “Live hospital beds” or “live hospital availability.”
- “Live traffic” when the source badge says road network or distance estimate.
- “This app is an ambulance dispatcher, medical device, or medical adviser.”
- “Unlimited uptime” or “works forever without provider limits.”
- “The AI selected the hospital.”

## Final form checklist

- Problem: at least 40 words.
- Solution: at least 40 words.
- How You Built It: at least 40 words.
- Who Benefits: at least 20 words.
- Future Vision: at least 20 words.
- Professional Bio: at least 20 words.
- MP4 demo: working app, visible AI action, 1–3 minutes recommended, 50–200 MB, 16:9.
- Screenshots: real functioning interface only.
- Resume: PDF.
- Team submissions: identical team-name spelling.
