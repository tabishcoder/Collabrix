import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logout, getMe, login } from "../auth/authSlice";
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "./notificationsApi";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchNotificationsApi();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load notifications");
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      const res = await markNotificationReadApi(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update");
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsReadApi();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update");
    }
  },
);

const initialState = {
  items: [],
  unread: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    pushNotification(state, action) {
      const n = action.payload;
      if (!n?._id) return;
      if (state.items.some((x) => String(x._id) === String(n._id))) return;
      state.items.unshift(n);
      if (!n.read) state.unread = (state.unread || 0) + 1;
    },
  },
  extraReducers: (builder) => {
    const reset = () => ({ ...initialState });

    builder
      .addCase(logout.fulfilled, reset)
      .addCase(logout.rejected, reset)
      .addCase(getMe.rejected, reset)
      .addCase(login.fulfilled, reset)
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.unread = action.payload.unread ?? 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = String(action.payload._id);
        const idx = state.items.findIndex((n) => String(n._id) === id);
        if (idx !== -1) {
          const wasUnread = !state.items[idx].read;
          state.items[idx] = { ...state.items[idx], read: true };
          if (wasUnread && state.unread > 0) state.unread -= 1;
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }));
        state.unread = 0;
      });
  },
});

export const { pushNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
