import express from 'express';
import multer from 'multer';
import archiver from 'archiver';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { validate } from '../src/validator.js';
import { sanitizeData } from '../src/sanitizer.js';
import { processImages } from '../src/imageProcessor.js';
import { generateHtml } from '../src/htmlGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tempDirs = new Set();

function cleanupTemp() {
  for (const dir of tempDirs) {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
process.on('exit', cleanupTemp);
process.on('SIGINT', () => { cleanupTemp(); process.exit(); });
process.on('SIGTERM', () => { cleanupTemp(); process.exit(); });

// Multer storage: save uploads into a per-request temp dir
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    if (!req._uploadDir) {
      const id = randomUUID();
      const dir = path.join(tmpdir(), `exhibit-${id}`, 'input');
      req._sessionId = id;
      req._uploadDir = dir;
      req._baseDir = path.join(tmpdir(), `exhibit-${id}`);
      mkdir(dir, { recursive: true }).then(() => cb(null, dir)).catch(cb);
    } else {
      cb(null, req._uploadDir);
    }
  },
  filename(_req, file, cb) {
    // Preserve original name but make unique with a prefix
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter(_req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image type: ${file.originalname}`));
    }
  },
});

/**
 * Build the exhibition JSON data object from flat form fields + uploaded files.
 */
function buildExhibitionData(fields, files) {
  const data = {};

  // Top-level text fields
  if (fields.title) data.title = fields.title;
  if (fields.subtitle) data.subtitle = fields.subtitle;
  if (fields.description) data.description = fields.description;
  if (fields.theme) data.theme = fields.theme;
  if (fields.inquiryEmail) data.inquiryEmail = fields.inquiryEmail;

  // Dates
  if (fields['dates.start'] || fields['dates.end']) {
    data.dates = {};
    if (fields['dates.start']) data.dates.start = fields['dates.start'];
    if (fields['dates.end']) data.dates.end = fields['dates.end'];
  }

  // Venue
  data.venue = {};
  for (const key of ['name', 'address', 'city', 'state', 'postalCode', 'country', 'website', 'mapUrl']) {
    const val = fields[`venue.${key}`];
    if (val) data.venue[key] = val;
  }

  // Artists (array)
  data.artists = buildArray(fields, 'artists', ['name', 'bio', 'nationality', 'website'], ['birthYear']);

  // Map uploaded artist photos
  if (files) {
    for (const file of files) {
      const match = file.fieldname.match(/^artist_photo_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (data.artists[idx]) {
          data.artists[idx].photo = file.filename;
        }
      }
    }
  }

  // Artworks (array)
  data.artworks = buildArray(fields, 'artworks', ['title', 'artist', 'medium', 'dimensions', 'description', 'price'], [], ['year']);

  // Map uploaded artwork images
  if (files) {
    for (const file of files) {
      const match = file.fieldname.match(/^artwork_image_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (data.artworks[idx]) {
          data.artworks[idx].image = file.filename;
        }
      }
    }
  }

  // Also handle artwork image URLs (when no file uploaded)
  const artworkCount = data.artworks.length;
  for (let i = 0; i < artworkCount; i++) {
    const urlVal = fields[`artworks[${i}].imageUrl`];
    if (urlVal && !data.artworks[i].image) {
      data.artworks[i].image = urlVal;
    }
  }

  // Artist photo URLs
  const artistCount = data.artists.length;
  for (let i = 0; i < artistCount; i++) {
    const urlVal = fields[`artists[${i}].photoUrl`];
    if (urlVal && !data.artists[i].photo) {
      data.artists[i].photo = urlVal;
    }
  }

  // Curator (optional)
  if (fields['curator.name'] || fields['curator.bio']) {
    data.curator = {};
    if (fields['curator.name']) data.curator.name = fields['curator.name'];
    if (fields['curator.bio']) data.curator.bio = fields['curator.bio'];

    // Curator photo upload
    if (files) {
      const curatorPhoto = files.find(f => f.fieldname === 'curator_photo');
      if (curatorPhoto) {
        data.curator.photo = curatorPhoto.filename;
      }
    }
    const curatorPhotoUrl = fields['curator.photoUrl'];
    if (curatorPhotoUrl && !data.curator?.photo) {
      data.curator.photo = curatorPhotoUrl;
    }
  }

  // Opening hours (array, optional)
  const hours = buildArray(fields, 'openingHours', ['days', 'hours']);
  if (hours.length > 0 && hours.some(h => h.days || h.hours)) {
    data.openingHours = hours.filter(h => h.days || h.hours);
  }

  // Admission (optional)
  const admissionKeys = ['general', 'concession', 'children', 'notes'];
  const admission = {};
  let hasAdmission = false;
  for (const key of admissionKeys) {
    const val = fields[`admission.${key}`];
    if (val) { admission[key] = val; hasAdmission = true; }
  }
  if (hasAdmission) data.admission = admission;

  // Links (optional)
  const linkKeys = ['website', 'instagram', 'twitter', 'facebook', 'ticketing'];
  const links = {};
  let hasLinks = false;
  for (const key of linkKeys) {
    const val = fields[`links.${key}`];
    if (val) { links[key] = val; hasLinks = true; }
  }
  if (hasLinks) data.links = links;

  return data;
}

/**
 * Build an array of objects from flat form fields like "artists[0].name", "artists[1].bio", etc.
 */
function buildArray(fields, prefix, stringKeys, intKeys = [], flexKeys = []) {
  const items = [];
  // Find the max index
  let maxIndex = -1;
  const pattern = new RegExp(`^${prefix}\\[(\\d+)\\]\\.`);
  for (const key of Object.keys(fields)) {
    const m = key.match(pattern);
    if (m) {
      const idx = parseInt(m[1], 10);
      if (idx > maxIndex) maxIndex = idx;
    }
  }

  for (let i = 0; i <= maxIndex; i++) {
    const item = {};
    for (const k of stringKeys) {
      const val = fields[`${prefix}[${i}].${k}`];
      if (val) item[k] = val;
    }
    for (const k of intKeys) {
      const val = fields[`${prefix}[${i}].${k}`];
      if (val) {
        const n = parseInt(val, 10);
        if (!isNaN(n)) item[k] = n;
      }
    }
    for (const k of flexKeys) {
      const val = fields[`${prefix}[${i}].${k}`];
      if (val) {
        const n = parseInt(val, 10);
        // If it's a pure integer, store as integer; otherwise keep as string
        if (!isNaN(n) && String(n) === val.trim()) {
          item[k] = n;
        } else {
          item[k] = val;
        }
      }
    }
    if (Object.keys(item).length > 0) items.push(item);
  }
  return items;
}

/**
 * Run the full pipeline: validate → sanitize → processImages → generateHtml
 */
async function runPipeline(data, inputDir, outputDir, theme) {
  // Validate
  const result = await validate(data);
  if (!result.valid) {
    return { error: true, status: 400, errors: result.errors };
  }

  // Sanitize
  const { data: sanitized, warnings } = sanitizeData(data, inputDir);

  // Resolve theme
  const resolvedTheme = theme || sanitized.theme || 'light';

  // Process images
  const processed = await processImages(sanitized, inputDir, outputDir);

  // Generate HTML
  const html = generateHtml(processed, resolvedTheme);

  return { error: false, html, warnings, hasLocalImages: checkForLocalImages(outputDir) };
}

function checkForLocalImages(outputDir) {
  const imagesDir = path.join(outputDir, 'images');
  return existsSync(imagesDir);
}

export function startServer(port = 3000) {
  const app = express();

  // Serve static files
  app.use('/public', express.static(path.join(__dirname, 'public')));

  // Serve index.html at root
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Serve uploaded images for preview
  app.get('/uploads/:id/images/:filename', (req, res) => {
    const filePath = path.join(tmpdir(), `exhibit-${req.params.id}`, 'output', 'images', req.params.filename);
    if (!existsSync(filePath)) {
      return res.status(404).send('Image not found');
    }
    res.sendFile(filePath);
  });

  // Preview endpoint
  app.post('/api/preview', upload.any(), async (req, res) => {
    try {
      const sessionId = req._sessionId || randomUUID();
      const inputDir = req._uploadDir || path.join(tmpdir(), `exhibit-${sessionId}`, 'input');
      const baseDir = req._baseDir || path.join(tmpdir(), `exhibit-${sessionId}`);
      const outputDir = path.join(baseDir, 'output');

      await mkdir(inputDir, { recursive: true });
      await mkdir(outputDir, { recursive: true });
      tempDirs.add(baseDir);

      const data = buildExhibitionData(req.body, req.files);
      const result = await runPipeline(data, inputDir, outputDir, req.body.theme);

      if (result.error) {
        return res.status(result.status).json({ errors: result.errors });
      }

      // Rewrite local image paths for preview serving
      let html = result.html;
      html = html.replace(/src="images\//g, `src="/uploads/${sessionId}/images/`);

      res.type('html').send(html);
    } catch (err) {
      console.error('Preview error:', err);
      res.status(500).json({ errors: [`Server error: ${err.message}`] });
    }
  });

  // Download endpoint
  app.post('/api/download', upload.any(), async (req, res) => {
    try {
      const sessionId = req._sessionId || randomUUID();
      const inputDir = req._uploadDir || path.join(tmpdir(), `exhibit-${sessionId}`, 'input');
      const baseDir = req._baseDir || path.join(tmpdir(), `exhibit-${sessionId}`);
      const outputDir = path.join(baseDir, 'output');

      await mkdir(inputDir, { recursive: true });
      await mkdir(outputDir, { recursive: true });
      tempDirs.add(baseDir);

      const data = buildExhibitionData(req.body, req.files);
      const result = await runPipeline(data, inputDir, outputDir, req.body.theme);

      if (result.error) {
        return res.status(result.status).json({ errors: result.errors });
      }

      // Write index.html to output
      const htmlPath = path.join(outputDir, 'index.html');
      await writeFile(htmlPath, result.html, 'utf-8');

      if (result.hasLocalImages) {
        // Zip the output directory
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="exhibition.zip"');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { throw err; });
        archive.pipe(res);
        archive.directory(outputDir, false);
        await archive.finalize();
      } else {
        // Just send the HTML file
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'attachment; filename="exhibition.html"');
        res.send(result.html);
      }
    } catch (err) {
      console.error('Download error:', err);
      res.status(500).json({ errors: [`Server error: ${err.message}`] });
    }
  });

  const server = app.listen(port, () => {
    console.log(`Exhibition Page Generator running at http://localhost:${port}`);
  });

  return server;
}
