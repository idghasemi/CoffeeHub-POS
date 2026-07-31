const STORAGE_KEY = "coffeehub.auth";

function readAuthStorage() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value);
    if (!parsed?.token || !parsed?.user) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeAuthStorage(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export { clearAuthStorage, readAuthStorage, writeAuthStorage };
