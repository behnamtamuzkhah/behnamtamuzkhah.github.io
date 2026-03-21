const titleInput = document.getElementById("titleInput");
const noteInput = document.getElementById("noteInput");
const addBtn = document.getElementById("addBtn");
const scanBtn = document.getElementById("scanBtn");
const qrVideo = document.getElementById("qrVideo");
const ticketsContainer = document.getElementById("ticketsContainer");

let tickets = [];

/* -------- TICKETS -------- */

function render() {
    ticketsContainer.innerHTML = "";

    tickets.forEach((t, i) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <b>${t.title}</b><br>
            ${t.note}<br>
            <button onclick="removeTicket(${i})">X</button>
            <hr>
        `;
        ticketsContainer.appendChild(div);
    });
}

function removeTicket(i) {
    tickets.splice(i, 1);
    render();
}

addBtn.onclick = () => {
    if (!titleInput.value) {
        alert("Titel eingeben!");
        return;
    }

    tickets.push({
        title: titleInput.value,
        note: noteInput.value
    });

    titleInput.value = "";
    noteInput.value = "";
    render();
};

/* -------- QR SCANNER -------- */

let stream = null;

scanBtn.onclick = async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        qrVideo.srcObject = stream;
        qrVideo.style.display = "block";
        await qrVideo.play();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scan = () => {
            if (!stream) return;

            canvas.width = qrVideo.videoWidth;
            canvas.height = qrVideo.videoHeight;

            ctx.drawImage(qrVideo, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                noteInput.value = code.data;

                stream.getTracks().forEach(t => t.stop());
                qrVideo.style.display = "none";
                stream = null;

                alert("QR OK ✅");
                return;
            }

            requestAnimationFrame(scan);
        };

        scan();

    } catch (e) {
        alert("❌ Kamera funktioniert nicht\n\n👉 از GitHub Pages باز کن");
    }
};
