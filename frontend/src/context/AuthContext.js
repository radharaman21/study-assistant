import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

axios.defaults.headers.post["Content-Type"] = "application/json";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔥 Auto login on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ✅ LOGIN
  const login = async (email, password) => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });

    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(user);

    return user;
  };

  // ✅ REGISTER
  const register = async (name, email, password) => {
    const res = await axios.post("http://localhost:5000/api/auth/register", {
      name,
      email,
      password,
    });

    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(user);

    return user;
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  // ✅ UPDATE USER (save to localStorage + state)
  const updateUser = (newUser) => {
    if (!newUser) return;
    try {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      console.error('updateUser error', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};







/*import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext({});

// ✅ Hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// ✅ Base URL (proxy use kar rahe ho to ye enough hai)


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Auto login on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // 🔥 LOGIN (real backend)
  const login = async (email, password) => {
    try {
      const res = await axios.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      // ✅ save token + user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ set axios header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // ✅ update state
      setUser(user);

      return user;
    } catch (err) {
      throw err;
    }
  };

  // 🔥 REGISTER
  const register = async (name, email, password) => {
    try {
      const res = await axios.post("/auth/register", {
        name,
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);

      return user;
    } catch (err) {
      throw err;
    }
  };

  // 🔥 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    delete axios.defaults.headers.common["Authorization"];

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};*/