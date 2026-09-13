#!/usr/bin/env node
/**
 * Generates cryptographically random automation secrets.
 *
 *   node scripts/generate-secrets.mjs            # print new CRON_SECRET / ADMIN_SECRET
 *   node scripts/generate-secrets.mjs --write-env  # rotate them in the local .env
 *
 * The previously documented values
 * (`kerala-lottery-cron-secure-token-2026`, `admin-kerala-lottery-2026`) are
 * public and are rejected by the application in production. Rotate them
 * wherever they are configured (Vercel project env vars, Supabase secrets,
 * `app.settings.keraladraws_cron_secret`).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const generate = () => crypto.randomBytes(32).toString('base64url');

const writeEnv = process.argv.includes('--write-env');
const envPath = path.join(process.cwd(), '.env');

if (!writeEnv) {
  process.stdout.write(`CRON_SECRET=${generate()}\n`);
  process.stdout.write(`ADMIN_SECRET=${generate()}\n`);
  process.exit(0);
}

if (!fs.existsSync(envPath)) {
  console.error('No .env file found in the project root.');
  process.exit(1);
}

const cronSecret = generate();
const adminSecret = generate();

const original = fs.readFileSync(envPath, 'utf8');

function upsert(contents, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(contents)) return contents.replace(pattern, line);
  return `${contents.trimEnd()}\n${line}\n`;
}

let updated = upsert(original, 'CRON_SECRET', cronSecret);
updated = upsert(updated, 'ADMIN_SECRET', adminSecret);

fs.writeFileSync(envPath, updated, 'utf8');
console.log('Rotated CRON_SECRET and ADMIN_SECRET in .env (values not printed).');
console.log('Now set the same values in your deployment environment.');
