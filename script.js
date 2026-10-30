
/* =========================================================
   TSUKUYOMI WATCH — THE SAMURAI'S CELESTIAL GUIDE
   PECathon 2026 | Problem Statement 002
   File: script.js
   Vanilla JavaScript — no framework required
   ========================================================= */

"use strict";

/* =========================================================
   1. GLOBAL UTILITIES & APPLICATION STATE
   ========================================================= */

function readStoredData(key, fallback) {
    try {
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        return stored ?? fallback;
    } catch (error) {
        if (error.name === "AbortError") return;
        if (requestController.signal.aborted) return;
        console.warn(`Could not read saved ${key} data.`, error);
        return fallback;
    }
}

const Tsukuyomi = {
    observations: readStoredData("tsukuyomi_observations", []),
    alerts: readStoredData("tsukuyomi_alerts", []),
    events: [],
    uploadedImage: null,
    selectedDate: new Date(),
    location: null,
    isRestoring: false
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("Local storage unavailable:", error);
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function notify(message, type = "info") {
    let toast = $("#tsukuyomi-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "tsukuyomi-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");

        Object.assign(toast.style, {
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translate(-50%, 20px)",
            zIndex: "99999",
            padding: "14px 22px",
            borderRadius: "12px",
            color: "#ffffff",
            background: "#15152b",
            border: "1px solid rgba(150,130,255,.6)",
            boxShadow: "0 10px 35px rgba(0,0,0,.35)",
            opacity: "0",
            transition: "all .25s ease",
            maxWidth: "90vw",
            textAlign: "center",
            fontSize: "14px"
        });

        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.dataset.type = type;
    toast.style.borderColor =
        type === "error" ? "#ff6b81" :
        type === "success" ? "#56e39f" : "#9682ff";

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translate(-50%, 0)";
    });

    clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translate(-50%, 20px)";
    }, 3200);
}

function formatDate(date) {
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatTime(date) {
    return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* =========================================================
   2. NAVIGATION & SECTION TRANSITIONS
   ========================================================= */

function initNavigation() {
    const navLinks = $$(
        'nav a[href^="#"], .nav-link[href^="#"], [data-section]'
    );

    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            const targetName =
                link.dataset.section ||
                link.getAttribute("href")?.slice(1);

            const target = targetName
                ? document.getElementById(targetName)
                : null;

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            $$(".active", link.closest("nav") || document)
                .forEach(item => item.classList.remove("active"));

            link.classList.add("active");
        });
    });

    const sections = $$(
        "main section[id], section[id], [data-watch-section]"
    );

    if ("IntersectionObserver" in window && sections.length) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                navLinks.forEach(link => {
                    const targetName =
                        link.dataset.section ||
                        link.getAttribute("href")?.slice(1);

                    link.classList.toggle(
                        "active",
                        targetName === entry.target.id
                    );
                });
            });
        }, {
            threshold: 0.25
        });

        sections.forEach(section => observer.observe(section));
    }

    // Mobile navigation toggle, if the HTML includes one.
    const menuButton = $(
        "#menu-toggle, #mobile-menu-toggle, .menu-toggle"
    );

    const menu = $(
        "#main-navigation, #mobile-menu, .nav-links, .navigation-links"
    );

    if (menuButton && menu) {
        menuButton.addEventListener("click", () => {
            const isOpen = menu.classList.toggle("open");

            menuButton.setAttribute("aria-expanded", String(isOpen));
            menuButton.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
        });
    }
}

/* =========================================================
   3. ANIMATIONS: REVEALS, COUNTERS & STARFIELD
   ========================================================= */

function initScrollAnimations() {
    const animatedElements = $$(
        ".reveal, .fade-in, .animate-on-scroll, .feature-card, .event-card"
    );

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible", "revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        animatedElements.forEach(element => observer.observe(element));
    } else {
        animatedElements.forEach(element => {
            element.classList.add("visible", "revealed");
        });
    }

    // Gentle staggered entrance for cards.
    $$(".feature-card, .event-card").forEach((card, index) => {
        card.style.setProperty(
            "--animation-delay",
            `${Math.min(index * 70, 700)}ms`
        );
    });

    // Animated numerical statistics.
    const counters = $$("[data-count], .counter[data-target]");

    if ("IntersectionObserver" in window && counters.length) {
        const counterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const element = entry.target;
                const target = Number(
                    element.dataset.count || element.dataset.target || 0
                );

                if (!Number.isFinite(target)) return;

                const duration = 1200;
                const start = performance.now();

                function updateCounter(now) {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);

                    element.textContent = Math.round(target * eased);

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    }
                }

                requestAnimationFrame(updateCounter);
                counterObserver.unobserve(element);
            });
        });

        counters.forEach(counter => counterObserver.observe(counter));
    }

    // Optional canvas starfield: activates only when a matching canvas exists.
    const canvas = $("#particle-canvas, #star-canvas");
    if (canvas) initStarfield(canvas);
}

function initStarfield(canvas) {
    const context = canvas.getContext("2d");
    if (!context) return;

    let stars = [];
    let animationFrame;
    let width = 0;
    let height = 0;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        width = rect.width || window.innerWidth;
        height = rect.height || window.innerHeight;

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        stars = Array.from({
            length: Math.min(160, Math.floor(width / 7))
        }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.7 + 0.2,
            speed: Math.random() * 0.015 + 0.003
        }));

        draw();
    }

    function draw() {
        if (document.hidden) return;
        context.clearRect(0, 0, width, height);

        stars.forEach(star => {
            context.beginPath();
            context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

            context.fillStyle =
                `rgba(195, 205, 255, ${star.alpha})`;

            context.fill();

            if (!reducedMotion) {
                star.alpha += star.speed;

                if (star.alpha > 0.9 || star.alpha < 0.15) {
                    star.speed *= -1;
                }
            }
        });

        if (!reducedMotion) {
            animationFrame = requestAnimationFrame(draw);
        }
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
        } else if (!reducedMotion) {
            draw();
        }
    });
    resize();

    window.addEventListener("pagehide", () => {
        cancelAnimationFrame(animationFrame);
    }, { once: true });
}

/* =========================================================
   4. WATCHTOWER: LOCATION SEARCH & STARGAZING MAP
   ========================================================= */

