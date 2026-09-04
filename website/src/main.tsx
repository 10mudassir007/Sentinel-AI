// Runtime validation of critical env vars — fail fast instead of silently
// defaulting to localhost in production.
const REQUIRED_ENV_VARS = ["VITE_API_URL"] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!import.meta.env[key]) {
    throw new Error(`${key} is not set. Check your .env file or deployment variables.`);
  }
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
