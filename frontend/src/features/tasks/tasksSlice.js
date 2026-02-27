// src/features/tasks/tasksSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchTasksByProjectApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
} from "./tasksApi";

const initialState = {
  tasks: [],
  isLoading: false,
  isError: false,
  message: "",
};

// Fetch tasks
export const getProjectTasks = createAsyncThunk(
  "tasks/getProjectTasks",
  async (projectId, thunkAPI) => {
    try {
      const res = await fetchTasksByProjectApi(projectId);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch tasks",
      );
    }
  },
);

// Create task
export const addTask = createAsyncThunk(
  "tasks/addTask",
  async (taskData, thunkAPI) => {
    try {
      // ensure API expects projectId key (backend doc uses projectId)
      const payload = {
        ...taskData,
        projectId: taskData.projectId ?? taskData.project, // support both, but prefer projectId
      };
      const res = await createTaskApi(payload);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create task",
      );
    }
  },
);

// Update task
export const editTask = createAsyncThunk(
  "tasks/editTask",
  async ({ taskId, updates }, thunkAPI) => {
    try {
      const res = await updateTaskApi(taskId, updates);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update task",
      );
    }
  },
);

// Delete task
export const removeTask = createAsyncThunk(
  "tasks/removeTask",
  async (taskId, thunkAPI) => {
    try {
      await deleteTaskApi(taskId);
      return taskId;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to delete task",
      );
    }
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
 reducers: {
  resetTasks: () => initialState,

  optimisticStatusUpdate: (state, action) => {
    const { taskId, status } = action.payload;
    const task = state.tasks.find((t) => t._id === taskId);
    if (task) {
      task.status = status;
    }
  },
},
  extraReducers: (builder) => {
    builder
      .addCase(getProjectTasks.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(getProjectTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        // backend returns tasks sorted by creation date (newest first) per doc
        state.tasks = action.payload;
      })
      .addCase(getProjectTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(addTask.fulfilled, (state, action) => {
        // server returns the created task object
        state.tasks.unshift(action.payload);
      })

      .addCase(editTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        } else {
          // if task not present (edge case), add it
          state.tasks.unshift(action.payload);
        }
      })

      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      })

      .addCase(addTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(editTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(removeTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetTasks, optimisticStatusUpdate } = tasksSlice.actions;
export default tasksSlice.reducer;