function initLocationSearch() {
    const form = $(
        "#locationForm, #location-form, #stargazing-search-form"
    );

    const locationInput = $(
        "#locationInput, #location-input, input[name='location']"
    );

    const map = $(
        "#stargazingMap, #stargazing-map, #map-container"
    );

    const result = $(
        "#locationResult, #location-result, #map-status"
    );

    function showLocationStatus(message) {
        if (result) result.textContent = message;
    }

    function displayMap(latitude, longitude, label) {
        if (!map) return;

        // OpenStreetMap embed. This does not require an API key.
        const bbox = [
            longitude - 0.08,
            latitude - 0.05,
            longitude + 0.08,
            latitude + 0.05
        ].join("%2C");

        map.innerHTML = "";

        const frame = document.createElement("iframe");
        frame.title = `Map near ${label}`;
        frame.loading = "lazy";
        frame.referrerPolicy = "no-referrer-when-downgrade";
        frame.src =
            `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
            `&layer=mapnik&marker=${latitude}%2C${longitude}`;

        Object.assign(frame.style, {
            width: "100%",
            height: "100%",
            minHeight: "280px",
            border: "0",
            borderRadius: "14px"
        });

        map.appendChild(frame);
    }

    async function searchLocation(query) {
        if (!query || !query.trim()) {
            notify("Enter a city or location first.", "error");
            return;
        }

        showLocationStatus("Searching for your location…");

        try {
            // Geocoding is provided by Nominatim. Respect its usage policy
            // and add a suitable backend/proxy before production deployment.
            const url = new URL(
                "https://nominatim.openstreetmap.org/search"
            );

            url.searchParams.set("q", query.trim());
            url.searchParams.set("format", "jsonv2");
            url.searchParams.set("limit", "1");

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Location service unavailable.");
            }

            const places = await response.json();

            if (!places.length) {
                showLocationStatus("Location not found. Try another city.");
                notify("No matching location found.", "error");
                return;
            }

            const place = places[0];
            const latitude = Number(place.lat);
            const longitude = Number(place.lon);

            Tsukuyomi.location = {
                name: place.display_name,
                latitude,
                longitude
            };

            saveData("tsukuyomi_location", Tsukuyomi.location);

            showLocationStatus(
                `${place.display_name} · ${latitude.toFixed(3)}, ` +
                `${longitude.toFixed(3)}`
            );

            displayMap(latitude, longitude, place.display_name);
            updateNightHonorScore();
            notify("Location updated successfully.", "success");
        } catch (error) {
            console.error(error);

            showLocationStatus(
                "Could not load location data. Check your connection."
            );

            notify("Location search failed. Please try again.", "error");
        }
    }

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();

            searchLocation(
                locationInput?.value ||
                $("#locationForm input")?.value ||
                ""
            );
        });
    }

    $$("[data-location-search]").forEach(button => {
        button.addEventListener("click", () => {
            searchLocation(
                locationInput?.value ||
                button.dataset.locationSearch ||
                ""
            );
        });
    });

    // Restore previously selected location.
    try {
        const saved = JSON.parse(
            localStorage.getItem("tsukuyomi_location") || "null"
        );

        if (saved && Number.isFinite(saved.latitude)) {
            Tsukuyomi.location = saved;

            if (locationInput) {
                locationInput.value = saved.name.split(",")[0];
            }

            displayMap(
                saved.latitude,
                saved.longitude,
                saved.name
            );

            showLocationStatus(saved.name);
        }
    } catch (error) {
        console.warn("Could not restore saved location.", error);
    }
}

/* =========================================================
   5. NIGHT HONOR SCORE
   ========================================================= */

function calculateNightHonorScore({
    cloudCover = 40,
    humidity = 50,
    lightPollution = 5
} = {}) {
    // This is a demo estimate, not a professional astronomy forecast.
    const cloudScore = 100 - Math.max(0, Math.min(100, cloudCover));
    const humidityScore = 100 - Math.max(
        0,
        Math.min(100, (humidity - 30) * 1.4)
    );

    const pollutionScore = 100 - (
        Math.max(0, Math.min(9, lightPollution)) / 9
    ) * 100;

    const score = Math.round(
        cloudScore * 0.55 +
        humidityScore * 0.15 +
        pollutionScore * 0.30
    );

    return Math.max(0, Math.min(100, score));
}

function updateNightHonorScore(weather = {}) {
    const scoreElement = $(
        "#nightHonorScore, #night-honor-score, [data-night-score]"
    );

    const statusElement = $(
        "#nightHonorStatus, #night-honor-status"
    );

    const bar = $(
        "#nightHonorBar, #night-honor-bar, [data-score-bar]"
    );

    const score = calculateNightHonorScore(weather);

    if (scoreElement) scoreElement.textContent = score;
    if (bar) bar.style.width = `${score}%`;

    let label;
    if (score >= 80) {
        label = "Excellent conditions";
    } else if (score >= 60) {
        label = "Good potential";
    } else if (score >= 40) {
        label = "Fair conditions";
    } else {
        label = "Challenging conditions";
    }

    if (statusElement) statusElement.textContent = label;

    return score;
}

function initHonorScoreForm() {
    const form = $(
        "#weatherForm, #weather-form, #honor-score-form"
    );

    if (!form) {
        updateNightHonorScore();
        return;
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        const getValue = (...selectors) => {
            for (const selector of selectors) {
                const element = $(selector, form);
                if (element && element.value !== "") {
                    return Number(element.value);
                }
            }
            return undefined;
        };

        const weather = {
            cloudCover: getValue("#cloudCover", "[name='cloudCover']") ?? 40,
            humidity: getValue("#humidity", "[name='humidity']") ?? 50,
            lightPollution:
                getValue("#lightPollution", "[name='lightPollution']") ?? 5
        };

        const score = updateNightHonorScore(weather);

        notify(
            `Estimated Night Honor Score: ${score}/100. ` +
            "Use a local forecast to verify actual sky conditions.",
            "success"
        );
    });
}

/* =========================================================
   6. CELESTIAL SCROLL: ASTRONOMY EVENTS & FILTERS
   ========================================================= */

// Sample events are clearly marked as demo entries.
// Replace them with verified astronomy data or an API.
const DEMO_EVENTS = [
    {
        title: "Moon Watching Night",
        type: "moon",
        date: null,
        description: "Observe lunar craters and surface features.",
        demo: true
    },
    {
        title: "Planet Observation Session",
        type: "planet",
        date: null,
        description: "Look for visible planets using a sky map.",
        demo: true
    },
    {
        title: "Meteor Watching Session",
        type: "meteor",
        date: null,
        description: "Check a reliable meteor shower calendar before observing.",
        demo: true
    }
];

function getEventDate(event) {
    if (!event.date) return null;

    const date = new Date(event.date);
    return Number.isNaN(date.getTime()) ? null : date;
}

function renderEvents(events = Tsukuyomi.events) {
    const list = $(
        "#eventList, #event-list, #events-container"
    );

    if (!list) return;

    if (!events.length) {
        list.innerHTML =
            '<p class="empty-state">No events match these filters.</p>';
        return;
    }

    list.innerHTML = events.map(event => {
        const date = getEventDate(event);
        const dateLabel = date
            ? formatDate(date)
            : "Date to be verified";

        return `
            <article class="event-card" data-event-type="${escapeHTML(event.type)}">
                <div class="event-card-content">
                    <span class="event-type">
                        ${escapeHTML(event.type || "astronomy")}
                    </span>
                    <h3>${escapeHTML(event.title)}</h3>
                    <p>${escapeHTML(event.description || "")}</p>
                    <p class="event-date">${escapeHTML(dateLabel)}</p>
                    ${event.demo ? '<small>Sample event · verify details</small>' : ""}
                </div>
                <button type="button"
                    class="event-alert-button"
                    data-alert-event="${escapeHTML(event.title)}">
                    Set reminder
                </button>
            </article>
        `;
    }).join("");

    list.querySelectorAll("[data-alert-event]").forEach(button => {
        button.addEventListener("click", () => {
            const title = button.dataset.alertEvent;

            const matchingEvent = events.find(event => event.title === title);

            if (matchingEvent) {
                createAlert({
                    title: matchingEvent.title,
                    date: matchingEvent.date || "",
                    type: matchingEvent.type
                });
            }
        });
    });
}

function filterEvents() {
    const typeFilter = $(
        "#eventTypeFilter, #event-type-filter, [name='eventType']"
    );

    const dateFilter = $(
        "#eventDateFilter, #event-date-filter, [name='eventDate']"
    );

    const selectedType = typeFilter?.value || "all";
    const selectedDate = dateFilter?.value || "";

    const filtered = Tsukuyomi.events.filter(event => {
        const typeMatches =
            selectedType === "all" ||
            event.type === selectedType;

        const date = getEventDate(event);
        const dateMatches =
            !selectedDate ||
            (date && date.toISOString().slice(0, 10) === selectedDate);

        return typeMatches && dateMatches;
    });

    renderEvents(filtered);
}

function initEvents() {
    Tsukuyomi.events = [...DEMO_EVENTS];

    const eventTypeFilter = $(
        "#eventTypeFilter, #event-type-filter, [name='eventType']"
    );

    const eventDateFilter = $(
        "#eventDateFilter, #event-date-filter, [name='eventDate']"
    );

    eventTypeFilter?.addEventListener("change", filterEvents);
    eventDateFilter?.addEventListener("change", filterEvents);

    const resetButton = $(
        "#resetEventFilters, #reset-event-filters"
    );

    resetButton?.addEventListener("click", () => {
        if (eventTypeFilter) eventTypeFilter.value = "all";
        if (eventDateFilter) eventDateFilter.value = "";

        filterEvents();
    });

    renderEvents();
}

/* =========================================================
   7. SPIRIT LENS: IMAGE UPLOAD & BEFORE/AFTER COMPARISON
   ========================================================= */

function initImageUpload() {
    const form = $(
        "#imageUploadForm, #restoration-form, #image-upload-form"
    );

    const fileInput = $(
        "#imageInput, #image-upload, input[type='file'][name='image']"
    );

    const preview = $(
        "#imagePreview, #image-preview, #uploaded-image-preview"
    );

    const result = $(
        "#restorationStatus, #restoration-status, #image-status"
    );

    const restoreButton = $(
        "#restoreImageButton, #restore-image-button"
    );

    let currentObjectUrl = null;

    function setStatus(message) {
        if (result) result.textContent = message;
    }

    function loadImage(file) {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            notify("Please choose a valid image file.", "error");
            return;
        }

        // Limit local preview uploads to 10 MB.
        if (file.size > 10 * 1024 * 1024) {
            notify("Please choose an image smaller than 10 MB.", "error");
            return;
        }

        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
        }

        currentObjectUrl = URL.createObjectURL(file);
        Tsukuyomi.uploadedImage = file;

        if (preview) {
            preview.innerHTML = "";

            const image = document.createElement("img");
            image.src = currentObjectUrl;
            image.alt = "Uploaded astronomy image preview";

            Object.assign(image.style, {
                width: "100%",
                maxHeight: "420px",
                objectFit: "contain",
                borderRadius: "14px"
            });

            preview.appendChild(image);
        }

        setStatus(
            "Image loaded locally. Select Restore to preview enhancement options."
        );

        notify("Image uploaded for local preview.", "success");
    }

    fileInput?.addEventListener("change", () => {
        loadImage(fileInput.files?.[0]);
    });

    form?.addEventListener("submit", event => {
        event.preventDefault();

        if (!fileInput?.files?.length) {
            notify("Choose an image first.", "error");
            return;
        }

        loadImage(fileInput.files[0]);
    });

    restoreButton?.addEventListener("click", () => {
        if (!Tsukuyomi.uploadedImage) {
            notify("Upload an image before starting restoration.", "error");
            return;
        }

        /*
          This is only a frontend placeholder.
          Actual AI restoration requires a model/API/backend.
          The filter below is a visual preview, not AI restoration.
        */

        const image = preview?.querySelector("img");

        if (!image) {
            notify("Image preview is unavailable.", "error");
            return;
        }

        Tsukuyomi.isRestoring = !Tsukuyomi.isRestoring;

        image.style.filter = Tsukuyomi.isRestoring
            ? "contrast(1.15) saturate(1.2) brightness(1.04)"
            : "none";

        setStatus(
            Tsukuyomi.isRestoring
                ? "Visual enhancement preview applied. AI restoration is not connected."
                : "Original image preview restored."
        );

        restoreButton.textContent = Tsukuyomi.isRestoring
            ? "Show Original"
            : "Preview Enhancement";
    });

    window.addEventListener("pagehide", () => {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    }, { once: true });
}

function initComparisonSlider() {
    const slider = $(
        "#comparisonSlider, #comparison-slider, input[data-comparison]"
    );

    const beforeImage = $(
        "#beforeImage, #before-image, .before-image"
    );

    const afterContainer = $(
        "#afterImageContainer, #after-image-container, .after-image"
    );

    const valueLabel = $(
        "#comparisonValue, #comparison-value"
    );

    if (!slider) return;

    function updateComparison() {
        const value = Number(slider.value);
        const position = Math.max(0, Math.min(100, value));

        if (afterContainer) {
            afterContainer.style.clipPath =
                `inset(0 ${100 - position}% 0 0)`;
        }

        if (beforeImage) {
            beforeImage.style.setProperty(
                "--comparison-position",
                `${position}%`
            );
        }

        if (valueLabel) {
            valueLabel.textContent = `${position}%`;
        }
    }

    slider.addEventListener("input", updateComparison);
    updateComparison();
}

function initImageZoom() {
    const images = $$(
        ".zoomable-image, #beforeImage, #afterImage"
    );

    images.forEach(image => {
        image.style.cursor = "zoom-in";

        image.addEventListener("click", () => {
            const overlay = $("#object-overlay, #image-overlay");

            if (overlay) {
                overlay.classList.add("active");
                overlay.setAttribute("aria-hidden", "false");

                const overlayImage = $("img", overlay);
                if (overlayImage) overlayImage.src = image.src;

                return;
            }

            const existing = $("#tsukuyomi-image-modal");
            existing?.remove();

            const modal = document.createElement("div");
            modal.id = "tsukuyomi-image-modal";

            Object.assign(modal.style, {
                position: "fixed",
                inset: "0",
                zIndex: "100000",
                display: "grid",
                placeItems: "center",
                background: "rgba(0,0,0,.9)",
                padding: "24px",
                cursor: "zoom-out"
            });

            const enlarged = document.createElement("img");
            enlarged.src = image.src;
            enlarged.alt = image.alt || "Enlarged astronomy image";

            Object.assign(enlarged.style, {
                maxWidth: "95vw",
                maxHeight: "90vh",
                objectFit: "contain"
            });

            modal.appendChild(enlarged);
            document.body.appendChild(modal);

            modal.addEventListener("click", () => modal.remove());

            document.addEventListener("keydown", function closeOnEscape(event) {
                if (event.key === "Escape") {
                    modal.remove();
                    document.removeEventListener("keydown", closeOnEscape);
                }
            });
        });
    });

    const overlay = $("#object-overlay, #image-overlay");

    overlay?.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.classList.remove("active");
            overlay.setAttribute("aria-hidden", "true");
        }
    });
}

/* =========================================================
   8. MOON CALENDAR: LUNAR PHASE APPROXIMATION
   ========================================================= */

function getMoonPhase(date) {
    return window.TsukuyomiMath.getMoonPhase(date);
}

function datePartsInLocation(date) {
    const timeZone = appState.location?.timezone;
    if (!timeZone) {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };
    }
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);
    return Object.fromEntries(parts
        .filter(part => ["year", "month", "day"].includes(part.type))
        .map(part => [part.type, Number(part.value)]));
}

function dateKeyInLocation(date) {
    try {
        const parts = datePartsInLocation(date);
        return `${parts.year}-${String(parts.month).padStart(2, "0")}-` +
            `${String(parts.day).padStart(2, "0")}`;
    } catch (error) {
        console.warn("Could not format the event date in the selected timezone:", error);
        return dateInputValue(date);
    }
}

function calendarDateInLocation(date = new Date()) {
    try {
        const parts = datePartsInLocation(date);
        return new Date(parts.year, parts.month - 1, parts.day, 12);
    } catch (error) {
        console.warn("Could not read the selected location timezone for the calendar:", error);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    }
}

function astronomyInstantInLocation(year, month, day, hour = 12) {
    const targetLocalAsUtc = Date.UTC(year, month, day, hour);
    const timeZone = appState.location?.timezone;
    if (!timeZone) return new Date(targetLocalAsUtc);

    try {
        let timestamp = targetLocalAsUtc;
        for (let attempt = 0; attempt < 3; attempt++) {
            const parts = new Intl.DateTimeFormat("en-CA", {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                hourCycle: "h23"
            }).formatToParts(new Date(timestamp));
            const values = Object.fromEntries(parts
                .filter(part => ["year", "month", "day", "hour"].includes(part.type))
                .map(part => [part.type, Number(part.value)]));
            const observedLocalAsUtc = Date.UTC(
                values.year, values.month - 1, values.day, values.hour
            );
            timestamp += targetLocalAsUtc - observedLocalAsUtc;
        }
        return new Date(timestamp);
    } catch (error) {
        console.warn("Could not apply the selected location timezone to a lunar date:", error);
        return new Date(targetLocalAsUtc);
    }
}

function renderMoonCalendar(date = Tsukuyomi.selectedDate) {
    const grid = $(
        "#lunarCalendarGrid, #calendar-grid, #moon-calendar-grid"
    );

    if (!grid) return;

    const selectedCalendarDate = appState.selectedCalendarDate || date;
    const year = selectedCalendarDate.getFullYear();
    const month = selectedCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthLabel = $(
        "#calendar-month-label, #calendarMonth, #calendar-month, #current-month"
    );

    if (monthLabel) {
        monthLabel.textContent = date.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
        });
    }

    grid.innerHTML = "";

    for (let i = 0; i < firstDay.getDay(); i++) {
        const blank = document.createElement("div");
        blank.className = "calendar-day calendar-day-empty";
        blank.setAttribute("aria-hidden", "true");
        grid.appendChild(blank);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = astronomyInstantInLocation(year, month, day, 12);
        const moon = getMoonPhase(currentDate);

        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-day";
        cell.setAttribute(
            "aria-label",
            `${formatAstronomyDate(currentDate, false)}, ${moon.name}, ` +
            `${moon.illumination}% illumination`
        );
        cell.title = `${formatAstronomyDate(currentDate, false)} · ${moon.name} · ` +
            `approximately ${moon.illumination}% illuminated. Select for details.`;
        const selectedDate = appState.selectedCalendarDate || date;
        const isSelected =
            currentDate.getDate() === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear();
        cell.setAttribute("aria-pressed", String(isSelected));
        if (isSelected) cell.classList.add("selected");

        const today = new Date();

        if (
            currentDate.getDate() === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        ) {
            cell.classList.add("today");
        }

        cell.innerHTML = `
            <span class="calendar-date">${day}</span>
            <span class="moon-icon" aria-hidden="true">${moon.emoji}</span>
            <span class="moon-phase">${escapeHTML(moon.name)}</span>
        `;

        cell.addEventListener("click", () => {
            Tsukuyomi.selectedDate = currentDate;
            showMoonDetails(currentDate, moon);
        });

        grid.appendChild(cell);
    }
}

function showMoonDetails(date, moon) {
    const details = $(
        "#moonDetails, #moon-details, #selected-moon-details"
    );

    if (details) {
        details.innerHTML = `
            <h3>${moon.emoji} ${escapeHTML(moon.name)}</h3>
            <p>${escapeHTML(formatAstronomyDate(date, false))}</p>
            <p>Estimated illumination: ${moon.illumination}%</p>
            <p>Approximate lunar age: ${moon.age.toFixed(1)} days</p>
        `;
    }
}

function initMoonCalendar() {
    const previous = $(
        "#calendar-prev, #previousMonth, #previous-month, [data-calendar-prev]"
    );

    const next = $(
        "#calendar-next, #nextMonth, #next-month, [data-calendar-next]"
    );

    previous?.addEventListener("click", () => {
        Tsukuyomi.selectedDate = new Date(
            Tsukuyomi.selectedDate.getFullYear(),
            Tsukuyomi.selectedDate.getMonth() - 1,
            1
        );

        renderMoonCalendar();
    });

    next?.addEventListener("click", () => {
        Tsukuyomi.selectedDate = new Date(
            Tsukuyomi.selectedDate.getFullYear(),
            Tsukuyomi.selectedDate.getMonth() + 1,
            1
        );

        renderMoonCalendar();
    });

    renderMoonCalendar();

    const todayMoon = getMoonPhase(new Date());
    showMoonDetails(new Date(), todayMoon);
}

/* =========================================================
   9. HONOR RECORDS: OBSERVATION LOG
   ========================================================= */

function renderObservations() {
    const list = $(
        "#observationList, #observation-list, #honor-records"
    );

    const count = $(
        "#observationCount, #observation-count"
    );

    if (count) count.textContent = Tsukuyomi.observations.length;
    if (!list) return;

    if (!Tsukuyomi.observations.length) {
        list.innerHTML =
            '<p class="empty-state">Your observation journal is waiting for its first entry.</p>';
        return;
    }

    list.innerHTML = Tsukuyomi.observations.map((item, index) => `
        <article class="observation-card">
            <div>
                <h3>${escapeHTML(item.title)}</h3>
                <p>${escapeHTML(item.object || "Sky observation")}</p>
                <p>${escapeHTML(item.date || "")}</p>
                <p>${escapeHTML(item.notes || "")}</p>
            </div>
            <button type="button"
                data-delete-observation="${index}"
                aria-label="Delete ${escapeHTML(item.title)}">
                Delete
            </button>
        </article>
    `).join("");

    list.querySelectorAll("[data-delete-observation]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.deleteObservation);

            Tsukuyomi.observations.splice(index, 1);
            saveData("tsukuyomi_observations", Tsukuyomi.observations);

            renderObservations();
            notify("Observation removed.", "success");
        });
    });
}

function initObservationForm() {
    const form = $(
        "#observationForm, #observation-form"
    );

    form?.addEventListener("submit", event => {
        event.preventDefault();

        const formData = new FormData(form);

        const title =
            formData.get("title") ||
            $("#observationTitle", form)?.value ||
            "";

        if (!String(title).trim()) {
            notify("Give your observation a title.", "error");
            return;
        }

        const entry = {
            title: String(title).trim(),
            object: String(
                formData.get("object") ||
                $("#observationObject", form)?.value ||
                "Sky observation"
            ).trim(),
            date: String(
                formData.get("date") ||
                $("#observationDate", form)?.value ||
                formatDate(new Date())
            ).trim(),
            notes: String(
                formData.get("notes") ||
                $("#observationNotes", form)?.value ||
                ""
            ).trim(),
            createdAt: new Date().toISOString()
        };

        Tsukuyomi.observations.unshift(entry);

        saveData("tsukuyomi_observations", Tsukuyomi.observations);

        renderObservations();
        form.reset();

        notify("Observation added to your journal.", "success");
    });

    renderObservations();
}

/* =========================================================
   10. ALERTS & REMINDERS
   ========================================================= */

function renderAlerts() {
    const list = $(
        "#alertList, #alert-list, #reminders-list"
    );

    if (!list) return;

    if (!Tsukuyomi.alerts.length) {
        list.innerHTML = '<p class="empty-state">No reminders saved yet.</p>';
        return;
    }

    list.innerHTML = Tsukuyomi.alerts.map((alert, index) => `
        <article class="alert-card">
            <div>
                <strong>${escapeHTML(alert.title)}</strong>
                <p>${escapeHTML(alert.date || "Date not set")}</p>
                <small>${escapeHTML(alert.type || "Astronomy")}</small>
            </div>
            <button type="button" data-delete-alert="${index}">
                Remove
            </button>
        </article>
    `).join("");

    list.querySelectorAll("[data-delete-alert]").forEach(button => {
        button.addEventListener("click", () => {
            Tsukuyomi.alerts.splice(
                Number(button.dataset.deleteAlert),
                1
            );

            saveData("tsukuyomi_alerts", Tsukuyomi.alerts);
            renderAlerts();

            notify("Reminder removed.", "success");
        });
    });
}

function createAlert({ title, date = "", type = "Astronomy" }) {
    const alert = {
        title: String(title),
        date: String(date),
        type: String(type),
        createdAt: new Date().toISOString()
    };

    Tsukuyomi.alerts.push(alert);
    saveData("tsukuyomi_alerts", Tsukuyomi.alerts);

    renderAlerts();
    notify(`Reminder saved for "${title}".`, "success");
}

function initAlerts() {
    const form = $(
        "#alertForm, #alert-form, #reminder-form"
    );

    form?.addEventListener("submit", event => {
        event.preventDefault();

        const data = new FormData(form);

        const title =
            data.get("title") ||
            $("#alertTitle", form)?.value ||
            "";

        if (!String(title).trim()) {
            notify("Enter a name for the reminder.", "error");
            return;
        }

        createAlert({
            title: String(title).trim(),
            date: String(
                data.get("date") ||
                $("#alertDate", form)?.value ||
                ""
            ),
            type: String(
                data.get("type") ||
                $("#alertType", form)?.value ||
                "Astronomy"
            )
        });

        form.reset();
    });

    renderAlerts();
}

/* =========================================================
   11. FULLSCREEN & ACCESSIBILITY
   ========================================================= */

function initFullscreen() {
    const button = $(
        "#fullscreenButton, #fullscreen-button, [data-fullscreen]"
    );

    if (!button) return;

    button.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                button.textContent = "Exit Fullscreen";
            } else {
                await document.exitFullscreen();
                button.textContent = "Fullscreen";
            }
        } catch (error) {
            console.warn("Fullscreen unavailable:", error);
            notify("Fullscreen is not available in this browser.", "error");
        }
    });

    document.addEventListener("fullscreenchange", () => {
        button.textContent = document.fullscreenElement
            ? "Exit Fullscreen"
            : "Fullscreen";
    });
}

function initBackToTop() {
    const button = $(
        "#backToTop, #back-to-top, [data-back-to-top]"
    );

    if (!button) return;

    button.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    function updateButton() {
        button.hidden = window.scrollY < 450;
    }

    window.addEventListener("scroll", updateButton, { passive: true });
    updateButton();
}

function initKeyboardShortcuts() {
    document.addEventListener("keydown", event => {
        const target = event.target;

        const isTyping =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            target?.isContentEditable;

        if (isTyping || event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        if (event.key === "Home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        if (event.key === "Escape") {
            $$("#object-overlay.active, #image-overlay.active")
                .forEach(overlay => {
                    overlay.classList.remove("active");
                    overlay.setAttribute("aria-hidden", "true");
                });

            $("#tsukuyomi-image-modal")?.remove();
        }
    });
}

/* =========================================================
   12. SYSTEM CLOCK & DATE
   ========================================================= */

function initClock() {
    const clock = $("#liveClock, #live-clock, [data-live-clock]");
    const dateLabel = $("#liveDate, #live-date, [data-live-date]");

    function update() {
        const now = new Date();

        if (clock) clock.textContent = formatTime(now);
        if (dateLabel) dateLabel.textContent = formatDate(now);
    }

    update();

    // Update on the next minute boundary instead of running continuously.
    function scheduleUpdate() {
        const delay = 60000 - (Date.now() % 60000);

        setTimeout(() => {
            update();
            scheduleUpdate();
        }, delay);
    }

    scheduleUpdate();
}

/* =========================================================
   13. OPTIONAL API INTEGRATION POINTS
   ========================================================= */

/*
  Weather integration:
  - Use a trusted weather API to retrieve cloud cover, humidity and visibility.
  - Pass real values to updateNightHonorScore({ cloudCover, humidity }).
  - Never label the demo estimate as a verified live forecast.

  Astronomy events:
  - Replace DEMO_EVENTS with validated API data.
  - Normalize each event to:
    { title, type, date, description, demo: false }

  AI image restoration:
  - Send the uploaded file to your backend.
  - Have the backend call a suitable image restoration model.
  - Display the returned restored image beside the original.
  - Do not claim the CSS filter above is AI.

  Notifications:
  - Browser notifications require permission and HTTPS/localhost.
  - Real scheduled notifications normally require a service worker,
    a backend scheduler, or an external notification service.
*/

/* =========================================================
   14. START APPLICATION
   ========================================================= */

/* =========================================================
   15. LIVE APPLICATION SERVICES
   ========================================================= */

const appState = {
    location: readStoredData("tsukuyomi_location", null),
    weather: null,
    events: [],
    observations: [],
    reminders: [],
    images: [],
    locationResults: [],
    locationResultsQuery: "",
    locationIndex: -1,
    locationTimer: null,
    locationController: null,
    weatherController: null,
    reminderEditId: null,
    notifiedReminders: new Set(),
    imageObjectUrl: null,
    imageZoom: 1,
    globalSearchIndex: -1,
    selectedCalendarDate: new Date(),
    map: null,
    mapMarker: null,
    mapWeatherControl: null,
    mapWeatherContent: null,
    baseMapLayer: null,
    baseMapType: "satellite",
    satelliteLabelLayers: [],
    topographicMap: false,
    nearbyMarkers: [],
    stargazingCandidateMarkers: [],
    nearbyController: null,
    viirsLayer: null,
    lastNominatimRequestAt: 0,
    launches: [],
    neoApproaches: [],
    countdownErrors: {}
};

const INDIA_REGIONS = [
    ["Andhra Pradesh", "Amaravati"], ["Arunachal Pradesh", "Itanagar"],
    ["Assam", "Dispur"], ["Bihar", "Patna"], ["Chhattisgarh", "Raipur"],
    ["Goa", "Panaji"], ["Gujarat", "Gandhinagar"], ["Haryana", "Chandigarh"],
    ["Himachal Pradesh", "Shimla"], ["Jharkhand", "Ranchi"],
    ["Karnataka", "Bengaluru"], ["Kerala", "Thiruvananthapuram"],
    ["Madhya Pradesh", "Bhopal"], ["Maharashtra", "Mumbai"],
    ["Manipur", "Imphal"], ["Meghalaya", "Shillong"], ["Mizoram", "Aizawl"],
    ["Nagaland", "Kohima"], ["Odisha", "Bhubaneswar"], ["Punjab", "Chandigarh"],
    ["Rajasthan", "Jaipur"], ["Sikkim", "Gangtok"], ["Tamil Nadu", "Chennai"],
    ["Telangana", "Hyderabad"], ["Tripura", "Agartala"],
    ["Uttar Pradesh", "Lucknow"], ["Uttarakhand", "Dehradun"],
    ["West Bengal", "Kolkata"], ["Andaman and Nicobar Islands", "Port Blair"],
    ["Chandigarh", "Chandigarh"],
    ["Dadra and Nagar Haveli and Daman and Diu", "Daman"],
    ["Delhi", "New Delhi"], ["Jammu and Kashmir", "Srinagar"],
    ["Ladakh", "Leh"], ["Lakshadweep", "Kavaratti"],
    ["Puducherry", "Puducherry"]
];

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

let apiModePromise;

async function detectApiMode() {
    try {
        const response = await fetch("/api/health", {
            signal: AbortSignal.timeout(2500)
        });
        if (!response.ok ||
            !(response.headers.get("content-type") || "").includes("application/json")) {
            return false;
        }
        const payload = await response.json();
        return payload?.data?.status === "ok";
    } catch (error) {
        console.info("Local API is not available; using browser-only mode.", error.message);
        return false;
    }
}

async function apiRequest(path, options = {}) {
    apiModePromise ||= detectApiMode();
    const backendAvailable = await apiModePromise;
    if (options.signal?.aborted) {
        const error = new Error("Request was cancelled.");
        error.name = "AbortError";
        throw error;
    }
    if (!backendAvailable) return staticApiRequest(path, options);
    if (path === "/api/health") {
        return { status: "ok", mode: "local Node service" };
    }

    let response;
    try {
        response = await fetch(path, {
            ...options,
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers
            }
        });
    } catch (error) {
        if (options.signal?.aborted || error.name === "AbortError") throw error;
        throw new ApiError(`The local service could not be reached: ${error.message}`, 0);
    }

    let payload;
    try {
        payload = await response.json();
    } catch {
        throw new ApiError("The server returned an unreadable response.", response.status);
    }
    if (!response.ok) {
        throw new ApiError(
            payload?.error?.message || `Request failed (${response.status}).`,
            response.status
        );
    }
    return payload.data;
}

async function fetchProviderJson(url, signal, timeoutMs = 12000) {
    const requestController = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
        timedOut = true;
        requestController.abort();
    }, timeoutMs);
    const abortRequest = () => requestController.abort();
    signal?.addEventListener("abort", abortRequest, { once: true });
    try {
        const response = await fetch(url, { signal: requestController.signal });
        if (!response.ok) {
            throw new ApiError(`Data provider returned HTTP ${response.status}.`, response.status);
        }
        return await response.json();
    } catch (error) {
        if (timedOut) throw new ApiError("Data provider request timed out.", 504);
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", abortRequest);
    }
}

function staticRecordRequest(path, options) {
    const match = path.match(/^\/api\/(observations|reminders)(?:\/([0-9a-f-]{36}))?(?:\?.*)?$/i);
    if (!match) return null;

    const kind = match[1].toLowerCase();
    const id = match[2];
    const method = options.method || "GET";
    const records = readStoredData(`tsukuyomi_${kind}`, []);
    const index = id ? records.findIndex(record => record.id === id) : -1;
    if (id && index < 0) throw new ApiError("Record not found.", 404);
    if (method === "GET") return id ? records[index] : records;
    if (method === "DELETE") {
        records.splice(index, 1);
        saveData(`tsukuyomi_${kind}`, records);
        return { deleted: true };
    }

    let input;
    try {
        input = JSON.parse(options.body || "{}");
    } catch {
        throw new ApiError("Record data must be valid JSON.", 400);
    }
    const existing = index >= 0 ? records[index] : {};
    const saved = kind === "observations"
        ? {
            ...existing,
            id: existing.id || crypto.randomUUID(),
            title: String(input.title ?? existing.title ?? "").trim(),
            object: String(input.object ?? existing.object ?? "").trim(),
            date: String(input.date ?? existing.date ?? ""),
            location: String(input.location ?? existing.location ?? "").trim(),
            conditions: String(input.conditions ?? existing.conditions ?? "").trim(),
            notes: String(input.notes ?? existing.notes ?? "").trim()
        }
        : {
            ...existing,
            id: existing.id || crypto.randomUUID(),
            title: String(input.title ?? existing.title ?? "").trim(),
            type: String(input.type ?? existing.type ?? "custom"),
            dateTime: String(input.dateTime ?? existing.dateTime ?? ""),
            notify: typeof (input.notify ?? existing.notify) === "boolean"
                ? (input.notify ?? existing.notify) : false
        };
    if (!saved.title) throw new ApiError("Title is required.", 400);
    if (kind === "reminders" && (!Number.isFinite(Date.parse(saved.dateTime)) ||
        Date.parse(saved.dateTime) <= Date.now())) {
        throw new ApiError("Reminder time must be in the future.", 400);
    }

    if (index >= 0) records[index] = saved;
    else records.unshift(saved);
    saveData(`tsukuyomi_${kind}`, records);
    return saved;
}

async function staticApiRequest(path, options = {}) {
    const method = options.method || "GET";
    if (path === "/api/health") {
        return { status: "ok", mode: "browser-only static mode" };
    }
    const record = staticRecordRequest(path, options);
    if (record !== null) return record;

    const requestUrl = new URL(path, window.location.href);
    if (requestUrl.pathname === "/api/locations/search" && method === "GET") {
        const providerUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
        providerUrl.searchParams.set("name", requestUrl.searchParams.get("q") || "");
        providerUrl.searchParams.set("count", "100");
        providerUrl.searchParams.set("language", "en");
        providerUrl.searchParams.set("format", "json");
        providerUrl.searchParams.set("countryCode", "IN");
        const payload = await fetchProviderJson(providerUrl, options.signal);
        return (payload.results || []).map(place => ({
            name: place.name,
            admin1: place.admin1 || "",
            country: place.country || "",
            latitude: place.latitude,
            longitude: place.longitude,
            timezone: place.timezone || ""
        }));
    }
    if (requestUrl.pathname === "/api/weather" && method === "GET") {
        const providerUrl = new URL("https://api.open-meteo.com/v1/forecast");
        providerUrl.searchParams.set("latitude", requestUrl.searchParams.get("latitude") || "");
        providerUrl.searchParams.set("longitude", requestUrl.searchParams.get("longitude") || "");
        providerUrl.searchParams.set("current", [
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "is_day", "precipitation", "weather_code", "cloud_cover",
            "visibility", "wind_speed_10m"
        ].join(","));
        providerUrl.searchParams.set("timezone", "auto");
        providerUrl.searchParams.set("models", "ncep_gfs_seamless");
        const payload = await fetchProviderJson(providerUrl, options.signal);
        return {
            current: payload.current,
            currentUnits: payload.current_units,
            timezone: payload.timezone,
            updatedAt: new Date().toISOString(),
            source: "NOAA GFS via Open-Meteo"
        };
    }
    if (requestUrl.pathname === "/api/images/search" && method === "GET") {
        const providerUrl = new URL("https://images-api.nasa.gov/search");
        providerUrl.searchParams.set("q", requestUrl.searchParams.get("q") || "");
        providerUrl.searchParams.set("media_type", "image");
        providerUrl.searchParams.set("page_size", "12");
        const payload = await fetchProviderJson(providerUrl, options.signal);
        return (payload.collection?.items || []).flatMap(item => {
            const metadata = item.data?.[0];
            const preview = item.links?.find(link => link.rel === "preview");
            if (!metadata || !preview?.href || !/^https:\/\//i.test(preview.href)) return [];
            return [{
                id: metadata.nasa_id || crypto.randomUUID(),
                title: metadata.title || "Untitled NASA image",
                description: (metadata.description || "").slice(0, 1200),
                date: metadata.date_created || "",
                imageUrl: preview.href,
                sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(metadata.nasa_id || "")}`
            }];
        });
    }
    if (requestUrl.pathname === "/api/launches/upcoming" && method === "GET") {
        const key = "tsukuyomi_launch_cache";
        const cached = readStoredData(key, null);
        if (cached?.expiresAt > Date.now()) return cached.data;
        const providerUrl = new URL(
            "https://ll.thespacedevs.com/2.2.0/launch/upcoming/"
        );
        providerUrl.searchParams.set("limit", "10");
        const payload = await fetchProviderJson(providerUrl, options.signal);
        const data = {
            launches: (payload.results || []).flatMap(launch => {
                if (!launch.net || Date.parse(launch.net) <= Date.now()) return [];
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
            }),
            updatedAt: new Date().toISOString(),
            source: "The Space Devs Launch Library 2"
        };
        saveData(key, { expiresAt: Date.now() + 30 * 60_000, data });
        return data;
    }
    if (requestUrl.pathname === "/api/nasa/neo" && method === "GET") {
        const key = "tsukuyomi_nasa_neo_cache";
        const cached = readStoredData(key, null);
        if (cached?.expiresAt > Date.now()) return cached.data;
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + 6 * 86400000)
            .toISOString().slice(0, 10);
        const providerUrl = new URL("https://api.nasa.gov/neo/rest/v1/feed");
        providerUrl.searchParams.set("start_date", startDate);
        providerUrl.searchParams.set("end_date", endDate);
        providerUrl.searchParams.set("api_key", "DEMO_KEY");
        const payload = await fetchProviderJson(providerUrl, options.signal);
        const monthNumbers = {
            Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
            Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
        };
        const approaches = Object.values(payload.near_earth_objects || {})
            .flatMap(asteroids => asteroids)
            .flatMap(asteroid => (asteroid.close_approach_data || []).flatMap(approach => {
                const match = approach.close_approach_date_full?.match(
                    /^(\d{4})-([A-Z][a-z]{2})-(\d{2}) (\d{2}):(\d{2})$/
                );
                const month = monthNumbers[match?.[2]];
                if (!match || !month) return [];
                const timestamp = Date.UTC(
                    Number(match[1]), Number(month) - 1,
                    Number(match[3]), Number(match[4]), Number(match[5])
                );
                if (timestamp <= Date.now()) return [];
                return [{
                    id: asteroid.id,
                    name: asteroid.name || "Unnamed near-Earth object",
                    date: new Date(timestamp).toISOString(),
                    timestamp,
                    missDistanceKm: Number(approach.miss_distance?.kilometers),
                    relativeVelocityKmh: Number(approach.relative_velocity?.kilometers_per_hour),
                    orbitingBody: approach.orbiting_body || "Earth",
                    sourceUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(asteroid.id)}`
                }];
            }))
            .sort((left, right) => left.timestamp - right.timestamp)
            .slice(0, 8);
        const data = {
            approaches,
            updatedAt: new Date().toISOString(),
            source: "NASA/JPL CNEOS NeoWs"
        };
        saveData(key, { expiresAt: Date.now() + 30 * 60_000, data });
        return data;
    }
    throw new ApiError("This request is not supported in browser-only mode.", 404);
}

function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value;
}

function dateInputValue(date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

function renderLocationSuggestions(items, message = "", query = "") {
    const container = $("#location-suggestions");
    if (!container) return;

    container.replaceChildren();
    appState.locationResults = items;
    appState.locationResultsQuery = query;
    appState.locationIndex = -1;

    if (message) {
        const status = document.createElement("p");
        status.className = "suggestion-status";
        status.setAttribute("role", "status");
        status.textContent = message;
        container.appendChild(status);
        container.hidden = false;
        $("#location-input")?.setAttribute("aria-expanded", "true");
        return;
    }

    items.forEach((place, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.id = `location-suggestion-${index}`;
        button.className = "location-suggestion";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");
        button.textContent = [place.name, place.admin1, place.country]
            .filter(Boolean)
            .join(", ");
        button.addEventListener("click", () => selectLocation(place));
        container.appendChild(button);
    });

    container.hidden = items.length === 0;
    $("#location-input")?.setAttribute("aria-expanded", String(items.length > 0 || Boolean(message)));
    if (appState.locationIndex >= 0) {
        $("#location-input")?.setAttribute(
            "aria-activedescendant",
            `location-suggestion-${appState.locationIndex}`
        );
    } else {
        $("#location-input")?.removeAttribute("aria-activedescendant");
    }
}

function locationLabel(location) {
    return [location.name, location.admin1, location.country]
        .filter(Boolean)
        .join(", ") || "Selected location";
}

function displaySelectedLocation(location) {
    const label = locationLabel(location);
    setText("#observer-location", label.toUpperCase());
    setText("#location-coordinates",
        `${label} · ${Number(location.latitude).toFixed(4)}°, ` +
        `${Number(location.longitude).toFixed(4)}°` +
        (location.timezone ? ` · ${location.timezone}` : ""));
    setText("#hero-coordinate",
        `${Number(location.latitude).toFixed(2)}°, ${Number(location.longitude).toFixed(2)}°`);

    const map = $("#stargazing-map");
    if (map) {
        const latitude = Number(location.latitude);
        const longitude = Number(location.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            showLocationOnMap(location);
        }
    }
}

function makeMapMarkerIcon(symbol, className) {
    return window.L.divIcon({
        className: `scroll-map-marker ${className}`,
        html: `<span aria-hidden="true">${symbol}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });
}

function createBaseMapLayer(type) {
    if (type === "satellite") {
        return window.L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                maxZoom: 19,
                className: "satellite-imagery-tile",
                attribution: 'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community'
            }
        );
    }

    if (type === "topographic") {
        return window.L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
            maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        });
    }

    return window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    });
}

