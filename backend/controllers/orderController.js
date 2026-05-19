const Order   = require('../models/Order');
const Product = require('../models/Product');

// ─── Zone-based shipping rates (mirrors priceUtils.js defaults) ───────────────
// These are the server-side defaults. The frontend uses localStorage overrides;
// here we use the same defaults so order totals match what the cart showed.
const DEFAULT_ZONE_RATES = {
  domestic_pak:  { baseRate:  80,  perKg:  30,  minFee:  80  },
  south_asia:    { baseRate: 500,  perKg: 150,  minFee: 500  },
  middle_east:   { baseRate: 900,  perKg: 250,  minFee: 900  },
  east_asia:     { baseRate:1100,  perKg: 300,  minFee:1100  },
  europe:        { baseRate:1800,  perKg: 400,  minFee:1800  },
  north_america: { baseRate:2200,  perKg: 500,  minFee:2200  },
  australia:     { baseRate:2000,  perKg: 450,  minFee:2000  },
  rest_of_world: { baseRate:2500,  perKg: 600,  minFee:2500  },
};

const ZONE_MAP = {
  india:'south_asia', bangladesh:'south_asia', 'sri lanka':'south_asia',
  nepal:'south_asia', bhutan:'south_asia', maldives:'south_asia',
  uae:'middle_east', 'united arab emirates':'middle_east', dubai:'middle_east',
  'saudi arabia':'middle_east', qatar:'middle_east', kuwait:'middle_east',
  bahrain:'middle_east', oman:'middle_east', jordan:'middle_east',
  lebanon:'middle_east', iraq:'middle_east', iran:'middle_east',
  china:'east_asia', japan:'east_asia', 'south korea':'east_asia',
  korea:'east_asia', 'hong kong':'east_asia', taiwan:'east_asia',
  singapore:'east_asia', malaysia:'east_asia', indonesia:'east_asia',
  thailand:'east_asia', vietnam:'east_asia', philippines:'east_asia',
  uk:'europe', 'united kingdom':'europe', germany:'europe', france:'europe',
  italy:'europe', spain:'europe', netherlands:'europe', sweden:'europe',
  norway:'europe', denmark:'europe', finland:'europe', poland:'europe',
  austria:'europe', switzerland:'europe', portugal:'europe', turkey:'europe',
  russia:'europe',
  usa:'north_america', 'united states':'north_america',
  'united states of america':'north_america', us:'north_america', canada:'north_america',
  australia:'australia', 'new zealand':'australia',
};

const PAK_CITIES = new Set([
  'karachi','lahore','islamabad','rawalpindi','faisalabad','multan','peshawar',
  'quetta','sialkot','gujranwala','hyderabad','bahawalpur','sargodha','abbottabad',
  'sukkur','larkana','sahiwal','rahim yar khan','kot addu','attock','jhelum',
  'muzaffargarh','dera ghazi khan','gujrat','khanewal','lodhran','narowal',
  'mianwali','bahawalnagar','vehari','toba tek singh','muzaffarabad','turbat',
  'khuzdar','hub','chaman','zhob','gwadar','mardan','mingora','kohat',
  'mansehra','haripur','nowshera','swat','charsadda','swabi','bannu',
]);

const detectZone = (toCountry = 'Pakistan', toCity = '') => {
  const tc    = (toCountry || '').trim().toLowerCase();
  const tCity = (toCity    || '').trim().toLowerCase();
  if (tc === 'pakistan') return 'domestic_pak';
  if (PAK_CITIES.has(tCity)) return 'domestic_pak';
  if (ZONE_MAP[tc])    return ZONE_MAP[tc];
  if (ZONE_MAP[tCity]) return ZONE_MAP[tCity];
  return 'rest_of_world';
};

/**
 * Calculate zone-based shipping fee (server-side, mirrors priceUtils.js).
 * Items with weightKg = 0 do NOT contribute per-kg charge.
 */
const calcZoneShipping = (items, toCountry, toCity) => {
  const zone      = detectZone(toCountry, toCity);
  const zoneRate  = DEFAULT_ZONE_RATES[zone] || DEFAULT_ZONE_RATES.rest_of_world;

  const totalWeight = items.reduce((sum, item) => {
    const w = Number(item.weightKg);
    if (!w || w <= 0) return sum;           // weightless item — no per-kg charge
    return sum + w * Number(item.quantity || 1);
  }, 0);

  const roundedWeight = parseFloat(totalWeight.toFixed(2));
  const rawFee        = zoneRate.baseRate + Math.round(roundedWeight * zoneRate.perKg);
  const fee           = Math.max(rawFee, zoneRate.minFee);

  return { fee, totalWeight: roundedWeight, zone };
};

const placeOrder = async (req, res) => {
  try {
    const { products, address, paymentMethod } = req.body;
    if (!products || products.length === 0)
      return res.status(400).json({ message: 'No products in order.' });

    const country       = address?.country || 'Pakistan';
    const city          = address?.city    || '';
    const enrichedItems = [];

    for (const item of products) {
      const db = await Product.findById(item.product || item._id);
      if (!db) return res.status(404).json({ message: `Product not found: ${item.name}` });
      if (db.isLocal && country !== 'Pakistan')
        return res.status(400).json({ message: `"${db.name}" is only available within Pakistan.` });
      if (db.stock < item.quantity)
        return res.status(400).json({ message: `Only ${db.stock} unit(s) of "${db.name}" available.` });
      // ✅ Use actual weightKg from DB (0 = weightless — no per-kg charge)
      enrichedItems.push({ ...item, weightKg: db.weightKg ?? 0 });
    }

    for (const item of products)
      await Product.findByIdAndUpdate(item.product||item._id, { $inc: { stock: -item.quantity } });

    // ✅ Zone-based shipping — correct for Multan→Karachi, Pakistan→Dubai, etc.
    const { fee: shippingFee, totalWeight, zone: shippingZone } = calcZoneShipping(enrichedItems, country, city);
    const productTotal = products.reduce((s,i) => s + i.price * i.quantity, 0);
    const totalPrice   = productTotal + shippingFee;

    const order = await Order.create({
      user: req.user._id, products: enrichedItems,
      productTotal, shippingFee, totalWeight, shippingZone, totalPrice,
      address, paymentMethod,
    });
    res.status(201).json(order);
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
};

const getMyOrders = async (req, res) => {
  try { res.json(await Order.find({ user: req.user._id }).sort({ createdAt:-1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

const getOrderById = async (req, res) => {
  try {
    const o = await Order.findById(req.params.id).populate('user','name email');
    if (!o) return res.status(404).json({ message: 'Order not found.' });
    if (o.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized.' });
    res.json(o);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const getAllOrders = async (req, res) => {
  try { res.json(await Order.find().populate('user','name email').sort({ createdAt:-1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ message: 'Order not found.' });
    if (req.body.status === 'Cancelled' && o.status !== 'Cancelled')
      for (const item of o.products)
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    o.status = req.body.status || o.status;
    if (req.body.status === 'Delivered') { o.isPaid = true; o.paidAt = new Date(); }
    res.json(await o.save());
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
