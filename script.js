document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("ticketTitle");
  const noteInput = document.getElementById("ticketNote");
  const addBtn = document.getElementById("addTicketBtn");
  const ticketList = document.getElementById("ticketList");

  // --- Load saved tickets ---
  let tickets = JSON.parse(localStorage.getItem("tickets") || "[]");
  tickets.forEach(t => renderTicket(t));

  // --- Add new ticket ---
  addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();

    if (!title) {
      alert("لطفاً عنوان تیکت را وارد کنید");
      return;
    }

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
    titleInput.focus();
  });

  // --- Save to localStorage ---
  function saveTickets() {
    localStorage.setItem("tickets", JSON.stringify(tickets));
  }

  // --- Render ticket item ---
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

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ticket-btn delete";
    deleteBtn.textContent = "حذف";

    // --- Toggle done ---
    doneBtn.addEventListener("click", () => {
      ticket.done = !ticket.done;
      saveTickets();
      li.classList.toggle("done");
    });

    // --- Delete ticket ---
    deleteBtn.addEventListener("click", () => {
      tickets = tickets.filter(t => t.id !== ticket.id);
      saveTickets();
      li.remove();
    });

    actions.appendChild(doneBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(titleEl);

    li.appendChild(header);
    li.appendChild(noteEl);
    li.appendChild(actions);

    ticketList.appendChild(li);
  }
});
