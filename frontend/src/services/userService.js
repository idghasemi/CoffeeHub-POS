import http from "./http.js";

async function getUsers(params = {}) {
  const { data } = await http.get("/users", { params });
  return data;
}

async function createUser(payload) {
  const { data } = await http.post("/users", payload);
  return data;
}

async function updateUser(userId, payload) {
  const { data } = await http.put(`/users/${userId}`, payload);
  return data;
}

async function deactivateUser(userId) {
  const { data } = await http.delete(`/users/${userId}`);
  return data;
}

async function resetUserPassword(userId, newPassword) {
  const { data } = await http.post(`/users/${userId}/reset-password`, {
    new_password: newPassword,
  });
  return data;
}

export { createUser, deactivateUser, getUsers, resetUserPassword, updateUser };
