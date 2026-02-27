import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';

const schemaPath = new URL('../schemas/exhibition.schema.json', import.meta.url);

let cachedSchema = null;

async function loadSchema() {
  if (!cachedSchema) {
    const raw = await readFile(schemaPath, 'utf-8');
    cachedSchema = JSON.parse(raw);
  }
  return cachedSchema;
}

export async function validate(data) {
  const schema = await loadSchema();
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const valid = ajv.validate(schema, data);

  if (!valid) {
    const errors = ajv.errors.map((err) => {
      const fieldPath = err.instancePath || '/';
      return `  ${fieldPath}: ${err.message}`;
    });
    return { valid: false, errors };
  }

  // Cross-field validation: end date must not be before start date
  const errors = [];
  if (data.dates?.start && data.dates?.end) {
    if (data.dates.end < data.dates.start) {
      errors.push('  /dates: end date must not be before start date');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}
