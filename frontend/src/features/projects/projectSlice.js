import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProjectsBySpaceApi,
  getProjectByIdApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from "./projectApi";

// Fetch projects by space
export const fetchProjectsBySpace = createAsyncThunk(
  "projects/fetchBySpace",
  async (spaceId, thunkAPI) => {
    const res = await getProjectsBySpaceApi(spaceId);
    return res.data;
  },
);

// Fetch single project
export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (projectId, thunkAPI) => {
    const res = await getProjectByIdApi(projectId);
    return res.data;
  },
);

// Create project
export const createProject = createAsyncThunk(
  "projects/create",
  async (data, thunkAPI) => {
    const res = await createProjectApi(data);
    return res.data;
  },
);

// Update project
export const updateProject = createAsyncThunk(
  "projects/update",
  async ({ id, data }, thunkAPI) => {
    const res = await updateProjectApi(id, data);
    return res.data;
  },
);

// Delete project
export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId, thunkAPI) => {
    await deleteProjectApi(projectId);
    return projectId;
  },
);

const projectSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    activeProject: null,
    activeProjectMembers: [],
    loading: false,
    error: null,
  },
  reducers: {
  setActiveProject(state, action) {
    state.activeProject = action.payload;
  },
},

  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsBySpace.fulfilled, (state, action) => {
        state.projects = action.payload;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.activeProject = action.payload;
        console.log(action.payload);
        // state.activeProjectMembers = action.payload.
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.activeProject = action.payload;
        state.projects = state.projects.map((p) =>
          p._id === action.payload._id ? action.payload : p,
        );
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.activeProject?._id === action.payload) {
          state.activeProject = null;
        }
      });
  },
});
export const { setActiveProject } = projectSlice.actions;
export default projectSlice.reducer;
