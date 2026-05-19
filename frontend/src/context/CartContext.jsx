import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

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

  const addToCart = (product) =>
    setItems(prev => {
      const exists = prev.find(i => i._id === product._id);
      return exists
        ? prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
    });

  const removeFromCart = (id) => setItems(prev => prev.filter(i => i._id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
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
  if (!ctx) return { items: [], addToCart:()=>{}, removeFromCart:()=>{}, updateQty:()=>{}, clearCart:()=>{}, totalItems:0, recentlyViewed:[], addToRecentlyViewed:()=>{} };
  return ctx;
};