function createSatelliteLabelLayers() {
    const tileOptions = {
        maxZoom: 19,
        attribution: 'Labels &copy; <a href="https://www.esri.com/">Esri</a> and its contributors'
    };
    return [
        window.L.tileLayer(
            "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            { ...tileOptions, className: "satellite-label-tile" }
        ),
        window.L.tileLayer(
            "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
            { ...tileOptions, className: "satellite-label-tile" }
        )
    ];
}

function setBaseMap(type) {
    if (!appState.map || !window.L) return false;

    if (appState.baseMapLayer) appState.map.removeLayer(appState.baseMapLayer);
    appState.satelliteLabelLayers.forEach(layer => appState.map.removeLayer(layer));
    appState.satelliteLabelLayers = [];
    appState.baseMapType = type;
    appState.topographicMap = type === "topographic";
    appState.baseMapLayer = createBaseMapLayer(type).addTo(appState.map);
    if (type === "satellite") {
        appState.satelliteLabelLayers = createSatelliteLabelLayers();
        appState.satelliteLabelLayers.forEach(layer => layer.addTo(appState.map));
    }

    const satelliteButton = $("#toggle-satellite-map");
    satelliteButton?.setAttribute("aria-pressed", String(type === "satellite"));
    if (satelliteButton) {
        satelliteButton.textContent = type === "satellite"
            ? "SHOW STREET MAP"
            : "SHOW SATELLITE";
    }

    const topographicButton = $("#toggle-topographic-map");
    topographicButton?.setAttribute("aria-pressed", String(type === "topographic"));
    if (topographicButton) {
        topographicButton.textContent = type === "topographic"
            ? "SHOW SATELLITE MAP"
            : "SHOW TOPOGRAPHY";
    }

    const status = type === "satellite"
        ? "Satellite imagery with Esri place and road labels. Zoom in to inspect rooftops where detailed imagery is available; imagery may be outdated and is not live."
        : type === "topographic"
            ? "Topographic relief from OpenTopoMap / OpenStreetMap; mountain labels are mapped features, not trail or access guidance."
            : "Street map from OpenStreetMap. Choose SHOW SATELLITE to view aerial imagery.";
    setText("#map-layer-status", status);
    return true;
}

