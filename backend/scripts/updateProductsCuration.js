const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const updates = [
  {
    id: '6ad0c089f59e4d652f12619d',
    name: 'Raw Indus Valley Forest Honey',
    category: 'Food',
    subcategory: 'Honey',
    pricePKR: 5000,
    priceUSD: 17.99,
    isLocal: true,
    stock: 25
  },
  {
    id: '6a0438e176923f11d6322c02',
    name: 'Pure Mountain Raw Honeycomb',
    category: 'Food',
    subcategory: 'Honey',
    description: 'Golden honeycomb cut straight from natural mountain hives. Chewy, nutrient-dense, and rich in natural beeswax and live enzymes.',
    pricePKR: 1800,
    priceUSD: 6.50,
    isLocal: true,
    stock: 40
  },
  {
    id: '6a043d8c76923f11d6322c56',
    name: 'Artisanal Terracotta & Woven Vessels',
    category: 'Crafts',
    subcategory: 'Pottery',
    description: 'Hand-thrown terracotta clay and woven river reed vessels crafted by traditional artisan families along the Indus basin.',
    pricePKR: 3400,
    priceUSD: 12.00,
    images: ['/home-local-craft-still-life.svg'],
    isLocal: true,
    stock: 15
  },
  {
    id: '6a0439b676923f11d6322c0d',
    name: 'Botanical Hair & Scalp Restorative Oil',
    category: 'Beauty',
    subcategory: 'Haircare',
    description: 'Infused with cold-pressed mustard, amla, and botanical rosemary extracts to deeply nourish hair and calm the scalp.',
    pricePKR: 1650,
    priceUSD: 5.99,
    images: ['/home-botanical-still-life.svg'],
    isLocal: true,
    stock: 30
  },
  {
    id: '6a040fccf81051039eee7179',
    name: 'Himalayan Glow Herbal Facial Elixir',
    category: 'Beauty',
    subcategory: 'Skincare',
    description: 'A concentrated facial nectar enriched with pure wild saffron and soothing botanical infusions for luminous, velvet skin.',
    pricePKR: 2800,
    priceUSD: 9.99,
    images: ['/home-ritual-still-life.svg'],
    isLocal: false,
    stock: 22
  },
  {
    id: '6a043c1d76923f11d6322c36',
    name: 'Wild Mountain Herbal Tea & Honey Dipper',
    category: 'Food',
    subcategory: 'Beverages',
    description: 'Hand-plucked mountain herbs and aromatic spices paired with a handcrafted wooden honey spoon for comforting ritual brews.',
    pricePKR: 1200,
    priceUSD: 4.50,
    images: ['/honey-cover.jpg'],
    isLocal: true,
    stock: 35
  },
  {
    id: '6a043ca476923f11d6322c41',
    name: 'Hunza Valley Organic Sun-Dried Apricots',
    category: 'Food',
    subcategory: 'Snacks',
    description: 'Sun-dried naturally in the high valleys of Hunza without chemical sulfur or additives. Rich in potassium and organic vitamins.',
    pricePKR: 950,
    priceUSD: 3.50,
    images: ['/home-botanical-still-life.svg'],
    isLocal: true,
    stock: 50
  },
  {
    id: '6a0437f776923f11d6322bf7',
    name: 'Handwoven Ajrak Block-Print Textile',
    category: 'Crafts',
    subcategory: 'Textiles',
    description: 'Authentic indigo and madder root block-printed modal fabric crafted using centuries-old woodblock techniques.',
    pricePKR: 3200,
    priceUSD: 11.50,
    images: ['/home-local-craft-still-life.svg'],
    isLocal: true,
    stock: 18
  },
  {
    id: '6a04358176923f11d6322bdd',
    name: 'Sindhri Mango & Cardamom Organic Preserve',
    category: 'Food',
    subcategory: 'Snacks',
    description: 'Slow-cooked ripe Sindhri mangoes infused with green cardamom and natural raw honey.',
    pricePKR: 850,
    priceUSD: 3.00,
    images: ['/honey-cover.jpg'],
    isLocal: true,
    stock: 45
  },
  {
    id: '6a014d5cc58e3ba39da0eb99',
    name: 'Kashmir Valley Pure Mogra Saffron',
    category: 'Food',
    subcategory: 'Spices',
    description: 'Deep crimson stigma threads of pure Grade-A Mogra saffron, imparting an exquisite aroma and golden warmth to tea and festive desserts.',
    pricePKR: 4500,
    priceUSD: 16.00,
    images: ['/home-ritual-still-life.svg'],
    isLocal: false,
    stock: 20
  }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const u of updates) {
    const { id, ...data } = u;
    await Product.findByIdAndUpdate(id, { $set: data });
  }

  const all = await Product.find({}, 'name category subcategory pricePKR images');
  console.log('Successfully updated', all.length, 'products:');
  console.log(JSON.stringify(all.map(p => ({
    id: p._id,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    pricePKR: p.pricePKR,
    img: p.images[0]?.substring(0, 30)
  })), null, 2));

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
