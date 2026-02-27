import { getStyles } from './styles.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function textToParagraphs(text) {
  if (!text) return '';
  return text
    .split(/\n\n|\n/)
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join('\n          ');
}

function renderHero(data) {
  const dateRange = `${formatDate(data.dates.start)} &ndash; ${formatDate(data.dates.end)}`;

  return `
  <header class="hero">
    <div class="container">
      <h1>${escapeHtml(data.title)}</h1>
      ${data.subtitle ? `<p class="subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
      <p class="dates">${dateRange}</p>
      <p class="venue-name">${escapeHtml(data.venue.name)}</p>
    </div>
  </header>`;
}

function renderAbout(data) {
  if (!data.description && !data.curator) return '';

  let curatorHtml = '';
  if (data.curator?.name) {
    const photo = data.curator.photo
      ? `<img src="${escapeHtml(data.curator.photo)}" alt="${escapeHtml(data.curator.name)}">`
      : '';
    curatorHtml = `
      <div class="curator-card">
        ${photo}
        <div>
          <p class="curator-label">Curator</p>
          <p class="curator-name">${escapeHtml(data.curator.name)}</p>
          ${data.curator.bio ? `<p class="curator-bio">${escapeHtml(data.curator.bio)}</p>` : ''}
        </div>
      </div>`;
  }

  return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">About the Exhibition</h2>
      ${data.description ? `<div class="about-text">${textToParagraphs(data.description)}</div>` : ''}
      ${curatorHtml}
    </div>
  </section>`;
}

function renderArtists(data) {
  const cards = data.artists
    .map((artist) => {
      const photo = artist.photo
        ? `<img src="${escapeHtml(artist.photo)}" alt="${escapeHtml(artist.name)}">`
        : '';

      const metaParts = [];
      if (artist.nationality) metaParts.push(escapeHtml(artist.nationality));
      if (artist.birthYear) metaParts.push(`b. ${artist.birthYear}`);
      const meta = metaParts.length
        ? `<p class="artist-meta">${metaParts.join(' · ')}</p>`
        : '';

      const name = artist.website
        ? `<a href="${escapeHtml(artist.website)}" target="_blank" rel="noopener">${escapeHtml(artist.name)}</a>`
        : escapeHtml(artist.name);

      return `
        <div class="artist-card">
          ${photo}
          <p class="artist-name">${name}</p>
          ${meta}
          ${artist.bio ? `<p class="artist-bio">${escapeHtml(artist.bio)}</p>` : ''}
        </div>`;
    })
    .join('');

  return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">Artists</h2>
      <div class="artists-grid">
        ${cards}
      </div>
    </div>
  </section>`;
}

function renderGallery(data) {
  const cards = data.artworks
    .map((work) => {
      const image = work.image
        ? `<img class="artwork-image" src="${escapeHtml(work.image)}" alt="${escapeHtml(work.title)}">`
        : '';

      const details = [];
      if (work.year) details.push(escapeHtml(String(work.year)));
      if (work.medium) details.push(escapeHtml(work.medium));
      if (work.dimensions) details.push(escapeHtml(work.dimensions));

      return `
        <div class="artwork-card">
          ${image}
          <div class="artwork-info">
            <p class="artwork-title">${escapeHtml(work.title)}</p>
            ${work.artist ? `<p class="artwork-artist">${escapeHtml(work.artist)}</p>` : ''}
            ${details.length ? `<p class="artwork-details">${details.join(' · ')}</p>` : ''}
            ${work.description ? `<p class="artwork-details">${escapeHtml(work.description)}</p>` : ''}
            <p class="artwork-price">${data.inquiryEmail
              ? `<a href="mailto:${escapeHtml(data.inquiryEmail)}?subject=${encodeURIComponent('Inquiry: ' + work.title)}">Inquire</a>`
              : 'Inquire'}</p>
          </div>
        </div>`;
    })
    .join('');

  return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">Gallery</h2>
      <div class="gallery-grid">
        ${cards}
      </div>
    </div>
  </section>`;
}

