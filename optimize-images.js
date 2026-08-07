import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = './public/assets';

async function optimizeImages() {
  if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory not found: ${assetsDir}`);
    return;
  }

  const files = fs.readdirSync(assetsDir);
  console.log(`Scanning public/assets. Found ${files.length} files.`);
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const ext = path.extname(file).toLowerCase();
    
    // Process PNG, JPG, JPEG files (and skip already converted WebP or models)
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      const baseName = path.basename(file, ext);
      const outPath = path.join(assetsDir, `${baseName}.webp`);
      
      // Skip if optimized webp already exists and is newer
      if (fs.existsSync(outPath)) {
        const origStat = fs.statSync(filePath);
        const webpStat = fs.statSync(outPath);
        if (webpStat.mtime > origStat.mtime) {
          console.log(`Skipping ${file} (optimized webp already exists and is up to date)`);
          continue;
        }
      }

      console.log(`Optimizing ${file}...`);
      try {
        await sharp(filePath)
          .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
        
        const origSize = (fs.statSync(filePath).size / 1024).toFixed(1);
        const newSize = (fs.statSync(outPath).size / 1024).toFixed(1);
        console.log(`Saved optimized: ${baseName}.webp (${origSize} KB -> ${newSize} KB)`);
      } catch (err) {
        console.error(`Error optimizing ${file}:`, err);
      }
    }
  }
  console.log('Image optimization process complete!');
}

optimizeImages();