function showLocationOnMap(location) {
    const container = $("#stargazing-map");
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    if (!container || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    if (!window.L) {
        const frame = document.createElement("iframe");
        frame.title = `OpenStreetMap near ${locationLabel(location)}`;
        frame.loading = "lazy";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=` +
            `${longitude - 0.08}%2C${latitude - 0.05}%2C${longitude + 0.08}%2C${latitude + 0.05}` +
            `&layer=mapnik&marker=${latitude},${longitude}`;
        container.replaceChildren(frame);
        setText("#map-layer-status", "Interactive map library unavailable; showing the selected point in OpenStreetMap.");
        return;
    }

    if (!appState.map) {
        container.replaceChildren();
        appState.map = window.L.map(container, {
            zoomControl: true,
            scrollWheelZoom: true,
            wheelPxPerZoomLevel: 100,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            keyboard: true,
            preferCanvas: true
        }).setView([latitude, longitude], 16);
        setBaseMap(appState.baseMapType || "satellite");
        appState.mapWeatherControl = window.L.control({ position: "topright" });
        appState.mapWeatherControl.onAdd = () => {
            const control = window.L.DomUtil.create(
                "section",
                "map-weather-overlay leaflet-bar"
            );
            control.setAttribute("role", "region");
            control.setAttribute("aria-label", "Selected location weather on map");
            control.innerHTML = [
                '<div class="map-weather-title"><span aria-hidden="true">天気</span>',
                '<span>LOCAL SKY · WEATHER</span></div>',
                '<strong class="map-weather-place">Select a place</strong>',
                '<div class="map-weather-condition">Waiting for weather data…</div>',
                '<div class="map-weather-metrics"></div>',
                '<small class="map-weather-source">NOAA GFS · via Open-Meteo</small>'
            ].join("");
            appState.mapWeatherContent = control;
            window.L.DomEvent.disableClickPropagation(control);
            window.L.DomEvent.disableScrollPropagation(control);
            return control;
        };
        appState.mapWeatherControl.addTo(appState.map);
    } else {
        appState.map.setView([latitude, longitude], 16, { animate: true });
    }

    if (appState.mapMarker) appState.map.removeLayer(appState.mapMarker);
    appState.mapMarker = window.L.marker([latitude, longitude], {
        icon: makeMapMarkerIcon("☾", "selected-place-marker"),
        title: locationLabel(location),
        alt: `Selected location: ${locationLabel(location)}`
    }).addTo(appState.map);
    appState.mapMarker.bindPopup(
        `<strong>${escapeHTML(locationLabel(location))}</strong><br>Selected observing point`
    );
    window.setTimeout(() => appState.map?.invalidateSize(), 100);
    renderMapWeather(appState.location, appState.weather);
}

function weatherIcon(code) {
    if ([0, 1].includes(Number(code))) return "☀";
    if ([2, 3].includes(Number(code))) return "☁";
    if ([45, 48].includes(Number(code))) return "≋";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(Number(code))) return "☂";
    if ([95, 96, 99].includes(Number(code))) return "⚡";
    if ([71, 73, 75, 77, 85, 86].includes(Number(code))) return "❄";
    return "✦";
}

function renderMapWeather(location = appState.location, current = appState.weather) {
    const control = appState.mapWeatherContent;
    if (!control) return;
    const place = control.querySelector(".map-weather-place");
    const condition = control.querySelector(".map-weather-condition");
    const metrics = control.querySelector(".map-weather-metrics");
    const source = control.querySelector(".map-weather-source");
    if (place) place.textContent = location ? locationLabel(location) : "Select a place";
    if (!current) {
        if (condition) {
            condition.textContent = location
                ? "Weather conditions are loading…"
                : "Search a city to reveal its local sky.";
        }
        if (metrics) metrics.replaceChildren();
        if (source) source.textContent = "NOAA GFS · via Open-Meteo";
        return;
    }

    if (condition) {
        condition.replaceChildren();
        const icon = document.createElement("span");
        icon.className = "map-weather-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = weatherIcon(current.weather_code);
        const description = document.createElement("span");
        description.textContent = weatherDescription(Number(current.weather_code));
        condition.append(icon, description);
    }
    if (metrics) {
        const values = [
            ["TEMP", current.temperature_2m, "°C"],
            ["CLOUD", current.cloud_cover, "%"],
            ["VISIBILITY", current.visibility === null ||
                current.visibility === undefined
                ? null : (Number(current.visibility) / 1000).toFixed(1), " km"],
            ["WIND", current.wind_speed_10m, " km/h"],
            ["HUMIDITY", current.relative_humidity_2m, "%"]
        ];
        metrics.replaceChildren();
        values.forEach(([label, value, unit]) => {
            const item = document.createElement("div");
            item.className = "map-weather-metric";
            const name = document.createElement("span");
            name.textContent = label;
            const reading = document.createElement("strong");
            reading.textContent = value === null || value === undefined ||
                value === "" || !Number.isFinite(Number(value))
                ? "—" : `${Math.round(Number(value) * 10) / 10}${unit}`;
            item.append(name, reading);
            metrics.appendChild(item);
        });
    }
    if (source) source.textContent = "LIVE · NOAA GFS via Open-Meteo";

    if (appState.mapMarker) {
        const popup = document.createElement("div");
        const heading = document.createElement("strong");
        heading.textContent = locationLabel(location);
        const currentWeather = document.createElement("p");
        currentWeather.textContent =
            `${weatherDescription(Number(current.weather_code))} · ` +
            `${current.temperature_2m ?? "—"}°C · ` +
            `${current.cloud_cover ?? "—"}% cloud`;
        popup.append(heading, currentWeather);
        appState.mapMarker.bindPopup(popup);
    }
}

function landmarkKind(tags) {
    const historic = String(tags.historic || "").toLowerCase();
    const natural = String(tags.natural || "").toLowerCase();
    if (natural === "peak" || natural === "mountain" || tags.mountain_pass) {
        return {
            label: "Mountain / high point",
            symbol: "▲",
            className: "mountain-marker",
            starRank: 1
        };
    }
    if (tags.tourism === "viewpoint") {
        return {
            label: "Viewpoint",
            symbol: "◉",
            className: "viewpoint-marker",
            starRank: 2
        };
    }
    if (historic === "shrine") {
        return { label: "Shrine", symbol: "⛩", className: "shrine-marker" };
    }
    if (historic === "monastery") {
        return { label: "Monastery", symbol: "✧", className: "shrine-marker" };
    }
    if (historic === "temple") {
        return { label: "Temple", symbol: "✧", className: "temple-marker" };
    }
    if (tags.amenity === "place_of_worship") {
        return { label: "Place of worship", symbol: "✧", className: "temple-marker" };
    }
    return null;
}

function distanceBetweenKm(first, second) {
    const radians = value => value * Math.PI / 180;
    const latitudeDelta = radians(second.latitude - first.latitude);
    const longitudeDelta = radians(second.longitude - first.longitude);
    const value = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

async function waitForNominatimSlot(signal) {
    const wait = Math.max(0, appState.lastNominatimRequestAt + 1100 - Date.now());
    if (wait) {
        await new Promise(resolve => window.setTimeout(resolve, wait));
    }
    if (signal.aborted) {
        const error = new Error("Request was cancelled.");
        error.name = "AbortError";
        throw error;
    }
    appState.lastNominatimRequestAt = Date.now();
}

function renderNearbyLandmarks(spots) {
    const list = $("#nearby-spots");
    if (!list) return;
    list.replaceChildren();
    if (!spots.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state glass-panel";
        empty.textContent = "No matching mapped features were found in this radius. This does not mean the area has no suitable places.";
        list.appendChild(empty);
        setText("#spot-count", "0 MAPPED FEATURES");
        setText("#star-candidate-status",
            "No nearby viewpoint is confirmed by the available map data.");
        return;
    }

    spots.forEach(spot => {
        const card = document.createElement("article");
        card.className = `spot-placeholder glass-panel${spot.bestForStars ? " star-candidate-card" : ""}`;
        const icon = document.createElement("span");
        icon.className = `spot-icon ${spot.bestForStars ? "star-candidate-icon" : spot.kind.className}`;
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = spot.bestForStars ? "✦" : spot.kind.symbol;
        const heading = document.createElement("h4");
        heading.textContent = spot.bestForStars
            ? `POSSIBLE VIEWPOINT · ${spot.name}`
            : spot.name;
        const description = document.createElement("p");
        description.textContent = spot.bestForStars
            ? `${spot.kind.label} · ${spot.distanceKm.toFixed(1)} km away. ` +
                "Highlighted from map features only—not a verified dark-sky rating. Check light pollution, weather, access, and safety."
            : `${spot.kind.label} · about ${spot.distanceKm.toFixed(1)} km away. ` +
                "Mapped feature only; check access, safety, and local rules.";
        const open = document.createElement("button");
        open.type = "button";
        open.className = "text-button";
        open.textContent = spot.bestForStars ? "FOCUS ON MAP" : "SHOW ON MAP";
        open.addEventListener("click", () => {
            appState.map?.flyTo([spot.latitude, spot.longitude], 14, { duration: 0.8 });
            spot.marker?.openPopup();
        });
        card.append(icon, heading, description, open);
        list.appendChild(card);
    });
    setText("#spot-count", `${spots.length} NEARBY MAP FEATURES`);
    const candidates = spots
        .filter(spot => spot.bestForStars)
        .sort((left, right) =>
            left.kind.starRank - right.kind.starRank ||
            left.distanceKm - right.distanceKm
        );
    setText("#star-candidate-status", candidates.length
        ?         `Possible viewpoints from map data: ${candidates.map(spot => spot.name).join(", ")}. ` +
        "Suggestions are ranked by mapped feature type and distance, not sky darkness. Check weather, access, and safety before visiting."
        : "No nearby viewpoint is confirmed by the available map data.");
}

async function loadNearbyLandmarks(location = appState.location) {
    if (!location) return;
    appState.nearbyController?.abort();
    appState.nearbyController = new AbortController();
    const controller = appState.nearbyController;
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const radius = Number($("#nearby-radius")?.value || 25000);
    appState.stargazingCandidateMarkers.forEach(marker =>
        appState.map?.removeLayer(marker)
    );
    appState.stargazingCandidateMarkers = [];
    setText("#spot-count", "SEARCHING NEARBY MAP DATA…");
    setText("#star-candidate-status", "Searching mapped mountains and viewpoints; highlights are candidates, not verified dark-sky ratings.");
    setText("#nearby-data-status",
        "Loading nearby mapped features. Map markers are community-mapped, not verified observing sites.");
    try {
        const seen = new Set();
        const searches = [
            { query: "temple", kind: landmarkKind({ historic: "temple" }) },
            { query: "shrine", kind: landmarkKind({ historic: "shrine" }) },
            { query: "mountain", kind: landmarkKind({ natural: "mountain" }) },
            { query: "viewpoint", kind: landmarkKind({ tourism: "viewpoint" }) }
        ];
        const spots = [];
        for (const search of searches) {
            await waitForNominatimSlot(controller.signal);
            const providerUrl = new URL("https://nominatim.openstreetmap.org/search");
            providerUrl.searchParams.set("format", "jsonv2");
            providerUrl.searchParams.set("q", search.query);
            providerUrl.searchParams.set("limit", "8");
            providerUrl.searchParams.set("addressdetails", "0");
            providerUrl.searchParams.set("bounded", "1");
            providerUrl.searchParams.set("viewbox", [
                longitude - radius / 1000 / (111 * Math.cos(latitude * Math.PI / 180)),
                latitude + radius / 1000 / 111,
                longitude + radius / 1000 / (111 * Math.cos(latitude * Math.PI / 180)),
                latitude - radius / 1000 / 111
            ].join(","));
            const results = await fetchProviderJson(
                providerUrl,
                controller.signal,
                7000
            );
            results.forEach(result => {
                const spotLatitude = Number(result.lat);
                const spotLongitude = Number(result.lon);
                if (!Number.isFinite(spotLatitude) || !Number.isFinite(spotLongitude)) return;
                const distanceKm = distanceBetweenKm(location, {
                    latitude: spotLatitude,
                    longitude: spotLongitude
                });
                if (distanceKm > radius / 1000) return;
                const name = result.name || result.display_name?.split(",")[0] || search.kind.label;
                const key = `${name.toLowerCase()}|${spotLatitude.toFixed(4)}|${spotLongitude.toFixed(4)}`;
                if (seen.has(key)) return;
                seen.add(key);
                spots.push({
                    id: `${result.osm_type}-${result.osm_id}`,
                    name,
                    kind: search.kind,
                    latitude: spotLatitude,
                    longitude: spotLongitude,
                    distanceKm
                });
            });
        }
        if (controller.signal.aborted ||
            `${appState.location?.latitude},${appState.location?.longitude}` !==
            `${latitude},${longitude}`) return;
        spots.sort((left, right) => left.distanceKm - right.distanceKm);
        const candidates = spots
            .filter(spot => spot.kind.starRank)
            .sort((left, right) =>
                left.kind.starRank - right.kind.starRank ||
                left.distanceKm - right.distanceKm
            )
            .slice(0, 3);
        candidates.forEach(spot => {
            spot.bestForStars = true;
        });

        appState.nearbyMarkers.forEach(marker => appState.map?.removeLayer(marker));
        appState.nearbyMarkers = [];
        if (appState.map) {
            spots.forEach(spot => {
                const marker = window.L.marker([spot.latitude, spot.longitude], {
                    icon: makeMapMarkerIcon(
                        spot.bestForStars ? "✦" : spot.kind.symbol,
                        spot.bestForStars ? "star-candidate-marker" : spot.kind.className
                    ),
                    title: spot.name,
                    alt: `${spot.kind.label}: ${spot.name}`
                }).addTo(appState.map);
                marker.bindTooltip(escapeHTML(spot.name), {
                    permanent: true,
                    direction: "right",
                    offset: [15, 0],
                    className: "map-place-label"
                });
                marker.bindPopup(
                    `<strong>${escapeHTML(spot.name)}</strong><br>` +
                    `${spot.bestForStars ? "Star-viewing candidate · " : ""}` +
                    `${escapeHTML(spot.kind.label)} · ${spot.distanceKm.toFixed(1)} km`
                );
                spot.marker = marker;
                appState.nearbyMarkers.push(marker);
                if (spot.bestForStars) appState.stargazingCandidateMarkers.push(marker);
            });
        }
        renderNearbyLandmarks(spots);
        setText("#nearby-data-status",
            `OpenStreetMap / Nominatim community data · ${spots.length} mapped features within ${radius / 1000} km. ` +
            "A mapped landmark is not a verified dark-sky or public-access site.");
    } catch (error) {
        if (error.name === "AbortError") return;
        console.warn("Nearby map data could not be loaded:", error);
        const list = $("#nearby-spots");
        if (list) {
            const message = document.createElement("p");
            message.className = "empty-state glass-panel";
            message.textContent =
                `Nearby map data could not be loaded (${error.message}). Try again later; no landmarks were inferred.`;
            list.replaceChildren(message);
        }
        setText("#nearby-data-status",
            "Nearby OpenStreetMap search is temporarily unavailable. The map and selected location remain usable.");
        setText("#star-candidate-status",
            "Nearby place search failed, so no stargazing candidate can be identified.");
        setText("#spot-count", "DATA UNAVAILABLE");
    }
}

function initMapControls() {
    $("#nearby-radius")?.addEventListener("change", () => loadNearbyLandmarks());
    $("#retry-nearby-button")?.addEventListener("click", () => loadNearbyLandmarks());
    $("#center-map-button")?.addEventListener("click", () => {
        if (appState.location) showLocationOnMap(appState.location);
    });
    $("#toggle-viirs-layer")?.addEventListener("click", event => {
        const button = event.currentTarget;
        if (!appState.map || !window.L) {
            setText("#map-layer-status", "Choose a location before enabling the NASA satellite night-lights layer.");
            return;
        }
        if (appState.viirsLayer) {
            appState.map.removeLayer(appState.viirsLayer);
            appState.viirsLayer = null;
            button.setAttribute("aria-pressed", "false");
            button.textContent = "SHOW NIGHT-LIGHT IMAGE";
            setText("#score-light-pollution", "Map layer only");
            setText("#map-layer-status",
                "NASA VIIRS satellite imagery is visual context only; it is not a point-level Bortle or light-pollution reading.");
            return;
        }

        appState.viirsLayer = window.L.tileLayer.wms(
            "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi",
            {
                layers: "VIIRS_SNPP_DayNightBand_ENCC",
                format: "image/png",
                transparent: true,
                version: "1.1.1",
                opacity: 0.78,
                crossOrigin: true,
                attribution: 'NASA EOSDIS GIBS · VIIRS Day/Night Band'
            }
        );
        appState.viirsLayer.on("tileerror", () => {
            setText("#map-layer-status",
                "NASA VIIRS tiles could not be loaded for this date or connection. The base map and markers remain available.");
            setText("#score-light-pollution", "Unavailable");
        });
        appState.viirsLayer.addTo(appState.map);
        button.setAttribute("aria-pressed", "true");
        button.textContent = "HIDE NIGHT-LIGHT IMAGE";
        setText("#score-light-pollution", "Satellite view");
        setText("#map-layer-status",
            "NASA VIIRS Day/Night Band imagery · latest available visualization. Visual context only; no point-level light-pollution measurement is calculated.");
    });
    $("#toggle-satellite-map")?.addEventListener("click", () => {
        if (!appState.map || !window.L) {
            setText("#map-layer-status", "Choose a location before changing the map style.");
            return;
        }
        setBaseMap(appState.baseMapType === "satellite" ? "street" : "satellite");
    });
    $("#toggle-topographic-map")?.addEventListener("click", () => {
        if (!appState.map || !window.L) {
            setText("#map-layer-status", "Choose a location before changing the map style.");
            return;
        }
        setBaseMap(
            appState.baseMapType === "topographic" ? "satellite" : "topographic"
        );
    });
}

async function selectLocation(place) {
    appState.location = {
        name: place.name || "Selected location",
        admin1: place.admin1 || "",
        country: place.country || "",
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        timezone: place.timezone || ""
    };

    if (!Number.isFinite(appState.location.latitude) ||
        !Number.isFinite(appState.location.longitude)) {
        notify("The selected location has invalid coordinates.", "error");
        return;
    }

    saveData("tsukuyomi_location", appState.location);
    $("#location-input").value = [place.name, place.admin1, place.country]
        .filter(Boolean).join(", ");
    renderLocationSuggestions([]);
    appState.weather = null;
    displaySelectedLocation(appState.location);
    await loadWeather();
    loadNearbyLandmarks();
}

async function searchLocations(query) {
    const input = $("#location-input");
    const cleaned = query.trim();
    if (cleaned.length < 2) {
        renderLocationSuggestions([]);
        return;
    }

    if (appState.locationController) appState.locationController.abort();
    appState.locationController = new AbortController();
    const coordinateMatch = cleaned.match(
        /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/
    );
    if (coordinateMatch) {
        const latitude = Number(coordinateMatch[1]);
        const longitude = Number(coordinateMatch[2]);
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            renderLocationSuggestions([], "Coordinates must be within 90° latitude and 180° longitude.", cleaned);
            return;
        }
        renderLocationSuggestions([{
            name: `Coordinates ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
            latitude,
            longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        }], "", cleaned);
        return;
    }
    renderLocationSuggestions([], "Searching locations…", cleaned);

    try {
        const results = await apiRequest(
            `/api/locations/search?q=${encodeURIComponent(cleaned)}`,
            { signal: appState.locationController.signal }
        );
        if (input.value.trim() !== cleaned) return;
        renderLocationSuggestions(results || [], results?.length
            ? ""
            : "No matching Indian cities or towns found. Try adding the state name.", cleaned);
    } catch (error) {
        if (error.name === "AbortError") return;
        console.warn("Location search failed:", error);
        renderLocationSuggestions([], error.message || "Location search is unavailable.", cleaned);
    }
}

