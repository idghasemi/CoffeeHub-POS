import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService.js";
import {
  clearAuthStorage,
  readAuthStorage,
  writeAuthStorage,
} from "../services/authStorage.js";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const storedAuth = readAuthStorage();
  const [auth, setAuth] = useState(storedAuth);
  const [initializing, setInitializing] = useState(Boolean(storedAuth));

  const clearAuth = useCallback(() => {
    clearAuthStorage();
    setAuth(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener("coffeehub:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("coffeehub:unauthorized", handleUnauthorized);
    };
  }, [clearAuth]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const current = readAuthStorage();
      if (!current?.token) {
        if (active) {
          setInitializing(false);
        }
        return;
      }

      try {
        const user = await getCurrentUser();
        if (active) {
          const nextAuth = { ...current, user };
          writeAuthStorage(nextAuth);
          setAuth(nextAuth);
        }
      } catch {
        if (active) {
          clearAuth();
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [clearAuth]);

  const login = useCallback(async (credentials) => {
    const result = await loginRequest(credentials);
    const nextAuth = {
      token: result.access_token,
      expiresAt: result.expires_at,
      user: result.user,
    };
    writeAuthStorage(nextAuth);
    setAuth(nextAuth);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (readAuthStorage()?.token) {
        await logoutRequest();
      }
    } catch {
      // Local cleanup must still happen when the server is unreachable.
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const updateUser = useCallback((user) => {
    setAuth((current) => {
      if (!current) {
        return current;
      }
      const nextAuth = { ...current, user };
      writeAuthStorage(nextAuth);
      return nextAuth;
    });
  }, []);

  const value = useMemo(
    () => ({
      token: auth?.token ?? null,
      user: auth?.user ?? null,
      authenticated: Boolean(auth?.token && auth?.user),
      initializing,
      login,
      logout,
      clearAuth,
      updateUser,
    }),
    [auth, clearAuth, initializing, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
