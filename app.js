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
        delete_all_confirm: "Bist du sicher, dass alle Tickets gelöscht werden sollen?",

        title_required: "Bitte gib einen Ticket-Titel ein.",
        camera_error: "Zugriff auf die Kamera ist nicht möglich.",

        count_label_single: "1 Ticket",
        count_label_multi: "{count} Tickets"
    },
    en: {
        app_title: "Ticket Manager",
        theme_auto: "Auto",
        theme_light: "Light",
        theme_dark: "Dark",

        field_title_label: "Ticket title",
        field_title_placeholder: "e.g. concert, cinema, train",
        field_note_label: "Note (optional)",
        field_note_placeholder: "Seat, time, booking code...",

        add_button: "Add ticket",
        scan_button: "Scan QR",

        search_label: "Search",
        search_placeholder: "Search in tickets...",

        sort_label: "Sort",
        sort_newest: "Newest",
        sort_oldest: "Oldest",

        tickets_title: "My tickets",
        empty_state: "No results found.",
        delete_button: "Delete",
        delete_all_button: "Delete all tickets",
        delete_all_confirm: "Are you sure you want to delete all tickets?",

        title_required: "Please enter a ticket title.",
        camera_error: "Camera access is not available.",

        count_label_single: "1 ticket",
        count_label_multi: "{count} tickets"
    },
    fa: {
        app_title: "مدیر بلیت",
        theme_auto: "خودکار",
        theme_light: "روشن",
        theme_dark: "تیره",

        field_title_label: "عنوان بلیت",
        field_title_placeholder: "مثلاً: کنسرت، سینما، قطار",
        field_note_label: "یادداشت (اختیاری)",
        field_note_placeholder: "صندلی، ساعت، کد رزرو و ...",

        add_button: "افزودن بلیت",
        scan_button: "اسکن QR",

        search_label: "جستجو",
        search_placeholder: "جستجو در بلیت‌ها...",

        sort_label: "مرتب‌سازی",
        sort_newest: "جدیدترین",
        sort_oldest: "قدیمی‌ترین",

        tickets_title: "بلیت‌های من",
        empty_state: "هیچ نتیجه‌ای پیدا نشد.",
        delete_button: "حذف",
        delete_all_button: "حذف همه بلیت‌ها",
        delete_all_confirm: "آیا مطمئنی همه بلیت‌ها حذف شوند؟",

        title_required: "عنوان بلیت را وارد کن.",
        camera_error: "دسترسی به دوربین امکان‌پذیر نیست.",

        count_label_single: "۱ بلیت",
        count_label_multi: "{count} بلیت"
    }
};

function getCurrentLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && translations[saved]) return saved;

    // default: German
    return "de";
}

function applyLanguage(lang) {
    const dict = translations[lang] || translations.de;

    // text nodes
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) el.textContent = dict[key];
    });

    // placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) el.placeholder = dict[key];
    });

    // title
    if (dict.app_title) {
        document.title = dict.app_title;
        const titleTag = document.querySelector("title[data-i18n='app_title']");
        if (titleTag) titleTag.textContent = dict.app_title;
    }

    // direction for Farsi
    if (lang === "fa") {
        document.documentElement.lang = "fa";
        document.documentElement.dir = "rtl";
    } else {
        document.documentElement.lang = lang;
        document.documentElement.dir = "ltr";
    }

    langSelect.value = lang;
    renderTickets(); // to update count label & empty text
}

langSelect.addEventListener("change", () => {
    const lang = langSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyLanguage(lang);
});

/* ---------------- THEME SYSTEM ---------------- */

function applyTheme(theme) {
    const root = document.body;
    root.classList.remove("light", "dark");

    if (theme === "light") root.classList.add("light");
    else if (theme === "dark") root.classList.add("dark");
    else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(prefersDark ? "dark" : "light");
    }

    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.theme === theme) btn.classList.add("active");
    });
}

function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "auto";
    applyTheme(saved);
}

document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const choice = btn.dataset.theme;
        localStorage.setItem(THEME_KEY, choice);
        applyTheme(choice);
    });
});

loadTheme();

/* ---------------- SORT SYSTEM ---------------- */

function loadSortMode() {
    return localStorage.getItem(SORT_KEY) || "newest";
}

function applySortButtons() {
    const mode = loadSortMode();
    document.querySelectorAll(".sort-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.sort === mode) btn.classList.add("active");
    });
}

