import http from "./http.js";

async function getEmployees(params = {}) {
  const { data } = await http.get("/employees", { params });
  return data;
}

async function createEmployee(payload) {
  const { data } = await http.post("/employees", payload);
  return data;
}

async function updateEmployee(employeeId, payload) {
  const { data } = await http.put(`/employees/${employeeId}`, payload);
  return data;
}

async function deactivateEmployee(employeeId) {
  const { data } = await http.delete(`/employees/${employeeId}`);
  return data;
}

export { createEmployee, deactivateEmployee, getEmployees, updateEmployee };
