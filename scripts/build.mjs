import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const settings = JSON.parse(fs.readFileSync(path.join(root, 'content/settings.json'), 'utf8'));
const home = JSON.parse(fs.readFileSync(path.join(root, 'content/de/home.json'), 'utf8'));
const announcementsPath = path.join(root, 'content/announcements.json');
const announcements = fs.existsSync(announcementsPath)
  ? JSON.parse(fs.readFileSync(announcementsPath, 'utf8'))
  : { active: false };

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function announcementActive(a) {
  if (!a?.active) return false;
  if (a.validUntil) {
    const end = new Date(`${a.validUntil}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && end < new Date()) return false;
  }
  const de = a.title?.de?.trim() || a.text?.de?.trim();
  const tr = a.title?.tr?.trim() || a.text?.tr?.trim();
  return Boolean(de || tr);
}

const listItems = (arr) =>
  (arr || []).map((x) => (typeof x === 'string' ? x : x.eintrag || x.item || Object.values(x)[0]));

let html = fs.readFileSync(path.join(root, 'templates/index.html'), 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

// Sticky bar & contact
$('.sticky-wahlarzt-link').text(settings.sticky_bar).attr('href', `tel:${settings.phone_tel}`);
$('[data-cms="phone"]').text(settings.phone_display).attr('href', `tel:${settings.phone_tel}`);
$('[data-cms="email"]').text(settings.email_ordination).attr('href', `mailto:${settings.email_ordination}`);
$('[data-cms="address"]').text(settings.address).attr('href', settings.maps_url);

// Hero
$('.hero-platz-title').text(home.hero_title);
$('.hero-platz-img').attr({ src: home.hero_image, alt: home.hero_image_alt });
$('.index-card-logo').attr('src', home.card_logo);
$('.index-card-title').text(home.card_title);
$('.index-card-sub').text(home.card_subtitle);

const specList = $('.index-card-list').empty();
listItems(home.specializations).forEach((s) => specList.append(`<li>${s}</li>`));

$('.index-card-right > p').filter((_, el) => $(el).text().trim() === 'Termine nach Vereinbarung' || $(el).text().includes('Termine nach')).first().text(home.appointments_note);
$('.wahlarzt-tagline').text(home.tagline);

// Benefits
const benefitGrid = $('.benefit-grid').empty();
home.benefits.forEach((b) => {
  benefitGrid.append(
    `<li class="benefit-item"><span class="benefit-icon" aria-hidden="true">⊕</span><strong>${b.title}</strong><br>${b.text}</li>`
  );
});

// Kosten
$('#kosten .cost-block').html(home.kosten_html);

// Über mich intro
$('#ueber-mich .prose').first().find('p').first().text(home.about_intro);

// Klinische Schwerpunkte
const focusList = $('#klinik .focus-list').empty();
listItems(home.clinical_focus).forEach((f) => focusList.append(`<li>${f}</li>`));

// Publikationen
const pubList = $('.publication-list').empty();
home.publications.forEach((p) => {
  pubList.append(
    `<li><cite>${p.title}</cite><span class="journal">${p.journal} <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="index-card-link">${p.link_label}</a></span></li>`
  );
});

// Videos
const videoGrid = $('.video-grid').empty();
home.videos.forEach((v) => {
  videoGrid.append(`
    <div class="video-card">
      <p class="video-card-label">${v.label}</p>
      <div class="video-wrap">
        <iframe src="https://www.youtube-nocookie.com/embed/${v.youtube_id}?rel=0" title="${v.label}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>
      <p class="video-card-link-wrap"><a href="https://www.youtube.com/watch?v=${v.youtube_id}" target="_blank" rel="noopener noreferrer" class="index-card-link">Video auf YouTube ansehen</a></p>
    </div>`);
});

// Kontakt
$('.contact-intro').text(home.contact_intro);
$('#kontakt .contact-block p').each((_, el) => {
  const t = $(el).html();
  if (t && t.includes('<strong>Anfahrt:</strong>')) {
    $(el).html(`<strong>Anfahrt:</strong> ${home.anfahrt_text}`);
  }
});

// Tel/mail in contact block
$('#kontakt a[href^="mailto:"]').attr('href', `mailto:${settings.email_ordination}`).text(settings.email_ordination);
$('#kontakt a[href^="tel:"]').attr('href', `tel:${settings.phone_tel}`).text(settings.phone_display);

// Mitteilungen / Aktuelles
if (announcementActive(announcements)) {
  const variant = ['info', 'warning', 'urgent'].includes(announcements.variant)
    ? announcements.variant
    : 'info';
  const titleDe = announcements.title?.de?.trim() || '';
  const textDe = announcements.text?.de?.trim() || '';
  const linkUrl = announcements.link?.url?.trim() || '';
  const linkLabel = announcements.link?.label?.de?.trim() || '';

  let bannerHtml = `<div class="announcement-inner announcement-${variant}">`;
  if (titleDe) bannerHtml += `<strong>${esc(titleDe)}</strong> `;
  if (textDe) bannerHtml += `<span>${esc(textDe)}</span>`;
  if (linkUrl && linkLabel) {
    bannerHtml += ` <a href="${esc(linkUrl)}">${esc(linkLabel)}</a>`;
  }
  bannerHtml += '</div>';

  $('#announcement-banner').removeAttr('hidden').html(bannerHtml);

  let panelHtml = `<div class="aktuelles-card aktuelles-${variant}">`;
  if (titleDe) panelHtml += `<p class="aktuelles-title">${esc(titleDe)}</p>`;
  if (textDe) panelHtml += `<p class="aktuelles-text">${esc(textDe)}</p>`;
  if (linkUrl && linkLabel) {
    panelHtml += `<p><a href="${esc(linkUrl)}">${esc(linkLabel)} →</a></p>`;
  }
  panelHtml += '</div>';

  $('#aktuelles-panel').removeAttr('hidden').html(panelHtml);
  $('.nav-aktuelles-dot').removeAttr('hidden');
} else {
  $('#aktuelles-panel')
    .removeAttr('hidden')
    .html('<p class="aktuelles-empty">Keine aktuellen Mitteilungen.</p>');
}

fs.writeFileSync(path.join(root, 'index.html'), $.html(), 'utf8');
console.log('✓ index.html erstellt');
