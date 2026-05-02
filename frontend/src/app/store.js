import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import spacesReducer from "../features/spaces/spaceSlice";
import projectsReducer from "../features/projects/projectSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import meetingsReducer from "../features/meetings/meetingsSlice";

export const store = configureStore({
  reducer:{
    auth: authReducer,
    spaces: spacesReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    notifications: notificationsReducer,
    meetings: meetingsReducer,
  }
})