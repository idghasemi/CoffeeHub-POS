import http from "../http.js";

async function getCategories(params = {}) {
  const { data } = await http.get("/categories", { params });
  return data;
}

async function createCategory(payload) {
  const { data } = await http.post("/categories", payload);
  return data;
}

async function updateCategory(categoryId, payload) {
  const { data } = await http.put(`/categories/${categoryId}`, payload);
  return data;
}

async function deleteCategory(categoryId) {
  const { data } = await http.delete(`/categories/${categoryId}`);
  return data;
}

export { createCategory, deleteCategory, getCategories, updateCategory };
