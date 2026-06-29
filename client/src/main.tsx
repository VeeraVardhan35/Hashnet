import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#1a1a2e",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: "600",
        },
        success: {
          iconTheme: { primary: "#10b981", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#fff" },
        },
      }}
    />
  </React.StrictMode>
);