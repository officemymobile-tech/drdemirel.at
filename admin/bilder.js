(function () {
  const config = window.ADMIN_CONFIG || {};
  const apiUrl = (config.apiUrl || "").replace(/\/$/, "");

  const IMAGE_FIELDS = [
    { key: "heroImage", label: "Hero-Foto (großes Bild oben)", hint: "Querformat, mind. 1200 px" },
    { key: "cardLogo", label: "Logo auf der Kontaktkarte", hint: "Quadratisch oder rund" },
  ];

  const els = {
    status: document.getElementById("status"),
    imageCards: document.getElementById("imageCards"),
    password: document.getElementById("password"),
  };

  let currentHome = {};

  function showStatus(message, ok) {
    els.status.textContent = message;
    els.status.className = "status " + (ok ? "ok" : "err");
    els.status.classList.remove("hidden");
  }

  const pathMap = { heroImage: "hero_image", cardLogo: "card_logo" };

  function cardHtml(field) {
    const path = currentHome[pathMap[field.key]] || "";
    const src = path ? "https://drdemirel.at/" + path.replace(/^\//, "") : "";
    return (
      '<div class="img-card" data-field="' + field.key + '">' +
      "<strong>" + field.label + "</strong>" +
      '<p class="img-meta">' + field.hint + "</p>" +
      (src ? '<img class="img-preview" src="' + src + "?v=" + Date.now() + '" alt="" />' : '<p class="img-meta">Noch kein Bild.</p>') +
      '<label class="field"><span>Neues Bild</span><input type="file" accept="image/jpeg,image/png,image/webp" class="file-input" /></label>' +
      '<button type="button" class="btn btn-primary upload-btn">Hochladen</button></div>'
    );
  }

  function renderCards() {
    els.imageCards.innerHTML = IMAGE_FIELDS.map(cardHtml).join("");
    els.imageCards.querySelectorAll(".upload-btn").forEach((btn) => {
      btn.addEventListener("click", () => upload(btn.closest(".img-card")));
    });
  }

  async function loadImages() {
    if (!apiUrl) return;
    try {
      const res = await fetch(apiUrl + "/content");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const data = await res.json();
      currentHome = data.home || {};
      renderCards();
    } catch {
      showStatus("Bilder konnten nicht geladen werden.", false);
    }
  }

  async function upload(card) {
    if (!apiUrl) return showStatus("Worker nicht eingerichtet.", false);
    const password = els.password.value;
    if (!password) return showStatus("Bitte Passwort eingeben.", false);

    const field = card.dataset.field;
    const file = card.querySelector(".file-input")?.files?.[0];
    if (!file) return showStatus("Bitte Bild auswählen.", false);
    if (file.size > 4 * 1024 * 1024) return showStatus("Max. 4 MB.", false);

    const btn = card.querySelector(".upload-btn");
    btn.disabled = true;
    showStatus("Upload …", true);

    try {
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const response = await fetch(apiUrl + "/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, field, contentType: file.type, dataBase64: dataUrl }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Upload fehlgeschlagen");
      currentHome = body.home || currentHome;
      renderCards();
      showStatus("Gespeichert. Website in ca. 2–3 Minuten aktualisiert.", true);
    } catch (err) {
      showStatus(err.message, false);
    } finally {
      btn.disabled = false;
    }
  }

  if (!apiUrl) showStatus("Techniker: workers/setup.ps1 ausführen.", false);
  else loadImages();
})();
