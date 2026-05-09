import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logout, getMe, login } from "../auth/authSlice";
import {
  fetchActiveTimerApi,
  startTimerApi,
  stopTimerApi,
} from "./timeEntriesApi";

const initialState = {
  activeEntry: null,
  loading: false,
  error: null,
};

export const fetchActiveTimer = createAsyncThunk(
  "timeTracking/fetchActive",
  async (_, thunkAPI) => {
    try {
      const res = await fetchActiveTimerApi();
      return res.data?.entry ?? null;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to load timer",
      );
    }
  },
);

export const startTimer = createAsyncThunk(
  "timeTracking/start",
  async (taskId, thunkAPI) => {
    try {
      const res = await startTimerApi(taskId);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to start timer",
      );
    }
  },
);

export const stopTimer = createAsyncThunk(
  "timeTracking/stop",
  async (taskId, thunkAPI) => {
    try {
      const res = await stopTimerApi(taskId);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to stop timer",
      );
    }
  },
);

const timeTrackingSlice = createSlice({
  name: "timeTracking",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const reset = () => ({ ...initialState });

    builder
      .addCase(logout.fulfilled, reset)
      .addCase(logout.rejected, reset)
      .addCase(getMe.rejected, reset)
      .addCase(login.fulfilled, reset)

      .addCase(fetchActiveTimer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveTimer.fulfilled, (state, action) => {
        state.loading = false;
        state.activeEntry = action.payload;
      })
      .addCase(fetchActiveTimer.rejected, (state, action) => {
        state.loading = false;
        state.activeEntry = null;
        state.error = action.payload ?? null;
      })

      .addCase(startTimer.pending, (state) => {
        state.error = null;
      })
      .addCase(startTimer.fulfilled, (state, action) => {
        state.activeEntry = action.payload;
      })
      .addCase(startTimer.rejected, (state, action) => {
        state.error = action.payload ?? null;
      })

      .addCase(stopTimer.fulfilled, (state) => {
        state.activeEntry = null;
      })
      .addCase(stopTimer.rejected, (state, action) => {
        state.error = action.payload ?? null;
      });
  },
});

export default timeTrackingSlice.reducer;
