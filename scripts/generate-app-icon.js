const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CORAL_COLOR = '#FF5A5F'; // Reserve4You brand coral
const SIZE = 1024; // 1024x1024 for high quality, iOS will scale down
const LOGO_SIZE = 650; // Logo size (with padding for professional look)
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
const LOGO_PATH = path.join(__dirname, '..', 'public', 'raylogo.png');

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

    // Load and resize logo
    const logo = await sharp(LOGO_PATH)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background for logo
      })
      .toBuffer();

    // Calculate position to center logo
    const logoX = Math.floor((SIZE - LOGO_SIZE) / 2);
    const logoY = Math.floor((SIZE - LOGO_SIZE) / 2);

    // Composite logo onto coral background
    const finalIcon = await background
      .composite([
        {
          input: logo,
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
    console.log(`   Logo size: ${LOGO_SIZE}x${LOGO_SIZE}px (centered)`);
    
    return OUTPUT_PATH;
  } catch (error) {
    console.error('❌ Error generating app icon:', error.message);
    process.exit(1);
  }
}

generateAppIcon();