function initLocationService() {
    const input = $("#location-input");
    const button = $("#search-location-btn");
    const geoButton = $("#use-location-btn");
    const regionSelect = $("#india-region");

    if (regionSelect) {
        INDIA_REGIONS.slice().sort((left, right) => left[0].localeCompare(right[0]))
            .forEach(([region, capital]) => {
                const option = document.createElement("option");
                option.value = `${capital}|${region}`;
                const cityName = region === "Andaman and Nicobar Islands"
                    ? "Sri Vijaya Puram (Port Blair)"
                    : capital;
                option.textContent = `${region} · ${cityName}`;
                regionSelect.appendChild(option);
            });
        regionSelect.addEventListener("change", () => {
            const [capital, region] = regionSelect.value.split("|");
            if (!capital || !region || !input) return;
            input.value = `${capital}, ${region}, India`;
            searchLocations(input.value);
        });
    }

    input?.addEventListener("input", () => {
        clearTimeout(appState.locationTimer);
        appState.locationController?.abort();
        renderLocationSuggestions([]);
        appState.locationTimer = setTimeout(() => searchLocations(input.value), 350);
    });

    input?.addEventListener("keydown", event => {
        const resultsMatchInput = appState.locationResultsQuery === input.value.trim();
        if (event.key === "ArrowDown" && resultsMatchInput && appState.locationResults.length) {
            event.preventDefault();
            appState.locationIndex = Math.min(
                appState.locationIndex + 1,
                appState.locationResults.length - 1
            );
            updateLocationSuggestionFocus();
        } else if (event.key === "ArrowUp" && resultsMatchInput && appState.locationResults.length) {
            event.preventDefault();
            appState.locationIndex = Math.max(appState.locationIndex - 1, 0);
            updateLocationSuggestionFocus();
        } else if (event.key === "Enter" && resultsMatchInput && appState.locationIndex >= 0) {
            event.preventDefault();
            selectLocation(appState.locationResults[appState.locationIndex]);
        } else if (event.key === "Enter" && resultsMatchInput &&
            appState.locationIndex < 0 && appState.locationResults.length === 1) {
            event.preventDefault();
            selectLocation(appState.locationResults[0]);
        } else if (event.key === "Enter") {
            event.preventDefault();
            searchLocations(input.value);
        } else if (event.key === "Escape") {
            renderLocationSuggestions([]);
        }
    });

    button?.addEventListener("click", () => {
        const resultsMatchInput = appState.locationResultsQuery === input?.value.trim();
        const selected = resultsMatchInput
            ? appState.locationResults[appState.locationIndex >= 0 ? appState.locationIndex : 0]
            : null;
        if (selected) {
            selectLocation(selected);
        } else if (input?.value.trim()) {
            searchLocations(input.value);
        } else {
            notify("Enter a city or place to search.", "error");
            input?.focus();
        }
    });

    geoButton?.addEventListener("click", () => {
        if (!navigator.geolocation) {
            notify("This browser does not support location access. Search for a place instead.", "error");
            return;
        }
        geoButton.disabled = true;
        geoButton.setAttribute("aria-busy", "true");
        navigator.geolocation.getCurrentPosition(
            position => {
                geoButton.disabled = false;
                geoButton.removeAttribute("aria-busy");
                selectLocation({
                    name: "Current location",
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ""
                });
            },
            error => {
                geoButton.disabled = false;
                geoButton.removeAttribute("aria-busy");
                const message = error.code === error.PERMISSION_DENIED
                    ? "Location permission was denied. You can search for a place manually."
                    : "Could not determine your location. Please try a manual search.";
                notify(message, "error");
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".location-input-group")) {
            renderLocationSuggestions([]);
        }
    });

    if (appState.location &&
        Number.isFinite(Number(appState.location.latitude)) &&
        Number.isFinite(Number(appState.location.longitude))) {
        displaySelectedLocation(appState.location);
        if (input) input.value = locationLabel(appState.location);
        loadWeather();
        loadNearbyLandmarks();
    }
}

function updateLocationSuggestionFocus() {
    $$(".location-suggestion", $("#location-suggestions")).forEach((item, index) => {
        item.setAttribute("aria-selected", String(index === appState.locationIndex));
    });
    const focused = $(`#location-suggestion-${appState.locationIndex}`);
    $("#location-input")?.setAttribute(
        "aria-activedescendant",
        `location-suggestion-${appState.locationIndex}`
    );
    focused?.scrollIntoView({ block: "nearest" });
}

function weatherDescription(code) {
    const descriptions = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
        55: "Dense drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
        71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers",
        81: "Rain showers", 82: "Heavy showers", 95: "Thunderstorm",
        96: "Thunderstorm with hail", 99: "Thunderstorm with hail"
    };
    return descriptions[code] || "Current weather";
}

function calculateNightScore(current) {
    return window.TsukuyomiMath.scoreNightConditions({
        cloudCover: current.cloud_cover,
        humidity: current.relative_humidity_2m,
        visibilityKm: current.visibility === null || current.visibility === undefined
            ? current.visibility
            : Number(current.visibility) / 1000,
        windSpeedKmh: current.wind_speed_10m,
        moonIllumination: window.TsukuyomiMath.getMoonPhase(new Date()).illumination
    });
}

function renderWeather(current, updatedAt, source = "NOAA GFS via Open-Meteo") {
    const metric = value => value === null || value === undefined || value === ""
        ? NaN : Number(value);
    const temperature = metric(current.temperature_2m);
    const humidity = metric(current.relative_humidity_2m);
    const cloudCover = metric(current.cloud_cover);
    const visibilityKm = metric(current.visibility) / 1000;
    const windSpeed = metric(current.wind_speed_10m);
    const description = weatherDescription(Number(current.weather_code));

    setText("#weather-temperature", Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : "--°C");
    setText("#weather-condition", description);
    setText("#cloud-cover", Number.isFinite(cloudCover) ? `${Math.round(cloudCover)}%` : "--%");
    setText("#humidity", Number.isFinite(humidity) ? `${Math.round(humidity)}%` : "--%");
    setText("#visibility", Number.isFinite(visibilityKm) ? `${visibilityKm.toFixed(1)} km` : "-- km");
    setText("#wind-speed", Number.isFinite(windSpeed) ? `${Math.round(windSpeed)} km/h` : "-- km/h");
    setText("#weather-status", `LIVE · ${source.toUpperCase()}`);
    setText("#hero-sky-status", Number.isFinite(cloudCover)
        ? `${description.toUpperCase()} · ${Math.round(cloudCover)}% CLOUD`
        : `${description.toUpperCase()} · CLOUD DATA UNAVAILABLE`);
    setText("#weather-updated", `Updated ${new Date(updatedAt).toLocaleString()}`);
    setText("#integration-weather-status", `LIVE · ${source.toUpperCase()}`);
    renderMapWeather(appState.location, current);

    const scoreData = calculateNightScore(current);
    const scoreElement = $("#honor-score");
    const ring = $("#score-ring");
    if (scoreData && scoreElement && ring) {
        const score = scoreData.score;
        scoreElement.textContent = String(score);
        ring.setAttribute("aria-label", `Observing conditions score ${score} out of 100`);
        ring.style.background = `conic-gradient(var(--gold) ${score * 3.6}deg, rgba(255,255,255,.08) ${score * 3.6}deg)`;
        setText("#dashboard-honor-score", `${score} / 100`);
        setText("#score-cloud-weight", `${scoreData.cloudPoints}/40`);
        setText("#score-visibility-weight", `${scoreData.visibilityPoints}/25`);
        setText("#score-humidity-weight", `${scoreData.humidityPoints}/10`);
        setText("#score-wind-weight", `${scoreData.windPoints}/10`);
        setText("#score-moon-weight", `${scoreData.moonPoints}/15`);
        setText("#score-light-pollution", "Map layer only");
        const interpretation = score >= 80 ? "Strong potential" :
            score >= 60 ? "Good potential" :
            score >= 40 ? "Mixed conditions" : "Poor conditions";
        setText("#score-status", interpretation.toUpperCase());
        setText("#score-explanation",
            `NOAA GFS weather via Open-Meteo: clouds ${scoreData.cloudPoints}/40, ` +
            `visibility ${scoreData.visibilityPoints}/25, humidity ` +
            `${scoreData.humidityPoints}/10, wind ${scoreData.windPoints}/10, ` +
            `and calculated moonlight ${scoreData.moonPoints}/15. VIIRS light ` +
            `imagery is not a point measurement and is excluded from the score.`);
    } else {
        setText("#honor-score", "--");
        setText("#dashboard-honor-score", "-- / 100");
        setText("#score-status", "NOT ENOUGH WEATHER DATA");
        setText("#score-explanation",
            "The provider did not return cloud cover, visibility, and humidity together, so no score is calculated.");
        setText("#score-cloud-weight", "Unavailable");
        setText("#score-visibility-weight", "Unavailable");
        setText("#score-humidity-weight", "Unavailable");
        setText("#score-wind-weight", "Unavailable");
        setText("#score-moon-weight", "Unavailable");
        setText("#score-light-pollution", "Unavailable");
        ring?.setAttribute("aria-label", "Observing conditions score unavailable because weather data is incomplete");
    }

    const scoreDisclaimer = $(".honor-score-card .data-disclaimer");
    if (scoreDisclaimer) {
        scoreDisclaimer.textContent =
            "Estimated from clouds (40), visibility (25), humidity (10), wind (10), " +
            "and calculated moonlight (15). Satellite night-light imagery is not scored.";
    }

    setText("#dashboard-cloud-outlook", Number.isFinite(cloudCover) ? `${Math.round(cloudCover)}% cloud` : "--");
    setText("#dashboard-moon-impact",
        `${getMoonPhase(new Date()).illumination}% illuminated; altitude unavailable`);
    setText("#dashboard-recommendation", scoreData?.score >= 60
        ? "Forecast conditions look promising for observing"
        : "Forecast conditions may make observing harder");
    setText("#condition-summary h4", "CURRENT LOCAL WEATHER");
    setText("#condition-summary p",
        `${description}; weather observations are current provider data, ` +
        `not a guarantee of sky quality.`);
    setText("#recommended-window", "Weather only; darkness is not calculated");
}

