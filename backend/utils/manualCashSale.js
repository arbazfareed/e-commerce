const validateManualCashSale = (payload = {}) => {
  const amountProvided = payload.amount !== undefined && payload.amount !== null && String(payload.amount).trim() !== '';
  if (amountProvided && typeof payload.amount !== 'number' && typeof payload.amount !== 'string') {
    return { error: 'Manual cash amount must be a non-negative number.' };
  }
  const amount = amountProvided ? Number(payload.amount) : undefined;
  if (amountProvided && (!Number.isFinite(amount) || amount < 0)) {
    return { error: 'Manual cash amount must be a non-negative number.' };
  }
  if (payload.products !== undefined && !Array.isArray(payload.products)) {
    return { error: 'Products must be an array.' };
  }

  const items = Array.isArray(payload.products) && payload.products.length
    ? payload.products
    : [{ name: 'Manual cash sale', quantity: 1, price: amount ?? 0 }];
  const normalizedItems = [];

  for (const item of items) {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const priceProvided = item?.price !== undefined && item?.price !== null && String(item.price).trim() !== '';
    if (!priceProvided || (typeof item.price !== 'number' && typeof item.price !== 'string')) {
      return { error: `Price for "${name || 'product'}" must be a non-negative number.` };
    }
    const price = Number(item?.price);
    if (item?.quantity !== undefined && typeof item.quantity !== 'number' && typeof item.quantity !== 'string') {
      return { error: `Quantity for "${name || 'product'}" must be a positive whole number.` };
    }
    const quantity = item?.quantity === undefined ? 1 : Number(item.quantity);
    if (!name) return { error: 'Every manual cash sale product must have a name.' };
    if (!Number.isFinite(price) || price < 0) {
      return { error: `Price for "${name}" must be a non-negative number.` };
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: `Quantity for "${name}" must be a positive whole number.` };
    }
    normalizedItems.push({ name, price, quantity });
  }

  const totalAmount = amountProvided
    ? amount
    : normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items: normalizedItems, totalAmount };
};

module.exports = { validateManualCashSale };
