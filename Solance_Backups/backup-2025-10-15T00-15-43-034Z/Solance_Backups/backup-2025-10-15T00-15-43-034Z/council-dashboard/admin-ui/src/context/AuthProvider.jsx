import React, { createContext, useContext, useState } from "react";
import axios from "../utils/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    try {
      const res = await axios.post(
        "/api/admin/login",
        { username, password },
        { withCredentials: true },
      );
      setUser(res.data.user);
      setError(null);
    } catch (e) {
      setError("Login failed");
    }
  };
  const logout = () => {
    setUser(null);
    // Optionally call backend logout
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
