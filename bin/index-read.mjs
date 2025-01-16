#!/usr/bin/env zx
import path from 'path';

import {
  assertGitClean,
  decode,
  noDupeList,
  readList,
  stringifyDate,
  writeList,
} from '../utils/index.js';

$.verbose = false;
process.chdir('E:\\SyncThing\\obsidian');
await assertGitClean({ prompt: true });

const listFile = './__Fil de lecture__.md';
const list = await readList(listFile);

if (!list.some(line => line.done)) {
  console.log('No done line, exit.');
  process.exit();
}

for (const line of list) {
  if (line.done && 'file' in line) {
    console.log(`index ${chalk.yellow(line.href)}`);
    await $`git add -- ${line.href}`;
  }
}

await writeList(noDupeList(list).filter(line => !line.done), listFile);
await $`git add -- ${listFile}`;
