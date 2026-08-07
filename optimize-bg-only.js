import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = './public/assets';

async function optimizeBgOnly() {
  if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory not found: ${assetsDir}`);
    return;
  }

  const files = fs.readdirSync(assetsDir);
  
  // 1. Delete old webp background files
  for (const file of files) {
    if (file.endsWith('_bg.webp') || file === 'bath_bg.webp') {
      const filePath = path.join(assetsDir, file);
      console.log(`Deleting old webp background: ${file}`);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete ${file}:`, err);
      }
    }
  }

  // Reload file list to get current assets
  const currentFiles = fs.readdirSync(assetsDir);
  console.log('Scanning for new background source files...');

  // 2. Optimize only background source images (ending with _bg)
  for (const file of currentFiles) {
    const filePath = path.join(assetsDir, file);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    
    if (baseName.endsWith('_bg') && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')) {
      const outPath = path.join(assetsDir, `${baseName}.webp`);
      console.log(`Optimizing new background: ${file}...`);
      try {
        await sharp(filePath)
          .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90 }) // Slightly higher quality for crisp container borders & textures
          .toFile(outPath);
        
        const origSize = (fs.statSync(filePath).size / 1024).toFixed(1);
        const newSize = (fs.statSync(outPath).size / 1024).toFixed(1);
        console.log(`Saved optimized background: ${baseName}.webp (${origSize} KB -> ${newSize} KB)`);
      } catch (err) {
        console.error(`Error optimizing background ${file}:`, err);
      }
    }
  }
  console.log('Background image optimization process complete!');
}

optimizeBgOnly();
