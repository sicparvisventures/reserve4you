const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_PATH = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
const SIZE = 1024; // iOS recommended size for best quality

async function optimizeAppleIcon() {
  try {
    console.log('🍎 Optimizing Apple Touch Icon for iOS...');
    
    // Check if icon exists
    if (!fs.existsSync(INPUT_PATH)) {
      throw new Error(`Icon not found at: ${INPUT_PATH}`);
    }

    // Get current icon metadata
    const metadata = await sharp(INPUT_PATH).metadata();
    console.log(`   Current size: ${metadata.width}x${metadata.height}px`);
    console.log(`   Format: ${metadata.format}`);
    console.log(`   Channels: ${metadata.channels}`);

    // iOS App Icon Requirements:
    // 1. Square format (1024x1024px recommended for best quality)
    // 2. No transparency at edges (iOS adds rounded corners automatically)
    // 3. Design should be centered with safe area (iOS may add padding)
    // 4. RGB format preferred (no alpha channel needed for edges)

    // Load the icon
    const icon = await sharp(INPUT_PATH)
      .ensureAlpha() // Ensure alpha channel exists
      .resize(SIZE, SIZE, {
        fit: 'contain', // Fit within bounds, maintain aspect ratio
        background: { r: 255, g: 90, b: 95, alpha: 1 } // Coral background for any padding
      })
      .png()
      .toBuffer();

    // Create a solid background (no transparency at edges)
    // This ensures iOS can properly add rounded corners
    const optimizedIcon = await sharp({
      create: {
        width: SIZE,
        height: SIZE,
        channels: 3, // RGB only - no alpha needed for iOS
        background: { r: 255, g: 90, b: 95 } // Reserve4You Coral background
      }
    })
    .png()
    .composite([
      {
        input: icon,
        gravity: 'center' // Center the icon content
      }
    ])
    .png({
      quality: 100, // Maximum quality
      compressionLevel: 6 // Balance between size and quality
    })
    .toFile(OUTPUT_PATH);

    console.log('✅ Apple Touch Icon optimized successfully!');
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log(`   Size: ${SIZE}x${SIZE}px (iOS optimized)`);
    console.log(`   Format: PNG (no edge transparency)`);
    console.log(`   Ready for iOS home screen`);
    
    return OUTPUT_PATH;
  } catch (error) {
    console.error('❌ Error optimizing icon:', error.message);
    process.exit(1);
  }
}

optimizeAppleIcon();