document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        localStorage.setItem(SORT_KEY, btn.dataset.sort);
        applySortButtons();
        renderTickets();
    });
});

applySortButtons();

/* ---------------- TICKET SYSTEM ---------------- */

function loadTickets() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function getDict() {
    const lang = getCurrentLang();
    return translations[lang] || translations.de;
}

function renderTickets() {
    const tickets = loadTickets();
    const query = searchInput.value.trim().toLowerCase();
    const sortMode = loadSortMode();
    const dict = getDict();

    let filtered = tickets.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.note.toLowerCase().includes(query)
    );

    if (sortMode === "newest") {
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else {
        filtered.sort((a, b) => a.createdAt - b.createdAt);
    }

    ticketsContainer.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.style.display = "block";
        emptyState.textContent = dict.empty_state;
        countLabel.textContent = "";
        return;
    }

    emptyState.style.display = "none";

    if (filtered.length === 1) {
        countLabel.textContent = dict.count_label_single || "1";
    } else {
        const tmpl = dict.count_label_multi || "{count}";
        countLabel.textContent = tmpl.replace("{count}", filtered.length);
    }

    filtered.forEach((t) => {
        const item = document.createElement("div");
        item.className = "ticket-item";

        const main = document.createElement("div");
        main.className = "ticket-main";

        const titleEl = document.createElement("div");
        titleEl.className = "ticket-title";
        titleEl.textContent = t.title;
        main.appendChild(titleEl);

        if (t.note && t.note.trim() !== "") {
            const noteEl = document.createElement("div");
            noteEl.className = "ticket-note";
            noteEl.textContent = t.note;
            main.appendChild(noteEl);
        }

        const delBtn = document.createElement("button");
        delBtn.className = "btn-danger";
        delBtn.textContent = dict.delete_button || "Delete";
        delBtn.onclick = () => {
            const current = loadTickets();
            const realIndex = current.findIndex(x => x.createdAt === t.createdAt);
            if (realIndex !== -1) {
                current.splice(realIndex, 1);
                saveTickets(current);
                renderTickets();
            }
        };

        item.appendChild(main);
        item.appendChild(delBtn);
        ticketsContainer.appendChild(item);
    });
}

addBtn.addEventListener("click", () => {
    const dict = getDict();
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();

    if (!title) {
        alert(dict.title_required || "Please enter a ticket title.");
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
    const dict = getDict();
    if (confirm(dict.delete_all_confirm || "Are you sure?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderTickets();
    }
});

/* ---------------- QR SCANNER ---------------- */

scanBtn.addEventListener("click", async () => {
    const dict = getDict();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        qrVideo.srcObject = stream;
        qrVideo.style.display = "block";
        qrVideo.play();

        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);

        const scanLoop = async () => {
            try {
                const bitmap = await imageCapture.grabFrame();
                const detector = new BarcodeDetector({ formats: ["qr_code"] });
                const codes = await detector.detect(bitmap);

                if (codes.length > 0) {
                    const text = codes[0].rawValue || "";
                    const lines = text.split("\n");
                    titleInput.value = lines[0] || "";
                    noteInput.value = lines.slice(1).join("\n");

                    stream.getTracks().forEach(t => t.stop());
                    qrVideo.style.display = "none";
                    return;
                }
            } catch (e) {
                // ignore frame errors
            }
            requestAnimationFrame(scanLoop);
        };

        scanLoop();
    } catch (err) {
        alert(dict.camera_error || "Camera access is not available.");
    }
});

/* ---------------- INIT LANGUAGE ---------------- */

(function initLanguage() {
    const lang = getCurrentLang();
    langSelect.value = lang;
    applyLanguage(lang);
})();

/* ---------------- SERVICE WORKER ---------------- */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}
const video = document.getElementById('qrVideo');
const scanBtn = document.getElementById('scanBtn');
const noteInput = document.getElementById('noteInput');

let scanner = null;

scanBtn.addEventListener('click', async () => {
    if (!scanner) {
        scanner = new QRScanner(video, (result) => {
            if (result) {
                noteInput.value = result;
                scanner.stop();
                video.style.display = "none";
                alert("QR gelesen ✅");
            }
        });
    }

    video.style.display = "block";

    try {
        await scanner.start();
    } catch (e) {
        alert("Kamera Fehler ❌");
        console.error(e);
    }
});
