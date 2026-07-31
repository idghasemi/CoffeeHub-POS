import http from "../http.js";

async function getProducts(params = {}) {
  const { data } = await http.get("/products", { params });
  return data;
}

async function getProduct(productId) {
  const { data } = await http.get(`/products/${productId}`);
  return data;
}

async function createProduct(payload) {
  const { data } = await http.post("/products", payload);
  return data;
}

async function updateProduct(productId, payload) {
  const { data } = await http.put(`/products/${productId}`, payload);
  return data;
}

async function deleteProduct(productId) {
  const { data } = await http.delete(`/products/${productId}`);
  return data;
}

export { createProduct, deleteProduct, getProduct, getProducts, updateProduct };
