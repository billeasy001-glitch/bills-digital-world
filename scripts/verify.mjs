import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const dist = resolve('dist');
async function htmlFiles(dir) {
  const children = await readdir(dir, { withFileTypes: true });
  const lists = await Promise.all(children.map(child => {
    const path = resolve(dir, child.name);
    return child.isDirectory() ? htmlFiles(path) : child.name.endsWith('.html') ? [path] : [];
  }));
  return lists.flat();
}

const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.ok(locations.length, 'Empty sitemap');
const origin = new URL(locations[0]).origin;
if (process.env.SITE_URL) assert.equal(origin, new URL(process.env.SITE_URL).origin);
const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: ' + origin + '/sitemap.xml'));
const found = new Set();
let links = 0;
for (const file of await htmlFiles(dist)) {
  const path = '/' + relative(dist, file).split(sep).join('/').replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path + ' heading');
  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<meta property="og:title" content="[^"]+"/);
  if (path === '/404.html') {
    assert.match(html, /name="robots" content="noindex/);
  } else {
    assert.ok(html.includes('rel="canonical" href="' + origin + path + '"'), path + ' canonical');
    found.add(origin + path);
  }
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), origin + path);
    if (url.origin !== origin) continue;
    const name = decodeURIComponent(url.pathname).replace(/^\//, '');
    const target = resolve(dist, name + (url.pathname.endsWith('/') ? 'index.html' : ''));
    assert.ok((await stat(target)).isFile(), path + ' links to ' + url.pathname);
    links++;
  }
}
for (const required of ['/', '/about/', '/projects/', '/blog/', '/tools/', '/contact/']) {
  assert.ok(found.has(origin + required), 'Missing page ' + required);
}
assert.equal(locations.length, found.size);
assert.deepEqual(new Set(locations), found, 'Sitemap must cover all public pages and exclude 404');
await stat(resolve(dist, '404.html'));
console.log(`Verified ${found.size} indexable pages, 404, robots, sitemap, and ${links} internal references.`);
