import http from "../http.js";

async function getDashboardSummary() {
  const { data } = await http.get("/dashboard/summary");
  return data;
}

export { getDashboardSummary };
