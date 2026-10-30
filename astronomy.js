"use strict";

(function exposeAstronomyMath(root, factory) {
    const astronomyMath = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = astronomyMath;
    } else {
        root.TsukuyomiMath = astronomyMath;
    }
}(globalThis, function createAstronomyMath() {
    const SYNODIC_MONTH_DAYS = 29.530588853;
    const NEW_MOON_REFERENCE = Date.UTC(2000, 0, 6, 18, 14);
    const DAY_MS = 86400000;

    function getMoonPhase(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            throw new TypeError("A valid Date is required.");
        }

        const daysSince = (date.getTime() - NEW_MOON_REFERENCE) / DAY_MS;
        const age = ((daysSince % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) %
            SYNODIC_MONTH_DAYS;
        const phase = age / SYNODIC_MONTH_DAYS;
        let name;
        let emoji;

        if (phase < 0.035 || phase >= 0.965) {
            name = "New Moon";
            emoji = "🌑";
        } else if (phase < 0.215) {
            name = "Waxing Crescent";
            emoji = "🌒";
        } else if (phase < 0.285) {
            name = "First Quarter";
            emoji = "🌓";
        } else if (phase < 0.465) {
            name = "Waxing Gibbous";
            emoji = "🌔";
        } else if (phase < 0.535) {
            name = "Full Moon";
            emoji = "🌕";
        } else if (phase < 0.715) {
            name = "Waning Gibbous";
            emoji = "🌖";
        } else if (phase < 0.785) {
            name = "Last Quarter";
            emoji = "🌗";
        } else {
            name = "Waning Crescent";
            emoji = "🌘";
        }

        return {
            age,
            phase,
            name,
            emoji,
            illumination: Math.round(50 * (1 - Math.cos(2 * Math.PI * phase)))
        };
    }

    function scoreNightConditions({
        cloudCover,
        humidity,
        visibilityKm,
        windSpeedKmh,
        moonIllumination
    } = {}) {
        const values = [
            cloudCover,
            humidity,
            visibilityKm,
            windSpeedKmh,
            moonIllumination
        ].map(value =>
            value === null || value === undefined || value === ""
                ? NaN
                : Number(value)
        );
        if (!values.every(Number.isFinite)) return null;
        const [cloud, moisture, visibility, wind, moon] = values;
        if (cloud < 0 || cloud > 100 || moisture < 0 || moisture > 100 ||
            visibility < 0 || wind < 0 || moon < 0 || moon > 100) {
            return null;
        }

        const cloudPoints = (1 - cloud / 100) * 40;
        const visibilityPoints = Math.min(1, visibility / 20) * 25;
        const humidityPoints = Math.min(1, Math.max(0, (90 - moisture) / 70)) * 10;
        const windPoints = Math.min(1, Math.max(0, (40 - wind) / 35)) * 10;
        const moonPoints = (1 - moon / 100) * 15;
        const roundedPoints = {
            cloudPoints: Math.round(cloudPoints),
            visibilityPoints: Math.round(visibilityPoints),
            humidityPoints: Math.round(humidityPoints),
            windPoints: Math.round(windPoints),
            moonPoints: Math.round(moonPoints)
        };
        return {
            score: Math.max(0, Math.min(100,
                Object.values(roundedPoints).reduce((total, points) => total + points, 0))),
            ...roundedPoints
        };
    }

    function generateLunarEvents(from = new Date(), days = 90) {
        if (!(from instanceof Date) || Number.isNaN(from.getTime()) ||
            !Number.isFinite(days) || days < 0) {
            throw new TypeError("A valid start date and non-negative day count are required.");
        }

        const synodicMonthMs = SYNODIC_MONTH_DAYS * DAY_MS;
        const phasePoints = [
            { fraction: 0, name: "New Moon" },
            { fraction: 0.25, name: "First Quarter" },
            { fraction: 0.5, name: "Full Moon" },
            { fraction: 0.75, name: "Last Quarter" }
        ];
        const end = from.getTime() + days * DAY_MS;
        const events = [];

        phasePoints.forEach(point => {
            const offset = point.fraction * synodicMonthMs;
            let cycle = Math.ceil((from.getTime() - NEW_MOON_REFERENCE - offset) / synodicMonthMs);
            let timestamp = NEW_MOON_REFERENCE + offset + cycle * synodicMonthMs;
            while (timestamp <= end) {
                if (timestamp >= from.getTime()) {
                    const date = new Date(timestamp);
                    events.push({
                        title: point.name,
                        type: "moon",
                        date: date.toISOString(),
                        description: `Approximate lunar phase milestone. Estimated illumination: ${getMoonPhase(date).illumination}%.`,
                        source: "Local synodic-month calculation",
                        approximate: true
                    });
                }
                cycle += 1;
                timestamp = NEW_MOON_REFERENCE + offset + cycle * synodicMonthMs;
            }
        });

        return events.sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    }

    function generateMeteorShowerEvents(from = new Date(), days = 370) {
        if (!(from instanceof Date) || Number.isNaN(from.getTime()) ||
            !Number.isFinite(days) || days < 0) {
            throw new TypeError("A valid start date and non-negative day count are required.");
        }

        const showers = [
            { month: 0, day: 4, title: "Quadrantids" },
            { month: 3, day: 22, title: "Lyrids" },
            { month: 4, day: 5, title: "Eta Aquariids" },
            { month: 6, day: 30, title: "Southern Delta Aquariids" },
            { month: 7, day: 12, title: "Perseids" },
            { month: 9, day: 21, title: "Orionids" },
            { month: 10, day: 5, title: "Southern Taurids" },
            { month: 10, day: 12, title: "Northern Taurids" },
            { month: 10, day: 17, title: "Leonids" },
            { month: 11, day: 14, title: "Geminids" },
            { month: 11, day: 22, title: "Ursids" }
        ];
        const end = from.getTime() + days * DAY_MS;
        const events = [];
        for (let year = from.getUTCFullYear(); year <= new Date(end).getUTCFullYear(); year++) {
            showers.forEach(shower => {
                const timestamp = Date.UTC(year, shower.month, shower.day, 12);
                if (timestamp < from.getTime() || timestamp > end) return;
                const date = new Date(timestamp);
                events.push({
                    title: shower.title,
                    type: "meteor",
                    date: date.toISOString(),
                    description: "Approximate annual peak date. The exact peak time and local visibility vary by year and observing location.",
                    source: "American Meteor Society annual calendar",
                    sourceUrl: "https://www.amsmeteors.org/calendar/",
                    approximate: true,
                    dateOnly: true
                });
            });
        }
        return events.sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    }

    return {
        getMoonPhase,
        scoreNightConditions,
        generateLunarEvents,
        generateMeteorShowerEvents
    };
}));
