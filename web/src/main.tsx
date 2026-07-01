import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Slice 1: empty shell. The streaming chat UI arrives in slice 3.
function App() {
  return <h1>freechat</h1>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
