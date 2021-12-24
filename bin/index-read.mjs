#!/usr/bin/env zx
import path from 'path';

import {
  assertGitClean,
  decode,
  noDupeList,
  readList,
  resolveWikiLink,
  stringifyDate,
  writeList,
} from '../utils/index.js';

$.verbose = false;
process.chdir('E:\\SyncThing\\obsidian');
await assertGitClean({ prompt: true });

const listFile = './David Gabison/Readwise/__Fil de lecture__.md';
const list = await readList(listFile);

for (const line of list) {
  if (line.done && 'file' in line) {
    await $`git add -- ${line.href}`;
  }
}

await writeList(noDupeList(list).filter(line => !line.done), listFile);
await $`git add -- ${listFile}`;
