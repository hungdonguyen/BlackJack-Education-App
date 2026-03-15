const { Jimp } = require('jimp');

async function removeBg() {
    try {
        const inputPath = process.argv[2];
        const outputPath = process.argv[3];
        
        if (!inputPath || !outputPath) {
            console.error('Usage: node remove_bg.js <inputPath> <outputPath>');
            process.exit(1);
        }

        const img = await Jimp.read(inputPath);
        
        const THRESHOLD = 35; // Remove very dark pixels (near black)

        img.scan((x, y, idx) => {
            const r = img.bitmap.data[idx + 0];
            const g = img.bitmap.data[idx + 1];
            const b = img.bitmap.data[idx + 2];
            
            if (r < THRESHOLD && g < THRESHOLD && b < THRESHOLD) {
                img.bitmap.data[idx + 3] = 0; // Set alpha to 0 for dark pixels
            }
        });

        // Crop transparent edges
        img.autocrop();

        await img.write(outputPath);
        console.log(`Successfully processed: ${outputPath}`);
    } catch (err) {
        console.error('Error removing background:', err);
    }
}

removeBg();
