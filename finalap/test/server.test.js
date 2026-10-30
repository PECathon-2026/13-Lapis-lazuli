"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createServer, normalizeRecord } = require("../server");
const {
    generateLunarEvents,
    generateMeteorShowerEvents,
    getMoonPhase,
    scoreNightConditions
} = require("../astronomy");

async function withServer(run, options = {}) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "tsukuyomi-test-"));
    const server = createServer({
        dataFile: path.join(directory, "store.json"),
        ...options
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    try {
        await run(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise(resolve => server.close(resolve));
        await fs.rm(directory, { recursive: true, force: true });
    }
}

test("NASA/JPL and Launch Library feeds return normalized, cached event data", async () => {
    let launchRequests = 0;
    let neoRequests = 0;
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    future.setUTCSeconds(0, 0);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const nasaDate = `${future.getUTCFullYear()}-${monthNames[future.getUTCMonth()]}-` +
        `${String(future.getUTCDate()).padStart(2, "0")} ` +
        `${String(future.getUTCHours()).padStart(2, "0")}:` +
        `${String(future.getUTCMinutes()).padStart(2, "0")}`;
    const fetchImplementation = async url => {
        if (url.hostname === "ll.thespacedevs.com") {
            launchRequests += 1;
            return {
                ok: true,
                json: async () => ({
                    results: [{
                        id: "launch-1",
                        name: "Test launch",
                        net: future.toISOString(),
                        window_start: future.toISOString(),
                        window_end: future.toISOString(),
                        net_precision: { name: "Minute" },
                        status: { name: "Go for Launch" },
                        launch_service_provider: { name: "ISRO" },
                        mission: { name: "Test mission" },
                        pad: { location: { name: "Sriharikota", country_code: "IND" } },
                        url: "https://ll.thespacedevs.com/2.2.0/launch/launch-1/"
                    }]
                })
            };
        }
        neoRequests += 1;
        return {
            ok: true,
            json: async () => ({
                near_earth_objects: {
                    [future.toISOString().slice(0, 10)]: [{
                        id: "neo-1",
                        name: "(2026 AB)",
                        close_approach_data: [{
                            close_approach_date_full: nasaDate,
                            miss_distance: { kilometers: "123456" },
                            relative_velocity: { kilometers_per_hour: "45678" },
                            orbiting_body: "Earth"
                        }]
                    }]
                }
            })
        };
    };

    await withServer(async base => {
        const [launchesResponse, neoResponse] = await Promise.all([
            fetch(`${base}/api/launches/upcoming`),
            fetch(`${base}/api/nasa/neo`)
        ]);
        const launches = (await launchesResponse.json()).data;
        const neo = (await neoResponse.json()).data;
        assert.equal(launches.launches[0].provider, "ISRO");
        assert.equal(launches.launches[0].countryCode, "IND");
        assert.equal(neo.approaches[0].name, "(2026 AB)");
        assert.equal(neo.approaches[0].missDistanceKm, 123456);
        assert.equal(Date.parse(neo.approaches[0].date), future.getTime());

        await Promise.all([
            fetch(`${base}/api/launches/upcoming`),
            fetch(`${base}/api/nasa/neo`)
        ]);
        assert.equal(launchRequests, 1);
        assert.equal(neoRequests, 1);
    }, { fetchImplementation });
});

test("health endpoint reports the local prototype mode", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/health`);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).data.status, "ok");
        assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
    });
});

test("invalid weather coordinates are rejected", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/weather?latitude=91&longitude=0`);
        assert.equal(response.status, 400);
        assert.match((await response.json()).error.message, /latitude and longitude/i);
    });
});

test("observation records support create, update, search, and delete", async () => {
    await withServer(async base => {
        const create = await fetch(`${base}/api/observations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Jupiter session",
                object: "Jupiter",
                date: "2026-10-29",
                location: "Home",
                conditions: "Clear",
                notes: "Four moons visible"
            })
        });
        assert.equal(create.status, 201);
        const created = (await create.json()).data;

        const update = await fetch(`${base}/api/observations/${created.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: "Europa and Io visible" })
        });
        assert.equal((await update.json()).data.notes, "Europa and Io visible");

        const list = await fetch(`${base}/api/observations`);
        assert.equal((await list.json()).data.length, 1);

        const remove = await fetch(`${base}/api/observations/${created.id}`, { method: "DELETE" });
        assert.equal((await remove.json()).data.deleted, true);
        assert.deepEqual((await (await fetch(`${base}/api/observations`)).json()).data, []);
    });
});

