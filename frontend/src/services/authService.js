import http from "./http.js";

async function login(credentials) {
  const { data } = await http.post("/auth/login", credentials);
  return data;
}

async function getCurrentUser() {
  const { data } = await http.get("/auth/me");
  return data;
}

async function logout() {
  const { data } = await http.post("/auth/logout");
  return data;
}

async function changePassword(payload) {
  const { data } = await http.post("/auth/change-password", payload);
  return data;
}

export { changePassword, getCurrentUser, login, logout };
