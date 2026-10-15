const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uploadsDir = path.join(__dirname, '..', 'uploads');

async function migrateImages() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas successfully.');

  const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    images: [String],
  }, { timestamps: true }));

  const products = await Product.find({});
  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;

  for (const product of products) {
    let changed = false;
    const newImages = [];

    for (const img of (product.images || [])) {
      if (!img) continue;
      if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) {
        newImages.push(img);
        continue;
      }

      // It's a filename! Try to load from uploadsDir
      const filePath = path.join(uploadsDir, img);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(img).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';

        const buffer = fs.readFileSync(filePath);
        const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
        newImages.push(dataUrl);
        changed = true;
        console.log(`Converted ${img} for product "${product.name}" (${(buffer.length / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`File not found: ${filePath}, keeping as is.`);
        newImages.push(img);
      }
    }

    if (changed) {
      product.images = newImages;
      await product.save();
      updatedCount++;
    }
  }

  console.log(`Migration complete! Updated ${updatedCount} products with database-stored images.`);
  await mongoose.disconnect();
}

migrateImages().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
