import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import spacesReducer from "../features/spaces/spaceSlice";
import projectsReducer from "../features/projects/projectSlice";

export const store = configureStore({
  reducer:{
    auth: authReducer,
    spaces: spacesReducer,
    projects: projectsReducer,
  }
})