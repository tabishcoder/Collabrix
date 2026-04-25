import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./app/store";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ThemeProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: "",
        style: {
          background: "var(--color-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-soft)",
          fontSize: "0.875rem",
          maxWidth: "22rem",
        },
        success: {
          iconTheme: { primary: "var(--color-success)", secondary: "var(--color-card)" },
        },
        error: {
          iconTheme: { primary: "var(--color-danger)", secondary: "var(--color-card)" },
        },
      }}
    />
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </ThemeProvider>
  </Provider>,
);
