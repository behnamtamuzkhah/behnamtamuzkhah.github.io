document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("ticketTitle");
  const noteInput = document.getElementById("ticketNote");
  const addBtn = document.getElementById("addTicketBtn");
  const ticketList = document.getElementById("ticketList");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const scanQrBtn = document.getElementById("scanQrBtn");
  const qrSection = document.getElementById("qrSection");
  const qrVideo = document.getElementById("qrVideo");

  // مسیر worker چون در روت است
  QrScanner.WORKER_PATH = 'qr-scanner-worker.min.js';

  let tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
  let qrScanner = null;
  let scanning = false;

  tickets.forEach(t => renderTicket(t));

  function saveTickets() {
    localStorage.setItem("tickets", JSON.stringify(tickets));
  }

  addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();

    if (!title) return alert("لطفاً عنوان تیکت را وارد کنید");

    const ticket = {
      id: Date.now(),
      title,
      note,
      done: false
    };

    tickets.push(ticket);
    saveTickets();
    renderTicket(ticket);

    titleInput.value = "";
    noteInput.value = "";
  });

  function renderTicket(ticket) {
    const li = document.createElement("li");
    li.className = "ticket-item";
    if (ticket.done) li.classList.add("done");
    li.dataset.id = ticket.id;

    const header = document.createElement("div");
    header.className = "ticket-item-header";

    const titleEl = document.createElement("span");
    titleEl.className = "ticket-title";
    titleEl.textContent = ticket.title;

    const noteEl = document.createElement("div");
    noteEl.className = "ticket-note";
    noteEl.textContent = ticket.note;

    const actions = document.createElement("div");
    actions.className = "ticket-actions";

    const doneBtn = document.createElement("button");
    doneBtn.className = "ticket-btn done";
    doneBtn.textContent = "انجام شد";

    const editBtn = document.createElement("button");
    editBtn.className = "ticket-btn edit";
    editBtn.textContent = "ویرایش";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ticket-btn delete";
    deleteBtn.textContent = "حذف";

    doneBtn.addEventListener("click", () => {
      ticket.done = !ticket.done;
      saveTickets();
      li.classList.toggle("done");
    });

    deleteBtn.addEventListener("click", () => {
      tickets = tickets.filter(t => t.id !== ticket.id);
      saveTickets();
      li.remove();
    });

    editBtn.addEventListener("click", () => {
      const newTitle = prompt("عنوان جدید:", ticket.title);
      if (newTitle === null || newTitle.trim() === "") return;

      const newNote = prompt("یادداشت جدید:", ticket.note);
      if (newNote === null) return;

      ticket.title = newTitle.trim();
      ticket.note = newNote.trim();
      saveTickets();

      titleEl.textContent = ticket.title;
      noteEl.textContent = ticket.note;
    });

    actions.appendChild(doneBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(titleEl);

    li.appendChild(header);
    li.appendChild(noteEl);
    li.appendChild(actions);

    ticketList.appendChild(li);
  }

  // جستجو
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".ticket-item").forEach(item => {
      const title = item.querySelector(".ticket-title").textContent.toLowerCase();
      const note = item.querySelector(".ticket-note").textContent.toLowerCase();

      item.style.display = (title.includes(q) || note.includes(q)) ? "flex" : "none";
    });
  });

  // مرتب‌سازی
  sortSelect.addEventListener("change", () => {
    const mode = sortSelect.value;

    let sorted = [...tickets];

    if (mode === "newest") sorted.sort((a, b) => b.id - a.id);
    else if (mode === "oldest") sorted.sort((a, b) => a.id - b.id);
    else if (mode === "undone") sorted.sort((a, b) => Number(a.done) - Number(b.done));

    ticketList.innerHTML = "";
    sorted.forEach(t => renderTicket(t));
  });

  // QR Scanner
  scanQrBtn.addEventListener("click", async () => {
    try {
      if (!scanning) {
        if (!qrScanner) {
          qrScanner = new QrScanner(
            qrVideo,
            result => {
              // متن QR را در یادداشت می‌گذاریم (یا اگر خواستی در عنوان)
              noteInput.value = result;
              stopScanning();
            },
            {
              returnDetailedScanResult: false
            }
          );
        }
        await qrScanner.start();
        qrSection.style.display = "block";
        scanning = true;
        scanQrBtn.textContent = "توقف اسکن";
      } else {
        stopScanning();
      }
    } catch (e) {
      alert("دسترسی به دوربین ممکن نیست.");
    }
  });

  function stopScanning() {
    if (qrScanner) {
      qrScanner.stop();
    }
    qrSection.style.display = "none";
    scanning = false;
    scanQrBtn.textContent = "اسکن QR";
  }
});
