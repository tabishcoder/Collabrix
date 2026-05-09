import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import spacesReducer from "../features/spaces/spaceSlice";
import projectsReducer from "../features/projects/projectSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import meetingsReducer from "../features/meetings/meetingsSlice";
import chatsReducer from "../features/chats/chatSlice";
import timeTrackingReducer from "../features/time/timeTrackingSlice";

export const store = configureStore({
  reducer:{
    auth: authReducer,
    spaces: spacesReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    notifications: notificationsReducer,
    meetings: meetingsReducer,
    chats: chatsReducer,
    timeTracking: timeTrackingReducer,
  }
})