const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'raylogo2.png');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
const SIZE = 1024; // iOS recommended size

async function createFullFillIcon() {
  try {
    console.log('🍎 Creating full-fill Apple Touch Icon (no coral border)...');
    
    // Check if logo exists
    if (!fs.existsSync(LOGO_PATH)) {
      throw new Error(`Logo not found at: ${LOGO_PATH}`);
    }

    // First, scale up the logo significantly (150%) to ensure it fills beyond edges
    // This removes any coral border by cropping the edges
    const scaledLogo = await sharp(LOGO_PATH)
      .resize(Math.floor(SIZE * 1.50), Math.floor(SIZE * 1.50), {
        fit: 'contain', // Keep aspect ratio
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .toBuffer();
    
    // Now extract the center 1024x1024px portion - this removes coral borders
    // and ensures the logo fills the entire icon
    await sharp(scaledLogo)
      .extract({
        left: Math.floor((Math.floor(SIZE * 1.50) - SIZE) / 2),
        top: Math.floor((Math.floor(SIZE * 1.50) - SIZE) / 2),
        width: SIZE,
        height: SIZE
      })
      .resize(SIZE, SIZE, {
        fit: 'fill' // Ensure exact 1024x1024px
      })
      .png({
        quality: 100,
        compressionLevel: 6
      })
      .toFile(OUTPUT_PATH);

    console.log('✅ Apple Touch Icon created successfully!');
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log(`   Size: ${SIZE}x${SIZE}px`);
    console.log(`   Logo fills entire icon - no coral border`);
    console.log(`   Ready for iOS home screen`);
    
    return OUTPUT_PATH;
  } catch (error) {
    console.error('❌ Error creating icon:', error.message);
    process.exit(1);
  }
}

createFullFillIcon();

