import { useMemo, useState } from "react";

function useCart() {
  const [items, setItems] = useState([]);

  function addProduct(product) {
    const stock = Number(product.stock || 0);
    const current = items.find((item) => item.product.id === product.id);
    const nextQuantity = Number(current?.quantity || 0) + 1;

    if (!product.is_active || stock <= 0) {
      return { ok: false, reason: "out-of-stock" };
    }
    if (nextQuantity > stock) {
      return { ok: false, reason: "stock-limit" };
    }

    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.product.id === product.id);
      if (existing) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Number(item.quantity) + 1 }
            : item,
        );
      }
      return [...currentItems, { product, quantity: 1 }];
    });
    return { ok: true };
  }

  function setQuantity(productId, quantity) {
    const item = items.find((entry) => entry.product.id === productId);
    if (!item) {
      return { ok: false, reason: "not-found" };
    }

    const normalized = Number(quantity);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      setItems((current) => current.filter((entry) => entry.product.id !== productId));
      return { ok: true, removed: true };
    }
    if (normalized > Number(item.product.stock || 0)) {
      return { ok: false, reason: "stock-limit" };
    }

    setItems((current) =>
      current.map((entry) =>
        entry.product.id === productId
          ? { ...entry, quantity: normalized }
          : entry,
      ),
    );
    return { ok: true };
  }

  function increment(productId) {
    const item = items.find((entry) => entry.product.id === productId);
    return item ? setQuantity(productId, Number(item.quantity) + 1) : { ok: false };
  }

  function decrement(productId) {
    const item = items.find((entry) => entry.product.id === productId);
    return item ? setQuantity(productId, Number(item.quantity) - 1) : { ok: false };
  }

  function removeProduct(productId) {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.product.price || 0) * Number(item.quantity || 0),
        0,
      ),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  );

  return {
    items,
    subtotal,
    itemCount,
    addProduct,
    setQuantity,
    increment,
    decrement,
    removeProduct,
    clearCart,
  };
}

export default useCart;
