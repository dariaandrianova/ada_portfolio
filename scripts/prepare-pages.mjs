import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(new URL('../dist/app.html', import.meta.url), 'utf8');
if (html.includes('/src/main.tsx')) throw new Error('Expected compiled HTML, received a source entry');
// This directory contains generated publication assets only. Sources are public/assets/.
await rm(`${root}/assets`, { recursive: true, force: true });
await mkdir(`${root}/assets`, { recursive: true });
await cp(`${root}/dist/assets`, `${root}/assets`, { recursive: true });
await writeFile(`${root}/index.html`, html);
await writeFile(`${root}/dist/index.html`, html);
await rm(`${root}/dist/app.html`);
await writeFile(`${root}/.nojekyll`, '');
console.log('GitHub Pages ready: root index.html + assets/ + .nojekyll');
