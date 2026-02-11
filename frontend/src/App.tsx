import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts";
import Compare from "./pages/Compare";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Register from "./pages/Register";
import VendorDashboard from "./pages/VendorDashboard";

const AppContent = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [isRegistering, setIsRegistering] = useState(false);

  // If not logged in, decide between Login or Register
  if (!isAuthenticated) {
    return isRegistering 
      ? <Register onSwitchToLogin={() => setIsRegistering(false)} />
      : <Login onSwitchToRegister={() => setIsRegistering(true)} />;
  }

  // Render content based on user role
  const renderContent = () => {
    if (user?.role === 'vendor') {
      return <VendorDashboard />;
    }

    // Admins/Managers see the full suite
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'contracts': return <Contracts />;
      case 'compare': return <Compare />;
      default: return <Dashboard />;
    }
  };

  // Determine if user should see navigation
  const showNavigation = user?.role !== 'vendor';

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
        
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {showNavigation ? (
            <div style={{ display: "flex", gap: "1rem" }}>
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
              <button 
                onClick={() => setCurrentView("compare")} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: currentView === "compare" ? "var(--accent-primary)" : "var(--text-secondary)", 
                  cursor: "pointer", 
                  fontWeight: 500 
                }}
              >
                Compare
              </button>
            </div>
          ) : (
            <div></div> // Spacer for vendors
          )}
          
          <div style={{ 
            paddingLeft: "2rem", 
            borderLeft: showNavigation ? "1px solid #333" : "none", 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem" 
          }}>
            <span style={{ fontSize: "0.9rem", color: "white" }}>
              {user?.full_name} <span style={{ opacity: 0.5 }}>({user?.role})</span>
            </span>
            <button 
              onClick={logout} 
              style={{ 
                background: "rgba(255,255,255,0.1)", 
                border: "none", 
                color: "white", 
                padding: "0.5rem 1rem", 
                borderRadius: "4px", 
                cursor: "pointer", 
                fontSize: "0.8rem" 
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, padding: "2rem" }}>
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;