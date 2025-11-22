"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

  const load = async () => {
    const res = await fetch("/api/dashboard/summary");
    const data = await res.json();
    setSummary(data);
  };

  useEffect(() => {
    load();
  }, []);

  if (!summary) return <p>Loading dashboard...</p>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Dashboard</h1>

      {/* TOP CARDS */}
      <div style={{ display: "flex", gap: 20 }}>
        <Card title="Total Products" value={summary.totalProducts} color="#2563eb" />
        <Card title="Low Stock" value={summary.lowStockCount} color="red" />
        <Card title="Today's Sales" value={`₹${summary.todaysSales}`} color="#16a34a" />
        <Card title="Today's Purchases" value={`₹${summary.todaysPurchases}`} color="#9333ea" />
      </div>

      {/* QUICK LINKS */}
      <div style={{ marginTop: 30 }}>
        <h2>Quick Actions</h2>

        <div style={{ display: "flex", gap: 15, marginTop: 15 }}>
           <QuickLink href="/purchases" label="Create Purchase" />
          <QuickLink href="/sales" label="Create Sale" />
          <QuickLink href="/invoices/create" label="Create Invoice" />
          <QuickLink href="/products" label="Manage Products" />
          <QuickLink href="/reports" label="Reports" />
          <QuickLink href="/low-stock" label="Low Stock" />
        </div>
      </div>

      {/* RECENT INVOICES */}
      <div style={{ marginTop: 40 }}>
        <h2>Recent Invoices</h2>

        <table
          style={{
            width: "100%",
            marginTop: 15,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={th}>Invoice No</th>
              <th style={th}>Customer</th>
              <th style={th}>Amount</th>
              <th style={th}>Date</th>
            </tr>
          </thead>

          <tbody>
            {summary?.recentInvoices.map((inv) => (
              <tr key={inv.id}>
                <td style={td}>{inv.invoiceNumber}</td>
                <td style={td}>{inv.customer?.name || "-"}</td>
                <td style={td}>₹{inv.total}</td>
                <td style={td}>
                  {inv.date
                    ? new Date(inv.date).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div
      style={{
        background: "white",
        padding: 20,
        borderRadius: 8,
        flex: 1,
        borderLeft: `6px solid ${color}`,
      }}
    >
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 22, fontWeight: "bold", marginTop: 10 }}>{value}</p>
    </div>
  );
}

function QuickLink({ href, label }) {
  return (
    <a
      href={href}
      style={{
        padding: "10px 20px",
        background: "#2563eb",
        color: "white",
        borderRadius: 6,
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}

const th = {
  textAlign: "left",
  padding: 8,
  border: "1px solid #ddd",
  background: "#f3f3f3",
};

const td = {
  padding: 8,
  border: "1px solid #ddd",
};
