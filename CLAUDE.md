# Exhibition Page Generator

CLI tool that generates self-contained static HTML pages from exhibition JSON data. Designed for galleries and artists who need a quick, polished web presence for art exhibitions without a full CMS.

A web form interface is planned on top of the existing CLI.

## Project Structure

```
bin/exhibit.js           # CLI entry point (shebang wrapper)
src/
  cli.js                 # Commander setup, generate + init subcommands
  interactive.js         # Step-by-step wizard (exhibit init) using @inquirer/prompts
  validator.js           # AJV schema validation + date cross-validation
  sanitizer.js           # HTML stripping, URL scheme validation, image path security
  imageProcessor.js      # Copies local images to output, passes through URLs
  htmlGenerator.js       # Renders exhibition data to full HTML document
  styles.js              # Embedded CSS with theme interpolation (no external stylesheets)
schemas/
  exhibition.schema.json # JSON Schema defining all exhibition fields and constraints
example/
  sample-exhibition.json # Complete example input file
```

## Running the Tool

Requires Node.js >= 18.

```bash
npm install

# Generate from JSON file
node bin/exhibit.js <input.json> [-o output-dir] [-t light|dark|minimal] [-v]

# Interactive wizard
node bin/exhibit.js init [-o output.json] [--no-generate]
```

The generate command reads a JSON file, validates it, sanitizes all content, processes images, and writes `index.html` to the output directory (default `./output`).

The init wizard walks through every field interactively, saves the JSON, and optionally generates the HTML page.

## Testing

```bash
npm test           # Runs node --test (no test files yet)

# Manual verification
node bin/exhibit.js example/sample-exhibition.json -o /tmp/test-output -v
```

## Tech Stack

- **Node.js ESM** — pure ES modules throughout (`"type": "module"`)
- **Commander** — CLI argument parsing
- **@inquirer/prompts** — interactive wizard (input, confirm, select)
- **AJV + ajv-formats** — JSON Schema validation with format keywords (date, uri, email)
- **Embedded CSS** — all styles are inline in the generated HTML via `src/styles.js`; no external CSS files or CDN dependencies
- **Images** — supports both HTTP/HTTPS URLs (passed through as-is) and local file paths (copied to `output/images/`)

## Themes

Three built-in themes selectable via `-t` flag or `theme` field in JSON:

- **light** (default) — warm off-white background, dark text, brown accent
- **dark** — dark background, light text, gold accent
- **minimal** — white background, black text, no card shadows

Theme colors are hardcoded in `src/styles.js` and are not user-configurable. The `theme` field in JSON is constrained to the enum `["light", "dark", "minimal"]`.

## Validation and Sanitization

The pipeline runs in order: parse JSON -> schema validate -> sanitize -> process images -> generate HTML.

### Schema Validation (`validator.js` + `exhibition.schema.json`)

- All required fields checked: `title`, `dates`, `venue`, `artists`, `artworks`
- `additionalProperties: false` on every object (rejects unknown fields)
- Format validation: dates (`YYYY-MM-DD`), URIs, email
- Cross-field: `dates.end` must not be before `dates.start`
- Length limits on all text fields (title: 200, description: 5000, bios: 2000, etc.)
- Array limits: artists max 50, artworks max 200, openingHours max 20
- `birthYear` range: 1000–2100

### Sanitization (`sanitizer.js`)

- **HTML stripping** — all HTML tags removed from every text field before it reaches the generator. The generator also applies `escapeHtml()` on output as defense-in-depth.
- **Control character removal** — null bytes and control chars stripped (newlines preserved in multi-line fields like description and bio)
- **URL scheme allowlist** — only `http:` and `https:` allowed for all URL fields (venue.website, artist.website, links.*, etc.). Rejects `javascript:`, `data:`, `file:`, `vbscript:`, and all other schemes.
- **Image path security** — local image paths must resolve within the input file's directory (prevents path traversal like `../../etc/passwd`). Only allowed extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`.
- The image processor (`imageProcessor.js`) has its own path traversal guard and extension allowlist as defense-in-depth.

## Artwork Pricing

Artwork prices from the JSON `price` field are **never displayed publicly** on the generated page. The gallery section always shows "Inquire" — if an `inquiryEmail` is set, this becomes a `mailto:` link with the artwork title as the subject line. The `price` field exists in the schema for the gallery's internal records only.
