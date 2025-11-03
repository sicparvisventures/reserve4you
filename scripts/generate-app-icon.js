const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CORAL_COLOR = '#FF5A5F'; // Reserve4You brand coral
const SIZE = 1024; // 1024x1024 for high quality, iOS will scale down
const LOGO_SIZE = 900; // Large logo size to fill the icon nicely
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

    // Load logo and resize to fit nicely
    // Remove any black borders by using the coral background and ensuring proper fit
    // Use 'contain' to ensure logo fits within bounds without cropping
    const logo = await sharp(LOGO_PATH)
      .resize(LOGO_SIZE, LOGO_SIZE, {
        fit: 'contain', // Ensures whole logo fits, no cropping
        background: { r: 255, g: 90, b: 95 } // Coral background fills any gaps (no black borders)
      })
      .png() // Ensure PNG format
      .toBuffer();

    // Calculate position to perfectly center logo
    const logoX = Math.floor((SIZE - LOGO_SIZE) / 2);
    const logoY = Math.floor((SIZE - LOGO_SIZE) / 2);

    // Composite logo onto coral background
    // This ensures no black borders are visible - the coral background fills any gaps
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
    console.log(`   Logo size: ${LOGO_SIZE}x${LOGO_SIZE}px (centered, no black borders)`);
    console.log(`   Logo: raylogo2.png`);
    
    return OUTPUT_PATH;
  } catch (error) {
    console.error('❌ Error generating app icon:', error.message);
    process.exit(1);
  }
}

generateAppIcon();

