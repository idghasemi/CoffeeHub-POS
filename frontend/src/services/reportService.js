import http from "./http.js";

async function getSalesReport(params = {}) {
  const { data } = await http.get("/reports/sales", { params });
  return data;
}

export { getSalesReport };
