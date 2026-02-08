import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSlice'
import spacesReducer from "../features/spaces/spaceSlice";

export const store = configureStore({
  reducer:{
    auth: authReducer,
    spaces: spacesReducer
  }
})