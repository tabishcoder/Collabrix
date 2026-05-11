import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
  resetPasswordApi,
  requestResetPasswordApi,
  verifyOtpApi,
} from "./authApi";
import { clearAuthTokens } from "../../services/authTokens";

/* =========================
   LOGIN
========================= */
export const login = createAsyncThunk("auth/login", async (data, thunkAPI) => {
  try {
    const res = await loginApi(data);
    const d = res.data;
    return {
      _id: d._id,
      name: d.name,
      email: d.email,
      role: d.role || "member",
    };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

/* =========================
   REGISTER
========================= */
export const register = createAsyncThunk(
  "auth/register",
  async (data, thunkAPI) => {
    try {
      const res = await registerApi(data);
      return res.data.data ?? res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message,
      );
    }
  },
);

/* =========================
   GET ME (restore auth)
========================= */
export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMeApi();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Session expired");
    }
  },
);

/* =========================
   LOGOUT
========================= */
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    } finally {
      clearAuthTokens();
    }
  },
);

/* =========================
   REQUEST RESET PASSWORD
========================= */
export const requestResetPassword = createAsyncThunk(
  "auth/requestResetPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await requestResetPasswordApi({ email });
      return res.data; // contains userId
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to request reset password",
      );
    }
  },
);

/* =========================
   VERIFY OTP
========================= */
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ userId, otp }, { rejectWithValue }) => {
    try {
      const res = await verifyOtpApi({ userId, otp }); // call POST /verify-otp
      return res.data; // contains resetToken for password reset
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "OTP verification failed",
      );
    }
  },
);

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, newPassword }, { rejectWithValue }) => {
    try {
      const res = await resetPasswordApi({ resetToken, newPassword });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to reset password",
      );
    }
  },
);

/* =========================
   SLICE
========================= */
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true, // 🔥 required for refresh flow
    error: null,

    // forgot password
    userId: null,
    resetToken: null,
    resetRequested: false,
    otpVerified: false,
    resetSuccess: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* LOGIN */
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      /* GET ME */
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      /* LOGOUT */
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        // Still end the client session if the API fails (cookies may remain; user can retry).
        state.user = null;
        state.isAuthenticated = false;
      })

      // REQUEST RESET
      .addCase(requestResetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestResetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetRequested = true;
        state.userId = action.payload.userId;
      })
      .addCase(requestResetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // VERIFY OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpVerified = true;
        state.resetToken = action.payload.resetToken;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default authSlice.reducer;
