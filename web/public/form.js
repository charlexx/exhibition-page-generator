// -- Dynamic array management --

let artistCount = 1;
let artworkCount = 1;
let hoursCount = 0;

function reindexEntries(containerId, prefix, labelPrefix) {
  const container = document.getElementById(containerId);
  const entries = container.querySelectorAll('.array-entry');
  entries.forEach((entry, i) => {
    entry.dataset.index = i;
    entry.querySelector('.entry-label').textContent = `${labelPrefix} #${i + 1}`;

    // Reindex all input/textarea/select names
    entry.querySelectorAll('input, textarea, select').forEach((el) => {
      if (el.name) {
        el.name = el.name.replace(/\[\d+\]/, `[${i}]`);
        // Also reindex file inputs like artist_photo_0 -> artist_photo_1
        el.name = el.name.replace(new RegExp(`${prefix.slice(0, -1)}_photo_\\d+`), `${prefix.slice(0, -1)}_photo_${i}`);
        el.name = el.name.replace(new RegExp(`${prefix.slice(0, -1)}_image_\\d+`), `${prefix.slice(0, -1)}_image_${i}`);
      }
    });

    // Enable/disable remove buttons
    const removeBtn = entry.querySelector('.btn-remove');
    removeBtn.disabled = entries.length <= 1;
  });
}

function addArtist() {
  const container = document.getElementById('artists-container');
  const index = container.querySelectorAll('.array-entry').length;
  artistCount = index + 1;

  const entry = document.createElement('div');
  entry.className = 'array-entry';
  entry.dataset.index = index;
  entry.innerHTML = `
    <div class="entry-header">
      <span class="entry-label">Artist #${index + 1}</span>
      <button type="button" class="btn-remove" data-target="artists" title="Remove artist">&times;</button>
    </div>
    <div class="form-group">
      <label>Name <span class="required">*</span></label>
      <input type="text" name="artists[${index}].name" required maxlength="200" class="artist-name-input" placeholder="Artist name">
    </div>
    <div class="form-group">
      <label>Bio</label>
      <textarea name="artists[${index}].bio" maxlength="2000" rows="3" placeholder="Artist biography..."></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nationality</label>
        <input type="text" name="artists[${index}].nationality" maxlength="100">
      </div>
      <div class="form-group">
        <label>Birth Year</label>
        <input type="number" name="artists[${index}].birthYear" min="1000" max="2100">
      </div>
    </div>
    <div class="form-group">
      <label>Website</label>
      <input type="url" name="artists[${index}].website" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>Photo (upload)</label>
      <input type="file" name="artist_photo_${index}" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif">
    </div>
    <div class="form-group">
      <label>Photo URL (or enter a URL instead)</label>
      <input type="url" name="artists[${index}].photoUrl" placeholder="https://...">
    </div>
  `;

  container.appendChild(entry);
  reindexEntries('artists-container', 'artists', 'Artist');
  syncArtistDropdowns();
}

function addArtwork() {
  const container = document.getElementById('artworks-container');
  const index = container.querySelectorAll('.array-entry').length;
  artworkCount = index + 1;

  const entry = document.createElement('div');
  entry.className = 'array-entry';
  entry.dataset.index = index;
  entry.innerHTML = `
    <div class="entry-header">
      <span class="entry-label">Artwork #${index + 1}</span>
      <button type="button" class="btn-remove" data-target="artworks" title="Remove artwork">&times;</button>
    </div>
    <div class="form-group">
      <label>Title <span class="required">*</span></label>
      <input type="text" name="artworks[${index}].title" required maxlength="300" placeholder="Artwork title">
    </div>
    <div class="form-group">
      <label>Artist</label>
      <select name="artworks[${index}].artist" class="artwork-artist-select">
        <option value="">-- Select artist --</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Year</label>
        <input type="text" name="artworks[${index}].year" maxlength="50" placeholder="e.g. 2025 or 2024-2025">
      </div>
      <div class="form-group">
        <label>Medium</label>
        <input type="text" name="artworks[${index}].medium" maxlength="300" placeholder="e.g. Oil on canvas">
      </div>
    </div>
    <div class="form-group">
      <label>Dimensions</label>
      <input type="text" name="artworks[${index}].dimensions" maxlength="200" placeholder="e.g. 180 x 240 cm">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea name="artworks[${index}].description" maxlength="3000" rows="2" placeholder="Artwork description..."></textarea>
    </div>
    <div class="form-group">
      <label>Price (internal only, not displayed)</label>
      <input type="text" name="artworks[${index}].price" maxlength="100" placeholder="e.g. $5,000">
    </div>
    <div class="form-group">
      <label>Image (upload)</label>
      <input type="file" name="artwork_image_${index}" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif">
    </div>
    <div class="form-group">
      <label>Image URL (or enter a URL instead)</label>
      <input type="url" name="artworks[${index}].imageUrl" placeholder="https://...">
    </div>
  `;

  container.appendChild(entry);
  reindexEntries('artworks-container', 'artworks', 'Artwork');
  syncArtistDropdowns();
}

