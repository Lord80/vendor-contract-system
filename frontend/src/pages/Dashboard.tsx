import { useEffect, useState } from "react";
import { api } from "../api/api";
import type { DashboardSummary, Vendor, Contract } from "../types";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    api.getDashboardSummary().then(data => {
        console.log("SUMMARY:", data);
        setSummary(data);
    });

    api.getTopVendors().then(data => {
        console.log("VENDORS:", data);
        setVendors(data);
    });

    api.getContracts().then(data => {
        console.log("CONTRACTS:", data);
        setContracts(data);
    });

    api.getAlerts().then(data => {
        console.log("ALERTS:", data);
        setAlerts(data.alerts);
    });
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, marginBottom: 24 }}>
        📊 AI Vendor & Contract Dashboard
        </h1>

        {/* SUMMARY CARDS */}
        {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            <SummaryCard title="Total Contracts" value={summary.total_contracts} />
            <SummaryCard title="Low Risk" value={summary.risk_distribution.LOW} color="green" />
            <SummaryCard title="Medium Risk" value={summary.risk_distribution.MEDIUM} color="yellow" />
            <SummaryCard title="High Risk" value={summary.risk_distribution.HIGH} color="red" />
        </div>
        )}

        {/* ALERTS */}
        <Section title="🚨 Alerts">
        {alerts.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No alerts</p>
        ) : (
            <ul>
            {alerts.map((a, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                {a.message}
                </li>
            ))}
            </ul>
        )}
        </Section>

        {/* TOP VENDORS */}
        <Section title="🏆 Top Vendors">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
            <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                <th>Name</th>
                <th>Score</th>
                <th>Risk</th>
            </tr>
            </thead>
            <tbody>
            {vendors.map(v => (
                <tr key={v.vendor_id}>
                <td>{v.name}</td>
                <td>{v.performance_score}</td>
                <td><RiskBadge level={v.risk_level} /></td>
                </tr>
            ))}
            </tbody>
        </table>
        </Section>

        {/* CONTRACTS */}
        <Section title="📄 Contracts">
        {contracts.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No contracts found</p>
        ) : (
        contracts.map(c => (
            <div
            key={c.id}
            style={{
                padding: 12,
                borderRadius: 8,
                background: "#020617",
                marginBottom: 12
            }}
            >
            <strong>{c.contract_name}</strong>
            <span style={{ marginLeft: 10 }}>
                <RiskBadge level={c.risk_level} />
            </span>
            <p style={{ marginTop: 8, color: "var(--muted)" }}>
                {c.summary}
            </p>
            </div>
        ))
        )}
        </Section>
    </div>
    );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div
      style={{
        background: "var(--card)",
        padding: 16,
        borderRadius: 12,
        marginBottom: 32
      }}
    >
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color
}: {
  title: string;
  value: number;
  color?: "green" | "yellow" | "red";
}) {
  const colorMap: any = {
    green: "var(--green)",
    yellow: "var(--yellow)",
    red: "var(--red)"
  };

  return (
    <div
      style={{
        background: "var(--card)",
        padding: 16,
        borderRadius: 12
      }}
    >
      <p style={{ color: "var(--muted)", marginBottom: 8 }}>{title}</p>
      <h2 style={{ color: color ? colorMap[color] : "var(--text)" }}>
        {value}
      </h2>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colorMap: any = {
    LOW: "var(--green)",
    MEDIUM: "var(--yellow)",
    HIGH: "var(--red)"
  };

  return (
    <span
      style={{
        background: colorMap[level] || "#64748b",
        color: "#000",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600
      }}
    >
      {level}
    </span>
  );
}
