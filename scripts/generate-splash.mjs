/**
 * Generates Apple splash screen PNGs for all iOS device sizes.
 * Uses the Asoode logo SVG centered on a white background with purple accent.
 *
 * Usage: node scripts/generate-splash.mjs
 * Requires: sharp (npm install -g sharp or npx)
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'apps/frontend/public/splash');
const LOGO_PATH = resolve(ROOT, 'angular/src/assets/images/logo-colored.svg');

mkdirSync(OUTPUT_DIR, { recursive: true });

// All required splash screen sizes [width, height]
const sizes = [
  // iPhones
  [640, 1136],   [1136, 640],   // iPhone SE
  [750, 1334],   [1334, 750],   // iPhone 8
  [1242, 2208],  [2208, 1242],  // iPhone 8 Plus
  [1125, 2436],  [2436, 1125],  // iPhone X/XS/11 Pro
  [828, 1792],   [1792, 828],   // iPhone XR/11
  [1242, 2688],  [2688, 1242],  // iPhone XS Max/11 Pro Max
  [1080, 2340],  [2340, 1080],  // iPhone 12/13 mini
  [1170, 2532],  [2532, 1170],  // iPhone 12/13/14
  [1284, 2778],  [2778, 1284],  // iPhone 12/13/14 Pro Max
  [1179, 2556],  [2556, 1179],  // iPhone 14 Pro
  [1290, 2796],  [2796, 1290],  // iPhone 14 Pro Max/15
  // iPads
  [1536, 2048],  [2048, 1536],  // iPad 9.7"
  [1668, 2224],  [2224, 1668],  // iPad Pro 10.5"
  [1668, 2388],  [2388, 1668],  // iPad Pro 11"
  [2048, 2732],  [2732, 2048],  // iPad Pro 12.9"
];

const logoSvg = readFileSync(LOGO_PATH);

async function generateSplash(width, height) {
  const filename = `splash-${width}x${height}.png`;
  const outputPath = resolve(OUTPUT_DIR, filename);

  // Logo size: 20% of the smaller dimension
  const logoSize = Math.round(Math.min(width, height) * 0.2);

  // Resize logo SVG
  const resizedLogo = await sharp(logoSvg)
    .resize(logoSize, logoSize, { fit: 'inside' })
    .png()
    .toBuffer();

  const logoMeta = await sharp(resizedLogo).metadata();
  const logoW = logoMeta.width;
  const logoH = logoMeta.height;

  // Center the logo on white background
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogo,
        left: Math.round((width - logoW) / 2),
        top: Math.round((height - logoH) / 2),
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`  Generated: ${filename}`);
}

console.log(`Generating ${sizes.length} splash screens...`);

for (const [w, h] of sizes) {
  await generateSplash(w, h);
}

console.log(`\nDone! Splash screens saved to: ${OUTPUT_DIR}`);
