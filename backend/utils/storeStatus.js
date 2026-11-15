const Store = require('../models/Store');

// Products of switched-off stores are hidden from shoppers and cannot be ordered.
// The list of switched-off stores is cached for 30 seconds.
let cache = { at: 0, ids: [] };

const getInactiveStoreIds = async () => {
  if (Date.now() - cache.at < 30000) return cache.ids;
  const ids = await Store.find({ isActive: false }).distinct('_id');
  cache = { at: Date.now(), ids };
  return ids;
};

const clearInactiveStoreCache = () => { cache = { at: 0, ids: [] }; };

const isStoreInactive = async storeId => {
  if (!storeId) return false;
  const ids = await getInactiveStoreIds();
  return ids.some(id => String(id) === String(storeId));
};

module.exports = { getInactiveStoreIds, clearInactiveStoreCache, isStoreInactive };
