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

// Minimal SVG Icons
const Icons = {
  Dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>,
  Contracts: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Compare: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
  Users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
};

const SidebarItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      // Premium Active State
      background: active ? "linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent)" : "transparent",
      border: "none",
      borderLeft: active ? "3px solid var(--accent-blue)" : "3px solid transparent",
      color: active ? "white" : "var(--text-secondary)",
      cursor: "pointer",
      textAlign: "left",
      fontWeight: active ? 600 : 500,
      borderRadius: "0 8px 8px 0",
      marginBottom: "4px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    }}
  >
    {/* Icon Glow */}
    <span style={{ 
        color: active ? "var(--accent-blue)" : "currentColor", 
        opacity: active ? 1 : 0.7,
        filter: active ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))" : "none",
        transition: "filter 0.2s ease"
    }}>
        {icon}
    </span>
    {label}
  </button>
);

const AppContent = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isAuthenticated) {
    if (isRegistering) return <Register onSwitchToLogin={() => setIsRegistering(false)} />;
    return <Login onSwitchToRegister={() => setIsRegistering(true)} />;
  }

  if (user?.role === 'vendor') return <VendorDashboard />;

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return user?.role === 'super_admin' ? <SuperAdminDashboard /> : <Dashboard />;
      case 'contracts': return <Contracts />;
      case 'compare': return <Compare />;
      case 'users': return <AdminUsers />; 
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-deep)" }}>
      {/* SIDEBAR */}
      <aside style={{ 
        width: "260px", 
        background: "rgba(15, 23, 42, 0.6)", 
        backdropFilter: "blur(20px)",
        borderRight: "var(--border-subtle)",
        display: "flex", 
        flexDirection: "column",
        padding: "2rem 0",
        position: "fixed",
        height: "100vh",
        zIndex: 50
      }}>
        <div style={{ padding: "0 1.5rem", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "32px", height: "32px", 
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", 
              borderRadius: "8px",
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)"
            }}></div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.5px" }}>ContractAI</h2>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Enterprise</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, paddingRight: "1rem" }}>
          <SidebarItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={Icons.Dashboard} label="Overview" />
          <SidebarItem active={currentView === 'contracts'} onClick={() => setCurrentView('contracts')} icon={Icons.Contracts} label="Contracts" />
          {user?.role !== 'super_admin' && (
            <SidebarItem active={currentView === 'compare'} onClick={() => setCurrentView('compare')} icon={Icons.Compare} label="AI Comparison" />
          )}
          {(user?.role === 'super_admin' || user?.role === 'company_admin') && (
            <SidebarItem active={currentView === 'users'} onClick={() => setCurrentView('users')} icon={Icons.Users} label="Team Access" />
          )}
        </nav>

        <div style={{ padding: "0 1.5rem" }}>
           <div style={{ 
             background: "rgba(255,255,255,0.03)", 
             padding: "1rem", 
             borderRadius: "12px", 
             border: "var(--border-subtle)" 
           }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
               <div style={{ 
                 width: "32px", height: "32px", 
                 borderRadius: "50%", 
                 background: "var(--bg-elevated)", 
                 display: "flex", alignItems: "center", justifyContent: "center", 
                 fontWeight: "bold", 
                 border: "1px solid var(--border-highlight)",
                 color: "var(--text-primary)",
                 fontSize: "0.8rem"
               }}>
                 {user?.full_name?.charAt(0)}
               </div>
               <div style={{ overflow: "hidden" }}>
                 <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user?.full_name}</div>
                 <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{user?.role.replace("_", " ")}</div>
               </div>
             </div>
             <button onClick={logout} className="btn-danger" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8rem" }}>
                Sign Out
             </button>
           </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: "3rem", marginLeft: "260px", overflowY: "auto" }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }