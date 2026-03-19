/**
 * build-env.js
 * Runs at Vercel build time to generate js/env.js from environment variables.
 * This is needed because env.js is gitignored and never committed.
 */

const fs   = require('fs');
const path = require('path');

const {
  PROD_FIREBASE_API_KEY,
  PROD_FIREBASE_AUTH_DOMAIN,
  PROD_FIREBASE_PROJECT_ID,
  PROD_FIREBASE_MESSAGING_SENDER_ID,
  PROD_FIREBASE_APP_ID
} = process.env;

const missing = [
  'PROD_FIREBASE_API_KEY',
  'PROD_FIREBASE_AUTH_DOMAIN',
  'PROD_FIREBASE_PROJECT_ID',
  'PROD_FIREBASE_MESSAGING_SENDER_ID',
  'PROD_FIREBASE_APP_ID'
].filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}

const content = `window.__env = {
  FIREBASE_API_KEY:             "${PROD_FIREBASE_API_KEY}",
  FIREBASE_AUTH_DOMAIN:         "${PROD_FIREBASE_AUTH_DOMAIN}",
  FIREBASE_PROJECT_ID:          "${PROD_FIREBASE_PROJECT_ID}",
  FIREBASE_MESSAGING_SENDER_ID: "${PROD_FIREBASE_MESSAGING_SENDER_ID}",
  FIREBASE_APP_ID:              "${PROD_FIREBASE_APP_ID}"
};
`;

const outPath = path.join(__dirname, '..', 'js', 'env.js');
fs.writeFileSync(outPath, content);
console.log('env.js generated successfully.');
