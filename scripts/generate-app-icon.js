const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CORAL_COLOR = '#FF5A5F'; // Reserve4You brand coral
const SIZE = 1024; // 1024x1024 for high quality, iOS will scale down
const LOGO_SIZE = 1024; // Full icon size - fills the entire icon completely
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
const LOGO_PATH = path.join(__dirname, '..', 'public', 'raylogo2.png');

async function generateAppIcon() {
  try {
    console.log('🎨 Generating iOS app icon with coral background...');
    
    // Check if logo exists
    if (!fs.existsSync(LOGO_PATH)) {
      throw new Error(`Logo not found at: ${LOGO_PATH}`);
    }

    // Create coral background (solid color, no transparency)
    const background = sharp({
      create: {
        width: SIZE,
        height: SIZE,
        channels: 3, // RGB only, no alpha channel for solid background
        background: { r: 255, g: 90, b: 95 } // #FF5A5F - Reserve4You Coral
      }
    })
    .png();

    // Load logo and resize larger
    // Process to remove black pixels/borders by making them transparent
    const logo = await sharp(LOGO_PATH)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: 'contain', // Ensures whole logo fits, no cropping
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background initially
      })
      .ensureAlpha() // Ensure alpha channel exists
      .png()
      .toBuffer();
    
    // Remove black pixels by processing the raw image data
    // Replace black/dark pixels with transparency so coral background shows through
    const { data, info } = await sharp(logo)
      .ensureAlpha() // Make sure we have alpha channel
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Process pixels: remove black borders and dark pixels
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = info.channels === 4 ? data[i + 3] : 255;
      
      // If pixel is black or very dark (threshold), make it fully transparent
      // This removes black borders and makes them show the coral background
      if (r < 80 && g < 80 && b < 80) {
        if (info.channels === 4) {
          data[i + 3] = 0; // Make transparent
        }
      }
    }
    
    // Reconstruct the image without black pixels
    const logoProcessed = await sharp(Buffer.from(data), {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
    .png()
    .toBuffer();

    // Position logo to fill entire icon (no padding)
    const logoX = 0;
    const logoY = 0;

    // Composite processed logo (without black pixels) onto coral background
    // The coral background will show through where black pixels were removed
    const finalIcon = await background
      .composite([
        {
          input: logoProcessed,
          top: logoY,
          left: logoX,
        }
      ])
      .png()
      .toFile(OUTPUT_PATH);

    console.log('✅ App icon generated successfully!');
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log(`   Size: ${SIZE}x${SIZE}px`);
    console.log(`   Background: ${CORAL_COLOR} (Reserve4You Coral)`);
    console.log(`   Logo size: ${LOGO_SIZE}x${LOGO_SIZE}px (centered, no black borders)`);
    console.log(`   Logo: raylogo2.png`);
    
    return OUTPUT_PATH;
  } catch (error) {
    console.error('❌ Error generating app icon:', error.message);
    process.exit(1);
  }
}

generateAppIcon();

