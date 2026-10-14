import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'sf_cart';

const loadCart = () => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const capped = Math.min(newQty, product.stock);
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: capped } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          stock: product.stock,
          sku: product.sku,
          quantity: Math.min(quantity, product.stock),
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCharge = itemsTotal >= 500 ? 0 : 50;
  const totalAmount = itemsTotal + shippingCharge;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      itemsTotal,
      shippingCharge,
      totalAmount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
