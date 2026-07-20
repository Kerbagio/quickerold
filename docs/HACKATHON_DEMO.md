# QuickER Hackathon Demo

Use this as the recording plan for a two-minute landscape demo. The official [submission instructions](https://try.ka.nz/hack/submit/instructions) prioritize the working demo video and recommend an MP4 lasting 1–3 minutes, sized 50–200 MB, in 16:9. Use your own narration and show the real app—not slides or generated mockups.

## Recording preflight

- Record the deployed GitHub Pages build in a 16:9 browser window.
- Run the full sequence once before recording. On the Agent page, click **Run free on-device AI** so the roughly 100 MB model is already cached.
- Confirm the AI result badge says **On-device AI**. If it says **Deterministic fallback**, refresh and retry before recording; never call a fallback result AI-generated.
- Use the labelled Beirut demo point so the route is reproducible and no personal location appears in the video.
- Keep the ETA source badge visible. On the static $0 build, describe it as road-network ETA—not live traffic.
- Keep the simulated availability label visible and say it is a demo feed.
- Close personal tabs, notifications, bookmarks, account names, keys, and private files before recording.
- Record only a functioning interface. If a provider is temporarily unavailable, wait or re-record after the fallback label is clearly visible.

## Two-minute script and actions

### 0:00–0:12 — Problem and promise

**Show:** Find Hospital landing state.

**Say:** “In an emergency, the hospital that is closest by distance may not be the fastest suitable option by road. QuickER compares road travel time, specialty metadata, and availability status to make that decision clearer.”

### 0:12–0:36 — Real hospital search and ranking

**Do:** Select **Use Beirut demo point** and wait for the ranked results.

**Say:** “I’ll use the clearly labelled Beirut presentation point. QuickER discovers real hospital map records from OpenStreetMap, calculates road ETAs through OSRM, and ranks the suitable candidates. Every result exposes its source. This availability feed is simulated for the prototype, so I’m not claiming access to live hospital capacity.”

### 0:36–0:54 — Recommended road route

**Do:** Open the recommended route and briefly scroll through the alternatives.

**Say:** “The fastest eligible option is highlighted with its road route, ETA, distance, specialty metadata, and alternatives. A user can hand the destination to navigation, while QuickER stays transparent when routing falls back to an estimate.”

### 0:54–1:13 — Automatic rerouting scenario

**Do:** Open **Dashboard** and select **Run rerouting demo**.

**Say:** “Here is the decision agent reacting to a status change. When the first facility becomes diverting in the simulator, QuickER evaluates the list again and moves an accepting alternative ahead of it. The dashboard is built from local summaries and stores no precise coordinates.”

### 1:13–1:30 — Specialty and accessibility view

**Do:** Open **Emergency Options**, change the emergency type, and show the 5/10/15-minute layers.

**Say:** “Emergency Options filters by available specialty metadata and visualizes five, ten, and fifteen-minute reach. The free static build labels these as estimated areas; an authorized road-isochrone integration can replace them later.”

### 1:30–1:50 — AI visibly working

**Do:** Open **Agent** and click **Run free on-device AI**. Keep the progress indicator and final **On-device AI** badge visible.

**Say:** “The explanation layer uses an open FLAN-T5 model through Transformers.js. It runs inside the browser, needs no key or paid API, and receives no precise location. It can explain a completed decision but cannot choose the hospital. QuickER rejects output that drops required facts or adds unsupported medical claims.”

### 1:50–2:00 — Honest $0 close

**Do:** Open **About** and show the free architecture and limitations.

**Say:** “QuickER’s core costs zero dollars to run, with no billing enabled. Public services and free enhancements have limits, live hospital availability needs an authorized feed, and this prototype supports routing decisions rather than replacing local emergency services.”

## Real screenshot shot list

1. **Find Hospital:** ranked results after the Beirut demo point, including the recommended hospital and ETA source badge.
2. **Route:** highlighted road route with the alternatives list visible.
3. **Dashboard:** rerouting scenario after the first facility becomes diverting.
4. **Emergency Options:** specialty filter and 5/10/15-minute accessibility layers, including the estimate label.
5. **Agent:** completed explanation with the **On-device AI** badge visible.

Do not submit AI-generated interface images, stock images, design concepts, or screenshots of code without the working app. Crop only for privacy or empty browser chrome; do not edit the interface result.

## Upload checklist

- MP4 video, 1–3 minutes, 50–200 MB, landscape 16:9.
- Working app and visible AI action shown in the video.
- Own spoken narration where possible.
- Only real screenshots of the functioning app.
- Resume uploaded as PDF.
- Every teammate submits separately using the exact same team name.
- Recheck the public URL in a private browser window before submitting.
