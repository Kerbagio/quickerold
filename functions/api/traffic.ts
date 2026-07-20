interface Env {
  TOMTOM_API_KEY?: string;
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface Candidate extends Coordinate {
  id: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const validCoordinate = (value: unknown): value is Coordinate => {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<Coordinate>;
  return (
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180
  );
};

export async function onRequestPost({ request, env }: PagesContext) {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }
  if (!env.TOMTOM_API_KEY) {
    return json({ error: "Live traffic is not configured." }, 503);
  }

  let origin: unknown;
  let candidates: unknown;
  try {
    const body = (await request.json()) as {
      origin?: unknown;
      candidates?: unknown;
    };
    origin = body.origin;
    candidates = body.candidates;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  if (
    !validCoordinate(origin) ||
    !Array.isArray(candidates) ||
    candidates.length < 1 ||
    candidates.length > 5 ||
    !candidates.every(
      (candidate): candidate is Candidate =>
        validCoordinate(candidate) &&
        typeof (candidate as Partial<Candidate>).id === "string" &&
        (candidate as Partial<Candidate>).id!.length <= 80,
    )
  ) {
    return json({ error: "Invalid routing request." }, 400);
  }

  try {
    const response = await fetch(
      `https://api.tomtom.com/routing/matrix/2?key=${encodeURIComponent(env.TOMTOM_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origins: [
            { point: { latitude: origin.lat, longitude: origin.lng } },
          ],
          destinations: candidates.map((candidate) => ({
            point: {
              latitude: candidate.lat,
              longitude: candidate.lng,
            },
          })),
          options: {
            departAt: "now",
            routeType: "fastest",
            traffic: "live",
            travelMode: "car",
          },
        }),
      },
    );
    if (!response.ok) return json({ error: "Traffic quota unavailable." }, 503);
    return json(await response.json());
  } catch {
    return json({ error: "Traffic provider unavailable." }, 503);
  }
}
