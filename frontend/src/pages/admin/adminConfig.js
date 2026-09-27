export const STATUS_LIST = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const STATUS_CFG = {
  Pending: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', icon: '⏳' },
  Processing: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', icon: '⚙️' },
  Shipped: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9', icon: '🚚' },
  Delivered: { bg: '#f0fdf4', color: '#166534', dot: '#16a34a', icon: '✅' },
  Cancelled: { bg: '#fff1f2', color: '#be123c', dot: '#f43f5e', icon: '❌' },
};

export const CATEGORY_TREE = {
  Electronics: ['Laptops', 'Phones', 'Audio', 'Accessories'],
  Fashion: ['Men', 'Women', 'Children', 'Accessories'],
  Home: ['Decor', 'Kitchen', 'Furniture', 'Textiles'],
  Beauty: ['Skincare', 'Haircare', 'Fragrance', 'Makeup'],
  Food: ['Honey', 'Spices', 'Snacks', 'Beverages'],
  Crafts: ['Pottery', 'Woodwork', 'Textiles', 'Jewellery'],
  Books: ['Fiction', 'Education', 'Children', 'Local Authors'],
};

export const EMPTY_FORM = {
  name: '',
  pricePKR: '',
  priceUSD: '',
  discountPercent: 0,
  discountStartDate: '',
  discountEndDate: '',
  category: '',
  subcategory: '',
  brand: '',
  model: '',
  colors: '',
  sizes: '',
  isVisible: true,
  description: '',
  isLocal: false,
  stock: '',
  weightKg: '',
};