async function loadWeather() {
    if (!appState.location) return;
    appState.weatherController?.abort();
    appState.weatherController = new AbortController();
    const requestController = appState.weatherController;
    const requestedCoordinates = `${appState.location.latitude},${appState.location.longitude}`;
    setText("#weather-status", "LOADING");
    setText("#integration-weather-status", "CONNECTING");
    try {
        const query = new URLSearchParams({
            latitude: String(appState.location.latitude),
            longitude: String(appState.location.longitude)
        });
        const response = await apiRequest(`/api/weather?${query}`, {
            signal: requestController.signal
        });
        if (requestController.signal.aborted ||
            requestedCoordinates !== `${appState.location.latitude},${appState.location.longitude}`) return;
        if (!response.current) throw new Error("Weather provider returned no current conditions.");
        appState.weather = response.current;
        if (response.timezone) appState.location.timezone = response.timezone;
        saveData("tsukuyomi_location", appState.location);
        displaySelectedLocation(appState.location);
        appState.selectedCalendarDate = calendarDateInLocation(new Date());
        renderMoonCalendar(appState.selectedCalendarDate);
        const now = new Date();
        showMoonDetails(now, getMoonPhase(now));
        renderCountdowns();
        renderWeather(response.current, response.updatedAt, response.source);
        updateClock();
    } catch (error) {
        if (error.name === "AbortError") return;
        console.warn("Weather request failed:", error);
        setText("#weather-status", "UNAVAILABLE");
        setText("#integration-weather-status", "UNAVAILABLE");
        setText("#weather-condition", "Weather unavailable");
        setText("#weather-temperature", "--°C");
        setText("#cloud-cover", "--%");
        setText("#visibility", "-- km");
        setText("#humidity", "--%");
        setText("#wind-speed", "-- km/h");
        setText("#dashboard-cloud-outlook", "Unavailable");
        setText("#dashboard-recommendation", "No current weather data");
        setText("#condition-summary h4", "WEATHER UNAVAILABLE");
        setText("#condition-summary p", "The weather service could not return local data, so an observing score is unavailable.");
        setText("#score-status", "NO WEATHER DATA");
        setText("#score-explanation", error.message);
        setText("#honor-score", "--");
        setText("#dashboard-honor-score", "-- / 100");
        const ring = $("#score-ring");
        ring?.setAttribute("aria-label", "Night Honor Score unavailable because weather data could not be loaded");
        if (ring) ring.style.background = "conic-gradient(rgba(255,255,255,.08) 360deg, rgba(255,255,255,.08) 360deg)";
        setText("#hero-sky-status", "WEATHER UNAVAILABLE");
        setText("#weather-updated", "No current weather data");
        setText("#score-wind-weight", "Unavailable");
        setText("#score-moon-weight", "Unavailable");
        setText("#score-light-pollution", "Map layer only");
        appState.weather = null;
        renderMapWeather(appState.location, null);
        renderCountdowns();
    }
}

function updateClock() {
    const now = new Date();
    const timeZone = appState.location?.timezone;
    let time = formatTime(now);
    if (timeZone) {
        try {
            time = new Intl.DateTimeFormat(undefined, {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                timeZone
            }).format(now);
        } catch (error) {
            console.warn("Invalid location time zone:", error);
        }
    }
    setText("#local-clock", time);
    setText("#live-date", formatDate(now));
}

function phaseName(phase) {
    if (phase < 0.035 || phase >= 0.965) return "New Moon";
    if (phase < 0.215) return "Waxing Crescent";
    if (phase < 0.285) return "First Quarter";
    if (phase < 0.465) return "Waxing Gibbous";
    if (phase < 0.535) return "Full Moon";
    if (phase < 0.715) return "Waning Gibbous";
    if (phase < 0.785) return "Last Quarter";
    return "Waning Crescent";
}

function generateLunarEvents(from = new Date(), days = 90) {
    return window.TsukuyomiMath.generateLunarEvents(from, days);
}

function setCurrentMoon(date = new Date()) {
    const moon = getMoonPhase(date);
    setText("#current-moon-phase", moon.name);
    setText("#moon-phase-description",
        `Estimated illumination ${moon.illumination}% · lunar age ${moon.age.toFixed(1)} days. ` +
        "Approximate calculation, not an ephemeris.");
    setText("#moon-illumination", `${moon.illumination}%`);
    const fill = $("#illumination-fill");
    if (fill) fill.style.width = `${moon.illumination}%`;
    setText("#dashboard-moon-phase", `${moon.emoji} ${moon.name}`);
    setText("#hero-lunar-phase", `${moon.name} · ${moon.illumination}%`);
    const visual = $("#current-moon-visual");
    if (visual) visual.setAttribute("aria-label",
        `${moon.name}, approximately ${moon.illumination}% illuminated`);
    return moon;
}

function renderLunarEvents() {
    const type = $("#event-type-filter")?.value || "all";
    const search = ($("#event-search")?.value || "").trim().toLowerCase();
    const dateFilter = $("#event-date-filter")?.value || "";
    const monthFilter = $("#event-month-filter");
    const todayKey = dateKeyInLocation(new Date());
    const currentMonth = todayKey.slice(0, 7);
    const selectedMonth = monthFilter?.value || currentMonth;
    const monthParts = currentMonth.split("-").map(Number);
    const latestEventMonth = appState.events.reduce((latest, event) => {
        const timestamp = Date.parse(event.date);
        if (!Number.isFinite(timestamp)) return latest;
        const eventMonth = dateKeyInLocation(new Date(timestamp)).slice(0, 7);
        return eventMonth > latest ? eventMonth : latest;
    }, currentMonth);
    const dateFilterMonth = dateFilter ? dateFilter.slice(0, 7) : currentMonth;
    const lastMonth = [latestEventMonth, dateFilterMonth]
        .reduce((latest, month) => month > latest ? month : latest, currentMonth);
    const [lastYear, lastMonthNumber] = lastMonth.split("-").map(Number);
    const monthSpan = Math.min(120, Math.max(
        11,
        (lastYear - monthParts[0]) * 12 + lastMonthNumber - monthParts[1]
    ));

    if (monthFilter) {
        const months = [];
        for (let offset = 0; offset <= monthSpan; offset++) {
            const date = new Date(monthParts[0], monthParts[1] - 1 + offset, 1, 12);
            const value = dateKeyInLocation(date).slice(0, 7);
            const option = document.createElement("option");
            option.value = value;
            option.textContent = new Intl.DateTimeFormat(undefined, {
                month: "long",
                year: "numeric"
            }).format(date);
            months.push(option);
        }
        monthFilter.replaceChildren(...months);
        monthFilter.value = [...monthFilter.options].some(option => option.value === selectedMonth)
            ? selectedMonth
            : currentMonth;
    }

    const activeMonth = monthFilter?.value || currentMonth;
    const events = appState.events.filter(event => {
        const timestamp = Date.parse(event.date);
        if (!Number.isFinite(timestamp)) return false;
        const eventDate = new Date(timestamp);
        const eventDateKey = dateKeyInLocation(eventDate);
        const upcoming = event.dateOnly
            ? eventDateKey >= todayKey
            : timestamp >= Date.now();
        const monthMatches = eventDateKey.slice(0, 7) === activeMonth;
        const typeMatches = type === "all" || type === event.type;
        const searchMatches = !search ||
            `${event.title || ""} ${event.description || ""}`.toLowerCase().includes(search);
        const dateMatches = !dateFilter ||
            eventDateKey === dateFilter;
        return upcoming && monthMatches && typeMatches && searchMatches && dateMatches;
    });

    const body = $("#event-table-body");
    if (!body) return;
    body.replaceChildren();
    const monthLabel = monthFilter?.selectedOptions[0]?.textContent || activeMonth;
    setText("#event-count", `${events.length} UPCOMING ${events.length === 1 ? "EVENT" : "EVENTS"} · ${monthLabel.toUpperCase()}`);
    setText("#event-table-caption", `Upcoming astronomy events for ${monthLabel}`);
    setText("#dashboard-event-count", String(appState.events.length));

    if (!events.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.className = "event-table-empty";
        cell.textContent = dateFilter
            ? "No upcoming events on this date match the selected filters."
            : `No upcoming events for ${monthLabel}. Choose another month or adjust the event filters.`;
        row.appendChild(cell);
        body.appendChild(row);
        return;
    }

    events.forEach(event => {
        const date = new Date(event.date);
        const row = document.createElement("tr");
        const typeLabels = {
            moon: "MOON PHASE · APPROXIMATE",
            meteor: "METEOR SHOWER · ESTIMATED PEAK",
            launch: `ROCKET LAUNCH · ${event.status || "SCHEDULED NET"}`,
            neo: "NASA/JPL CLOSE APPROACH"
        };
        const cell = (label, className = "") => {
            const element = document.createElement("td");
            element.dataset.label = label;
            if (className) element.className = className;
            return element;
        };
        const dateCell = cell("Date / time", "event-table-date");
        dateCell.textContent = formatAstronomyDate(date, !event.dateOnly);
        const titleCell = cell("Event", "event-table-title");
        titleCell.textContent = event.title;
        const typeCell = cell("Type");
        typeCell.appendChild(document.createTextNode(typeLabels[event.type] || "ASTRONOMY EVENT"));
        const detailCell = cell("Details", "event-table-details");
        detailCell.textContent = event.description;
        const sourceCell = cell("Source", "event-table-source");
        if (event.sourceUrl) {
            const source = document.createElement("a");
            source.href = event.sourceUrl;
            source.target = "_blank";
            source.rel = "noopener noreferrer";
            source.textContent = `${event.source || "Source"} ↗`;
            sourceCell.appendChild(source);
        } else {
            sourceCell.textContent = event.source || "Local calculation";
        }

        const reminder = document.createElement("button");
        reminder.type = "button";
        reminder.className = "secondary-button";
        reminder.textContent = "REMIND ME";
        const actionCell = cell("Action");
        actionCell.appendChild(reminder);
        reminder.addEventListener("click", () => openReminderDialog(event));
        row.append(dateCell, titleCell, typeCell, detailCell, sourceCell, actionCell);
        body.appendChild(row);
    });
}

function formatAstronomyDate(date, includeTime = true) {
    const options = {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(includeTime ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : {})
    };
    try {
        if (appState.location?.timezone) options.timeZone = appState.location.timezone;
        return new Intl.DateTimeFormat(undefined, options).format(date);
    } catch (error) {
        console.warn("Could not format event time in the selected location timezone:", error);
        return includeTime ? `${formatDate(date)} ${formatTime(date)}` : formatDate(date);
    }
}

