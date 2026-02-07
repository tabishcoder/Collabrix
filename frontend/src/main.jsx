import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./app/store";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <Toaster position="top-right" />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);
