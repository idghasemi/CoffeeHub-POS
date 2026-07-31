import http from "../http.js";

async function createInvoice(payload) {
  const { data } = await http.post("/invoices", payload);
  return data;
}

async function getInvoices(params = {}) {
  const { data } = await http.get("/invoices", { params });
  return data;
}

async function getInvoice(invoiceId) {
  const { data } = await http.get(`/invoices/${invoiceId}`);
  return data;
}

export { createInvoice, getInvoice, getInvoices };
