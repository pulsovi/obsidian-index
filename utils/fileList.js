import fs from 'fs-extra';
import path from 'path';

import stringifyDate from './stringifyDate.js';
import { resolveWikiLink, resolveMarkdownLink } from './resolveLink.js';

export async function readList (listFile) {
  const listDir = path.dirname(listFile);
  const listTextBefore = await fs.readFile(listFile, 'utf8');
  const lines = listTextBefore.split('\n').filter(line => line.length);
  const list = await Promise.all(lines.map(async text => {
    const done = text.startsWith('- [x] ');
    const isTodo = text.startsWith('- [');
    if (!isTodo) return { done, text };
    const link = text.slice(6);
    const isWikiLink = (/^\[\[.*\]\]$/u).test(link);
    if (!isWikiLink) {
      const markdownLink = resolveMarkdownLink(link);
      if (markdownLink) {
        const { alias, href, title } = markdownLink;
        return { alias, href, done, text, title };
      }
      return { done, text };
    }
    const resolved = await resolveWikiLink('.', listDir, link);
    if (!resolved) throw new Error(`Impossible de trouver le fichier pointé par le lien "${link}"`);
    const { alias, anchor, file, href, name } = resolved;
    return { alias, anchor, done, file, href, link, name, text };
  }));
  return list;
}

export function noDupeList (list) {
  return list.filter((line, index) => {
    if (!('href' in line)) return true;
    const duplicates = list.filter((item, itemIndex) => {
      // on ne compte pas la ligne comme son propre doublon
      if (itemIndex === index) return false;
      // le critère de similitude est la resource visée
      if (item.href !== line.href) return false;
      // un lien non coché ne compte pas face à un lien coché
      if (line.done === true && item.done === false) return false;
      return true;
    });
    if (duplicates.length === 0) return true;

    // un lien non coché ne compte pas face à un lien coché
    if (!line.done && duplicates.some(item => item.done)) return false;

    // si la similitude est parfaite, on garde le premier de la liste
    if (duplicates.some(item => list.indexOf(item) < index)) return false;
    return true;
  })
}

export async function writeList (list, listFile) {
  const text = list
    .map(line => {
      if (line.text.startsWith('date modified'))
        return `date modified: ${stringifyDate(new Date())}`;
      return line.text;
    })
    .concat('')
    .join('\n');
  await fs.writeFile(listFile, text, 'utf8');
}
