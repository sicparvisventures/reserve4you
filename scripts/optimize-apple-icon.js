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

    // Load the icon and make it fill the entire space
    // First, check if we need to extract just the logo part or use the whole image
    let iconBuffer = await sharp(INPUT_PATH)
      .resize(SIZE, SIZE, {
        fit: 'fill', // Stretch to fill entire space exactly
        withoutEnlargement: false // Allow upscaling
      })
      .toBuffer();
    
    // Check if there's a coral border by analyzing edge pixels
    // If there's coral at edges, we need to crop/scale the logo part
    const { data, info } = await sharp(iconBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Detect if edges are coral colored (RGB ~255,90,95)
    // If so, we need to find the actual logo boundaries and scale it up
    let hasCoralBorder = false;
    const edgeSampleSize = 50; // Sample 50 pixels from edges
    
    // Check top edge
    for (let i = 0; i < edgeSampleSize * info.channels; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Check if pixel is coral colored (within range)
      if (r > 240 && r < 255 && g > 80 && g < 100 && b > 90 && b < 100) {
        hasCoralBorder = true;
        break;
      }
    }
    
    if (hasCoralBorder) {
      console.log('   Detected coral border - scaling logo to fill entire icon...');
      
      // Reload original and scale up significantly to remove border
      // Use a larger scale factor to ensure logo fills entire space
      iconBuffer = await sharp(INPUT_PATH)
        .resize(SIZE * 1.15, SIZE * 1.15, { // Scale up 15% more
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .extract({
          left: Math.floor((SIZE * 1.15 - SIZE) / 2),
          top: Math.floor((SIZE * 1.15 - SIZE) / 2),
          width: SIZE,
          height: SIZE
        })
        .resize(SIZE, SIZE, {
          fit: 'fill', // Now fill exactly
          withoutEnlargement: false
        })
        .toBuffer();
    }
    
    // Final resize to ensure exact 1024x1024px fill
    const optimizedIcon = await sharp(iconBuffer)
      .resize(SIZE, SIZE, {
        fit: 'fill', // Fill entire space exactly - no borders
        withoutEnlargement: false
      })
      .png({
        quality: 100,
        compressionLevel: 6
      })
      .toBuffer();
    
    // Write the optimized icon to file
    await sharp(optimizedIcon)
      .toFile(OUTPUT_PATH);

    console.log('✅ Apple Touch Icon optimized successfully!');
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log(`   Size: ${SIZE}x${SIZE}px (iOS optimized)`);
    console.log(`   Format: PNG (fills entire icon, no coral border)`);
    console.log(`   Ready for iOS home screen`);
    
    return OUTPUT_PATH;
  } catch (error) {
    console.error('❌ Error optimizing icon:', error.message);
    process.exit(1);
  }
}

optimizeAppleIcon();

