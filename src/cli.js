import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { validate } from './validator.js';
import { sanitizeData } from './sanitizer.js';
import { processImages } from './imageProcessor.js';
import { generateHtml } from './htmlGenerator.js';
import { runInteractive } from './interactive.js';

const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf-8')
);

export async function run(argv = process.argv) {
  const program = new Command();

  program
    .name('exhibit')
    .description('Generate a static HTML page from exhibition JSON data')
    .version(pkg.version)
    .argument('<input>', 'Path to exhibition JSON file')
    .option('-o, --output <dir>', 'Output directory', './output')
    .option('-t, --theme <name>', 'Theme: light, dark, or minimal', 'light')
    .option('-v, --verbose', 'Verbose logging')
    .action(async (input, options) => {
      try {
        await generate(input, options);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  program
    .command('init')
    .description('Interactive wizard to create exhibition JSON')
    .option('-o, --output <file>', 'Output JSON file path', 'exhibition.json')
    .option('--no-generate', 'Skip HTML generation after creating JSON')
    .action(async (options) => {
      try {
        await runInteractive({
          output: options.output,
          generate: options.generate,
        });
      } catch (err) {
        if (err.name === 'ExitPromptError') {
          console.log('\nAborted.');
          process.exit(0);
        }
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}

async function generate(inputPath, options) {
  const { output: outputDir, theme: cliTheme, verbose } = options;

  // 1. Read JSON
  const absInput = path.resolve(inputPath);
  const inputDir = path.dirname(absInput);

  if (verbose) console.log(`Reading: ${absInput}`);

  let raw;
  try {
    raw = await readFile(absInput, 'utf-8');
  } catch {
    throw new Error(`Cannot read file: ${absInput}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  // 2. Validate
  if (verbose) console.log('Validating...');
  const result = await validate(data);
  if (!result.valid) {
    console.error('Validation failed:');
    result.errors.forEach((e) => console.error(e));
    process.exit(1);
  }

  // 3. Sanitize
  if (verbose) console.log('Sanitizing...');
  const { data: sanitized, warnings } = sanitizeData(data, inputDir);
  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn(`  Warning: ${w}`));
  }

  // 4. Resolve theme
  const theme = cliTheme !== 'light' ? cliTheme : sanitized.theme || 'light';
  if (verbose) console.log(`Theme: ${theme}`);

  // 5. Process images
  const absOutput = path.resolve(outputDir);
  if (verbose) console.log('Processing images...');
  const processed = await processImages(sanitized, inputDir, absOutput, verbose);

  // 6. Generate HTML
  if (verbose) console.log('Generating HTML...');
  const html = generateHtml(processed, theme);

  // 7. Write output
  await mkdir(absOutput, { recursive: true });
  const outputPath = path.join(absOutput, 'index.html');
  await writeFile(outputPath, html, 'utf-8');

  console.log(`Generated: ${outputPath}`);
  console.log(`  Title: ${sanitized.title}`);
  console.log(`  Theme: ${theme}`);
  console.log(`  Artists: ${sanitized.artists.length}`);
  console.log(`  Artworks: ${sanitized.artworks.length}`);
}
