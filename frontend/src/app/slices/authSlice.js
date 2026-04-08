import { createSlice } from "@reduxjs/toolkit";

const userFromStorage = localStorage.getItem("pms_user")
  ? JSON.parse(localStorage.getItem("pms_user"))
  : null;
const tokenFromStorage = localStorage.getItem("pms_token") || null;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: userFromStorage,
    token: tokenFromStorage,
    isAuthenticated: !!tokenFromStorage,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("pms_user", JSON.stringify(user));
      localStorage.setItem("pms_token", token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("pms_user");
      localStorage.removeItem("pms_token");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
