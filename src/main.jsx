import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminDataProvider } from "./context/AdminDataContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AdminDataProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AdminDataProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);