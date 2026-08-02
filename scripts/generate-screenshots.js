const sharp = require('sharp');
const fs = require('fs');

const src = 'public/assets/logo.jpg';

async function generateScreenshots() {
  // Desktop Screenshot (Wide)
  await sharp({
    create: { width: 1280, height: 720, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
  })
    .composite([{ input: await sharp(src).resize(200).toBuffer(), gravity: 'center' }])
    .png()
    .toFile('public/screenshots/desktop.png');

  // Mobile Screenshot (Narrow)
  await sharp({
    create: { width: 720, height: 1280, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
  })
    .composite([{ input: await sharp(src).resize(150).toBuffer(), gravity: 'center' }])
    .png()
    .toFile('public/screenshots/mobile.png');

  console.log('Screenshots generated.');
}

fs.mkdirSync('public/screenshots', { recursive: true });
generateScreenshots();
