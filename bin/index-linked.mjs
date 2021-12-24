#!/usr/bin/env zx
import path from 'path';

import { assertGitClean, decode, resolveWikiLink } from '../utils/index.js';

$.verbose = false;
process.chdir('E:\\SyncThing\\obsidian');
const choice = await assertGitClean({
  prompt: true, choices: { i: 'indexed - process only new indexed files'}
});

const command = choice === 'i' ? 'diff --name-only' : 'ls-files';
const indexedFiles = (await $`git ${
  choice === 'i' ? 'diff' : 'ls-files'} ${
  choice === 'i' ? '--name-only' : ''} --cached`).stdout
  .split('\n')
  .map(filename => decode(filename).replace(/^"(.*)"$/u, '$1'));

const links = [];
const linkRE = /\[\[[^\]]*\]\]/gu
for (const source of indexedFiles.filter(file => file.endsWith('.md'))) {
  const dirname = path.dirname(source);
  console.log(`${chalk.green('git')} show :${source}`);
  const content = (await $`git show :${source}`).stdout;
  const matchs = content.match(linkRE);

  if (!matchs) continue;
  for (const match of matchs) {
    const resolved = await resolveWikiLink('.', dirname, match);
    if (resolved) links.push({ ...resolved, source });
  }
}
links.sort((a, b) => a.file.path.localeCompare(b.file.path, 'fr'));

if (!links.length) {
  console.log('no file to add');
}

const uniqueLinks = {};
for (const { alias, anchor, file, link, name, source } of links) {
  const filepath = file.path.replace(/\\/gu, '/');

  if (filepath.startsWith('.trash')) continue;
  if (indexedFiles.includes(filepath)) continue;
  if (filepath in uniqueLinks && uniqueLinks[filepath].includes(source)) continue;

  console.log(`indexing ${chalk.yellow(filepath)} because it linked in ${chalk.yellow(source)}`);
  if (!(filepath in uniqueLinks)) {
    if (filepath.endsWith('.md'))
      await $`git update-index --add --cacheinfo 100644,e69de29bb2d1d6434b8b29ae775ad8c2e48c5391,${filepath}`;
    else
      await $`git add -- ${filepath}`;
    uniqueLinks[filepath] = [source];
  } else {
    uniqueLinks[filepath].push(source);
  }
}
