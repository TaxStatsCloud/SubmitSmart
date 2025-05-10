import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>Submitra - AI-Powered Filing & Compliance Platform</title>
      <meta name="description" content="Submitra helps UK-based companies file their Confirmation Statements, Annual Accounts, and Corporation Tax returns in a seamless, fast-tracked, and compliant manner." />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </Helmet>
    <App />
  </HelmetProvider>
);
