/**
 * build-env.js
 * Generates js/env.js from Vercel environment variables at build time.
 * 
 * VERCEL_ENV is set automatically by Vercel:
 *   - 'production' → uses PROD_FIREBASE_* variables
 *   - 'preview'    → uses DEV_FIREBASE_* variables
 */

const fs   = require('fs');
const path = require('path');

const env    = process.env.VERCEL_ENV || 'preview';
const prefix = env === 'production' ? 'PROD' : 'DEV';

console.log(`Building env.js for Vercel environment: ${env} (using ${prefix}_FIREBASE_* variables)`);

const API_KEY             = process.env[`${prefix}_FIREBASE_API_KEY`];
const AUTH_DOMAIN         = process.env[`${prefix}_FIREBASE_AUTH_DOMAIN`];
const PROJECT_ID          = process.env[`${prefix}_FIREBASE_PROJECT_ID`];
const MESSAGING_SENDER_ID = process.env[`${prefix}_FIREBASE_MESSAGING_SENDER_ID`];
const APP_ID              = process.env[`${prefix}_FIREBASE_APP_ID`];

const missing = [
  `${prefix}_FIREBASE_API_KEY`,
  `${prefix}_FIREBASE_AUTH_DOMAIN`,
  `${prefix}_FIREBASE_PROJECT_ID`,
  `${prefix}_FIREBASE_MESSAGING_SENDER_ID`,
  `${prefix}_FIREBASE_APP_ID`,
].filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}

const content = `window.__env = {
  FIREBASE_API_KEY:             "${API_KEY}",
  FIREBASE_AUTH_DOMAIN:         "${AUTH_DOMAIN}",
  FIREBASE_PROJECT_ID:          "${PROJECT_ID}",
  FIREBASE_MESSAGING_SENDER_ID: "${MESSAGING_SENDER_ID}",
  FIREBASE_APP_ID:              "${APP_ID}"
};
`;

const outPath = path.join(__dirname, '..', 'js', 'env.js');
fs.writeFileSync(outPath, content);
console.log('env.js generated successfully.');