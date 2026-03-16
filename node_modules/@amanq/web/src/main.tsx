import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import "./styles.css";

function showError(message: string) {
  const el = document.getElementById("root");
  if (el) {
    el.innerHTML = `
      <div style="padding:24px;max-width:560px;margin:40px auto;background:#101623;border:1px solid #2a3344;border-radius:12px;color:#e6ebf2;font-family:system-ui,sans-serif">
        <h2 style="margin:0 0 12px 0;color:#ff7b7b">Failed to load app</h2>
        <pre style="margin:0;padding:12px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:12px;overflow:auto;white-space:pre-wrap">${String(message).replace(/</g, "&lt;")}</pre>
      </div>
    `;
  }
}

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = "<p>Root element #root not found.</p>";
} else {
  try {
    createRoot(root).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
    console.error(err);
  }
}
