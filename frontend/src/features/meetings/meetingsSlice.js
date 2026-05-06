import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logout, getMe, login } from "../auth/authSlice";
import {
  createMeetingApi,
  joinMeetingApi,
  leaveMeetingApi,
  endMeetingApi,
  getMeetingByIdApi,
} from "./meetingsApi";

const initialState = {
  activeMeeting: null,
  acs: null,
  loading: false,
  error: null,
};

export const createMeeting = createAsyncThunk(
  "meetings/createMeeting",
  async ({ title, projectId }, thunkAPI) => {
    try {
      const res = await createMeetingApi({ title, projectId });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to create meeting",
      );
    }
  },
);

export const joinMeeting = createAsyncThunk(
  "meetings/joinMeeting",
  async (meetingId, thunkAPI) => {
    try {
      const res = await joinMeetingApi(meetingId);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to join meeting",
      );
    }
  },
);

export const leaveMeeting = createAsyncThunk(
  "meetings/leaveMeeting",
  async (meetingId, thunkAPI) => {
    try {
      const res = await leaveMeetingApi(meetingId);
      return { meetingId, meeting: res.data.meeting };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to leave meeting",
      );
    }
  },
);

export const endMeeting = createAsyncThunk(
  "meetings/endMeeting",
  async (meetingId, thunkAPI) => {
    try {
      const res = await endMeetingApi(meetingId);
      return { meetingId, meeting: res.data.meeting };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to end meeting",
      );
    }
  },
);

export const fetchMeetingById = createAsyncThunk(
  "meetings/fetchMeetingById",
  async (meetingId, thunkAPI) => {
    try {
      const res = await getMeetingByIdApi(meetingId);
      return res.data.meeting;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load meeting",
      );
    }
  },
);

const meetingsSlice = createSlice({
  name: "meetings",
  initialState,
  reducers: {
    clearMeetingSession: () => initialState,
    applyMeetingFromSocket(state, action) {
      const { meetingId, meeting } = action.payload || {};
      if (!meetingId || !state.activeMeeting?._id) return;
      if (String(state.activeMeeting._id) !== String(meetingId)) return;
      if (!meeting) return;
      state.activeMeeting = {
        ...state.activeMeeting,
        title: meeting.title ?? state.activeMeeting.title,
        status: meeting.status ?? state.activeMeeting.status,
        groupId: meeting.groupId ?? state.activeMeeting.groupId,
        projectId: meeting.projectId ?? state.activeMeeting.projectId,
        participants: meeting.participants ?? state.activeMeeting.participants,
        createdBy: meeting.createdBy ?? state.activeMeeting.createdBy,
      };
    },
  },
  extraReducers: (builder) => {
    const reset = () => ({ ...initialState });

    builder
      .addCase(logout.fulfilled, reset)
      .addCase(logout.rejected, reset)
      .addCase(getMe.rejected, reset)
      .addCase(login.fulfilled, reset);

    builder
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.activeMeeting = action.payload.meeting;
        state.acs = action.payload.acs;
        state.error = null;
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(joinMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.activeMeeting = action.payload.meeting;
        state.acs = action.payload.acs;
        state.error = null;
      })
      .addCase(joinMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(leaveMeeting.fulfilled, (state, action) => {
        if (
          state.activeMeeting &&
          String(state.activeMeeting._id) === String(action.payload.meetingId)
        ) {
          state.activeMeeting = action.payload.meeting;
          state.acs = null;
        }
      })
      .addCase(leaveMeeting.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(endMeeting.fulfilled, (state, action) => {
        if (
          state.activeMeeting &&
          String(state.activeMeeting._id) === String(action.payload.meetingId)
        ) {
          state.activeMeeting = action.payload.meeting;
          state.acs = null;
        }
      })
      .addCase(endMeeting.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(fetchMeetingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeMeeting = action.payload;
        state.error = null;
      })
      .addCase(fetchMeetingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.activeMeeting = null;
      });
  },
});

export const { clearMeetingSession, applyMeetingFromSocket } = meetingsSlice.actions;
export default meetingsSlice.reducer;
