# Tsukuyomi Watch

A responsive astronomy observing companion with a vanilla HTML/CSS/JavaScript interface and an optional small Node.js service. The Node service uses built-in modules; no package installation is required.

## Requirements

- Node.js 20 or newer
- A modern browser
- Internet access for geocoding, NOAA weather data, NASA imagery, maps, and nearby features

## Run locally

```powershell
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The service binds to loopback only. Set `PORT` to use another local port.

The frontend also works with VS Code Live Server or another static HTTP server. In static mode, provider requests run from the browser and journals/reminders are stored in that browser's local storage; they are not shared with the Node service or another browser. Use `npm run dev` for file-based local persistence.

```powershell
npm test
npm run build
npm run check
```

`npm run start` is also available for local production-style startup. The `build` command performs syntax checks; this vanilla frontend has no bundler and emits no build directory. There is no database migration.

## Local data and privacy

Observation and reminder records are stored in `data/store.json` on this machine. That directory is ignored by Git and the file is written with owner-only permissions where supported. The service intentionally binds to `127.0.0.1`; it has no user accounts or multi-user authorization and should not be exposed to a network. Keep the data file private.

Location is requested only after a manual search or an explicit click on **Use my location**. A selected location is saved in browser local storage. Weather requests send only its coordinates to the local service or, in static mode, directly to the provider. Uploaded images are previewed in the browser and are not sent to the server.

## Data services and attribution

- **India locations:** [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api), filtered to India and returning up to 100 matches per query. The state/UT selector lists all 28 states and 8 union territories and searches their capitals. This is a searchable geocoding index, not an exhaustive official census gazetteer of every settlement.
- **Weather:** Global [NOAA GFS](https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast) via the [Open-Meteo GFS API](https://open-meteo.com/en/docs/gfs-api). Visibility is a weather-model estimate, not astronomical transparency or seeing.
- **Interactive map and nearby features:** [OpenStreetMap](https://www.openstreetmap.org/) street/topographic tiles and nearby community-mapped temples, shrines, and mountains searched through [Nominatim](https://nominatim.org/). Requests are manually triggered and rate-limited to respect its public usage policy. Mapped features are not verified public-access or dark-sky sites.
- **Night-light imagery:** NASA [EOSDIS GIBS](https://nasa-gibs.github.io/gibs-api-docs/) VIIRS Day/Night Band visualization. It is a visual satellite layer, not a point radiance/Bortle measurement.
- **Astronomy images:** [NASA Image and Video Library](https://images.nasa.gov/); source links are displayed with results.
- **Lunar phases:** approximate local calculation using a mean synodic month. It is not a precision ephemeris.

These public services can be unavailable or rate-limited; the interface reports failures rather than substituting fake live values. Check the providers' current usage and attribution terms before deploying beyond a local demonstration.

## Astral Academy

The site includes an integrated, local-first astronomy learning section with a 10-constellation star chart, star profiles, constellation guides, planet fact cards, interactive lessons, navigation exercises, challenges, quizzes, and browser-local progress. Its star positions are approximate J2000 equatorial coordinates and rounded reference estimates adapted from the [Yale Bright Star Catalogue](https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=V/50) and [SIMBAD](https://simbad.cds.unistra.fr/simbad/) object records; constellation stick figures are simplified teaching diagrams. The chart is not a location-specific or live planetarium. Catalog numbers are not a precision astrometry service and should be checked against the source catalogs for research use.

Planet profiles give approximate sidereal orbital periods from [NASA Solar System Exploration](https://science.nasa.gov/solar-system/). The observation mode calculates approximate sunrise/sunset and astronomical twilight using the [NOAA solar-position method](https://gml.noaa.gov/grad/solcalc/calcdetails.html), returning UTC times; polar-day/night cases are reported instead of fabricated times. Moon phase uses this site's approximate synodic-month model, and upcoming meteor shower entries are annual peak-date estimates from the [American Meteor Society](https://www.amsmeteors.org/calendar/). Live planet positions, moonrise/moonset, and location-specific visibility forecasts are not connected and are explicitly marked unavailable. Browser geolocation is requested only after the user selects **Use my location**. Academy progress and quiz counts are saved in that browser's local storage under `tsukuyomi_astral_academy_v1`.

## API

All API responses use `{ "data": ... }` on success and `{ "error": { "message": ... } }` on failure.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Local service status |
| `GET` | `/api/locations/search?q=...` | Open-Meteo India-filtered geocoding |
| `GET` | `/api/weather?latitude=...&longitude=...` | NOAA GFS conditions via Open-Meteo |
| `GET` | `/api/launches/upcoming` | Cached upcoming launch NETs from The Space Devs Launch Library 2 |
| `GET` | `/api/nasa/neo` | Cached next-seven-day close approaches from NASA/JPL NeoWs |
| `GET` | `/api/images/search?q=...` | NASA image catalogue search |
| `GET`, `POST` | `/api/observations` | List or create journal records |
| `GET`, `PATCH`, `DELETE` | `/api/observations/:id` | Read, update, or delete a journal record |
| `GET`, `POST` | `/api/reminders` | List or create reminders |
| `GET`, `PATCH`, `DELETE` | `/api/reminders/:id` | Read, update, or delete a reminder |

JSON writes are limited to 32 KB. The API validates record fields and dates, rate-limits API requests, applies security headers, and does not expose a cross-origin API.

## Night Honor Score

The score is a project-specific observing-condition indicator, not an official NASA or astronomy metric:

- Cloud cover: up to 40 points (less cloud is better)
- Visibility: up to 25 points, scaling to 20 km
- Relative humidity: up to 10 points
- Wind: up to 10 points
- Calculated lunar illumination: up to 15 points (less illumination is better)

NASA VIIRS night-light imagery is not sampled into a numerical point value and does not affect the score. Weather-model visibility does not measure astronomical transparency. A score is shown only when the required weather values are available.

## Reminders and images

Browser notifications require a user-initiated permission grant. They can fire only while this page remains open; this project does not have push notifications, a background scheduler, or a service worker. NASA image search is live, but uploaded image processing, AI restoration, and object detection are not connected. The upload control offers a local preview only and the processing button remains unavailable.

## Current limitations

- The calendar uses approximate lunar phase calculations and annual meteor shower peak dates. Rocket launch NETs are third-party schedules; NASA/JPL close approaches are not predictions of naked-eye visibility. There is no verified eclipse or ISS-pass feed.
- NASA NeoWs uses `DEMO_KEY` by default, which is rate-limited; set `NASA_API_KEY` in the environment when running the Node service for a registered key.
- Event countdowns display in the selected location's timezone where available. Dates and launch times can be updated or delayed by their providers.
- The map's VIIRS layer visualizes nighttime lights but does not calculate Bortle class or point-level light pollution. Nearby places are community-mapped; verify access and safety.
- The Night Honor Score uses current model conditions and approximate lunar illumination; it is not a forecast of astronomical seeing or a guarantee of sky quality.
- The journal and reminders are single-user local records without login or cloud sync.
- NASA image catalogue coverage and image metadata vary by query.
- This prototype has no external credentials or `.env` configuration.
