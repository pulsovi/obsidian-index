import path from 'path';

import readdirp from 'readdirp';

const markdownLinkBrackedRE = /(?<!\\)\[(?<alias>(?:[^\\\]\|]|\\\[|\\\]|\\\|)*)\]\(<(?<href>[^\)#>"]*)(?:#(?<anchor>[^"\)>]*))?>(?: "(?<title>[^"]*)")?\)/u;
const markdownLinkRE = /(?<!\\)\[(?<alias>(?:[^\\\]\|]|\\\[|\\\]|\\\|)*)\]\((?<href>[^\)#"]*)(?:#(?<anchor>[^"\)]*))?(?: "(?<title>[^"]*)")?\)/u;
const wikiLinkRE = /(?<!\\)\[\[(?<href>[^\|#\]]*)(?:#(?<anchor>[^\|\]]*))?(?:\|(?<alias>[^\]]*))?\]\]/u
const linksRE = [markdownLinkBrackedRE, markdownLinkRE, wikiLinkRE].map(re => new RegExp(re, 'gu'));
const cache = {};

export function getLinks(text) {
  let left = text;
  const links = [];
  const matches = {};
  for (const re of linksRE) {
    const matchs = text.match(re);
    if (matchs) for (const match of matchs) {
      links.push(match);
      left = left.replace(match, '');
    }
  }
  return links;
}

export function getLink(text) {
  if (markdownLinkBrackedRE.test(text)) return markdownLinkBrackedRE.exec(text).groups;
  if (markdownLinkRE.test(text)) return markdownLinkRE.exec(text).groups;
  if (wikiLinkRE.test(text)) return wikiLinkRE.exec(text).groups;
  return null;
}

export async function resolveLink (root, from, text) {
  const link = getLink(text);
  if (!link) throw new Error(`Aucun lien trouvé dans "${text}"`);
  const { href, anchor, alias, title } = link;
  const tree = await getTree(root);
  const candidates = tree.filter(entry => {
    const entryHref = fileToHref(entry).toLowerCase();
    const basename = entry.basename.toLowerCase();
    const fullname = (href.endsWith('.md') ? href : `${href}.md`).toLowerCase();
    return (
      basename === fullname ||
      basename === href.toLowerCase() ||
      (
        entryHref.endsWith(fullname) &&
        (
          entryHref.slice(-(fullname.length + 1)).charAt() === '/' ||
          entryHref.length === fullname.length
        )
      )
    );
  });
  if (candidates.length === 0) return { alias, anchor, href, title };;
  if (candidates.length === 1)
    return { alias, anchor, file: candidates[0], href: fileToHref(candidates[0]), title };

  // more than one solution
  let minDeep = Infinity;
  const filtered = candidates.map(candidate => {
    const relative = path.relative(from, candidate.path);
    const deep = relative.split(path.sep).filter(part => part == '..').length;
    minDeep = Math.min(minDeep, deep);
    return {
      ...candidate,
      deep,
      relative,
    };
  }).filter(candidate => candidate.deep === minDeep);

  if (filtered.length === 1)
    return { alias, anchor, file: filtered[0], href: fileToHref(filtered[0]), title };
  console.log('more than one solution:', { alias, anchor, filtered, root, from, text, title });
  return filtered.map(file => ({ alias, anchor, file, href: fileToHref(file), title }));
}

function fileToHref (file) {
  return file.path.replace(/\\/gu, '/');
}

export function isWikiLink (link) {
  return wikiLinkRE.test(link);
}

async function getTree (root) {
  if (!(root in cache))
    cache[root] = await readdirp.promise(root);
  return cache[root];
}

export function isMarkdownLink (link) {
  return markdownLinkRE.test(link);
}

export function resolveMarkdownLink (link) {
  if (!isMarkdownLink(link))
    throw new Error(`Le lien markdown "${link}" semble être mal formaté`);
  return link.match(markdownLinkRE).groups;
}
