import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>PromptSubmissions - AI-Powered Filing & Compliance Platform</title>
      <meta name="description" content="PromptSubmissions helps UK-based companies file their Confirmation Statements, Annual Accounts, and Corporation Tax returns in a seamless, fast-tracked, and compliant manner." />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
      {/* Fonts loaded via CSS imports for better performance and privacy */}
    </Helmet>
    <App />
  </HelmetProvider>
);
