document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("ticketTitle");
  const noteInput = document.getElementById("ticketNote");
  const addBtn = document.getElementById("addTicketBtn");
  const ticketList = document.getElementById("ticketList");

  // رویداد دکمه افزودن
  addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();

    if (!title) {
      alert("لطفاً عنوان تیکت را وارد کنید");
      return;
    }

    const li = document.createElement("li");
    li.className = "ticket-item";

    const header = document.createElement("div");
    header.className = "ticket-item-header";

    const titleEl = document.createElement("span");
    titleEl.className = "ticket-title";
    titleEl.textContent = title;

    const noteEl = document.createElement("div");
    noteEl.className = "ticket-note";
    noteEl.textContent = note;

    const actions = document.createElement("div");
    actions.className = "ticket-actions";

    const doneBtn = document.createElement("button");
    doneBtn.className = "ticket-btn done";
    doneBtn.textContent = "انجام شد";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ticket-btn delete";
    deleteBtn.textContent = "حذف";

    // رویداد دکمه انجام شد
    doneBtn.addEventListener("click", () => {
      li.classList.toggle("done");
    });

    // رویداد دکمه حذف
    deleteBtn.addEventListener("click", () => {
      li.remove();
    });

    actions.appendChild(doneBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(titleEl);

    li.appendChild(header);
    li.appendChild(noteEl);
    li.appendChild(actions);

    ticketList.appendChild(li);

    titleInput.value = "";
    noteInput.value = "";
    titleInput.focus();
  });
});
