(function () {
  const config = window.ADMIN_CONFIG || {};
  const apiUrl = (config.apiUrl || "").replace(/\/$/, "");

  const els = {
    status: document.getElementById("status"),
    form: document.getElementById("form"),
    password: document.getElementById("password"),
    saveBtn: document.getElementById("saveBtn"),
  };

  function showStatus(message, ok) {
    els.status.textContent = message;
    els.status.className = "status " + (ok ? "ok" : "err");
    els.status.classList.remove("hidden");
  }

  function specToText(arr) {
    return (arr || [])
      .map((x) => (typeof x === "string" ? x : x.eintrag || ""))
      .filter(Boolean)
      .join("\n");
  }

  function textToSpec(text) {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((eintrag) => ({ eintrag }));
  }

  function fillForm(data) {
    const s = data.settings || {};
    const h = data.home || {};

    document.getElementById("sticky_bar").value = s.sticky_bar || "";
    document.getElementById("phone_display").value = s.phone_display || "";
    document.getElementById("phone_tel").value = s.phone_tel || "";
    document.getElementById("email_ordination").value = s.email_ordination || "";
    document.getElementById("address").value = s.address || "";

    document.getElementById("hero_title").value = h.hero_title || "";
    document.getElementById("hero_image_alt").value = h.hero_image_alt || "";
    document.getElementById("card_title").value = h.card_title || "";
    document.getElementById("card_subtitle").value = h.card_subtitle || "";
    document.getElementById("appointments_note").value = h.appointments_note || "";
    document.getElementById("tagline").value = h.tagline || "";
    document.getElementById("specializations").value = specToText(h.specializations);
    document.getElementById("about_intro").value = h.about_intro || "";
    document.getElementById("contact_intro").value = h.contact_intro || "";
    document.getElementById("anfahrt_text").value = h.anfahrt_text || "";
  }

  function collectPayload() {
    return {
      settings: {
        sticky_bar: document.getElementById("sticky_bar").value.trim(),
        phone_display: document.getElementById("phone_display").value.trim(),
        phone_tel: document.getElementById("phone_tel").value.trim(),
        email_ordination: document.getElementById("email_ordination").value.trim(),
        address: document.getElementById("address").value.trim(),
      },
      home: {
        hero_title: document.getElementById("hero_title").value.trim(),
        hero_image_alt: document.getElementById("hero_image_alt").value.trim(),
        card_title: document.getElementById("card_title").value.trim(),
        card_subtitle: document.getElementById("card_subtitle").value.trim(),
        appointments_note: document.getElementById("appointments_note").value.trim(),
        tagline: document.getElementById("tagline").value.trim(),
        specializations: textToSpec(document.getElementById("specializations").value),
        about_intro: document.getElementById("about_intro").value.trim(),
        contact_intro: document.getElementById("contact_intro").value.trim(),
        anfahrt_text: document.getElementById("anfahrt_text").value.trim(),
      },
    };
  }

  async function loadContent() {
    if (!apiUrl) return;
    try {
      const res = await fetch(apiUrl + "/content");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      fillForm(await res.json());
    } catch {
      showStatus("Inhalte konnten nicht geladen werden.", false);
    }
  }

  async function save() {
    if (!apiUrl) {
      showStatus("Worker noch nicht eingerichtet (API-URL fehlt).", false);
      return;
    }
    const password = els.password.value;
    if (!password) {
      showStatus("Bitte Passwort eingeben.", false);
      return;
    }

    els.saveBtn.disabled = true;
    showStatus("Wird gespeichert …", true);

    try {
      const payload = collectPayload();
      const res = await fetch(apiUrl + "/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Speichern fehlgeschlagen");
      fillForm(body);
      els.password.value = "";
      showStatus("Gespeichert. Website aktualisiert sich in ca. 2–3 Minuten.", true);
    } catch (err) {
      showStatus(err.message || "Speichern fehlgeschlagen.", false);
    } finally {
      els.saveBtn.disabled = false;
    }
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    save();
  });

  if (!apiUrl) {
    showStatus("Techniker: workers/setup.ps1 ausführen.", false);
    els.form.querySelectorAll("input, textarea, button").forEach((el) => {
      if (el.id !== "password") el.disabled = true;
    });
  } else {
    loadContent();
  }
})();
