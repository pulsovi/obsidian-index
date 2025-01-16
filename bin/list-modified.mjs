#!/usr/bin/env zx
import path from 'path';

import {
  assertGitClean, decode, noDupeList, readList, resolveLink, writeList
} from '../utils/index.js';

$.verbose = false;
process.chdir('E:\\SyncThing\\obsidian');
await assertGitClean({ prompt: true });

const listFile = './__Fil de lecture__.md';
const listDir = path.dirname(listFile);
const list = await readList(listFile);
const modifiedFiles = (await $`git status --porcelain`).stdout
  .split('\n')
  .map(line => {
    const status = line.slice(0, 2);
    const filepath = decode(line.slice(3).replace(/^"(.*)"$/u, '$1'));
    return { status, filepath };
  })
  .filter(file => file.status.slice(-1) === 'M');

const filesToAdd = modifiedFiles.filter(file => {
  const { filepath } = file;
  if (filepath.startsWith('David Gabison/')) return false;
  if (!filepath.endsWith('.md')) return false;
  if (list.some(line => ('href' in line) && line.href === filepath)) return false;
  return true;
})

if (!filesToAdd.length) {
  console.log('No file to add, exit.');
  process.exit();
}

for (const { filepath } of filesToAdd) {
  const name = path.basename(filepath).replace(/\.md$/u, '');
  const link = `[[${name}]]`;
  const resolved = await resolveLink('.', listDir, link);
  if (!resolved) throw new Error(`Impossible de trouver le fichier pointé par le lien "${link}"`);
  const { href } = resolved;
  console.log(`add ${chalk.yellow(filepath)}`);
  if (href !== filepath)
    list.push({ done: false, href: filepath, text: `- [ ] [[${filepath}|${name}]]` });
  else
    list.push({ done: false, href, text: `- [ ] ${link}` });
}

await writeList(noDupeList(list), listFile);
await $`git add -- ${listFile}`;
