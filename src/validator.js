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
      const path = err.instancePath || '/';
      return `  ${path}: ${err.message}`;
    });
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}
