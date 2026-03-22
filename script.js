// جلوگیری از bounce و اسکرول ناخواسته در iPhone
document.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, { passive: false });

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

  let tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
  let scanning = false;
  let stream = null;
  let detector = null;

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
      if (!newTitle) return;

      const newNote = prompt("یادداشت جدید:", ticket.note);
      if (newNote === null) return;

      ticket.title = newTitle.trim();
      ticket.note = newNote.trim();
      saveTickets();

      titleEl.textContent = ticket.title;
      noteEl.textContent = ticket.note;
    });

    actions.append(doneBtn, editBtn, deleteBtn);
    header.append(titleEl);
    li.append(header, noteEl, actions);
    ticketList.append(li);
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

  // -------------------------------
  // QR Scanner — حالت C (ساخت تیکت کامل)
  // -------------------------------
  scanQrBtn.addEventListener("click", async () => {
    if (!("BarcodeDetector" in window)) {
      alert("این دستگاه از QR Scanner پشتیبانی نمی‌کند.");
      return;
    }

    try {
      detector = new BarcodeDetector({ formats: ["qr_code"] });

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      qrVideo.srcObject = stream;
      qrVideo.setAttribute("playsinline", true);
      qrVideo.setAttribute("muted", true);
      qrVideo.setAttribute("autoplay", true);
      await qrVideo.play();

      qrSection.style.display = "block";
      scanning = true;
      scanQrBtn.textContent = "توقف اسکن";

      scanLoop();
    } catch (err) {
      alert("دسترسی به دوربین ممکن نیست.");
    }
  });

  async function scanLoop() {
    if (!scanning) return;

    try {
      const results = await detector.detect(qrVideo);

      if (results.length > 0) {
        const qr = results[0].rawValue;

        stopScan();

        const ticket = {
          id: Date.now(),
          title: qr,
          note: "",
          done: false
        };

        tickets.push(ticket);
        saveTickets();
        renderTicket(ticket);

        alert("QR ثبت شد:\n" + qr);
        return;
      }
    } catch (e) {
      console.log("Detector error:", e);
    }

    requestAnimationFrame(scanLoop);
  }

  function stopScan() {
    scanning = false;
    scanQrBtn.textContent = "اسکن QR";
    qrSection.style.display = "none";

    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }
});
