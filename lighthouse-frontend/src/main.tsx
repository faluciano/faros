import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { getLighthouseMapData } from "./utils/api";

// The map route needs the marker data and the map library no matter who is
// signed in, so start both downloads now instead of after the session check.
if (window.location.pathname.startsWith("/lighthouse")) {
  getLighthouseMapData().catch(() => undefined);
  import("maplibre-gl").catch(() => undefined);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
