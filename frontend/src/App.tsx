import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts"; // <--- Import this

function App() {
  const [currentView, setCurrentView] = useState("dashboard");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ 
        borderBottom: "1px solid rgba(255,255,255,0.1)", 
        padding: "1rem 2rem", 
        background: "var(--bg-card)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "32px", height: "32px", background: "var(--accent-primary)", borderRadius: "6px" }}></div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem" }}>
            AI Contract Manager
          </h2>
        </div>
        
        <div style={{ display: "flex", gap: "2rem" }}>
          <button 
            onClick={() => setCurrentView("dashboard")} 
            style={{ 
              background: "none", 
              border: "none", 
              color: currentView === "dashboard" ? "var(--accent-primary)" : "var(--text-secondary)", 
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView("contracts")} 
            style={{ 
              background: "none", 
              border: "none", 
              color: currentView === "contracts" ? "var(--accent-primary)" : "var(--text-secondary)", 
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Contracts
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: "2rem" }}>
        {currentView === "dashboard" ? <Dashboard /> : <Contracts />}
      </main>
    </div>
  );
}

export default App;