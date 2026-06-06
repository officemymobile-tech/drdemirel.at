(function () {
  const config = window.ADMIN_CONFIG || {};
  const apiUrl = (config.apiUrl || "").replace(/\/$/, "");

  const els = {
    setupHint: document.getElementById("setup-hint"),
    status: document.getElementById("status"),
    form: document.getElementById("form"),
    active: document.getElementById("active"),
    variant: document.getElementById("variant"),
    validUntil: document.getElementById("validUntil"),
    titleDe: document.getElementById("titleDe"),
    textDe: document.getElementById("textDe"),
    titleTr: document.getElementById("titleTr"),
    textTr: document.getElementById("textTr"),
    linkUrl: document.getElementById("linkUrl"),
    linkLabelDe: document.getElementById("linkLabelDe"),
    linkLabelTr: document.getElementById("linkLabelTr"),
    password: document.getElementById("password"),
    saveBtn: document.getElementById("saveBtn"),
    hideBtn: document.getElementById("hideBtn"),
  };

  function showStatus(message, ok) {
    els.status.textContent = message;
    els.status.className = "status " + (ok ? "ok" : "err");
    els.status.classList.remove("hidden");
  }

  function fillForm(data) {
    els.active.checked = Boolean(data.active);
    els.variant.value = data.variant || "info";
    els.validUntil.value = data.validUntil || "";
    els.titleDe.value = data.title?.de || "";
    els.textDe.value = data.text?.de || "";
    els.titleTr.value = data.title?.tr || "";
    els.textTr.value = data.text?.tr || "";
    els.linkUrl.value = data.link?.url || "";
    els.linkLabelDe.value = data.link?.label?.de || "";
    els.linkLabelTr.value = data.link?.label?.tr || "";
  }

  function collectPayload(activeOverride) {
    const active =
      typeof activeOverride === "boolean" ? activeOverride : els.active.checked;
    return {
      active,
      variant: els.variant.value,
      title: {
        de: els.titleDe.value.trim(),
        tr: els.titleTr.value.trim(),
      },
      text: {
        de: els.textDe.value.trim(),
        tr: els.textTr.value.trim(),
      },
      link: {
        url: els.linkUrl.value.trim(),
        label: {
          de: els.linkLabelDe.value.trim(),
          tr: els.linkLabelTr.value.trim(),
        },
      },
      validUntil: els.validUntil.value || null,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  }

  function validatePayload(payload, active) {
    if (!active) return true;
    const hasDe = payload.title.de || payload.text.de;
    const hasTr = payload.title.tr || payload.text.tr;
    if (!hasDe && !hasTr) {
      showStatus("Bitte mindestens einen Text auf Deutsch oder Türkisch eingeben.", false);
      return false;
    }
    return true;
  }

  async function loadCurrent() {
    if (!apiUrl) return;
    try {
      const res = await fetch(apiUrl + "/current");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const data = await res.json();
      fillForm(data);
    } catch {
      showStatus("Aktuelle Mitteilung konnte nicht geladen werden.", false);
    }
  }

  async function save(activeOverride) {
    if (!apiUrl) {
      showStatus("Admin ist noch nicht eingerichtet (API-URL fehlt).", false);
      return;
    }

    const password = els.password.value;
    if (!password) {
      showStatus("Bitte das Ordinations-Passwort eingeben.", false);
      return;
    }

    const payload = collectPayload(activeOverride);
    if (!validatePayload(payload, payload.active)) return;

    els.saveBtn.disabled = true;
    showStatus("Wird gespeichert …", true);

    try {
      const res = await fetch(apiUrl + "/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, announcement: payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Speichern fehlgeschlagen");
      }
      fillForm(body.announcement || payload);
      els.password.value = "";
      showStatus(
        "Gespeichert. Die Website aktualisiert sich in ca. 2–3 Minuten.",
        true
      );
    } catch (err) {
      showStatus(err.message || "Speichern fehlgeschlagen.", false);
    } finally {
      els.saveBtn.disabled = false;
    }
  }

  if (!apiUrl) {
    els.setupHint.classList.remove("hidden");
    els.setupHint.innerHTML =
      "<strong>Hinweis für den Techniker:</strong> Cloudflare Worker deployen und in <code>public/admin/config.js</code> die <code>apiUrl</code> eintragen. Die Ordination braucht danach nur noch ein Passwort — kein GitHub-Konto.";
    els.form.querySelectorAll("input, select, textarea, button").forEach((el) => {
      if (el.id !== "password") el.disabled = true;
    });
  } else {
    loadCurrent();
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    save();
  });

  els.hideBtn.addEventListener("click", () => {
    save(false);
  });
})();
