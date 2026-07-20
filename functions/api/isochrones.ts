interface Env {
  ORS_API_KEY?: string;
}

interface Coordinate {
  lat: number;
  lng: number;
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

function validCoordinate(value: unknown): value is Coordinate {
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
}

export async function onRequestPost({ request, env }: PagesContext) {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }
  if (!env.ORS_API_KEY) {
    return json({ error: "Road isochrones are not configured." }, 503);
  }

  let location: unknown;
  try {
    const body = (await request.json()) as { location?: unknown };
    location = body.location;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  if (!validCoordinate(location)) {
    return json({ error: "Invalid location." }, 400);
  }

  try {
    const response = await fetch(
      "https://api.openrouteservice.org/v2/isochrones/driving-car",
      {
        method: "POST",
        headers: {
          Authorization: env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations: [[location.lng, location.lat]],
          range: [300, 600, 900],
          range_type: "time",
        }),
      },
    );
    if (!response.ok) return json({ error: "Isochrone quota unavailable." }, 503);
    return json(await response.json());
  } catch {
    return json({ error: "Isochrone provider unavailable." }, 503);
  }
}