function countdownText(date, dateOnly = false) {
    const target = date instanceof Date ? date.getTime() : Date.parse(date);
    if (!Number.isFinite(target)) return "TIME UNAVAILABLE";
    const remaining = target - Date.now();
    if (dateOnly) {
        const days = Math.max(0, Math.ceil(remaining / 86400000));
        return days === 0 ? "PEAK DATE · TODAY" : `~${days} DAY${days === 1 ? "" : "S"} TO PEAK`;
    }
    if (remaining <= 0) return "EVENT TIME REACHED";
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${String(hours).padStart(2, "0")}h ` +
        `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function createCountdownCard({ kind, title, date, detail, source, sourceUrl, dateOnly = false }) {
    const card = document.createElement("article");
    card.className = `sky-countdown-card ${kind}-countdown-card`;
    const kicker = document.createElement("span");
    kicker.className = "panel-kicker";
    kicker.textContent = kind === "moon" ? "LUNAR PHASE · APPROXIMATE" :
        kind === "meteor" ? "METEOR SHOWER · ESTIMATED PEAK NIGHT" :
            "NASA/JPL · NEAR-EARTH OBJECT";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const countdown = document.createElement("strong");
    countdown.className = "countdown-clock";
    countdown.dataset.target = date instanceof Date ? date.toISOString() : date;
    countdown.dataset.dateOnly = String(dateOnly);
    countdown.textContent = countdownText(date, dateOnly);
    const dateLine = document.createElement("p");
    const parsedDate = date instanceof Date ? date : new Date(date);
    dateLine.textContent = `Local time: ${formatAstronomyDate(parsedDate, !dateOnly)}`;
    const description = document.createElement("p");
    description.className = "countdown-detail";
    description.textContent = detail;
    card.append(kicker, heading, countdown, dateLine, description);
    if (sourceUrl) {
        const sourceLink = document.createElement("a");
        sourceLink.href = sourceUrl;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = `${source} ↗`;
        card.appendChild(sourceLink);
    } else {
        const sourceLabel = document.createElement("small");
        sourceLabel.textContent = source;
        card.appendChild(sourceLabel);
    }
    const reminder = document.createElement("button");
    reminder.type = "button";
    reminder.className = "text-button countdown-reminder-button";
    reminder.textContent = "SET REMINDER";
    reminder.addEventListener("click", () => openReminderDialog({
        title: heading.textContent,
        type: kind === "meteor" ? "meteor" : kind === "neo" ? "custom" : "moon",
        date: parsedDate.toISOString()
    }));
    card.appendChild(reminder);
    return card;
}

function renderCountdowns() {
    const grid = $("#sky-countdown-grid");
    if (!grid) return;
    const nextMoon = appState.events.find(event =>
        event.type === "moon" && Date.parse(event.date) > Date.now());
    const nextMeteor = appState.events.find(event =>
        event.type === "meteor" && Date.parse(event.date) > Date.now());
    const nextNeo = appState.neoApproaches.find(event =>
        Date.parse(event.date) > Date.now());
    grid.replaceChildren();

    if (nextMoon) {
        grid.appendChild(createCountdownCard({
            kind: "moon",
            title: nextMoon.title,
            date: nextMoon.date,
            detail: nextMoon.description,
            source: "Approximate local lunar model"
        }));
    }
    if (nextMeteor) {
        grid.appendChild(createCountdownCard({
            kind: "meteor",
            title: nextMeteor.title,
            date: nextMeteor.date,
            dateOnly: true,
            detail: nextMeteor.description,
            source: "American Meteor Society",
            sourceUrl: nextMeteor.sourceUrl
        }));
    }
    if (nextNeo) {
        const missDistance = Number(nextNeo.missDistanceKm);
        grid.appendChild(createCountdownCard({
            kind: "neo",
            title: nextNeo.name,
            date: nextNeo.date,
            detail: `Earth close approach; ${Number.isFinite(missDistance)
                ? `${Math.round(missDistance).toLocaleString()} km nominal miss distance. `
                : ""}This is not a prediction of naked-eye visibility.`,
            source: "NASA/JPL CNEOS",
            sourceUrl: nextNeo.sourceUrl
        }));
    } else if (appState.countdownErrors.neo) {
        grid.appendChild(createCountdownCardUnavailable("NASA/JPL close approaches",
            appState.countdownErrors.neo));
    }

    const moonStart = appState.events.find(event => event.type === "moon");
    const meteorStart = appState.events.find(event => event.type === "meteor");
    if (!nextMoon && moonStart) {
        grid.appendChild(createCountdownCard({
            kind: "moon",
            title: moonStart.title,
            date: moonStart.date,
            detail: moonStart.description,
            source: "Approximate local lunar model"
        }));
    }
    if (!nextMeteor && meteorStart) {
        grid.appendChild(createCountdownCard({
            kind: "meteor",
            title: meteorStart.title,
            date: meteorStart.date,
            dateOnly: true,
            detail: meteorStart.description,
            source: "American Meteor Society",
            sourceUrl: meteorStart.sourceUrl
        }));
    }

    const launchList = $("#rocket-launch-countdowns");
    if (!launchList) return;
    launchList.replaceChildren();
    const upcomingLaunches = appState.launches.filter(launch =>
        Date.parse(launch.net) > Date.now()).slice(0, 5);
    if (!upcomingLaunches.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = appState.countdownErrors.launches
            ? `Launch schedule unavailable: ${appState.countdownErrors.launches}`
            : "No future launch NETs are currently listed by the launch feed.";
        launchList.appendChild(empty);
        return;
    }
    upcomingLaunches.forEach(launch => {
        const row = document.createElement("article");
        row.className = "rocket-launch-card";
        const details = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = launch.name;
        const mission = document.createElement("p");
        mission.textContent = [
            launch.provider,
            launch.location,
            launch.mission && launch.mission !== launch.name ? launch.mission : ""
        ].filter(Boolean).join(" · ");
        const time = document.createElement("p");
        time.className = "launch-net";
        time.textContent = `NET ${formatAstronomyDate(new Date(launch.net))} · ${launch.precision} precision`;
        const status = document.createElement("span");
        status.className = "launch-status";
        status.textContent = launch.status;
        details.append(title, mission, time, status);
        const countdown = document.createElement("strong");
        countdown.className = "countdown-clock launch-clock";
        countdown.dataset.target = launch.net;
        countdown.textContent = countdownText(launch.net);
        const actions = document.createElement("div");
        actions.className = "launch-actions";
        const source = document.createElement("a");
        source.href = launch.sourceUrl;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        source.textContent = "SOURCE ↗";
        const reminder = document.createElement("button");
        reminder.type = "button";
        reminder.className = "text-button";
        reminder.textContent = "SET REMINDER";
        reminder.addEventListener("click", () => openReminderDialog({
            title: `Launch: ${launch.name}`,
            type: "launch",
            date: launch.net,
            dateTime: launch.net
        }));
        actions.append(source, reminder);
        row.append(details, countdown, actions);
        launchList.appendChild(row);
    });
}

function updateCountdownClocks() {
    $$(".countdown-clock").forEach(element => {
        element.textContent = countdownText(
            element.dataset.target,
            element.dataset.dateOnly === "true"
        );
    });
}

function createCountdownCardUnavailable(title, error) {
    const card = document.createElement("article");
    card.className = "sky-countdown-card unavailable-countdown-card";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const detail = document.createElement("p");
    detail.textContent = `Feed unavailable: ${error}`;
    card.append(heading, detail);
    return card;
}

async function loadCountdownData() {
    const grid = $("#sky-countdown-grid");
    if (grid && !grid.children.length) {
        grid.innerHTML = '<p class="empty-state glass-panel">Loading sourced sky events…</p>';
    }
    const [launchResult, neoResult] = await Promise.allSettled([
        apiRequest("/api/launches/upcoming"),
        apiRequest("/api/nasa/neo")
    ]);

    if (launchResult.status === "fulfilled") {
        appState.launches = launchResult.value.launches || [];
        appState.countdownErrors.launches = "";
        appState.events = appState.events.filter(event => event.type !== "launch");
        appState.launches.forEach(launch => {
            appState.events.push({
                id: launch.id,
                title: launch.name,
                type: "launch",
                date: launch.net,
                description: `${launch.status} · ${launch.provider} · ${launch.location}. Launch schedules can change.`,
                status: launch.status,
                source: "The Space Devs Launch Library 2",
                sourceUrl: launch.sourceUrl,
                approximate: false
            });
        });
    } else {
        appState.countdownErrors.launches = launchResult.reason.message;
    }
    if (neoResult.status === "fulfilled") {
        appState.neoApproaches = neoResult.value.approaches || [];
        appState.countdownErrors.neo = "";
        appState.events = appState.events.filter(event => event.type !== "neo");
        appState.neoApproaches.forEach(approach => {
            appState.events.push({
                id: approach.id,
                title: approach.name,
                type: "neo",
                date: approach.date,
                description: `NASA/JPL predicted close approach to ${approach.orbitingBody}. This is not a visibility forecast.`,
                source: "NASA/JPL CNEOS NeoWs",
                sourceUrl: approach.sourceUrl,
                approximate: false
            });
        });
    } else {
        appState.countdownErrors.neo = neoResult.reason.message;
    }
    appState.events.sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    renderLunarEvents();
    renderCountdowns();
}

function initLunarCalendar() {
    appState.selectedCalendarDate = calendarDateInLocation(new Date());
    appState.events = [
        ...generateLunarEvents(new Date(), 370),
        ...window.TsukuyomiMath.generateMeteorShowerEvents(new Date(), 370)
    ];
    setCurrentMoon();
    const nextFullMoon = appState.events.find(event => event.title === "Full Moon");
    const nextNewMoon = appState.events.find(event => event.title === "New Moon");
    setText("#next-full-moon", nextFullMoon
        ? formatAstronomyDate(new Date(nextFullMoon.date)) : "Unavailable");
    setText("#next-new-moon", nextNewMoon
        ? formatAstronomyDate(new Date(nextNewMoon.date)) : "Unavailable");
    setText("#moonrise-time", "Not calculated");
    setText("#moonset-time", "Not calculated");
    renderMoonCalendar(appState.selectedCalendarDate);
    showMoonDetails(new Date(), getMoonPhase(new Date()));
    renderLunarEvents();

    $("#calendar-prev")?.addEventListener("click", () => {
        const date = appState.selectedCalendarDate;
        appState.selectedCalendarDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        renderMoonCalendar(appState.selectedCalendarDate);
    });
    $("#calendar-next")?.addEventListener("click", () => {
        const date = appState.selectedCalendarDate;
        appState.selectedCalendarDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        renderMoonCalendar(appState.selectedCalendarDate);
    });
    $("#calendar-today-btn")?.addEventListener("click", () => {
        appState.selectedCalendarDate = calendarDateInLocation(new Date());
        renderMoonCalendar(appState.selectedCalendarDate);
        const now = new Date();
        showMoonDetails(now, getMoonPhase(now));
    });
    $("#calendar-grid")?.addEventListener("click", event => {
        const cell = event.target.closest(".calendar-day:not(.calendar-day-empty)");
        if (!cell) return;
        $$(".calendar-day.selected", $("#calendar-grid")).forEach(item => item.classList.remove("selected"));
        cell.classList.add("selected");
        $$(".calendar-day", $("#calendar-grid")).forEach(item =>
            item.setAttribute("aria-pressed", String(item === cell)));
        const day = Number($(".calendar-date", cell)?.textContent);
        const selected = new Date(
            appState.selectedCalendarDate.getFullYear(),
            appState.selectedCalendarDate.getMonth(),
            day,
            12
        );
        appState.selectedCalendarDate = selected;
        const astronomyInstant = astronomyInstantInLocation(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
            12
        );
        showMoonDetails(astronomyInstant, getMoonPhase(astronomyInstant));
        const dateFilter = $("#event-date-filter");
        if (dateFilter) {
            dateFilter.value = dateKeyInLocation(astronomyInstant);
            const monthFilter = $("#event-month-filter");
            if (monthFilter) monthFilter.value = dateFilter.value.slice(0, 7);
            renderLunarEvents();
        }
    });
    $("#refresh-countdowns")?.addEventListener("click", loadCountdownData);
    ["#event-search", "#event-type-filter"].forEach(selector => {
        $(selector)?.addEventListener("input", renderLunarEvents);
        $(selector)?.addEventListener("change", renderLunarEvents);
    });
    $("#event-date-filter")?.addEventListener("input", renderLunarEvents);
    $("#event-month-filter")?.addEventListener("change", event => {
        $("#event-date-filter").value = "";
        renderLunarEvents();
    });
    $("#event-date-filter")?.addEventListener("change", event => {
        const monthFilter = $("#event-month-filter");
        if (monthFilter && event.currentTarget.value) {
            monthFilter.value = event.currentTarget.value.slice(0, 7);
        }
        renderLunarEvents();
    });
    $("#reset-event-filters")?.addEventListener("click", () => {
        $("#event-type-filter").value = "all";
        $("#event-date-filter").value = "";
        $("#event-search").value = "";
        const monthFilter = $("#event-month-filter");
        if (monthFilter) monthFilter.value = dateKeyInLocation(new Date()).slice(0, 7);
        renderLunarEvents();
    });
}

function observationFilters() {
    const search = ($("#observation-search")?.value || "").trim().toLowerCase();
    const date = $("#observation-date-filter")?.value || "";
    return appState.observations.filter(item => {
        const text = `${item.title} ${item.object || ""} ${item.location || ""} ${item.notes || ""}`.toLowerCase();
        return (!search || text.includes(search)) && (!date || item.date === date);
    });
}

function renderObservations() {
    const list = $("#observation-list");
    if (!list) return;
    const observations = observationFilters();
    list.replaceChildren();

    if (!observations.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = appState.observations.length
            ? "No observations match the current search."
            : "Your journal is ready for its first observation.";
        list.appendChild(empty);
        return;
    }

    observations.forEach(item => {
        const card = document.createElement("article");
        card.className = "observation-card";
        const details = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = item.title;
        const summary = document.createElement("p");
        summary.textContent = [
            item.object || "Sky observation",
            item.date ? formatDate(new Date(`${item.date}T12:00:00`)) : "",
            item.location || ""
        ].filter(Boolean).join(" · ");
        const notes = document.createElement("p");
        notes.textContent = [item.conditions, item.notes].filter(Boolean).join(" — ");
        details.append(title, summary, notes);

        const actions = document.createElement("div");
        actions.className = "record-actions";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "text-button";
        edit.textContent = "EDIT";
        edit.addEventListener("click", () => editObservation(item));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "text-button";
        remove.textContent = "DELETE";
        remove.addEventListener("click", () => deleteObservation(item));
        actions.append(edit, remove);
        card.append(details, actions);
        list.appendChild(card);
    });
}

function editObservation(item) {
    const form = $("#observation-form");
    if (!form) return;
    $("#observation-id").value = item.id;
    $("#observation-title").value = item.title || "";
    $("#observation-object").value = item.object || "";
    $("#observation-date").value = item.date || "";
    $("#observation-location").value = item.location || "";
    $("#observation-conditions").value = item.conditions || "";
    $("#observation-notes").value = item.notes || "";
    $("#save-observation-button").textContent = "UPDATE JOURNAL ENTRY";
    $("#cancel-observation-edit").hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#observation-title").focus();
}

function resetObservationForm() {
    const form = $("#observation-form");
    form?.reset();
    $("#observation-id").value = "";
    $("#observation-date").value = dateInputValue(new Date());
    $("#save-observation-button").textContent = "SAVE JOURNAL ENTRY";
    $("#cancel-observation-edit").hidden = true;
}

async function deleteObservation(item) {
    if (!window.confirm(`Delete “${item.title}” from this local journal?`)) return;
    try {
        await apiRequest(`/api/observations/${encodeURIComponent(item.id)}`, { method: "DELETE" });
        appState.observations = appState.observations.filter(entry => entry.id !== item.id);
        renderObservations();
        renderActivity();
        notify("Observation deleted.", "success");
    } catch (error) {
        notify(error.message, "error");
    }
}

async function submitObservation(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const body = Object.fromEntries(new FormData(form).entries());
    delete body.id;
    const id = $("#observation-id").value;
    try {
        const saved = await apiRequest(
            id ? `/api/observations/${encodeURIComponent(id)}` : "/api/observations",
            { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }
        );
        if (id) {
            appState.observations = appState.observations.map(item => item.id === id ? saved : item);
        } else {
            appState.observations.unshift(saved);
        }
        resetObservationForm();
        renderObservations();
        renderActivity();
        notify(id ? "Observation updated." : "Observation saved.", "success");
    } catch (error) {
        notify(error.message, "error");
    }
}

function downloadData(filename, content, type) {
    const objectUrl = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function exportObservationsJson() {
    downloadData("tsukuyomi-observations.json",
        JSON.stringify(appState.observations, null, 2),
        "application/json");
}

function exportObservationsCsv() {
    const fields = ["title", "object", "date", "location", "conditions", "notes"];
    const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
        fields.map(quote).join(","),
        ...appState.observations.map(item => fields.map(field => quote(item[field])).join(","))
    ];
    downloadData("tsukuyomi-observations.csv", rows.join("\r\n"), "text/csv;charset=utf-8");
}

async function loadObservations() {
    try {
        appState.observations = await apiRequest("/api/observations");
        renderObservations();
        renderActivity();
    } catch (error) {
        console.warn("Could not load observations:", error);
        setText("#observation-list", `Journal unavailable: ${error.message}`);
    }
}

function renderReminders() {
    const list = $("#reminders-list");
    if (!list) return;
    const future = appState.reminders
        .filter(item => Date.parse(item.dateTime) > Date.now())
        .sort((left, right) => Date.parse(left.dateTime) - Date.parse(right.dateTime));
    list.replaceChildren();

    if (!future.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = appState.reminders.length
            ? "No upcoming reminders. Past reminders remain stored."
            : "No reminders saved yet.";
        list.appendChild(empty);
    }

    future.forEach(item => {
        const card = document.createElement("article");
        card.className = "alert-card";
        const content = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = item.title;
        const date = document.createElement("p");
        date.textContent = new Date(item.dateTime).toLocaleString();
        const type = document.createElement("small");
        type.textContent = item.type || "Astronomy";
        content.append(title, date, type);
        const actions = document.createElement("div");
        actions.className = "record-actions";
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "text-button";
        edit.textContent = "EDIT";
        edit.addEventListener("click", () => editReminder(item));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "text-button";
        remove.textContent = "DELETE";
        remove.addEventListener("click", () => deleteReminder(item));
        actions.append(edit, remove);
        card.append(content, actions);
        list.appendChild(card);
    });
}

function localDateTimeValue(value) {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
}

function openReminderDialog(event = null) {
    const dialog = $("#alert-dialog");
    const form = $("#alert-form");
    if (!dialog || !form) return;

    appState.reminderEditId = event?.recordId || null;
    $("#alert-title").value = event?.title || "";
    $("#alert-event-type").value = event?.type || "custom";
    const initialDate = event?.recordId
        ? new Date(event.dateTime)
        : event?.date
            ? new Date(Date.parse(event.date) - 60 * 60 * 1000)
            : new Date(Date.now() + 60 * 60 * 1000);
    $("#alert-datetime").value = localDateTimeValue(initialDate);
    $("#alert-form button[type='submit']").textContent =
        appState.reminderEditId ? "UPDATE ALERT" : "SAVE ALERT";
    if (!dialog.open) dialog.showModal();
    $("#alert-title").focus();
}

function editReminder(item) {
    openReminderDialog({ ...item, recordId: item.id });
}

async function deleteReminder(item) {
    if (!window.confirm(`Delete reminder “${item.title}”?`)) return;
    try {
        await apiRequest(`/api/reminders/${encodeURIComponent(item.id)}`, { method: "DELETE" });
        appState.reminders = appState.reminders.filter(reminder => reminder.id !== item.id);
        appState.notifiedReminders.delete(item.id);
        renderReminders();
        renderActivity();
        notify("Reminder deleted.", "success");
    } catch (error) {
        notify(error.message, "error");
    }
}

async function submitReminder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const localDate = $("#alert-datetime").value;
    const dateTime = new Date(localDate).toISOString();
    if (Date.parse(dateTime) <= Date.now()) {
        notify("Choose a reminder time in the future.", "error");
        return;
    }
    const shouldNotify = $("#alert-notification-enabled").checked;

    if (shouldNotify && "Notification" in window && Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch (error) {
            console.warn("Notification permission was not granted:", error);
        }
    }

    const body = {
        title: $("#alert-title").value.trim(),
        type: $("#alert-event-type").value,
        dateTime,
        notify: shouldNotify && "Notification" in window && Notification.permission === "granted"
    };

    try {
        const id = appState.reminderEditId;
        const saved = await apiRequest(
            id ? `/api/reminders/${encodeURIComponent(id)}` : "/api/reminders",
            { method: id ? "PATCH" : "POST", body: JSON.stringify(body) }
        );
        if (id) {
            appState.reminders = appState.reminders.map(item => item.id === id ? saved : item);
        } else {
            appState.reminders.unshift(saved);
        }
        appState.reminderEditId = null;
        form.reset();
        $("#alert-dialog").close();
        renderReminders();
        renderActivity();
        notify("Reminder saved. It will only alert while this page remains open.", "success");
    } catch (error) {
        notify(error.message, "error");
    }
}

function checkDueReminders() {
    const now = Date.now();
    appState.reminders.forEach(reminder => {
        const due = Date.parse(reminder.dateTime);
        if (!reminder.notify || appState.notifiedReminders.has(reminder.id) ||
            due > now || due < now - 60_000) return;
        appState.notifiedReminders.add(reminder.id);
        try {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Tsukuyomi Watch reminder", { body: reminder.title });
            } else {
                notify(`Reminder: ${reminder.title}`, "info");
            }
        } catch (error) {
            console.warn("Could not display reminder notification:", error);
            notify(`Reminder: ${reminder.title}`, "info");
        }
    });
}

async function loadReminders() {
    try {
        appState.reminders = await apiRequest("/api/reminders");
        renderReminders();
        renderActivity();
    } catch (error) {
        console.warn("Could not load reminders:", error);
        setText("#reminders-list", `Reminders unavailable: ${error.message}`);
    }
}

function renderActivity() {
    const list = $("#activity-list");
    if (!list) return;
    const entries = [
        ...appState.observations.map(item => ({
            label: "OBSERVATION", title: item.title, date: item.createdAt || item.date
        })),
        ...appState.reminders.map(item => ({
            label: "REMINDER", title: item.title, date: item.createdAt || item.dateTime
        }))
    ].sort((left, right) => Date.parse(right.date) - Date.parse(left.date)).slice(0, 5);
    list.replaceChildren();
    if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "activity-empty-state";
        empty.textContent = "Your observations and reminders will appear here.";
        list.appendChild(empty);
        return;
    }
    entries.forEach(item => {
        const entry = document.createElement("div");
        entry.className = "activity-entry";
        const label = document.createElement("span");
        label.textContent = item.label;
        const title = document.createElement("strong");
        title.textContent = item.title;
        const date = document.createElement("small");
        date.textContent = Number.isNaN(Date.parse(item.date))
            ? ""
            : new Date(item.date).toLocaleString();
        entry.append(label, title, date);
        list.appendChild(entry);
    });
}

async function loadStoredRecords() {
    try {
        const [observations, reminders] = await Promise.all([
            apiRequest("/api/observations"),
            apiRequest("/api/reminders")
        ]);
        appState.observations = observations;
        appState.reminders = reminders;
        await migrateLegacyRecords();
        renderObservations();
        renderReminders();
        renderActivity();
    } catch (error) {
        console.warn("Could not load local records:", error);
        setText("#observation-list", `Journal unavailable: ${error.message}`);
        setText("#reminders-list", `Reminders unavailable: ${error.message}`);
    }
}

