import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const settings = JSON.parse(fs.readFileSync(path.join(root, 'content/settings.json'), 'utf8'));
const home = JSON.parse(fs.readFileSync(path.join(root, 'content/de/home.json'), 'utf8'));

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

fs.writeFileSync(path.join(root, 'index.html'), $.html(), 'utf8');
console.log('✓ index.html erstellt');
