import http from "../http.js";

async function getCustomers(params = {}) {
  const { data } = await http.get("/customers", { params });
  return data;
}

async function getCustomer(customerId) {
  const { data } = await http.get(`/customers/${customerId}`);
  return data;
}

async function createCustomer(payload) {
  const { data } = await http.post("/customers", payload);
  return data;
}

async function updateCustomer(customerId, payload) {
  const { data } = await http.put(`/customers/${customerId}`, payload);
  return data;
}

async function deleteCustomer(customerId) {
  const { data } = await http.delete(`/customers/${customerId}`);
  return data;
}

async function chargeCustomerWallet(customerId, payload) {
  const { data } = await http.post(`/customers/${customerId}/wallet/charge`, payload);
  return data;
}

async function getCustomerWalletTransactions(customerId) {
  const { data } = await http.get(`/customers/${customerId}/wallet/transactions`);
  return data;
}

async function getCustomerInvoices(customerId) {
  const { data } = await http.get(`/customers/${customerId}/invoices`);
  return data;
}

export {
  chargeCustomerWallet,
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomerInvoices,
  getCustomers,
  getCustomerWalletTransactions,
  updateCustomer,
};
