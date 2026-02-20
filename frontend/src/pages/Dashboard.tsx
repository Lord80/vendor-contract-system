import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { DashboardSummary, Vendor, Contract } from '../types';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldAlert, FileText, Building2, Clock } from 'lucide-react';
import { RiskBadge } from '../components/dashboard/RiskBadge';

const BentoCard = ({ title, value, icon: Icon, delay, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="holo-card"
    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
      <div style={{ 
        width: '48px', height: '48px', borderRadius: '12px', 
        background: `linear-gradient(135deg, ${color}20, ${color}05)`, 
        border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
        boxShadow: `0 0 20px ${color}15`
      }}>
        <Icon size={22} />
      </div>
      <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', fontSize: '0.75rem', gap: '4px', background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
        +12% <ArrowUpRight size={12} />
      </div>
    </div>
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: "4px" }}>
        {title}
      </div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, letterSpacing: "-1px" }}>
        {value}
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  useEffect(() => {
    async function loadData() {
      try {
        const [sum, vend, cont] = await Promise.all([
          api.getDashboardSummary(),
          api.getTopVendors(),
          api.getAllContracts()
        ]);
        setSummary(sum);
        setVendors(vend);
        setContracts(cont);
      } catch (err) { console.error(err); }
    }
    loadData();
  }, []);

  const riskData = [
    { name: 'Low', value: summary?.risk_distribution.LOW || 0, color: '#10b981' },
    { name: 'Med', value: summary?.risk_distribution.MEDIUM || 0, color: '#f59e0b' },
    { name: 'High', value: summary?.risk_distribution.HIGH || 0, color: '#ef4444' },
  ];

  return (
    <div style={{ paddingBottom: '4rem', maxWidth: 1200, margin: "0 auto" }}>
      
      {/* HEADER (Button Removed) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}
      >
        <div>
          <h1 className="glow-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-1px" }}>
            Command Center
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1.1rem" }}>
            System Status: <span style={{ color: '#10b981', fontWeight: 600 }}>● ONLINE</span>
          </p>
        </div>
      </motion.div>

      {/* BENTO GRID STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <BentoCard title="TOTAL CONTRACTS" value={summary?.total_contracts || 0} icon={FileText} delay={0.1} color="#3b82f6" />
        <BentoCard title="CRITICAL RISKS" value={summary?.risk_distribution.HIGH || 0} icon={ShieldAlert} delay={0.2} color="#ef4444" />
        <BentoCard title="ACTIVE VENDORS" value={vendors.length} icon={Building2} delay={0.3} color="#f59e0b" />
        <BentoCard title="SECURE DOCS" value={summary?.risk_distribution.LOW || 0} icon={ShieldAlert} delay={0.4} color="#10b981" />
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* CHART CONTAINER */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="holo-card" style={{ padding: '2rem' }}>
                <h3 style={{ margin: "0 0 2rem 0", fontSize: "1.1rem", fontWeight: 700 }}>Risk Distribution Analysis</h3>
                <div style={{ width: "100%", height: "280px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskData}>
                            <defs>
                                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} itemStyle={{ color: 'white' }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                {riskData.map((entry, index) => <Cell key={index} fill={`url(#color${entry.name})`} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Recent List */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="holo-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Live Activity Feed</h3>
                </div>
                <div>
                    {contracts.slice(0, 4).map((c, i) => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--text-muted)" }}>
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: "0.9rem" }}>{c.contract_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Uploaded recently</div>
                                </div>
                            </div>
                            <RiskBadge level={c.risk_level} />
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>

        {/* RIGHT COLUMN: VENDORS */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="holo-card" style={{ height: '100%', padding: '1.5rem' }}>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", fontWeight: 700 }}>Vendor Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {vendors.map((v) => (
                    <div key={v.id} style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.performance_score > 90 ? '#10b981' : '#f59e0b', boxShadow: `0 0 10px ${v.performance_score > 90 ? '#10b981' : '#f59e0b'}` }}></div>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{v.name}</span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: "1rem" }}>{v.performance_score.toFixed(1)}</div>
                    </div>
                ))}
            </div>
        </motion.div>

      </div>
    </div>
  );
}