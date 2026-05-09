import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as spaceApi from "./spaceApi";
import { logout, getMe, login } from "../auth/authSlice";

const LAST_SPACE_ID_KEY = "collabrix:lastActiveSpaceId";

function readLastSpaceId() {
  try {
    return localStorage.getItem(LAST_SPACE_ID_KEY);
  } catch {
    return null;
  }
}

function writeLastSpaceId(spaceId) {
  try {
    if (!spaceId) localStorage.removeItem(LAST_SPACE_ID_KEY);
    else localStorage.setItem(LAST_SPACE_ID_KEY, String(spaceId));
  } catch {
    // ignore storage issues (private mode, blocked, etc.)
  }
}

export const fetchSpaces = createAsyncThunk(
  "spaces/fetchSpaces",
  async (_, { rejectWithValue }) => {
    try {
      const res = await spaceApi.getSpaces();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createSpace = createAsyncThunk(
  "spaces/createSpace",
  async (data, { rejectWithValue }) => {
    try {
      const res = await spaceApi.createSpace(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  spaces:          [],
  activeSpace:     null,
  activeSpaceRole: null, // 'owner' | 'admin' | 'member'
  loading:         false,
  initialized:     false,
  error:           null,
};

const spaceSlice = createSlice({
  name: "spaces",
  initialState,
  reducers: {
    setActiveSpace: (state, action) => {
      state.activeSpace     = action.payload;
      // myRole is included in the space object returned by the API
      state.activeSpaceRole = action.payload?.myRole ?? null;
      writeLastSpaceId(action.payload?._id ?? null);
    },
    clearSpaces: (state) => {
      state.spaces          = [];
      state.activeSpace     = null;
      state.activeSpaceRole = null;
      state.initialized     = false;
      state.loading         = false;
      state.error           = null;
      writeLastSpaceId(null);
    },
  },
  extraReducers: (builder) => {
    const resetToInitial = () => ({ ...initialState });

    builder
      .addCase(logout.fulfilled, resetToInitial)
      .addCase(logout.rejected, resetToInitial)
      .addCase(getMe.rejected, resetToInitial)
      .addCase(login.fulfilled, resetToInitial)
      .addCase(fetchSpaces.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchSpaces.fulfilled, (state, action) => {
        state.spaces      = action.payload;
        state.loading     = false;
        state.initialized = true;

        // 1) If we already have an active space, refresh it (or clear if removed).
        if (state.activeSpace?._id) {
          const updated = action.payload.find((s) => s._id === state.activeSpace._id);
          if (updated) {
            state.activeSpace = updated;
            state.activeSpaceRole = updated.myRole ?? state.activeSpaceRole;
            writeLastSpaceId(updated._id);
            return;
          }
          state.activeSpace = null;
          state.activeSpaceRole = null;
        }

        // 2) Restore last selected workspace (if any) so we don't ask every refresh.
        const lastId = readLastSpaceId();
        if (lastId) {
          const restored = action.payload.find((s) => String(s._id) === String(lastId));
          if (restored) {
            state.activeSpace = restored;
            state.activeSpaceRole = restored.myRole ?? null;
            return;
          }
          // Stale id; clear persisted value.
          writeLastSpaceId(null);
        }

        // 3) If the user has exactly one workspace, auto-select it.
        if (action.payload?.length === 1) {
          const only = action.payload[0];
          state.activeSpace = only;
          state.activeSpaceRole = only?.myRole ?? null;
          writeLastSpaceId(only?._id ?? null);
        }
      })
      .addCase(fetchSpaces.rejected, (state, action) => {
        state.error       = action.payload;
        state.loading     = false;
        state.initialized = true;
      })
      .addCase(createSpace.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSpace.fulfilled, (state, action) => {
        state.spaces.push(action.payload);
        state.activeSpace     = action.payload;
        state.activeSpaceRole = action.payload.myRole ?? 'owner';
        state.loading         = false;
        writeLastSpaceId(action.payload?._id ?? null);
      })
      .addCase(createSpace.rejected, (state, action) => {
        state.error   = action.payload;
        state.loading = false;
      });
  },
});

export const { setActiveSpace, clearSpaces } = spaceSlice.actions;
export default spaceSlice.reducer;