test("reminders support create, update, and delete", async () => {
    await withServer(async base => {
        const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const create = await fetch(`${base}/api/reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Meteor watch",
                type: "meteor",
                dateTime: future,
                notify: false
            })
        });
        assert.equal(create.status, 201);
        const reminder = (await create.json()).data;
        const update = await fetch(`${base}/api/reminders/${reminder.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Updated sky watch", notify: true })
        });
        assert.equal((await update.json()).data.title, "Updated sky watch");
        const remove = await fetch(`${base}/api/reminders/${reminder.id}`, { method: "DELETE" });
        assert.equal((await remove.json()).data.deleted, true);
        assert.deepEqual((await (await fetch(`${base}/api/reminders`)).json()).data, []);
    });
});

test("reminders require a future date and observations validate field limits", () => {
    assert.throws(() => normalizeRecord("reminders", {
        title: "Past reminder",
        dateTime: "2020-01-01T00:00:00.000Z"
    }), /future/);
    assert.throws(() => normalizeRecord("observations", {
        title: "x".repeat(121),
        date: "2026-10-29"
    }), /120 characters/);
});

test("invalid JSON receives a client error", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/api/observations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{invalid"
        });
        assert.equal(response.status, 400);
        assert.match((await response.json()).error.message, /valid JSON/);
    });
});

test("lunar phase calculation handles reference and full-moon dates", () => {
    const newMoon = getMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    const fullMoon = getMoonPhase(new Date(Date.UTC(2000, 0, 21, 7, 45)));
    assert.equal(newMoon.name, "New Moon");
    assert.equal(newMoon.illumination, 0);
    assert.equal(fullMoon.name, "Full Moon");
    assert.ok(fullMoon.illumination >= 99);
    assert.throws(() => getMoonPhase(new Date("invalid")), /valid Date/);
});

test("Night Honor Score has bounded zero and 100 cases and rejects missing inputs", () => {
    assert.equal(scoreNightConditions({
        cloudCover: 100,
        humidity: 95,
        visibilityKm: 0,
        windSpeedKmh: 40,
        moonIllumination: 100
    }).score, 0);
    assert.equal(scoreNightConditions({
        cloudCover: 0,
        humidity: 0,
        visibilityKm: 20,
        windSpeedKmh: 0,
        moonIllumination: 0
    }).score, 100);
    assert.equal(scoreNightConditions({
        cloudCover: 30,
        humidity: 50,
        visibilityKm: 10,
        windSpeedKmh: 10,
        moonIllumination: 25
    }).score, 67);
    assert.equal(scoreNightConditions({
        cloudCover: 10,
        humidity: 50
    }), null);
    assert.equal(scoreNightConditions({
        cloudCover: 101,
        humidity: 50,
        visibilityKm: 10,
        windSpeedKmh: 10,
        moonIllumination: 25
    }), null);
});

test("API rejects cross-origin requests and unknown record ids", async () => {
    await withServer(async base => {
        const crossOrigin = await fetch(`${base}/api/health`, {
            headers: { Origin: "https://untrusted.example" }
        });
        assert.equal(crossOrigin.status, 403);

        const missing = await fetch(`${base}/api/observations/00000000-0000-4000-8000-000000000000`);
        assert.equal(missing.status, 404);
    });
});

test("Academy frontend module is served as JavaScript", async () => {
    await withServer(async base => {
        const response = await fetch(`${base}/academy.js`);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type"), /^text\/javascript/);
        assert.match(await response.text(), /initializeAstralAcademy/);
    });
});

test("lunar event predictions are sorted and cover date and year boundaries", () => {
    const start = new Date(Date.UTC(2024, 1, 28, 12));
    const events = generateLunarEvents(start, 70);
    assert.ok(events.length >= 8);
    assert.ok(events.every(event => event.approximate && event.type === "moon"));
    assert.ok(events.every((event, index) =>
        index === 0 || Date.parse(events[index - 1].date) <= Date.parse(event.date)));
    assert.ok(events.every(event =>
        Date.parse(event.date) >= start.getTime() &&
        Date.parse(event.date) <= start.getTime() + 70 * 86400000));
    assert.throws(() => generateLunarEvents(start, -1), /non-negative/);
});

test("annual meteor shower peak dates include source metadata and sort across years", () => {
    const start = new Date(Date.UTC(2026, 9, 29));
    const events = generateMeteorShowerEvents(start, 100);
    assert.ok(events.length >= 5);
    assert.equal(events[0].title, "Southern Taurids");
    assert.ok(events.every(event =>
        event.type === "meteor" &&
        event.approximate &&
        event.dateOnly &&
        event.sourceUrl === "https://www.amsmeteors.org/calendar/"));
    assert.ok(events.every((event, index) =>
        index === 0 || Date.parse(events[index - 1].date) <= Date.parse(event.date)));
    assert.ok(events.every(event =>
        Date.parse(event.date) >= start.getTime() &&
        Date.parse(event.date) <= start.getTime() + 100 * 86400000));
    assert.throws(() => generateMeteorShowerEvents(start, -1), /non-negative/);
});
