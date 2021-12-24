import path from 'path';

import readdirp from 'readdirp';

const wikiLinkRE = /^\[\[(?<name>[^\|#\]]*)(?:#(?<anchor>[^\|\]]*))?(?:\|(?<alias>[^\]]*))?\]\]$/u
const markdownLinkRE = /^\[(?<alias>[^\]]*)\]\((?<href>[^"\)]*)(?:"(?<title>[^"\)]*)")?\)$/u;
const cache = {};

export async function resolveWikiLink (root, ref, link) {
  if (!isWikiLink(link))
    throw new Error(`Le wikilink "${link}" semble être mal formaté`);
  const { name, anchor, alias } = link.match(wikiLinkRE).groups;
  const tree = await getTree(root);
  const candidates = tree.filter(entry => {
    const href = fileToHref(entry).toLowerCase();
    const basename = entry.basename.toLowerCase();
    const fullname = (name.endsWith('.md') ? name : `${name}.md`).toLowerCase();
    return (
      basename === fullname ||
      basename === name.toLowerCase() ||
      (
        href.endsWith(fullname) &&
        (
          href.slice(-(fullname.length + 1)).charAt() === '/' ||
          href.length === fullname.length
        )
      )
    );
  });
  if (candidates.length === 0) return null;
  if (candidates.length === 1)
    return { alias, anchor, file: candidates[0], href: fileToHref(candidates[0]), link, name };

  // more than one solution
  let minDeep = Infinity;
  const filtered = candidates.map(candidate => {
    const relative = path.relative(ref, candidate.path);
    const deep = relative.split(path.sep).filter(part => part == '..').length;
    minDeep = Math.min(minDeep, deep);
    return {
      ...candidate,
      deep,
      relative,
    };
  }).filter(candidate => candidate.deep === minDeep);

  if (filtered.length === 1)
    return { file: filtered[0], href: fileToHref(filtered[0]), link, name, anchor, alias };
  console.log('more than one solution:', { name, anchor, alias, filtered, root, ref, link }); process.exit();
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
