// جلوگیری از اسکرول ناخواسته iPhone
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

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

  // نمایش تیکت‌های ذخیره‌شده
  tickets.forEach(t => renderTicket(t));

  function saveTickets() {
    localStorage.setItem("tickets", JSON.stringify(tickets));
  }

  // افزودن تیکت
  addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();
    if (!title) return alert("عنوان لازم است");

    const ticket = { id: Date.now(), title, note, done: false };
    tickets.push(ticket);
    saveTickets();
    renderTicket(ticket);

    titleInput.value = "";
    noteInput.value = "";
  });

  // رندر تیکت
  function renderTicket(ticket) {
    const li = document.createElement("li");
    li.className = "ticket-item";
    if (ticket.done) li.classList.add("done");

    li.innerHTML = `
      <div class="ticket-title">${ticket.title}</div>
      <div class="ticket-note">${ticket.note}</div>
      <div class="ticket-actions">
        <button class="ticket-btn done">انجام شد</button>
        <button class="ticket-btn edit">ویرایش</button>
        <button class="ticket-btn delete">حذف</button>
      </div>
    `;

    li.querySelector(".done").onclick = () => {
      ticket.done = !ticket.done;
      saveTickets();
      li.classList.toggle("done");
    };

    li.querySelector(".delete").onclick = () => {
      tickets = tickets.filter(t => t.id !== ticket.id);
      saveTickets();
      li.remove();
    };

    li.querySelector(".edit").onclick = () => {
      const newTitle = prompt("عنوان جدید:", ticket.title);
      if (!newTitle) return;
      const newNote = prompt("یادداشت جدید:", ticket.note);
      if (newNote === null) return;

      ticket.title = newTitle.trim();
      ticket.note = newNote.trim();
      saveTickets();

      li.querySelector(".ticket-title").textContent = ticket.title;
      li.querySelector(".ticket-note").textContent = ticket.note;
    };

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
  // QR Scanner — jsQR (نسخه ۱۰۰٪ سازگار با iPhone)
  // -------------------------------
  scanQrBtn.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      qrVideo.srcObject = stream;
      await qrVideo.play();

      qrSection.style.display = "block";
      scanning = true;
      scanQrBtn.textContent = "توقف اسکن";

      scanLoop();
    } catch (err) {
      alert("دسترسی به دوربین ممکن نیست.");
    }
  });

  function stopScan() {
    scanning = false;
    scanQrBtn.textContent = "اسکن QR";
    qrSection.style.display = "none";

    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  // حلقهٔ اسکن — نسخهٔ درست‌شده
  function scanLoop() {
    if (!scanning) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = qrVideo.videoWidth;
    canvas.height = qrVideo.videoHeight;

    ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

    // فقط وسط تصویر را اسکن کن
    const size = Math.min(canvas.width, canvas.height) * 0.6;
    const sx = (canvas.width - size) / 2;
    const sy = (canvas.height - size) / 2;

    const imgData = ctx.getImageData(sx, sy, size, size);
    const code = jsQR(imgData.data, size, size);

    if (code && code.data) {
      stopScan();

      const ticket = {
        id: Date.now(),
        title: code.data,
        note: "",
        done: false
      };

      tickets.push(ticket);
      saveTickets();
      renderTicket(ticket);

      alert("QR ثبت شد:\n" + code.data);
      return;
    }

    requestAnimationFrame(scanLoop);
  }
});
