const sharp = require('sharp');
const fs = require('fs');

const src = 'C:/Users/mball/.gemini/antigravity/brain/dc9c4af2-98a6-4e3a-89a7-3c89f5c45e80/.user_uploaded/media__1784997938942.jpg';

fs.mkdirSync('public/assets', { recursive: true });
fs.mkdirSync('public/icons', { recursive: true });

fs.copyFileSync(src, 'public/assets/logo.jpg');

sharp(src).resize(192, 192).toFile('public/icons/icon-192x192.png');
sharp(src).resize(512, 512).toFile('public/icons/icon-512x512.png');
sharp(src).resize(64, 64).toFile('public/favicon.ico');
sharp(src).resize(180, 180).toFile('public/apple-icon.png');

console.log('Images generated successfully.');
