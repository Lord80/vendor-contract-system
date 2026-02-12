import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Contracts from "./pages/Contracts";
import Compare from "./pages/Compare";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Register from "./pages/Register";
import VendorDashboard from "./pages/VendorDashboard";
import AdminUsers from "./pages/AdminUsers";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

const AppContent = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  // View state: 'dashboard', 'contracts', 'compare', 'users'
  const [currentView, setCurrentView] = useState("dashboard");
  const [isRegistering, setIsRegistering] = useState(false);

  // If not logged in, decide between Login or Register
  if (!isAuthenticated) {
    if (isRegistering) {
      return <Register onSwitchToLogin={() => setIsRegistering(false)} />;
    }
    return <Login onSwitchToRegister={() => setIsRegistering(true)} />;
  }

  // Render content based on user role & current view
  const renderContent = () => {
    // 🏢 Vendor View (Vendors have a completely different UI)
    if (user?.role === 'vendor') {
      return <VendorDashboard />;
    }

    // 🔀 MAIN NAVIGATION SWITCH
    switch (currentView) {
      case 'dashboard': 
        // ✅ FIX: If Super Admin, show THEIR dashboard. Otherwise show standard dashboard.
        return user?.role === 'super_admin' ? <SuperAdminDashboard /> : <Dashboard />;
        
      case 'contracts': return <Contracts />;
      case 'compare': return <Compare />;
      case 'users': return <AdminUsers />; 
      default: return <Dashboard />;
    }
  };

  // Vendors don't see the main nav
  const showNavigation = user?.role !== 'vendor';

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* NAVIGATION BAR */}
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
                  fontWeight: 500,
                  fontSize: "1rem"
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
                  fontWeight: 500,
                  fontSize: "1rem"
                }}
              >
                Contracts
              </button>
              
              {/* ❌ HIDE COMPARE BUTTON FOR SUPER ADMIN */}
              {user?.role !== 'super_admin' && (
                <button 
                    onClick={() => setCurrentView("compare")} 
                    style={{ 
                    background: "none", 
                    border: "none", 
                    color: currentView === "compare" ? "var(--accent-primary)" : "var(--text-secondary)", 
                    cursor: "pointer", 
                    fontWeight: 500,
                    fontSize: "1rem"
                    }}
                >
                    Compare
                </button>
              )}

              {/* Admin-Only Users Button */}
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setCurrentView("users")} 
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: currentView === "users" ? "#a855f7" : "var(--text-secondary)", 
                    cursor: "pointer", 
                    fontWeight: 600,
                    fontSize: "1rem"
                  }}
                >
                  👮‍♂️ Users
                </button>
              )}
            </div>
          ) : (
            <div></div> // Spacer for vendors
          )}
          
          {/* USER PROFILE & LOGOUT */}
          <div style={{ 
            paddingLeft: "2rem", 
            borderLeft: showNavigation ? "1px solid #333" : "none", 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem" 
          }}>
            <span style={{ fontSize: "0.9rem", color: "white", textAlign: "right" }}>
              <div style={{fontWeight: "bold"}}>{user?.full_name}</div>
              <div style={{ opacity: 0.5, fontSize: "0.8rem", textTransform: "uppercase" }}>{user?.role}</div>
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

      {/* MAIN CONTENT AREA */}
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