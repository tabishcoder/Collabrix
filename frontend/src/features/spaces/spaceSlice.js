import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as spaceApi from "./spaceApi";

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
    },
    clearSpaces: (state) => {
      state.spaces          = [];
      state.activeSpace     = null;
      state.activeSpaceRole = null;
      state.initialized     = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpaces.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchSpaces.fulfilled, (state, action) => {
        state.spaces      = action.payload;
        state.loading     = false;
        state.initialized = true;
        // Restore activeSpace role if it was already selected
        if (state.activeSpace) {
          const updated = action.payload.find((s) => s._id === state.activeSpace._id);
          if (updated) {
            state.activeSpace     = updated;
            state.activeSpaceRole = updated.myRole ?? state.activeSpaceRole;
          }
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
      })
      .addCase(createSpace.rejected, (state, action) => {
        state.error   = action.payload;
        state.loading = false;
      });
  },
});

export const { setActiveSpace, clearSpaces } = spaceSlice.actions;
export default spaceSlice.reducer;
