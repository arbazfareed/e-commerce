import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const getCartItemKey = (item) =>
  `${item?._id || ''}|${item?.selectedColor || ''}|${item?.selectedSize || ''}`;

const readStoredArray = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};

export const CartProvider = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;
  const userId = user?._id || null;
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
    const key = userId ? `cart_${userId}` : 'cart';
    return readStoredArray(key).filter(i => i && i._id && i.name);
  });

  const [wishlist, setWishlist] = useState(() => {
    const key = userId ? `wishlist_${userId}` : 'wishlist';
    return readStoredArray(key).filter(product => product?._id && product?.name);
  });
  const [serverCartReady, setServerCartReady] = useState(() => !user?._id);
  const [loadedForUserId, setLoadedForUserId] = useState(userId);

  useEffect(() => {
    if (loadedForUserId !== userId) return;
    localStorage.setItem(userId ? `cart_${userId}` : 'cart', JSON.stringify(items));
  }, [items, userId, loadedForUserId]);

  useEffect(() => {
    if (loadedForUserId !== userId) return;
    localStorage.setItem(userId ? `wishlist_${userId}` : 'wishlist', JSON.stringify(wishlist));
  }, [wishlist, userId, loadedForUserId]);

  useEffect(() => {
    let active = true;
    if (!user?._id) {
      setItems(readStoredArray('cart').filter(item => item?._id && item?.name));
      setWishlist(readStoredArray('wishlist').filter(product => product?._id && product?.name));
      localStorage.removeItem('cart_owner_id');
      setLoadedForUserId(null);
      setServerCartReady(true);
      return () => { active = false; };
    }
    setServerCartReady(false);
    setLoadedForUserId(null);
    setItems(readStoredArray(`cart_${user._id}`).filter(item => item?._id && item?.name));
    setWishlist(readStoredArray(`wishlist_${user._id}`).filter(product => product?._id && product?.name));
    API.get('/api/cart')
      .then(({ data }) => {
        if (!active) return null;
        const merged = [...(Array.isArray(data) ? data : [])];
        const guestCart = readStoredArray('cart');
        const previousOwner = localStorage.getItem('cart_owner_id');
        const safeGuestItems = previousOwner && previousOwner !== user._id ? [] : guestCart;
        for (const localItem of safeGuestItems) {
          const key = getCartItemKey(localItem);
          const existing = merged.find(item => getCartItemKey(item) === key);
          if (existing) existing.quantity = Math.min(Number(existing.stock) || 99, (Number(existing.quantity) || 0) + (Number(localItem.quantity) || 0));
          else merged.push(localItem);
        }
        setItems(merged);
        localStorage.setItem('cart_owner_id', user._id);
        localStorage.removeItem('cart');
        return API.put('/api/cart', { items: merged.map(item => ({ product: item._id, quantity: item.quantity, selectedColor: item.selectedColor || '', selectedSize: item.selectedSize || '' })) });
      })
      .then(response => { if (active && response?.data) setItems(response.data); })
      .catch(() => { /* Keep this account's browser cache usable if the account API is temporarily unavailable. */ })
      .finally(() => { if (active) { setLoadedForUserId(user._id); setServerCartReady(true); } });
    API.get('/api/wishlist')
      .then(({ data }) => {
        if (!active) return;
        const remote = Array.isArray(data) ? data : [];
        const remoteIds = new Set(remote.map(product => String(product._id)));
        const localWishlist = readStoredArray(`wishlist_${user._id}`);
        const previousOwner = localStorage.getItem('cart_owner_id');
        const guestWishlist = previousOwner && previousOwner !== user._id ? [] : readStoredArray('wishlist');
        const localOnly = [...localWishlist, ...guestWishlist].filter(product => product?._id && !remoteIds.has(String(product._id)))
          .filter((product, index, values) => values.findIndex(item => String(item._id) === String(product._id)) === index);
        Promise.allSettled(localOnly.map(product => API.post(`/api/wishlist/${product._id}`)))
          .then(() => API.get('/api/wishlist'))
          .then(result => {
            if (!active) return;
            setWishlist(Array.isArray(result.data) ? result.data : remote);
            localStorage.removeItem('wishlist');
          })
          .catch(() => { if (active) setWishlist(remote); });
      })
      .catch(() => { /* Keep locally saved items available if offline. */ });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !serverCartReady) return;
    API.put('/api/cart', { items: items.map(item => ({ product: item._id, quantity: item.quantity, selectedColor: item.selectedColor || '', selectedSize: item.selectedSize || '' })) })
      .catch(() => { /* Local persistence remains the fallback while offline. */ });
  }, [items, userId, serverCartReady]);

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
  const addToWishlist = product => {
    setWishlist(previous => previous.some(item => item._id === product._id) ? previous : [...previous, product]);
    if (user?._id) API.post(`/api/wishlist/${product._id}`).catch(() => {});
  };
  const removeFromWishlist = productId => {
    setWishlist(previous => previous.filter(product => product._id !== productId));
    if (user?._id) API.delete(`/api/wishlist/${productId}`).catch(() => {});
  };
  const isWishlisted = productId => wishlist.some(product => product._id === productId);
  const totalItems = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, recentlyViewed, addToRecentlyViewed, wishlist, addToWishlist, removeFromWishlist, isWishlisted }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    if (import.meta.env.DEV) throw new Error('useCart must be used inside a CartProvider.');
    return { items: [], addToCart:()=>{}, removeFromCart:()=>{}, updateQty:()=>{}, clearCart:()=>{}, totalItems:0, recentlyViewed:[], addToRecentlyViewed:()=>{}, wishlist:[], addToWishlist:()=>{}, removeFromWishlist:()=>{}, isWishlisted:()=>false };
  }
  return ctx;
};
