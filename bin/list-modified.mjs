#!/usr/bin/env zx
import path from 'path';

import {
  assertGitClean, decode, noDupeList, readList, resolveLink, writeList
} from '../utils/index.js';

$.verbose = false;
process.chdir('E:\\SyncThing\\obsidian');
await assertGitClean({ prompt: true });

const listFile = './David Gabison/Readwise/__Fil de lecture__.md';
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

for (const { filepath } of modifiedFiles) {
  if (filepath.startsWith('David Gabison/')) continue;
  if (list.some(line => ('href' in line) && line.href === filepath)) continue;
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
