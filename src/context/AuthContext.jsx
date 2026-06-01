import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

function safeParseJson(value) {
  try {
    if (!value || value === "undefined" || value === "null") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeRole(role = "") {
  const cleanRole = String(role || "").toLowerCase().trim();

  if (cleanRole === "admin") return "admin";
  if (cleanRole === "subadmin") return "subadmin";

  return "cliente";
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;

  const role = normalizeRole(user.role || user.rol);
  const authProvider = user.authProvider || "local";
  const googleLinked = Boolean(user.googleLinked || user.googleId || authProvider === "google");

  return {
    ...user,
    id: user.id || user._id || "",
    _id: user._id || user.id || "",
    nombre: user.nombre || user.name || "",
    apellido: user.apellido || user.lastName || "",
    alias: user.alias || user.username || "",
    email: user.email || user.correo || "",
    correo: user.correo || user.email || "",
    telefono: user.telefono || user.phone || "",
    telefonoCompleto: user.telefonoCompleto || "",
    authProvider,
    emailVerified: Boolean(user.emailVerified),
    hasPassword: Boolean(user.hasPassword),
    googleLinked,
    role
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  const clearSession = () => {
    localStorage.removeItem("smika_token");
    localStorage.removeItem("smika_user");

    setToken("");
    setUser(null);
  };

  const saveSession = ({ token: newToken, user: newUser }) => {
    const normalizedUser = normalizeUser(newUser);

    if (!newToken || !normalizedUser) {
      throw new Error("No se pudo guardar la sesión del usuario.");
    }

    localStorage.setItem("smika_token", newToken);
    localStorage.setItem("smika_user", JSON.stringify(normalizedUser));

    setToken(newToken);
    setUser(normalizedUser);
  };

  const updateStoredUser = (newUser) => {
    const normalizedUser = normalizeUser(newUser);

    if (!normalizedUser) {
      throw new Error("No se pudo actualizar el usuario.");
    }

    localStorage.setItem("smika_user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    return normalizedUser;
  };

  const refreshProfile = async () => {
    const storedToken = localStorage.getItem("smika_token");

    if (!storedToken) return null;

    const data = await apiRequest("/auth/profile", {
      method: "GET"
    });

    return updateStoredUser(data.user);
  };

  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem("smika_token");
        const storedUser = safeParseJson(localStorage.getItem("smika_user"));

        if (!storedToken || !storedUser) {
          clearSession();
          return;
        }

        setToken(storedToken);
        setUser(normalizeUser(storedUser));

        await refreshProfile();
      } catch (error) {
        if (error?.status === 401) {
          clearSession();
        }
      } finally {
        setLoadingAuth(false);
      }
    };

    loadStoredSession();
  }, []);

  const registerUser = async (payload) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveSession({
      token: data.token,
      user: data.user
    });

    return data;
  };

  const loginUser = async (payload) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveSession({
      token: data.token,
      user: data.user
    });

    return data;
  };

  const loginWithGoogle = async (credential) => {
    const data = await apiRequest("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential })
    });

    saveSession({
      token: data.token,
      user: data.user
    });

    return data;
  };

  const linkGoogleAccount = async (credential) => {
    const data = await apiRequest("/auth/google/link", {
      method: "POST",
      body: JSON.stringify({ credential })
    });

    if (data.user) {
      updateStoredUser(data.user);
    }

    return data;
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(() => {
    const isAuthenticated = Boolean(token && user);

    const role = normalizeRole(user?.role);
    const isAdmin = role === "admin";
    const isSubadmin = role === "subadmin";
    const isStaff = isAdmin || isSubadmin;
    const isClient = role === "cliente";

    return {
      user,
      currentUser: user,
      token,
      loadingAuth,

      role,
      isAuthenticated,
      isAdmin,
      isSubadmin,
      isStaff,
      isClient,

      registerUser,
      loginUser,
      loginWithGoogle,
      linkGoogleAccount,
      logout,
      refreshProfile
    };
  }, [user, token, loadingAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
