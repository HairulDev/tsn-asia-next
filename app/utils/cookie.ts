import Cookies from "js-cookie";

const isProd = process.env.NODE_ENV === "production";

// ===== TOKEN =====
export const setToken = (token: string) => {
  Cookies.set("token", token, {
    expires: 1, // 1 hari
    secure: isProd,
    sameSite: "strict",
  });
};

export const getToken = (): string | undefined => {
  return Cookies.get("token");
};

export const removeToken = () => {
  Cookies.remove("token");
};

// ===== USER =====
export const setUser = (user: any) => {
  Cookies.set("user", JSON.stringify(user), {
    expires: 1,
    secure: isProd,
    sameSite: "strict",
  });
};

export const getUser = (): any | null => {
  const user = Cookies.get("user");
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  Cookies.remove("user");
};

// ===== CLEAR ALL =====
export const clearAuth = () => {
  removeToken();
  removeUser();
};
