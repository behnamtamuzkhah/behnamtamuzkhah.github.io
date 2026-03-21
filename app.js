const STORAGE_KEY = "tickets-v1";
const SORT_KEY = "sort-mode";
const THEME_KEY = "theme-choice";
const LANG_KEY = "lang-choice";

const titleInput = document.getElementById("titleInput");
const noteInput = document.getElementById("noteInput");
const addBtn = document.getElementById("addBtn");
const scanBtn = document.getElementById("scanBtn");
const qrVideo = document.getElementById("qrVideo");
const ticketsContainer = document.getElementById("ticketsContainer");
const emptyState = document.getElementById("emptyState");
const countLabel = document.getElementById("countLabel");
const searchInput = document.getElementById("searchInput");
const clearAllBtn = document.getElementById("clearAllBtn");
const langSelect = document.getElementById("langSelect");

/* ---------------- TRANSLATIONS ---------------- */

const translations = {
    de: {
        app_title: "Ticket Manager",
        theme_auto: "Automatisch",
        theme_light: "Hell",
        theme_dark: "Dunkel",

        field_title_label: "Ticket-Titel",
        field_title_placeholder: "z.B. Konzert, Kino, Zug",
        field_note_label: "Notiz (optional)",
        field_note_placeholder: "Sitzplatz, Uhrzeit, Buchungscode ...",

        add_button: "Ticket hinzufügen",
        scan_button: "QR scannen",

        search_label: "Suche",
        search_placeholder: "In Tickets suchen...",

        sort_label: "Sortierung",
        sort_newest: "Neueste",
        sort_oldest: "Älteste",

        tickets_title: "Meine Tickets",
        empty_state: "Keine Ergebnisse gefunden.",
        delete_button: "Löschen",
        delete_all_button: "Alle Tickets löschen",
        delete_all_confirm: "Bist du sicher?",

        title_required: "Bitte gib einen Ticket-Titel ein.",
        camera_error: "Kamera konnte nicht gestartet werden.",

        count_label_single: "1 Ticket",
        count_label_multi: "{count} Tickets"
    }
};

/* ---------------- LANGUAGE ---------------- */

function getCurrentLang() {
    return localStorage.getItem(LANG_KEY) || "de";
}

function applyLanguage(lang) {
    const dict = translations[lang] || translations.de;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) el.placeholder = dict[key];
    });

    langSelect.value = lang;
    renderTickets();
}

langSelect.addEventListener("change", () => {
    const lang = langSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyLanguage(lang);
});

/* ---------------- THEME ---------------- */

function applyTheme(theme) {
    const root = document.body;
    root.classList.remove("light", "dark");

    if (theme === "light") root.classList.add("light");
    else if (theme === "dark") root.classList.add("dark");
    else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(prefersDark ? "dark" : "light");
    }
}

document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const choice = btn.dataset.theme;
        localStorage.setItem(THEME_KEY, choice);
        applyTheme(choice);
    });
});

applyTheme(localStorage.getItem(THEME_KEY) || "auto");

/* ---------------- TICKETS ---------------- */

function loadTickets() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function renderTickets() {
    const tickets = loadTickets();
    const query = searchInput.value.toLowerCase();

    const filtered = tickets.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.note.toLowerCase().includes(query)
    );

    ticketsContainer.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.style.display = "block";
        countLabel.textContent = "";
        return;
    }

    emptyState.style.display = "none";
    countLabel.textContent = filtered.length + " Tickets";

    filtered.forEach(t => {
        const div = document.createElement("div");
        div.className = "ticket-item";

        div.innerHTML = `
            <div>
                <div class="ticket-title">${t.title}</div>
                <div class="ticket-note">${t.note}</div>
            </div>
            <button class="btn-danger">X</button>
        `;

        div.querySelector("button").onclick = () => {
            const list = loadTickets().filter(x => x.createdAt !== t.createdAt);
            saveTickets(list);
            renderTickets();
        };

        ticketsContainer.appendChild(div);
    });
}

addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();

    if (!title) {
        alert("Titel eingeben!");
        return;
    }

    const tickets = loadTickets();
    tickets.push({ title, note, createdAt: Date.now() });
    saveTickets(tickets);

    titleInput.value = "";
    noteInput.value = "";
    renderTickets();
});

searchInput.addEventListener("input", renderTickets);

clearAllBtn.addEventListener("click", () => {
    if (confirm("Alles löschen?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderTickets();
    }
});

/* ---------------- QR SCANNER (ساده و پایدار) ---------------- */

let stream = null;

scanBtn.addEventListener("click", async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        qrVideo.srcObject = stream;
        qrVideo.style.display = "block";

        await qrVideo.play();

        // iPhone compatible scanning (no worker, no crash)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scan = () => {
            if (!stream) return;

            canvas.width = qrVideo.videoWidth;
            canvas.height = qrVideo.videoHeight;

            ctx.drawImage(qrVideo, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    noteInput.value = code.data;

                    stream.getTracks().forEach(t => t.stop());
                    qrVideo.style.display = "none";
                    stream = null;
                    alert("QR erkannt ✅");
                    return;
                }
            } catch {}

            requestAnimationFrame(scan);
        };

        scan();

    } catch (e) {
        alert("❌ Kamera funktioniert nicht\n\n👉 GitHub Pages benutzen (https)");
        console.error(e);
    }
});

/* ---------------- INIT ---------------- */

applyLanguage(getCurrentLang());
renderTickets();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}
