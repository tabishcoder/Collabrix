import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as spaceApi from "./spaceApi";

// Fetch all spaces for the user
export const fetchSpaces = createAsyncThunk(
  "spaces/fetchSpaces",
  async (_, { rejectWithValue }) => {
    try {
      const response = await spaceApi.getSpaces();
      return response.data; // array of spaces
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// Create a new space
export const createSpace = createAsyncThunk(
  "spaces/createSpace",
  async (data, { rejectWithValue }) => {
    try {
      const response = await spaceApi.createSpace(data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

const initialState = {
  spaces: [],
  activeSpace: null,
  loading: false,
  initialized: false,
  error: null,
};

const spaceSlice = createSlice({
  name: "spaces",
  initialState,
  reducers: {
    setActiveSpace: (state, action) => {
      state.activeSpace = action.payload;
    },
    clearSpaces: (state) => {
      state.spaces = [];
      state.activeSpace = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSpaces
      .addCase(fetchSpaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpaces.fulfilled, (state, action) => {
        state.spaces = action.payload;
        state.loading = false;
        state.initialized = true; // mark initialized after fetch completes
      })
      .addCase(fetchSpaces.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
        state.initialized = true; // still mark as initialized
      })
      // createSpace
      .addCase(createSpace.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSpace.fulfilled, (state, action) => {
        state.spaces.push(action.payload);
        state.activeSpace = action.payload;
        state.loading = false;
      })
      .addCase(createSpace.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { setActiveSpace, clearSpaces } = spaceSlice.actions;
export default spaceSlice.reducer;