async function migrateLegacyRecords() {
    if (readStoredData("tsukuyomi_records_migrated", false)) return;
    const oldObservations = Array.isArray(Tsukuyomi.observations)
        ? Tsukuyomi.observations : [];
    const oldReminders = Array.isArray(Tsukuyomi.alerts)
        ? Tsukuyomi.alerts : [];

    try {
        if (!appState.observations.length) {
            for (const old of oldObservations) {
                const parsedDate = new Date(old.date || old.createdAt || Date.now());
                if (!old.title || Number.isNaN(parsedDate.getTime())) continue;
                const migrated = await apiRequest("/api/observations", {
                    method: "POST",
                    body: JSON.stringify({
                        title: String(old.title),
                        object: String(old.object || ""),
                        date: dateInputValue(parsedDate),
                        location: String(old.location || ""),
                        conditions: String(old.conditions || ""),
                        notes: String(old.notes || "")
                    })
                });
                appState.observations.push(migrated);
            }
        }

        if (!appState.reminders.length) {
            for (const old of oldReminders) {
                const parsedTime = Date.parse(old.dateTime || old.date || "");
                if (!old.title || !Number.isFinite(parsedTime) || parsedTime <= Date.now()) continue;
                const migrated = await apiRequest("/api/reminders", {
                    method: "POST",
                    body: JSON.stringify({
                        title: String(old.title),
                        type: String(old.type || "custom"),
                        dateTime: new Date(parsedTime).toISOString(),
                        notify: false
                    })
                });
                appState.reminders.push(migrated);
            }
        }
        saveData("tsukuyomi_records_migrated", true);
    } catch (error) {
        console.warn("Could not migrate earlier local records:", error);
    }
}

function initJournalAndReminders() {
    const observationDate = $("#observation-date");
    if (observationDate) observationDate.value = dateInputValue(new Date());
    $("#observation-form")?.addEventListener("submit", submitObservation);
    $("#observation-search")?.addEventListener("input", renderObservations);
    $("#observation-date-filter")?.addEventListener("change", renderObservations);
    $("#cancel-observation-edit")?.addEventListener("click", resetObservationForm);
    $("#export-observations-json")?.addEventListener("click", exportObservationsJson);
    $("#export-observations-csv")?.addEventListener("click", exportObservationsCsv);

    $("#create-alert-btn")?.addEventListener("click", () => openReminderDialog());
    $("#alert-form")?.addEventListener("submit", submitReminder);
    $$("[data-close-dialog]").forEach(button => {
        button.addEventListener("click", () => {
            const dialog = document.getElementById(button.dataset.closeDialog);
            dialog?.close();
            appState.reminderEditId = null;
        });
    });
    $("#alert-dialog")?.addEventListener("click", event => {
        if (event.target === event.currentTarget) event.currentTarget.close();
    });
    $("#export-reminders-json")?.addEventListener("click", () => {
        downloadData("tsukuyomi-reminders.json",
            JSON.stringify(appState.reminders, null, 2),
            "application/json");
    });
    loadStoredRecords();
    window.setInterval(checkDueReminders, 30_000);
}

async function searchNasaImages(query) {
    const status = $("#image-search-status");
    const resultsContainer = $("#image-search-results");
    status.textContent = "Searching NASA's public image catalogue…";
    resultsContainer.replaceChildren();

    try {
        const results = await apiRequest(`/api/images/search?q=${encodeURIComponent(query)}`);
        appState.images = results;
        if (!results.length) {
            status.textContent = "No NASA image results were found for that query.";
            renderGlobalSearch();
            return;
        }

        status.textContent = `${results.length} results from the NASA Image and Video Library.`;
        results.forEach(item => {
            const card = document.createElement("article");
            card.className = "image-result-card";
            const imageLink = document.createElement("a");
            imageLink.href = item.sourceUrl;
            imageLink.target = "_blank";
            imageLink.rel = "noopener noreferrer";
            imageLink.setAttribute("aria-label", `Open NASA source for ${item.title}`);
            const image = document.createElement("img");
            image.src = item.imageUrl;
            image.alt = item.title;
            image.loading = "lazy";
            image.decoding = "async";
            imageLink.appendChild(image);

            const details = document.createElement("div");
            details.className = "image-result-copy";
            const title = document.createElement("h4");
            title.textContent = item.title;
            const date = document.createElement("p");
            date.textContent = item.date
                ? `Image date: ${new Date(item.date).toLocaleDateString()}`
                : "Image date not supplied";
            const description = document.createElement("p");
            description.textContent = item.description || "No description supplied by NASA.";
            const source = document.createElement("a");
            source.href = item.sourceUrl;
            source.target = "_blank";
            source.rel = "noopener noreferrer";
            source.textContent = "NASA source and credits ↗";
            details.append(title, date, description, source);
            card.append(imageLink, details);
            resultsContainer.appendChild(card);
        });
        renderGlobalSearch();
    } catch (error) {
        console.warn("NASA image search failed:", error);
        status.textContent = `Image search unavailable: ${error.message}`;
    }
}

function initImageExplorer() {
    $("#image-search-form")?.addEventListener("submit", event => {
        event.preventDefault();
        const query = $("#image-search-input").value.trim();
        if (query.length < 2) {
            notify("Enter at least two characters to search NASA's image archive.", "error");
            return;
        }
        searchNasaImages(query);
    });

    const fileInput = $("#astronomy-image-input");
    const uploadZone = $("#upload-zone");
    const restoreButton = $("#restore-image-btn");

    function updateZoom() {
        const image = $("#original-image");
        if (image) image.style.transform = `scale(${appState.imageZoom})`;
        setText("#zoom-level", `${Math.round(appState.imageZoom * 100)}%`);
    }

    async function previewImage(file) {
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            notify("Choose a PNG, JPEG, or WebP image.", "error");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            notify("Images must be 10 MB or smaller.", "error");
            return;
        }

        const candidateUrl = URL.createObjectURL(file);
        const image = new Image();
        image.src = candidateUrl;
        try {
            await image.decode();
        } catch {
            URL.revokeObjectURL(candidateUrl);
            notify("The selected file could not be decoded as an image.", "error");
            return;
        }

        if (appState.imageObjectUrl) URL.revokeObjectURL(appState.imageObjectUrl);
        appState.imageObjectUrl = candidateUrl;
        appState.imageZoom = 1;
        updateZoom();
        const original = $("#original-image");
        if (original) {
            original.src = candidateUrl;
            original.alt = `Local preview of ${file.name}`;
        }
        $("#restored-image")?.removeAttribute("src");
        $("#comparison-empty-state").hidden = true;
        $("#comparison-image-stage").hidden = false;
        $("#restored-image-clip").hidden = true;
        $("#comparison-divider").hidden = true;
        $("#comparison-slider").hidden = true;
        setText("#processing-status", "LOCAL PREVIEW ONLY · NO PROCESSOR CONFIGURED");
        setText("#processing-title", "IMAGE PREVIEW READY");
        setText("#processing-description",
            "The image remains in your browser. No AI processing or object detection was performed.");
        setText("#result-noise-level", "Not measured");
        setText("#result-sharpness", "Not measured");
        setText("#result-object-count", "Not analyzed");
        if (restoreButton) {
            restoreButton.disabled = true;
            restoreButton.textContent = "PROCESSOR NOT CONFIGURED";
        }
        notify("Local image preview ready. No file was uploaded or modified.", "success");
    }

    fileInput?.addEventListener("change", () => previewImage(fileInput.files?.[0]));
    uploadZone?.addEventListener("click", event => {
        if (event.target !== fileInput) fileInput?.click();
    });
    uploadZone?.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInput?.click();
        }
    });
    uploadZone?.addEventListener("dragover", event => {
        event.preventDefault();
        uploadZone.classList.add("drag-over");
    });
    uploadZone?.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
    uploadZone?.addEventListener("drop", event => {
        event.preventDefault();
        uploadZone.classList.remove("drag-over");
        previewImage(event.dataTransfer?.files?.[0]);
    });
    $("#restoration-form")?.addEventListener("submit", event => {
        event.preventDefault();
        notify("No restoration service is configured. The local preview remains unchanged.", "error");
    });
    $("#restoration-strength")?.addEventListener("input", event => {
        setText("#restoration-strength-value", `${event.currentTarget.value}%`);
    });
    $("#zoom-in-btn")?.addEventListener("click", () => {
        appState.imageZoom = Math.min(3, appState.imageZoom + 0.25);
        updateZoom();
    });
    $("#zoom-out-btn")?.addEventListener("click", () => {
        appState.imageZoom = Math.max(1, appState.imageZoom - 0.25);
        updateZoom();
    });
    $("#reset-zoom-btn")?.addEventListener("click", () => {
        appState.imageZoom = 1;
        updateZoom();
    });
    window.addEventListener("pagehide", () => {
        if (appState.imageObjectUrl) URL.revokeObjectURL(appState.imageObjectUrl);
    }, { once: true });

    setText("#integration-ai-status", "NOT CONFIGURED");
    setText("#integration-detection-status", "NOT CONFIGURED");
    setText("#integration-telescope-status", "NASA IMAGE SEARCH AVAILABLE");
}

function globalSearchEntries(query) {
    const normalized = query.trim().toLowerCase();
    const entries = [
        { title: "Mission overview", detail: "Application section", target: "#home", group: "Sections" },
        { title: "Watchtower and weather", detail: "Location and local forecast", target: "#watchtower", group: "Sections" },
        { title: "Lunar calendar and events", detail: "Approximate calculated lunar phases", target: "#events", group: "Sections" },
        { title: "NASA image archive", detail: "Search and view NASA image records", target: "#spirit-lens", group: "Sections" },
        { title: "Observation journal", detail: "Private local records", target: "#journal", group: "Sections" },
        ...appState.events.map(item => ({
            title: item.title,
            detail: `${formatDate(new Date(item.date))} · approximate lunar phase`,
            target: "#events",
            group: "Calculated lunar phases"
        })),
        ...appState.observations.map(item => ({
            title: item.title,
            detail: `${item.object || "Observation"} · ${item.date || ""}`,
            target: "#journal",
            group: "Your observations"
        })),
        ...appState.images.map(item => ({
            title: item.title,
            detail: "NASA image search result",
            target: "#spirit-lens",
            group: "Loaded NASA images"
        }))
    ];
    return normalized
        ? entries.filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(normalized))
        : entries.slice(0, 6);
}

function renderGlobalSearch() {
    const container = $("#global-search-results");
    const query = $("#global-search-input")?.value || "";
    if (!container) return;
    const entries = globalSearchEntries(query);
    container.replaceChildren();
    appState.globalSearchIndex = -1;
    $("#global-search-input")?.removeAttribute("aria-activedescendant");
    if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No matches. Try a different search or check the section names.";
        container.appendChild(empty);
        return;
    }

    entries.forEach((entry, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "global-search-result";
        button.id = `global-search-result-${index}`;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");
        const title = document.createElement("strong");
        title.textContent = entry.title;
        const detail = document.createElement("small");
        detail.textContent = `${entry.group} · ${entry.detail}`;
        button.append(title, detail);
        button.addEventListener("click", () => {
            $("#global-search-dialog").close();
            document.querySelector(entry.target)?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
        container.appendChild(button);
    });
}

function moveGlobalSearchSelection(direction) {
    const results = $$(".global-search-result", $("#global-search-results"));
    if (!results.length) return;
    appState.globalSearchIndex = (appState.globalSearchIndex + direction + results.length) % results.length;
    results.forEach((item, index) =>
        item.setAttribute("aria-selected", String(index === appState.globalSearchIndex)));
    $("#global-search-input")?.setAttribute(
        "aria-activedescendant",
        `global-search-result-${appState.globalSearchIndex}`
    );
    results[appState.globalSearchIndex].scrollIntoView({ block: "nearest" });
}

function initGlobalSearch() {
    const dialog = $("#global-search-dialog");
    const input = $("#global-search-input");
    const open = () => {
        if (!dialog.open) dialog.showModal();
        renderGlobalSearch();
        input.focus();
    };
    $("#global-search-button")?.addEventListener("click", open);
    $("#close-global-search")?.addEventListener("click", () => dialog.close());
    input?.addEventListener("input", renderGlobalSearch);
    input?.addEventListener("keydown", event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            moveGlobalSearchSelection(event.key === "ArrowDown" ? 1 : -1);
        } else if (event.key === "Enter" && appState.globalSearchIndex >= 0) {
            event.preventDefault();
            $(`#global-search-result-${appState.globalSearchIndex}`)?.click();
        } else if (event.key === "Enter") {
            event.preventDefault();
        }
    });
    dialog?.addEventListener("click", event => {
        if (event.target === dialog) dialog.close();
    });
    dialog?.addEventListener("cancel", event => {
        event.preventDefault();
        dialog.close();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && dialog.open) {
            dialog.close();
            return;
        }
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            target?.isContentEditable;
        if (event.key === "/" && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            open();
        }
        if (event.key === "Enter" && document.activeElement === input &&
            appState.globalSearchIndex >= 0) {
            event.preventDefault();
            $(`#global-search-result-${appState.globalSearchIndex}`)?.click();
        }
    });
}

function initThemeToggle() {
    const toggle = $("#theme-toggle");
    const savedTheme = readStoredData("tsukuyomi_theme", "dark");
    document.body.classList.toggle("light-theme", savedTheme === "light");
    toggle?.setAttribute("aria-pressed", String(savedTheme === "light"));
    toggle?.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("light-theme");
        saveData("tsukuyomi_theme", isLight ? "light" : "dark");
        toggle.setAttribute("aria-pressed", String(isLight));
    });
}

function initAdditionalControls() {
    $("#refresh-weather-btn")?.addEventListener("click", () => {
        if (!appState.location) {
            notify("Select an observing location first.", "error");
            return;
        }
        loadWeather();
    });

    $("#skyview-search-btn")?.addEventListener("click", () => {
        const target = $("#skyview-target").value.trim();
        if (target.length < 2) {
            notify("Enter an astronomy target to search the NASA image archive.", "error");
            return;
        }
        $("#image-search-input").value = target;
        searchNasaImages(target);
        document.querySelector("#spirit-lens")?.scrollIntoView({ behavior: "smooth" });
    });

    $("#run-analysis-btn")?.addEventListener("click", () => {
        const result = $("#analysis-result");
        const content = $("#analysis-result-content");
        result.hidden = false;
        content.textContent = "No scientific analysis model is connected. No object detection or measurements were performed.";
    });

    $("#view-honor-history-btn")?.addEventListener("click", () => {
        const history = $("#honor-history-panel");
        history.hidden = false;
        history.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("#close-honor-history-btn")?.addEventListener("click", () => {
        $("#honor-history-panel").hidden = true;
    });

    const menuButton = $("#mobile-menu-toggle");
    const nav = $("#main-navigation");
    nav?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("open");
            menuButton?.setAttribute("aria-expanded", "false");
            menuButton?.setAttribute("aria-label", "Open navigation");
        });
    });

    $(".back-to-top")?.addEventListener("click", event => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    setText("#system-status-text", "LOCAL MODE");
    setText("#integration-events-status", "APPROXIMATE LUNAR PHASES");
    setText("#integration-map-status", "OPENSTREETMAP · NASA VIIRS LAYER");
    setText("#hero-coordinate", "Awaiting location");
    if (appState.location) {
        setText("#hero-coordinate",
            `${Number(appState.location.latitude).toFixed(2)}°, ` +
            `${Number(appState.location.longitude).toFixed(2)}°`);
    }

    apiRequest("/api/health")
        .then(health => setText("#system-status-text",
            health.mode === "browser-only static mode"
                ? "BROWSER MODE · LIVE DATA"
                : "LOCAL SERVICES ONLINE"))
        .catch(error => {
            setText("#system-status-text", "LOCAL SERVICE OFFLINE");
            console.warn("Health check failed:", error);
        });
}

function initAppServices() {
    initLocationService();
    initMapControls();
    initLunarCalendar();
    loadCountdownData();
    window.setInterval(updateCountdownClocks, 1000);
    initJournalAndReminders();
    initImageExplorer();
    initGlobalSearch();
    initThemeToggle();
    initAdditionalControls();
    updateClock();
    window.setInterval(() => {
        if (!document.hidden) updateClock();
    }, 1000);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) updateClock();
    });
}

function initTsukuyomiWatch() {
    initNavigation();
    initScrollAnimations();
    initKeyboardShortcuts();
    initAppServices();

    console.log(
        "%c TSUKUYOMI WATCH ",
        "background:#17172f;color:#b9a7ff;font-weight:bold;padding:8px 12px;border-radius:6px"
    );

    console.log("Celestial guide initialized successfully.");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initTsukuyomiWatch,
        { once: true }
    );
} else {
    initTsukuyomiWatch();
}
