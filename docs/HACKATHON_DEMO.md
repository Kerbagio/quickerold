# QuickER Hackathon Demo

Use this as the recording plan for a two-minute landscape demo. The official [submission instructions](https://try.ka.nz/hack/submit/instructions) prioritize the working demo video and recommend an MP4 lasting 1–3 minutes, sized 50–200 MB, in 16:9. Use your own narration and show the real app—not slides or generated mockups.

## Recording preflight

- Record the deployed GitHub Pages build in a 16:9 browser window.
- Run the full sequence once before recording. Generate the Decision Brief on Home so the roughly 100 MB model is already cached.
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

### 0:12–0:34 — Real hospital search and ranking

**Do:** Select **Use Beirut demo point** and wait for the ranked results.

**Say:** “I’ll use the clearly labelled Beirut presentation point. QuickER discovers real hospital map records from OpenStreetMap, calculates road ETAs through OSRM, and ranks the suitable candidates. Every result exposes its source. This availability feed is simulated for the prototype, so I’m not claiming access to live hospital capacity.”

### 0:34–0:55 — Prove closest is not always fastest

**Do:** Keep the closest/fastest/suitable evidence card visible, then open the recommended route.

**Say:** “QuickER does not just announce a result. It compares the closest route, the fastest ETA, and the fastest suitable hospital. Here the evidence shows exactly whether road travel time changes the recommendation, while source and uncertainty remain visible.”

### 0:55–1:17 — AI explains; the engine decides

**Do:** Select **Generate AI Decision Brief**. Keep the completed brief and **On-device AI · validated** badge visible.

**Say:** “After the deterministic routing engine chooses the hospital, an open model explains the verified facts inside the browser with no API key. It receives no precise location, cannot change the hospital, and its answer is validated. If it fails, QuickER immediately uses a deterministic brief.”

### 1:17–1:43 — Availability rerouting Scenario Lab

**Do:** Open **Scenario**, run **Run rerouting scenario**, and pause on the completed before/event/after comparison.

**Say:** “Now I stress-test the same decision. This clearly labelled simulated feed marks the first facility as diverting. QuickER reruns the real suitability and ETA ranking, selects the next eligible option, and exposes the extra travel-time trade-off instead of hiding it.”

### 1:43–1:53 — Accessibility and impact evidence

**Do:** Briefly show the Scenario access filters and then open **Dashboard**.

**Say:** “Accessibility evidence separates explicit public tags from unknown data. The dashboard records only location-free decision summaries and reports potential time difference—not invented patient outcomes.”

### 1:53–2:00 — Honest $0 close

**Do:** Open **About** and show the free architecture and limitations.

**Say:** “QuickER’s core costs zero dollars to run, with no billing enabled. Public services and free enhancements have limits, live hospital availability needs an authorized feed, and this prototype supports routing decisions rather than replacing local emergency services.”

## Real screenshot shot list

1. **Find Hospital:** ranked results after the Beirut demo point, including the recommended hospital and ETA source badge.
2. **Route:** highlighted road route with the alternatives list visible.
3. **Decision evidence:** closest route, fastest ETA, and fastest suitable comparison.
4. **Decision Brief:** completed explanation with the validated **On-device AI** badge.
5. **Scenario Lab:** before/event/after rerouting result and the access-evidence map.
6. **Dashboard:** potential time difference and public metadata coverage with the limitation notice visible.

Do not submit AI-generated interface images, stock images, design concepts, or screenshots of code without the working app. Crop only for privacy or empty browser chrome; do not edit the interface result.

## Upload checklist

- MP4 video, 1–3 minutes, 50–200 MB, landscape 16:9.
- Working app and visible AI action shown in the video.
- Own spoken narration where possible.
- Only real screenshots of the functioning app.
- Resume uploaded as PDF.
- Every teammate submits separately using the exact same team name.
- Recheck the public URL in a private browser window before submitting.