function addHoursEntry() {
  const container = document.getElementById('hours-container');
  const index = container.querySelectorAll('.array-entry').length;
  hoursCount = index + 1;

  const entry = document.createElement('div');
  entry.className = 'array-entry';
  entry.dataset.index = index;
  entry.innerHTML = `
    <div class="entry-header">
      <span class="entry-label">Hours #${index + 1}</span>
      <button type="button" class="btn-remove" data-target="hours" title="Remove entry">&times;</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Days</label>
        <input type="text" name="openingHours[${index}].days" maxlength="100" placeholder="e.g. Monday - Friday">
      </div>
      <div class="form-group">
        <label>Hours</label>
        <input type="text" name="openingHours[${index}].hours" maxlength="100" placeholder="e.g. 10:00 AM - 6:00 PM">
      </div>
    </div>
  `;

  container.appendChild(entry);
  // Enable all remove buttons if more than one
  const entries = container.querySelectorAll('.array-entry');
  entries.forEach((e) => {
    e.querySelector('.btn-remove').disabled = entries.length <= 1;
  });
}

function removeEntry(button) {
  const entry = button.closest('.array-entry');
  const section = entry.parentElement;
  const entries = section.querySelectorAll('.array-entry');
  if (entries.length <= 1 && !section.id.includes('hours')) return;

  entry.remove();

  if (section.id === 'artists-container') {
    reindexEntries('artists-container', 'artists', 'Artist');
    syncArtistDropdowns();
  } else if (section.id === 'artworks-container') {
    reindexEntries('artworks-container', 'artworks', 'Artwork');
  } else if (section.id === 'hours-container') {
    const remaining = section.querySelectorAll('.array-entry');
    remaining.forEach((e, i) => {
      e.dataset.index = i;
      e.querySelector('.entry-label').textContent = `Hours #${i + 1}`;
      e.querySelectorAll('input').forEach((inp) => {
        inp.name = inp.name.replace(/\[\d+\]/, `[${i}]`);
      });
      e.querySelector('.btn-remove').disabled = remaining.length <= 1;
    });
  }
}

// -- Artist dropdown sync --

function syncArtistDropdowns() {
  const nameInputs = document.querySelectorAll('.artist-name-input');
  const names = Array.from(nameInputs)
    .map((inp) => inp.value.trim())
    .filter(Boolean);

  const selects = document.querySelectorAll('.artwork-artist-select');
  selects.forEach((select) => {
    const current = select.value;
    const options = ['<option value="">-- Select artist --</option>'];
    names.forEach((name) => {
      const escaped = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      options.push(`<option value="${escaped}"${name === current ? ' selected' : ''}>${escaped}</option>`);
    });
    select.innerHTML = options.join('');
  });
}

// -- Collapsible sections --

function setupCollapsibles() {
  document.querySelectorAll('.collapsible-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      const content = toggle.nextElementSibling;
      content.hidden = expanded;
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  });
}

// -- Preview & Download --

function collectFormData() {
  const form = document.getElementById('exhibitionForm');
  const formData = new FormData(form);
  return formData;
}

function showErrors(errors) {
  const container = document.getElementById('error-container');
  const list = document.getElementById('error-list');
  list.innerHTML = '';
  errors.forEach((err) => {
    const li = document.createElement('li');
    li.textContent = err;
    list.appendChild(li);
  });
  container.hidden = false;
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearErrors() {
  const container = document.getElementById('error-container');
  container.hidden = true;
  document.getElementById('error-list').innerHTML = '';
}

async function handlePreview() {
  const btn = document.getElementById('btn-preview');
  const origText = btn.textContent;
  btn.textContent = 'Generating...';
  btn.disabled = true;
  clearErrors();

  try {
    const formData = collectFormData();
    const resp = await fetch('/api/preview', { method: 'POST', body: formData });

    if (!resp.ok) {
      const data = await resp.json();
      showErrors(data.errors || ['Unknown error']);
      return;
    }

    const html = await resp.text();
    const iframe = document.getElementById('preview-iframe');
    iframe.srcdoc = html;

    const section = document.getElementById('preview-section');
    section.hidden = false;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showErrors([`Request failed: ${err.message}`]);
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

async function handleDownload() {
  const btn = document.getElementById('btn-download');
  const origText = btn.textContent;
  btn.textContent = 'Preparing...';
  btn.disabled = true;
  clearErrors();

  try {
    const formData = collectFormData();
    const resp = await fetch('/api/download', { method: 'POST', body: formData });

    if (!resp.ok) {
      const data = await resp.json();
      showErrors(data.errors || ['Unknown error']);
      return;
    }

    const contentType = resp.headers.get('content-type') || '';
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = contentType.includes('zip') ? 'exhibition.zip' : 'exhibition.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    showErrors([`Request failed: ${err.message}`]);
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// -- Event listeners --

document.addEventListener('DOMContentLoaded', () => {
  setupCollapsibles();

  document.getElementById('add-artist').addEventListener('click', addArtist);
  document.getElementById('add-artwork').addEventListener('click', addArtwork);
  document.getElementById('add-hours').addEventListener('click', addHoursEntry);

  document.getElementById('btn-preview').addEventListener('click', handlePreview);
  document.getElementById('btn-download').addEventListener('click', handleDownload);

  // Delegated click handler for remove buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove')) {
      removeEntry(e.target);
    }
  });

  // Sync artist dropdowns when artist name changes
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('artist-name-input')) {
      syncArtistDropdowns();
    }
  });
});
