import api from "./api";
import { USE_MOCK } from "./config";
import { mockUser } from "../mock/user";

export async function login(email, password) {
  if (USE_MOCK) {
    await delay(300);

    return {
      ...mockUser,
    };
  }

  try {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = res.data;

    if (!token || !user) {
      throw new Error("Invalid login response");
    }

    localStorage.setItem("token", token);

    return user;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Login failed. Please check your credentials.";

    throw new Error(message);
  }
}

export async function register(userData) {
  if (USE_MOCK) {
    await delay(300);

    return {
      ...mockUser,
    };
  }

  try {
    const res = await api.post("/auth/register", userData);

    const { token, user } = res.data;

    if (token) {
      localStorage.setItem("token", token);
    }

    return user;
  } catch (error) {
    const message = error.response?.data?.message || "Registration failed.";

    throw new Error(message);
  }
}

export async function getCurrentUser() {
  if (USE_MOCK) {
    await delay(200);

    return {
      ...mockUser,
    };
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const res = await api.get("/users/me");

    return res.data.user || null;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      return null;
    }

    throw error;
  }
}

export async function logout() {
  localStorage.removeItem("token");
  return true;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
