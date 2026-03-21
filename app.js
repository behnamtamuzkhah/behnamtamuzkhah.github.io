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

/* -------- QR SCANNER (نسخه نهایی پایدار) -------- */

let stream = null;

scanBtn.onclick = async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        qrVideo.srcObject = stream;
        qrVideo.style.display = "block";

        await new Promise(res => {
            qrVideo.onloadedmetadata = res;
        });

        await qrVideo.play();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scan = () => {
            if (!stream) return;

            // 🔥 مهم: کوچک کردن تصویر برای iPhone
            const targetWidth = 400;
            const scale = targetWidth / qrVideo.videoWidth;
            const targetHeight = qrVideo.videoHeight * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(qrVideo, 0, 0, targetWidth, targetHeight);

            try {
                const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
                const code = jsQR(imageData.data, targetWidth, targetHeight);

                if (code && code.data) {
                    noteInput.value = code.data;

                    stream.getTracks().forEach(t => t.stop());
                    qrVideo.style.display = "none";
                    stream = null;

                    alert("QR erkannt ✅");
                    return;
                }
            } catch (e) {
                // ignore
            }

            requestAnimationFrame(scan);
        };

        scan();

    } catch (e) {
        alert("❌ Kamera funktioniert nicht\n\n👉 از GitHub Pages (https) باز کن");
        console.error(e);
    }
};
