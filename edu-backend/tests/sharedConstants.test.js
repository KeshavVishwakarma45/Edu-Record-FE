// Roles, statuses, categories, course patterns and genders must be the same on server and client.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHARED = ['roles.js', 'statuses.js', 'categories.js', 'coursePatterns.js', 'genders.js'];

test.each(SHARED)('constants/%s is identical in server and client', (file) => {
  const server = fs.readFileSync(path.join(root, 'edu-backend/src/constants', file), 'utf8');
  const client = fs.readFileSync(path.join(root, 'edu-frontend/src/constants', file), 'utf8');
  expect(client).toBe(server);
});