function renderVisitorInfo(data) {
  const hasHours = data.openingHours?.length > 0;
  const hasAdmission = data.admission && Object.keys(data.admission).length > 0;
  const hasAddress = data.venue.address || data.venue.city;

  if (!hasHours && !hasAdmission && !hasAddress) return '';

  let hoursBlock = '';
  if (hasHours) {
    const rows = data.openingHours
      .map(
        (h) =>
          `<tr><td>${escapeHtml(h.days)}</td><td>${escapeHtml(h.hours)}</td></tr>`
      )
      .join('');
    hoursBlock = `
      <div class="info-block">
        <h3>Opening Hours</h3>
        <table class="hours-table">
          ${rows}
        </table>
      </div>`;
  }

  let admissionBlock = '';
  if (hasAdmission) {
    const items = [];
    if (data.admission.general)
      items.push(`<li><span>General</span><span>${escapeHtml(data.admission.general)}</span></li>`);
    if (data.admission.concession)
      items.push(`<li><span>Concession</span><span>${escapeHtml(data.admission.concession)}</span></li>`);
    if (data.admission.children)
      items.push(`<li><span>Children</span><span>${escapeHtml(data.admission.children)}</span></li>`);

    admissionBlock = `
      <div class="info-block">
        <h3>Admission</h3>
        <ul class="admission-list">
          ${items.join('\n          ')}
        </ul>
        ${data.admission.notes ? `<p class="admission-notes">${escapeHtml(data.admission.notes)}</p>` : ''}
      </div>`;
  }

  let addressBlock = '';
  if (hasAddress) {
    const addressParts = [];
    if (data.venue.address) addressParts.push(`<p>${escapeHtml(data.venue.address)}</p>`);
    const cityLine = [data.venue.city, data.venue.state, data.venue.postalCode]
      .filter(Boolean)
      .map(escapeHtml)
      .join(', ');
    if (cityLine) addressParts.push(`<p>${cityLine}</p>`);
    if (data.venue.country) addressParts.push(`<p>${escapeHtml(data.venue.country)}</p>`);

    const links = [];
    if (data.venue.mapUrl)
      links.push(`<a href="${escapeHtml(data.venue.mapUrl)}" class="info-link" target="_blank" rel="noopener">View Map</a>`);
    if (data.venue.website)
      links.push(`<a href="${escapeHtml(data.venue.website)}" class="info-link" target="_blank" rel="noopener">Website</a>`);
    if (data.links?.ticketing)
      links.push(`<a href="${escapeHtml(data.links.ticketing)}" class="info-link" target="_blank" rel="noopener">Buy Tickets</a>`);

    addressBlock = `
      <div class="info-block">
        <h3>Location</h3>
        <div class="address-block">
          ${addressParts.join('\n          ')}
          ${links.length ? links.join('\n          ') : ''}
        </div>
      </div>`;
  }

  return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">Visitor Information</h2>
      <div class="visitor-info">
        ${hoursBlock}
        ${admissionBlock}
        ${addressBlock}
      </div>
    </div>
  </section>`;
}

function renderFooter(data) {
  const socialLinks = [];
  if (data.links?.website)
    socialLinks.push(`<a href="${escapeHtml(data.links.website)}" target="_blank" rel="noopener">Website</a>`);
  if (data.links?.instagram)
    socialLinks.push(`<a href="${escapeHtml(data.links.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  if (data.links?.twitter)
    socialLinks.push(`<a href="${escapeHtml(data.links.twitter)}" target="_blank" rel="noopener">Twitter</a>`);
  if (data.links?.facebook)
    socialLinks.push(`<a href="${escapeHtml(data.links.facebook)}" target="_blank" rel="noopener">Facebook</a>`);

  const year = new Date().getFullYear();

  return `
  <footer class="footer">
    <div class="container">
      <p class="footer-title">${escapeHtml(data.title)}</p>
      <p class="footer-venue">${escapeHtml(data.venue.name)}</p>
      ${socialLinks.length ? `<div class="social-links">${socialLinks.join('\n        ')}</div>` : ''}
      <p class="copyright">&copy; ${year} ${escapeHtml(data.venue.name)}. All rights reserved.</p>
    </div>
  </footer>`;
}

export function generateHtml(data, theme = 'light') {
  const css = getStyles(theme);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} | ${escapeHtml(data.venue.name)}</title>
  <meta name="description" content="${escapeHtml(data.subtitle || data.title)} at ${escapeHtml(data.venue.name)}">
  <style>
    ${css}
  </style>
</head>
<body>
  ${renderHero(data)}
  ${renderAbout(data)}
  ${renderArtists(data)}
  ${renderGallery(data)}
  ${renderVisitorInfo(data)}
  ${renderFooter(data)}
</body>
</html>`;
}
