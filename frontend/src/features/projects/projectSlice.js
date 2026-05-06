import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProjectsBySpaceApi,
  getProjectByIdApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from "./projectApi";
import { logout, getMe, login } from "../auth/authSlice";

// Fetch projects by space
export const fetchProjectsBySpace = createAsyncThunk(
  "projects/fetchBySpace",
  async (spaceId) => {
    const res = await getProjectsBySpaceApi(spaceId);
    return res.data;
  },
);

// Fetch single project
export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (projectId) => {
    const res = await getProjectByIdApi(projectId);
    return res.data;
  },
);

// Create project
export const createProject = createAsyncThunk(
  "projects/create",
  async (data) => {
    const res = await createProjectApi(data);
    return res.data;
  },
);

// Update project
export const updateProject = createAsyncThunk(
  "projects/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateProjectApi(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to update project");
    }
  },
);

// Delete project
export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId, { rejectWithValue }) => {
    try {
      await deleteProjectApi(projectId);
      return projectId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete project");
    }
  },
);

const initialState = {
  projects: [],
  activeProject: null,
  activeProjectMembers: [],
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setActiveProject(state, action) {
      state.activeProject = action.payload;
    },
    clearProjects(state) {
      state.projects = [];
      state.activeProject = null;
      state.activeProjectMembers = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    const setPending  = (state)          => { state.loading = true;  state.error = null; };
    const setRejected = (state, action)  => { state.loading = false; state.error = action.payload || action.error?.message || "Error"; };
    const resetToInitial = () => ({ ...initialState });

    builder
      .addCase(logout.fulfilled, resetToInitial)
      .addCase(logout.rejected, resetToInitial)
      .addCase(getMe.rejected, resetToInitial)
      .addCase(login.fulfilled, resetToInitial)
      // fetchProjectsBySpace — does not use `loading` (avoids clobbering fetchProjectById / page skeleton)
      .addCase(fetchProjectsBySpace.fulfilled, (state, action) => {
        state.projects = action.payload;
      })
      .addCase(fetchProjectsBySpace.rejected, () => {
        /* keep existing list; avoids overwriting fetchProjectById error UI */
      })

      // fetchProjectById
      .addCase(fetchProjectById.pending,   setPending)
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading       = false;
        state.activeProject = action.payload;
      })
      .addCase(fetchProjectById.rejected,  setRejected)

      // createProject
      .addCase(createProject.pending,   setPending)
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.unshift(action.payload);
      })
      .addCase(createProject.rejected,  setRejected)

      // updateProject
      .addCase(updateProject.fulfilled, (state, action) => {
        state.activeProject = action.payload;
        state.projects = state.projects.map((p) =>
          p._id === action.payload._id ? action.payload : p,
        );
      })

      // deleteProject
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.activeProject?._id === action.payload) state.activeProject = null;
      });
  },
});
export const { setActiveProject, clearProjects } = projectSlice.actions;
export default projectSlice.reducer;
