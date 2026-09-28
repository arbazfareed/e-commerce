import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const getCartItemKey = (item) =>
  `${item?._id || ''}|${item?.selectedColor || ''}|${item?.selectedSize || ''}`;

export const CartProvider = ({ children }) => {
  // ✅ Recently viewed products (last 8) — filter out any stale/deleted entries
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const s = localStorage.getItem('recentlyViewed');
      const parsed = s ? JSON.parse(s) : [];
      // Only keep entries that have the required fields — guards against deleted products
      return Array.isArray(parsed)
        ? parsed.filter(p => p && p._id && p.name)
        : [];
    }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToRecentlyViewed = (product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p._id !== product._id);
      return [product, ...filtered].slice(0, 8); // keep last 8
    });
  };

  const [items, setItems] = useState(() => {
    try {
      const s = localStorage.getItem('cart');
      const p = s ? JSON.parse(s) : [];
      // Filter out any stale entries missing required fields (e.g. from deleted products)
      return Array.isArray(p) ? p.filter(i => i && i._id && i.name) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1, options = {}) =>
    setItems(prev => {
      const variantKey = `${product._id}|${options.color || ''}|${options.size || ''}`;
      const exists = prev.find(i => getCartItemKey(i) === variantKey);
      const stock = Number(product.stock);
      const maxQuantity = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 99;
      if (maxQuantity < 1) return prev;
      const requestedQuantity = Number(quantity);
      if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) return prev;
      return exists
        ? prev.map(i => getCartItemKey(i) === variantKey ? { ...i, quantity: Math.min(maxQuantity, (Number(i.quantity) || 0) + requestedQuantity) } : i)
        : [...prev, { ...product, quantity: Math.min(maxQuantity, requestedQuantity), selectedColor: options.color || '', selectedSize: options.size || '' }];
    });

  const removeFromCart = (itemOrId, options = {}) => {
    const key = typeof itemOrId === 'object'
      ? getCartItemKey(itemOrId)
      : `${itemOrId}|${options.color || ''}|${options.size || ''}`;
    setItems(prev => prev.filter(item => getCartItemKey(item) !== key));
  };

  const updateQty = (itemOrId, qty, options = {}) => {
    const item = typeof itemOrId === 'object' ? itemOrId : { _id: itemOrId, ...options };
    const key = getCartItemKey(item);
    const requestedQuantity = Math.floor(Number(qty) || 0);
    if (requestedQuantity < 1) {
      setItems(prev => prev.filter(i => getCartItemKey(i) !== key));
      return;
    }
    setItems(prev => prev.map(i => {
      if (getCartItemKey(i) !== key) return i;
      const stock = Number(i.stock);
      const maxQuantity = Number.isFinite(stock) ? Math.max(1, Math.floor(stock)) : 99;
      return { ...i, quantity: Math.min(maxQuantity, requestedQuantity) };
    }));
  };

  const clearCart = () => setItems([]);
  const totalItems = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, recentlyViewed, addToRecentlyViewed }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    if (import.meta.env.DEV) throw new Error('useCart must be used inside a CartProvider.');
    return { items: [], addToCart:()=>{}, removeFromCart:()=>{}, updateQty:()=>{}, clearCart:()=>{}, totalItems:0, recentlyViewed:[], addToRecentlyViewed:()=>{} };
  }
  return ctx;
};
