"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const ROOT = __dirname;
const DEFAULT_DATA_FILE = path.join(ROOT, "data", "store.json");
const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const rateBuckets = new Map();
const launchCache = { expiresAt: 0, data: null };
const neoCache = new Map();
const NASA_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function parseNasaApproachDate(value) {
    const match = typeof value === "string" && value.match(
        /^(\d{4})-([A-Z][a-z]{2})-(\d{2}) (\d{2}):(\d{2})$/
    );
    if (!match) return NaN;
    const month = NASA_MONTHS.indexOf(match[2]);
    if (month < 0) return NaN;
    return Date.UTC(
        Number(match[1]),
        month,
        Number(match[3]),
        Number(match[4]),
        Number(match[5])
    );
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.status = 400;
    }
}

function jsonResponse(response, status, payload) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    response.end(JSON.stringify(payload));
}

function errorResponse(response, status, message) {
    jsonResponse(response, status, { error: { message } });
}

function setSecurityHeaders(response) {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "SAMEORIGIN");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
    response.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com https://unpkg.com; img-src 'self' data: blob: https://images-assets.nasa.gov https://www.nasa.gov https://tile.openstreetmap.org https://*.tile.opentopomap.org https://gibs.earthdata.nasa.gov; connect-src 'self' https://geocoding-api.open-meteo.com https://api.open-meteo.com https://images-api.nasa.gov https://nominatim.openstreetmap.org https://gibs.earthdata.nasa.gov https://ll.thespacedevs.com https://api.nasa.gov; frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    );
}

function checkRateLimit(request, response) {
    const now = Date.now();
    const key = request.socket.remoteAddress || "local";
    const current = rateBuckets.get(key);
    const bucket = current && current.expiresAt > now
        ? current
        : { count: 0, expiresAt: now + RATE_WINDOW_MS };

    bucket.count += 1;
    rateBuckets.set(key, bucket);

    if (bucket.count > RATE_LIMIT) {
        response.setHeader("Retry-After", "60");
        errorResponse(response, 429, "Too many requests. Please wait a minute and try again.");
        return false;
    }

    return true;
}

async function readJsonBody(request) {
    const chunks = [];
    let bytes = 0;

    for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) {
            const error = new ValidationError("Request body is too large.");
            error.status = 413;
            throw error;
        }
        chunks.push(chunk);
    }

    if (bytes === 0) return {};

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        const error = new ValidationError("Request body must be valid JSON.");
        throw error;
    }
}

