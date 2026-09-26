#!/usr/bin/env node
// Generates responsive WebP + JPEG variants for image slots that have a
// `source` block in image-manifest.json, then records them under `variants`.
// Output is committed, so build.mjs never needs this script or sharp.
//
//   node dental-preview-src/tools/process-images.mjs [--from=<dir of <slot>.png|jpg>] [--sharp=<path to sharp module>]
//
// --from      (optional) new originals named by slot, e.g. hero-clinic.png. Each is
//             saved as a quality-90 JPEG master in img/masters/ before processing.
// --sharp     path to an installed `sharp` package if it isn't resolvable from here.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const require = createRequire(import.meta.url);
const sharp = require(args.sharp || 'sharp');

const MANIFEST = path.join(SRC, 'image-manifest.json');
const IMG = path.join(SRC, 'img');
const MASTERS = path.join(IMG, 'masters');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(MASTERS, { recursive: true });

const ladder = (max, steps) => [...new Set([...steps.filter((w) => w < max), max])];

for (const [slot, def] of Object.entries(manifest.slots)) {
  if (!def.source) continue;
  const master = path.join(MASTERS, `${slot}.jpg`);
  const incoming = args.from && ['png', 'jpg', 'jpeg', 'webp'].map((e) => path.join(args.from, `${slot}.${e}`)).find((f) => fs.existsSync(f));
  if (incoming) await sharp(incoming).rotate().jpeg({ quality: 90, mozjpeg: true }).toFile(master);
  if (!fs.existsSync(master)) throw new Error(`No master for ${slot}; pass --from`);

  const meta = await sharp(master).metadata();
  const variants = {};
  const jobs = [['desktop', null, [640, 960, 1280, 1600]], ['mobile', def.source.mobile_crop, [480, 720, 960]]];
  for (const [kind, crop, steps] of jobs) {
    if (kind === 'mobile' && !crop) continue;
    const box = crop || { left: 0, top: 0, width: meta.width, height: meta.height };
    const widths = ladder(box.width, steps);
    for (const w of widths) {
      const base = path.join(IMG, `${slot}${kind === 'mobile' ? '-m' : ''}-${w}`);
      const pipe = () => sharp(master).extract(box).resize({ width: w });
      await pipe().webp({ quality: 78 }).toFile(`${base}.webp`);
      await pipe().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(`${base}.jpg`);
    }
    variants[kind] = { widths, px: [box.width, box.height] };
  }
  def.variants = variants;
  console.log(slot, JSON.stringify(variants));
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
