import { existsSync } from 'node:fs';
import path from 'node:path';

const SAFE_URL_SCHEMES = /^https?:\/\//i;

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.avif',
]);

/**
 * Strip HTML tags and control characters from a string.
 * Preserves newlines in multi-line fields when `keepNewlines` is true.
 */
function stripHtml(str, keepNewlines = false) {
  if (typeof str !== 'string') return str;
  // Remove HTML tags
  let cleaned = str.replace(/<[^>]*>/g, '');
  // Remove null bytes and control chars (keep \n and \t conditionally)
  if (keepNewlines) {
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  return cleaned;
}

/**
 * Validate a URL string has a safe scheme (http/https only).
 * Returns null if unsafe, the original string if safe.
 */
function validateUrlScheme(url) {
  if (!url || typeof url !== 'string') return url;
  if (SAFE_URL_SCHEMES.test(url.trim())) return url;
  return null;
}

/**
 * Validate a local image path:
 * - Must resolve within inputDir (no traversal)
 * - Must have an allowed image extension
 * - Must exist on disk
 * Returns null if invalid.
 */
function validateLocalImagePath(imagePath, inputDir) {
  if (!imagePath || typeof imagePath !== 'string') return null;

  const absInput = path.resolve(inputDir);
  const absImage = path.resolve(inputDir, imagePath);

  // Path traversal check
  if (!absImage.startsWith(absInput + path.sep) && absImage !== absInput) {
    return null;
  }

  // Extension check
  const ext = path.extname(absImage).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return null;
  }

  // Existence check
  if (!existsSync(absImage)) {
    return null;
  }

  return imagePath;
}

/**
 * Validate an image field value (URL or local path).
 * Returns { value, warning } where value is the sanitized
 * path/URL or null, and warning is a message if rejected.
 */
function validateImage(imagePath, inputDir, fieldLabel) {
  if (!imagePath || typeof imagePath !== 'string') return { value: null };

  // HTTP(S) URLs pass through
  if (SAFE_URL_SCHEMES.test(imagePath.trim())) {
    return { value: imagePath };
  }

  // Reject non-http URL schemes (javascript:, data:, file:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(imagePath.trim())) {
    return {
      value: null,
      warning: `${fieldLabel}: unsafe URL scheme rejected — "${imagePath}"`,
    };
  }

  // Treat as local path
  const validated = validateLocalImagePath(imagePath, inputDir);
  if (!validated) {
    return {
      value: null,
      warning: `${fieldLabel}: invalid local image path — "${imagePath}" (must be an existing image file within the input directory)`,
    };
  }

  return { value: validated };
}

/**
 * Validate a URL field (href, not image).
 * Returns { value, warning }.
 */
function validateUrl(url, fieldLabel) {
  if (!url || typeof url !== 'string') return { value: url };

  const safe = validateUrlScheme(url);
  if (safe) return { value: safe };

  return {
    value: null,
    warning: `${fieldLabel}: unsafe URL scheme rejected — only http/https allowed, got "${url}"`,
  };
}

/**
 * Sanitize exhibition data in-place on a deep clone.
 * Returns { data, warnings } where warnings is an array of strings.
 */
export function sanitizeData(data, inputDir = '.') {
  const d = structuredClone(data);
  const warnings = [];

  // --- Text fields: strip HTML tags and control characters ---

  // Multi-line fields (preserve newlines)
  const multiLineFields = ['description'];
  for (const field of multiLineFields) {
    if (d[field]) d[field] = stripHtml(d[field], true);
  }

  // Single-line top-level fields
  if (d.title) d.title = stripHtml(d.title);
  if (d.subtitle) d.subtitle = stripHtml(d.subtitle);

  // Venue
  if (d.venue) {
    for (const key of ['name', 'address', 'city', 'state', 'postalCode', 'country']) {
      if (d.venue[key]) d.venue[key] = stripHtml(d.venue[key]);
    }
    for (const key of ['website', 'mapUrl']) {
      if (d.venue[key]) {
        const result = validateUrl(d.venue[key], `venue.${key}`);
        d.venue[key] = result.value;
        if (result.warning) warnings.push(result.warning);
        if (!result.value) delete d.venue[key];
      }
    }
  }

  // Artists
  if (d.artists) {
    d.artists.forEach((artist, i) => {
      for (const key of ['name', 'nationality']) {
        if (artist[key]) artist[key] = stripHtml(artist[key]);
      }
      if (artist.bio) artist.bio = stripHtml(artist.bio, true);

      if (artist.website) {
        const result = validateUrl(artist.website, `artists[${i}].website`);
        artist.website = result.value;
        if (result.warning) warnings.push(result.warning);
        if (!result.value) delete artist.website;
      }

      if (artist.photo) {
        const result = validateImage(artist.photo, inputDir, `artists[${i}].photo`);
        artist.photo = result.value;
        if (result.warning) warnings.push(result.warning);
        if (!result.value) delete artist.photo;
      }
    });
  }

  // Artworks
  if (d.artworks) {
    d.artworks.forEach((work, i) => {
      for (const key of ['title', 'artist', 'medium', 'dimensions', 'price']) {
        if (work[key]) work[key] = stripHtml(work[key]);
      }
      if (work.description) work.description = stripHtml(work.description, true);
      if (typeof work.year === 'string') work.year = stripHtml(work.year);

      if (work.image) {
        const result = validateImage(work.image, inputDir, `artworks[${i}].image`);
        work.image = result.value;
        if (result.warning) warnings.push(result.warning);
        if (!result.value) delete work.image;
      }
    });
  }

  // Curator
  if (d.curator) {
    if (d.curator.name) d.curator.name = stripHtml(d.curator.name);
    if (d.curator.bio) d.curator.bio = stripHtml(d.curator.bio, true);

    if (d.curator.photo) {
      const result = validateImage(d.curator.photo, inputDir, 'curator.photo');
      d.curator.photo = result.value;
      if (result.warning) warnings.push(result.warning);
      if (!result.value) delete d.curator.photo;
    }
  }

  // Opening hours
  if (d.openingHours) {
    d.openingHours.forEach((entry) => {
      if (entry.days) entry.days = stripHtml(entry.days);
      if (entry.hours) entry.hours = stripHtml(entry.hours);
    });
  }

  // Admission
  if (d.admission) {
    for (const key of ['general', 'concession', 'children', 'notes']) {
      if (d.admission[key]) d.admission[key] = stripHtml(d.admission[key]);
    }
  }

  // Links
  if (d.links) {
    for (const key of ['website', 'instagram', 'twitter', 'facebook', 'ticketing']) {
      if (d.links[key]) {
        const result = validateUrl(d.links[key], `links.${key}`);
        d.links[key] = result.value;
        if (result.warning) warnings.push(result.warning);
        if (!result.value) delete d.links[key];
      }
    }
  }

  // Inquiry email — strip tags only (format validated by schema)
  if (d.inquiryEmail) d.inquiryEmail = stripHtml(d.inquiryEmail);

  return { data: d, warnings };
}