function validateText(value, label, maxLength, required = false) {
    if (typeof value !== "string") {
        if (required)         throw new ValidationError(`${label} is required.`);
        return "";
    }

    const text = value.trim();
    if (required && !text) throw new ValidationError(`${label} is required.`);
    if (text.length > maxLength) throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`);
    return text;
}

function validateDate(value, label, required = false) {
    if (value === undefined || value === null || value === "") {
        if (required)         throw new ValidationError(`${label} is required.`);
        return "";
    }
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        throw new ValidationError(`${label} must be a valid date.`);
    }
    return value;
}

function normalizeRecord(kind, input, existing = {}) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new ValidationError("Request body must be a JSON object.");
    }

    if (kind === "observations") {
        return {
            title: validateText(input.title ?? existing.title, "Title", 120, true),
            object: validateText(input.object ?? existing.object ?? "", "Object", 120),
            date: validateDate(input.date ?? existing.date, "Observation date", true),
            location: validateText(input.location ?? existing.location ?? "", "Location", 160),
            conditions: validateText(input.conditions ?? existing.conditions ?? "", "Conditions", 500),
            notes: validateText(input.notes ?? existing.notes ?? "", "Notes", 5000)
        };
    }

    const title = validateText(input.title ?? existing.title, "Title", 120, true);
    const dateTime = validateDate(input.dateTime ?? existing.dateTime, "Reminder time", true);
    if (Date.parse(dateTime) <= Date.now()) {
        throw new ValidationError("Reminder time must be in the future.");
    }

    return {
        title,
        type: validateText(input.type ?? existing.type ?? "custom", "Type", 40),
        dateTime,
        notify: typeof (input.notify ?? existing.notify) === "boolean"
            ? (input.notify ?? existing.notify)
            : false
    };
}

async function readStore(filePath) {
    try {
        const store = JSON.parse(await fs.readFile(filePath, "utf8"));
        return {
            observations: Array.isArray(store.observations) ? store.observations : [],
            reminders: Array.isArray(store.reminders) ? store.reminders : []
        };
    } catch (error) {
        if (error.code === "ENOENT") return { observations: [], reminders: [] };
        throw error;
    }
}

async function writeStore(filePath, store) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), { mode: 0o600 });
    await fs.rename(temporaryPath, filePath);
}

async function fetchJson(url, fetchImplementation = fetch) {
    try {
        const response = await fetchImplementation(url, {
            headers: { "User-Agent": "TsukuyomiWatch/1.0 (local astronomy companion)" },
            signal: AbortSignal.timeout(8_000)
        });

        if (!response.ok) {
            const error = new Error(`Data provider returned HTTP ${response.status}.`);
            error.status = response.status === 429 ? 503 : 502;
            throw error;
        }

        return await response.json();
    } catch (error) {
        if (error.status) throw error;
        const providerError = new Error(
            "Data provider could not be reached or returned invalid data."
        );
        providerError.status = 502;
        throw providerError;
    }
}

function createServer(options = {}) {
    const dataFile = options.dataFile || process.env.DATA_FILE || DEFAULT_DATA_FILE;
    const fetchImplementation = options.fetchImplementation || fetch;
    const server = http.createServer(async (request, response) => {
        setSecurityHeaders(response);

        const hostHeader = request.headers.host || "";
        if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(hostHeader)) {
            errorResponse(response, 403, "This local service accepts requests only through loopback.");
            return;
        }
        const origin = request.headers.origin;
        if (origin) {
            let originHost;
            try {
                originHost = new URL(origin).host;
            } catch {
                errorResponse(response, 403, "Request origin is not allowed.");
                return;
            }
            if (originHost !== hostHeader) {
                errorResponse(response, 403, "Cross-origin requests are not allowed.");
                return;
            }
        }

        let url;
        try {
            url = new URL(request.url, "http://localhost");
        } catch {
            errorResponse(response, 400, "Invalid request URL.");
            return;
        }

        const api = url.pathname.startsWith("/api/");

        if (api && !checkRateLimit(request, response)) return;

        try {
            if (url.pathname === "/api/health" && request.method === "GET") {
                jsonResponse(response, 200, { data: { status: "ok", mode: "single-user local prototype" } });
                return;
            }

            if (url.pathname === "/api/locations/search" && request.method === "GET") {
                const query = validateText(url.searchParams.get("q"), "Search query", 120, true);
                if (query.length < 2) throw new ValidationError("Search query must contain at least 2 characters.");
                const providerUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
                providerUrl.searchParams.set("name", query);
                providerUrl.searchParams.set("count", "100");
                providerUrl.searchParams.set("language", "en");
                providerUrl.searchParams.set("format", "json");
                providerUrl.searchParams.set("countryCode", "IN");
                const payload = await fetchJson(providerUrl);
                jsonResponse(response, 200, {
                    data: (payload.results || []).map(place => ({
                        name: place.name,
                        admin1: place.admin1 || "",
                        country: place.country || "",
                        latitude: place.latitude,
                        longitude: place.longitude,
                        timezone: place.timezone || ""
                    }))
                });
                return;
            }

            if (url.pathname === "/api/weather" && request.method === "GET") {
                const latitude = Number(url.searchParams.get("latitude"));
                const longitude = Number(url.searchParams.get("longitude"));
                if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
                    !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                    throw new ValidationError("Valid latitude and longitude are required.");
                }

                const providerUrl = new URL("https://api.open-meteo.com/v1/forecast");
                providerUrl.searchParams.set("latitude", String(latitude));
                providerUrl.searchParams.set("longitude", String(longitude));
                providerUrl.searchParams.set("current", [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "is_day",
                    "precipitation",
                    "weather_code",
                    "cloud_cover",
                    "visibility",
                    "wind_speed_10m"
                ].join(","));
                providerUrl.searchParams.set("timezone", "auto");
                providerUrl.searchParams.set("models", "ncep_gfs_seamless");
                const payload = await fetchJson(providerUrl);
                jsonResponse(response, 200, {
                    data: {
                        current: payload.current,
                        currentUnits: payload.current_units,
                        timezone: payload.timezone,
                        updatedAt: new Date().toISOString(),
                        source: "NOAA GFS via Open-Meteo"
                    }
                });
                return;
            }

            if (url.pathname === "/api/launches/upcoming" && request.method === "GET") {
                if (!launchCache.data || launchCache.expiresAt <= Date.now()) {
                    const providerUrl = new URL(
                        "https://ll.thespacedevs.com/2.2.0/launch/upcoming/"
                    );
                    providerUrl.searchParams.set("limit", "10");
                    const payload = await fetchJson(providerUrl, fetchImplementation);
                    if (!Array.isArray(payload.results)) {
                        throw new Error("Launch Library returned an invalid launch list.");
                    }
                    launchCache.data = payload.results.flatMap(launch => {
                        const timestamp = Date.parse(launch.net || "");
                        if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return [];
                        return [{
                            id: launch.id,
                            name: launch.name || "Unnamed launch",
                            net: launch.net,
                            windowStart: launch.window_start || "",
                            windowEnd: launch.window_end || "",
                            precision: launch.net_precision?.name || "Unspecified",
                            status: launch.status?.name || "Status unconfirmed",
                            provider: launch.launch_service_provider?.name || "Provider unlisted",
                            mission: launch.mission?.name || "",
                            location: launch.pad?.location?.name || "Launch location unlisted",
                            countryCode: launch.pad?.location?.country_code || "",
                            sourceUrl: launch.url || "https://thespacedevs.com/llapi"
                        }];
                    });
                    launchCache.expiresAt = Date.now() + 30 * 60_000;
                }
                jsonResponse(response, 200, {
                    data: {
                        launches: launchCache.data,
                        updatedAt: new Date().toISOString(),
                        source: "The Space Devs Launch Library 2"
                    }
                });
                return;
            }

            if (url.pathname === "/api/nasa/neo" && request.method === "GET") {
                const startDate = new Date().toISOString().slice(0, 10);
                const cache = neoCache.get(startDate);
                let payload;
                if (cache && cache.expiresAt > Date.now()) {
                    payload = cache.data;
                } else {
                    const endDate = new Date(Date.now() + 6 * 86400000)
                        .toISOString().slice(0, 10);
                    const providerUrl = new URL("https://api.nasa.gov/neo/rest/v1/feed");
                    providerUrl.searchParams.set("start_date", startDate);
                    providerUrl.searchParams.set("end_date", endDate);
                    providerUrl.searchParams.set("api_key", process.env.NASA_API_KEY || "DEMO_KEY");
                    payload = await fetchJson(providerUrl, fetchImplementation);
                    neoCache.set(startDate, {
                        data: payload,
                        expiresAt: Date.now() + 30 * 60_000
                    });
                }

                const closeApproaches = Object.values(payload.near_earth_objects || {})
                    .flatMap(asteroids => asteroids)
                    .flatMap(asteroid => (asteroid.close_approach_data || [])
                        .flatMap(approach => {
                            const timestamp = parseNasaApproachDate(
                                approach.close_approach_date_full
                            );
                            if (!Number.isFinite(timestamp) || timestamp <= Date.now()) return [];
                            return [{
                                id: asteroid.id,
                                name: asteroid.name || "Unnamed near-Earth object",
                                date: new Date(timestamp).toISOString(),
                                timestamp,
                                missDistanceKm: Number(approach.miss_distance?.kilometers),
                                relativeVelocityKmh: Number(
                                    approach.relative_velocity?.kilometers_per_hour
                                ),
                                orbitingBody: approach.orbiting_body || "Earth",
                                sourceUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(asteroid.id)}`
                            }];
                        }))
                    .sort((left, right) => left.timestamp - right.timestamp)
                    .slice(0, 8);
                jsonResponse(response, 200, {
                    data: {
                        approaches: closeApproaches,
                        updatedAt: new Date().toISOString(),
                        source: "NASA/JPL CNEOS NeoWs"
                    }
                });
                return;
            }

            if (url.pathname === "/api/images/search" && request.method === "GET") {
                const query = validateText(url.searchParams.get("q"), "Search query", 100, true);
                if (query.length < 2) throw new ValidationError("Search query must contain at least 2 characters.");
                const providerUrl = new URL("https://images-api.nasa.gov/search");
                providerUrl.searchParams.set("q", query);
                providerUrl.searchParams.set("media_type", "image");
                providerUrl.searchParams.set("page_size", "12");
                const payload = await fetchJson(providerUrl);
                const items = (payload.collection?.items || []).flatMap(item => {
                    const metadata = item.data?.[0];
                    const preview = item.links?.find(link => link.rel === "preview");
                    if (!metadata || !preview?.href || !/^https:\/\//i.test(preview.href)) return [];
                    return [{
                        id: metadata.nasa_id || randomUUID(),
                        title: metadata.title || "Untitled NASA image",
                        description: (metadata.description || "").slice(0, 1200),
                        date: metadata.date_created || "",
                        imageUrl: preview.href,
                        sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(metadata.nasa_id || "")}`
                    }];
                });
                jsonResponse(response, 200, { data: items });
                return;
            }

            const recordRoute = url.pathname.match(/^\/api\/(observations|reminders)(?:\/([0-9a-f-]{36}))?$/i);
            if (recordRoute) {
                const kind = recordRoute[1].toLowerCase();
                const id = recordRoute[2];
                const store = await readStore(dataFile);
                const records = store[kind];

                if (request.method === "GET") {
                    if (id) {
                        const record = records.find(item => item.id === id);
                        if (!record) {
                            errorResponse(response, 404, "Record not found.");
                            return;
                        }
                        jsonResponse(response, 200, { data: record });
                    } else {
                        jsonResponse(response, 200, { data: records });
                    }
                    return;
                }

                if (request.method === "POST" && !id) {
                    if (!request.headers["content-type"]?.startsWith("application/json")) {
                        errorResponse(response, 415, "Content-Type must be application/json.");
                        return;
                    }
                    const input = await readJsonBody(request);
                    const record = {
                        id: randomUUID(),
                        ...normalizeRecord(kind, input),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    records.unshift(record);
                    await writeStore(dataFile, store);
                    jsonResponse(response, 201, { data: record });
                    return;
                }

                if ((request.method === "PATCH" || request.method === "PUT") && id) {
                    if (!request.headers["content-type"]?.startsWith("application/json")) {
                        errorResponse(response, 415, "Content-Type must be application/json.");
                        return;
                    }
                    const index = records.findIndex(item => item.id === id);
                    if (index < 0) {
                        errorResponse(response, 404, "Record not found.");
                        return;
                    }
                    const input = await readJsonBody(request);
                    records[index] = {
                        ...records[index],
                        ...normalizeRecord(kind, input, records[index]),
                        updatedAt: new Date().toISOString()
                    };
                    await writeStore(dataFile, store);
                    jsonResponse(response, 200, { data: records[index] });
                    return;
                }

                if (request.method === "DELETE" && id) {
                    const index = records.findIndex(item => item.id === id);
                    if (index < 0) {
                        errorResponse(response, 404, "Record not found.");
                        return;
                    }
                    records.splice(index, 1);
                    await writeStore(dataFile, store);
                    jsonResponse(response, 200, { data: { deleted: true } });
                    return;
                }

                errorResponse(response, 405, "Method not allowed.");
                return;
            }

            if (api) {
                errorResponse(response, 404, "API route not found.");
                return;
            }

            if (request.method !== "GET" && request.method !== "HEAD") {
                errorResponse(response, 405, "Method not allowed.");
                return;
            }

            const files = {
                "/": ["index.html", "text/html; charset=utf-8"],
                "/index.html": ["index.html", "text/html; charset=utf-8"],
                "/astronomy.js": ["astronomy.js", "text/javascript; charset=utf-8"],
                "/academy.js": ["academy.js", "text/javascript; charset=utf-8"],
                "/style.css": ["style.css", "text/css; charset=utf-8"],
                "/script.js": ["script.js", "text/javascript; charset=utf-8"]
            };
            const file = files[url.pathname];
            if (!file) {
                errorResponse(response, 404, "File not found.");
                return;
            }

            const contents = await fs.readFile(path.join(ROOT, file[0]));
            response.writeHead(200, {
                "Content-Type": file[1],
                "Cache-Control": "no-cache"
            });
            response.end(request.method === "HEAD" ? undefined : contents);
        } catch (error) {
            const status = error.status || 500;
            if (status >= 500) console.error("Request failed:", error.message);
            errorResponse(response, status, status >= 500
                ? "The requested service is temporarily unavailable."
                : error.message);
        }
    });

    return server;
}

if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    const host = "127.0.0.1";
    const server = createServer();
    server.listen(port, host, () => {
        console.log(`Tsukuyomi Watch listening at http://${host}:${port}`);
        console.log("Local mode: journal and reminders are stored on this machine.");
    });
}

module.exports = { createServer, normalizeRecord };
