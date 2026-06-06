/**
 * Cloudflare Worker: drdemirel.at Ordinations-Admin → GitHub API
 * Mitteilungen, Texte (settings + home), Bild-Upload
 */

const ALLOWED_ORIGINS = [
  "https://drdemirel.at",
  "https://www.drdemirel.at",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
];

const ANNOUNCEMENT_PATH = "content/announcements.json";
const SETTINGS_PATH = "content/settings.json";
const HOME_PATH = "content/de/home.json";
const UPLOAD_DIR = "uploads";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const IMAGE_FIELD_MAP = {
  heroImage: "hero_image",
  cardLogo: "card_logo",
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
    },
  });
}

function githubHeaders(env) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_PAT}`,
    "User-Agent": "drdemirel-cms-worker",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubReadPath(env, path) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: githubHeaders(env) });

  if (res.status === 404) return { content: null, sha: null };
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  if (path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return { content: data.content, sha: data.sha, isBinary: true };
  }
  const decoded = JSON.parse(atob(data.content.replace(/\n/g, "")));
  return { content: decoded, sha: data.sha, isBinary: false };
}

function encodeUtf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function githubWritePath(env, path, contentB64, sha, message) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const payload = {
    message,
    content: contentB64,
    committer: { name: "Dr. Demirel Admin", email: "admin@drdemirel.at" },
  };
  if (sha) payload.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function githubWriteJson(env, path, obj, sha, message) {
  const body = JSON.stringify(obj, null, 2) + "\n";
  return githubWritePath(env, path, encodeUtf8(body), sha, message);
}

function checkPassword(body, env) {
  return body?.password && body.password === env.ADMIN_PASSWORD;
}

function sanitizeAnnouncement(input) {
  const variant = ["info", "warning", "urgent"].includes(input?.variant) ? input.variant : "info";
  return {
    active: Boolean(input?.active),
    variant,
    title: { de: String(input?.title?.de || "").slice(0, 120), tr: String(input?.title?.tr || "").slice(0, 120) },
    text: { de: String(input?.text?.de || "").slice(0, 500), tr: String(input?.text?.tr || "").slice(0, 500) },
    link: {
      url: String(input?.link?.url || "").slice(0, 300),
      label: { de: String(input?.link?.label?.de || "").slice(0, 80), tr: String(input?.link?.label?.tr || "").slice(0, 80) },
    },
    validUntil: input?.validUntil ? String(input.validUntil).slice(0, 10) : null,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

function sanitizeSettings(input, existing = {}) {
  const keys = [
    "sticky_bar", "phone_display", "phone_tel", "email_ordination",
    "email_university", "address", "maps_url", "termin_url",
    "google_scholar_url", "orcid_url", "orcid_id",
  ];
  const out = { ...existing };
  for (const key of keys) {
    if (input?.[key] !== undefined) out[key] = String(input[key]).slice(0, 500);
  }
  return out;
}

function sanitizeHome(input, existing = {}) {
  const out = { ...existing };
  const str = (v, max) => (v !== undefined ? String(v).slice(0, max) : undefined);
  const fields = {
    hero_title: 200, hero_image: 200, hero_image_alt: 300, card_logo: 200,
    card_title: 200, card_subtitle: 200, appointments_note: 120, tagline: 1000,
    about_intro: 3000, contact_intro: 2000, anfahrt_text: 2000, kosten_html: 8000,
  };
  for (const [key, max] of Object.entries(fields)) {
    const val = str(input?.[key], max);
    if (val !== undefined) out[key] = val;
  }
  if (Array.isArray(input?.specializations)) {
    out.specializations = input.specializations.slice(0, 20).map((x) =>
      typeof x === "string" ? x.slice(0, 200) : { eintrag: String(x?.eintrag || "").slice(0, 200) },
    );
  }
  if (Array.isArray(input?.benefits)) {
    out.benefits = input.benefits.slice(0, 12).map((b) => ({
      title: String(b?.title || "").slice(0, 200),
      text: String(b?.text || "").slice(0, 2000),
    }));
  }
  return out;
}

function extFromMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    try {
      if (request.method === "GET" && (path === "" || path === "/" || path === "/current")) {
        const { content } = await githubReadPath(env, ANNOUNCEMENT_PATH);
        return json(content || {}, 200, request);
      }

      if (request.method === "POST" && path === "/update") {
        const body = await request.json();
        if (!checkPassword(body, env)) return json({ error: "Falsches Passwort." }, 401, request);
        const announcement = sanitizeAnnouncement(body.announcement);
        const { sha } = await githubReadPath(env, ANNOUNCEMENT_PATH);
        await githubWriteJson(env, ANNOUNCEMENT_PATH, announcement, sha, "Mitteilung aktualisiert (Ordinations-Admin)");
        return json({ ok: true, announcement }, 200, request);
      }

      if (request.method === "GET" && path === "/content") {
        const { content: settings } = await githubReadPath(env, SETTINGS_PATH);
        const { content: home } = await githubReadPath(env, HOME_PATH);
        return json({ settings: settings || {}, home: home || {} }, 200, request);
      }

      if (request.method === "POST" && path === "/content") {
        const body = await request.json();
        if (!checkPassword(body, env)) return json({ error: "Falsches Passwort." }, 401, request);

        const { content: existingSettings, sha: settingsSha } = await githubReadPath(env, SETTINGS_PATH);
        const { content: existingHome, sha: homeSha } = await githubReadPath(env, HOME_PATH);

        if (body.settings) {
          const settings = sanitizeSettings(body.settings, existingSettings || {});
          await githubWriteJson(env, SETTINGS_PATH, settings, settingsSha, "Einstellungen aktualisiert (Ordinations-Admin)");
        }
        if (body.home) {
          const { content: latestHome } = await githubReadPath(env, HOME_PATH);
          const home = sanitizeHome(body.home, latestHome || existingHome || {});
          const { sha: latestSha } = await githubReadPath(env, HOME_PATH);
          await githubWriteJson(env, HOME_PATH, home, latestSha || homeSha, "Startseite aktualisiert (Ordinations-Admin)");
        }

        const { content: settings } = await githubReadPath(env, SETTINGS_PATH);
        const { content: home } = await githubReadPath(env, HOME_PATH);
        return json({ ok: true, settings, home }, 200, request);
      }

      if (request.method === "POST" && path === "/upload-image") {
        const body = await request.json();
        if (!checkPassword(body, env)) return json({ error: "Falsches Passwort." }, 401, request);

        const field = String(body.field || "");
        const homeKey = IMAGE_FIELD_MAP[field];
        if (!homeKey) return json({ error: "Ungültiges Bildfeld." }, 400, request);

        const mime = String(body.contentType || "");
        const ext = extFromMime(mime);
        if (!ext) return json({ error: "Nur JPG, PNG oder WebP erlaubt." }, 400, request);

        const b64 = String(body.dataBase64 || "").replace(/^data:[^;]+;base64,/, "");
        if (!b64) return json({ error: "Keine Bilddaten." }, 400, request);
        if (Math.floor((b64.length * 3) / 4) > MAX_IMAGE_BYTES) {
          return json({ error: "Bild zu groß (max. 4 MB)." }, 400, request);
        }

        const stamp = new Date().toISOString().slice(0, 10);
        const filename = `${field}-${stamp}.${ext}`;
        const imagePath = `${UPLOAD_DIR}/${filename}`;
        const publicPath = `uploads/${filename}`;

        const { sha: imgSha } = await githubReadPath(env, imagePath);
        await githubWritePath(env, imagePath, b64, imgSha, `Bild ${field} aktualisiert (Ordinations-Admin)`);

        const { content: existingHome, sha: homeSha } = await githubReadPath(env, HOME_PATH);
        const home = sanitizeHome({ [homeKey]: publicPath }, existingHome || {});
        await githubWriteJson(env, HOME_PATH, home, homeSha, `Bildverweis ${field} aktualisiert (Ordinations-Admin)`);

        return json({ ok: true, field, url: publicPath, home }, 200, request);
      }

      return json({ error: "Not found" }, 404, request);
    } catch (err) {
      return json({ error: err.message || "Server error" }, 500, request);
    }
  },
};
