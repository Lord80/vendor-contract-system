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
import { LayoutDashboard, FileText, GitCompare, Users, LogOut } from 'lucide-react';
import { Logo } from "./components/common/logo";

const SidebarItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    style={{
      width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
      background: active ? "rgba(59, 130, 246, 0.15)" : "transparent",
      border: "none", borderRadius: "12px",
      color: active ? "white" : "var(--text-muted)",
      cursor: "pointer", textAlign: "left", fontWeight: active ? 600 : 500,
      transition: "all 0.2s ease", marginBottom: "4px"
    }}
  >
    <span style={{ color: active ? "#60a5fa" : "currentColor", opacity: active ? 1 : 0.7 }}>{icon}</span>
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
      
      {/* FLOATING SIDEBAR */}
      <aside style={{ 
        width: "260px", 
        background: "rgba(10, 10, 10, 0.6)", 
        backdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        borderRadius: "24px", 
        display: "flex", flexDirection: "column", padding: "1.5rem",
        position: "fixed", top: "1rem", left: "1rem", bottom: "1rem", zIndex: 50,
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ paddingBottom: "2rem", marginBottom: "1rem" }}>
                <Logo subtitle="Enterprise" />
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <SidebarItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Overview" />
                <SidebarItem active={currentView === 'contracts'} onClick={() => setCurrentView('contracts')} icon={<FileText size={18}/>} label="Contracts" />
                {user?.role !== 'super_admin' && <SidebarItem active={currentView === 'compare'} onClick={() => setCurrentView('compare')} icon={<GitCompare size={18}/>} label="AI Comparison" />}
                {(user?.role === 'super_admin' || user?.role === 'company_admin') && <SidebarItem active={currentView === 'users'} onClick={() => setCurrentView('users')} icon={<Users size={18}/>} label="Team Access" />}
            </nav>
        </div>
        <div style={{ marginTop: "auto", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "16px", border: "1px solid var(--glass-border)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
               <div style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.9rem" }}>{user?.full_name?.charAt(0)}</div>
               <div style={{ overflow: "hidden", minWidth: 0 }}>
                 <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "white" }}>{user?.full_name}</div>
                 <div style={{ fontSize: "0.7rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.role.replace("_", " ")}</div>
               </div>
             </div>
             <button onClick={logout} className="btn-neon" style={{ width: "100%", padding: "0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#f87171", borderColor: "rgba(248, 113, 113, 0.2)" }}><LogOut size={16} /> Sign Out</button>
        </div>
      </aside>

      {/* CONTENT AREA - PADDED TO AVOID OVERLAP */}
      <main style={{ flex: 1, padding: "3rem 3rem 3rem 320px", overflowY: "auto" }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }