import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { input, confirm, select } from '@inquirer/prompts';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanObj(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      const cleaned = v.map((item) =>
        typeof item === 'object' && item !== null ? cleanObj(item) : item
      );
      if (cleaned.length > 0) out[k] = cleaned;
    } else if (typeof v === 'object') {
      const nested = cleanObj(v);
      if (Object.keys(nested).length > 0) out[k] = nested;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function section(title) {
  console.log(`\n--- ${title} ---\n`);
}

async function promptExhibitionDetails() {
  section('Exhibition Details');

  const title = await input({
    message: 'Exhibition title:',
    validate: (v) => (v.trim() ? true : 'Title is required'),
  });

  const subtitle = await input({
    message: 'Subtitle (optional):',
  });

  const description = await input({
    message: 'Description (optional):',
  });

  return { title: title.trim(), subtitle, description };
}

async function promptDates() {
  section('Dates');

  const start = await input({
    message: 'Start date (YYYY-MM-DD):',
    validate: (v) =>
      DATE_RE.test(v.trim()) ? true : 'Must be YYYY-MM-DD format',
  });

  const end = await input({
    message: 'End date (YYYY-MM-DD):',
    validate: (v) =>
      DATE_RE.test(v.trim()) ? true : 'Must be YYYY-MM-DD format',
  });

  return { start: start.trim(), end: end.trim() };
}

async function promptVenue() {
  section('Venue');

  const name = await input({
    message: 'Venue name:',
    validate: (v) => (v.trim() ? true : 'Venue name is required'),
  });

  const venue = { name: name.trim() };

  const addDetails = await confirm({
    message: 'Add address and links?',
    default: false,
  });

  if (addDetails) {
    venue.address = await input({ message: 'Street address (optional):' });
    venue.city = await input({ message: 'City (optional):' });
    venue.state = await input({ message: 'State/region (optional):' });
    venue.postalCode = await input({ message: 'Postal code (optional):' });
    venue.country = await input({ message: 'Country (optional):' });
    venue.website = await input({ message: 'Website URL (optional):' });
    venue.mapUrl = await input({ message: 'Map URL (optional):' });
  }

  return venue;
}

async function promptArtists() {
  section('Artists');

  const artists = [];

  while (artists.length < 50) {
    console.log(`\n  Artist #${artists.length + 1}`);

    const name = await input({
      message: 'Artist name:',
      validate: (v) => (v.trim() ? true : 'Name is required'),
    });

    const artist = { name: name.trim() };

    const bio = await input({ message: 'Bio (optional):' });
    if (bio) artist.bio = bio;

    const nationality = await input({ message: 'Nationality (optional):' });
    if (nationality) artist.nationality = nationality;

    const birthYearStr = await input({
      message: 'Birth year (optional):',
      validate: (v) => {
        if (!v.trim()) return true;
        const n = Number(v);
        return Number.isInteger(n) && n > 0 ? true : 'Must be a valid year';
      },
    });
    if (birthYearStr.trim()) artist.birthYear = Number(birthYearStr);

    const website = await input({ message: 'Website URL (optional):' });
    if (website) artist.website = website;

    artists.push(artist);

    if (artists.length >= 50) break;

    const addMore = await confirm({
      message: 'Add another artist?',
      default: false,
    });
    if (!addMore) break;
  }

  return artists;
}

async function promptArtworks(artistNames) {
  section('Artworks');

  const artworks = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log(`\n  Artwork #${artworks.length + 1}`);

    const title = await input({
      message: 'Artwork title:',
      validate: (v) => (v.trim() ? true : 'Title is required'),
    });

    const artwork = { title: title.trim() };

    if (artistNames.length > 0) {
      const artist = await select({
        message: 'Artist:',
        choices: [
          ...artistNames.map((n) => ({ name: n, value: n })),
          { name: '(skip)', value: '' },
        ],
      });
      if (artist) artwork.artist = artist;
    }

    const yearStr = await input({ message: 'Year (optional):' });
    if (yearStr.trim()) {
      const n = Number(yearStr);
      artwork.year = Number.isInteger(n) ? n : yearStr.trim();
    }

    const medium = await input({ message: 'Medium (optional):' });
    if (medium) artwork.medium = medium;

    const dimensions = await input({ message: 'Dimensions (optional):' });
    if (dimensions) artwork.dimensions = dimensions;

    const image = await input({ message: 'Image path or URL (optional):' });
    if (image) artwork.image = image;

    const description = await input({ message: 'Description (optional):' });
    if (description) artwork.description = description;

    const price = await input({ message: 'Price (optional):' });
    if (price) artwork.price = price;

    artworks.push(artwork);

    const addMore = await confirm({
      message: 'Add another artwork?',
      default: false,
    });
    if (!addMore) break;
  }

  return artworks;
}

async function promptCurator() {
  section('Curator');

  const add = await confirm({
    message: 'Add curator info?',
    default: false,
  });
  if (!add) return undefined;

  const name = await input({ message: 'Curator name:' });
  const bio = await input({ message: 'Curator bio (optional):' });

  return { name, bio };
}

async function promptOpeningHours() {
  section('Opening Hours');

  const add = await confirm({
    message: 'Add opening hours?',
    default: false,
  });
  if (!add) return undefined;

  const hours = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const days = await input({
      message: 'Days (e.g. "Tuesday - Friday"):',
      validate: (v) => (v.trim() ? true : 'Days are required'),
    });

    const time = await input({
      message: 'Hours (e.g. "10:00 AM - 6:00 PM"):',
      validate: (v) => (v.trim() ? true : 'Hours are required'),
    });

    hours.push({ days: days.trim(), hours: time.trim() });

    const addMore = await confirm({
      message: 'Add another time slot?',
      default: false,
    });
    if (!addMore) break;
  }

  return hours;
}

async function promptAdmission() {
  section('Admission');

  const add = await confirm({
    message: 'Add admission info?',
    default: false,
  });
  if (!add) return undefined;

  const general = await input({ message: 'General admission (e.g. "$12"):' });
  const concession = await input({
    message: 'Concession price (optional):',
  });
  const children = await input({ message: 'Children price (optional):' });
  const notes = await input({ message: 'Additional notes (optional):' });

  return { general, concession, children, notes };
}

async function promptInquiryEmail() {
  section('Contact');

  const add = await confirm({
    message: 'Add inquiry email?',
    default: false,
  });
  if (!add) return undefined;

  const email = await input({
    message: 'Inquiry email:',
    validate: (v) => (v.includes('@') ? true : 'Must be a valid email'),
  });

  return email.trim();
}

async function promptLinks() {
  section('Links');

  const add = await confirm({
    message: 'Add social/web links?',
    default: false,
  });
  if (!add) return undefined;

  const website = await input({ message: 'Website URL (optional):' });
  const instagram = await input({ message: 'Instagram URL (optional):' });
  const twitter = await input({ message: 'Twitter/X URL (optional):' });
  const facebook = await input({ message: 'Facebook URL (optional):' });
  const ticketing = await input({ message: 'Ticketing URL (optional):' });

  return { website, instagram, twitter, facebook, ticketing };
}

async function promptTheme() {
  section('Theme');

  const theme = await select({
    message: 'Choose a theme:',
    choices: [
      { name: 'Light', value: 'light' },
      { name: 'Dark', value: 'dark' },
      { name: 'Minimal', value: 'minimal' },
    ],
  });

  return theme;
}

export async function runInteractive(options = {}) {
  const { output = 'exhibition.json', generate = true } = options;

  console.log('\nExhibition Page Generator - Interactive Setup\n');

  const details = await promptExhibitionDetails();
  const dates = await promptDates();
  const venue = await promptVenue();
  const artists = await promptArtists();
  const artistNames = artists.map((a) => a.name);
  const artworks = await promptArtworks(artistNames);
  const curator = await promptCurator();
  const openingHours = await promptOpeningHours();
  const admission = await promptAdmission();
  const inquiryEmail = await promptInquiryEmail();
  const links = await promptLinks();
  const theme = await promptTheme();

  const data = cleanObj({
    title: details.title,
    subtitle: details.subtitle,
    description: details.description,
    dates,
    venue,
    artists,
    artworks,
    curator,
    openingHours,
    admission,
    inquiryEmail,
    links,
    theme,
  });

  const outPath = path.resolve(output);
  await writeFile(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`\nSaved: ${outPath}`);

  if (generate) {
    const shouldGenerate = await confirm({
      message: 'Generate HTML page now?',
      default: true,
    });

    if (shouldGenerate) {
      const { validate } = await import('./validator.js');
      const { processImages } = await import('./imageProcessor.js');
      const { generateHtml } = await import('./htmlGenerator.js');
      const { writeFile: wf, mkdir } = await import('node:fs/promises');

      const result = await validate(data);
      if (!result.valid) {
        console.error('Validation failed:');
        result.errors.forEach((e) => console.error(e));
        process.exit(1);
      }

      const inputDir = path.dirname(outPath);
      const outputDir = path.resolve('./output');

      const processed = await processImages(data, inputDir, outputDir, false);
      const html = generateHtml(processed, data.theme || 'light');

      await mkdir(outputDir, { recursive: true });
      const htmlPath = path.join(outputDir, 'index.html');
      await wf(htmlPath, html, 'utf-8');

      console.log(`Generated: ${htmlPath}`);
    }
  }
}
