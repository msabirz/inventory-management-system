"use client";

import NavLink from "@/components/NavLink";
import GlobalSearch from "@/components/GlobalSearch";

export default function AppShell({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "220px",
          background: "#1e293b",
          color: "white",
          padding: "20px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h2
          style={{ color: "#fff", textAlign: "center", marginBottom: "20px" }}
        >
          Palwe Enterprises
        </h2>

        <NavLink href="/">Dashboard</NavLink>
        <NavLink href="/customers">Customers</NavLink>
        <NavLink href="/suppliers">Suppliers</NavLink>
        <NavLink href="/categories">Categories</NavLink>
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/purchases">Purchases</NavLink>
        <NavLink href="/sales">Sales</NavLink>
        <NavLink href="/invoices">Invoices</NavLink>
        <NavLink href="/reports">Reports</NavLink>
        <NavLink href="/backup">Backups</NavLink>
        <NavLink href="/low-stock">Low Stock</NavLink>
        <NavLink href="/settings">Settings</NavLink>
        <NavLink href="/stock-adjustments">Stock Adjustments</NavLink>
        <NavLink href="/import">Customers Import</NavLink>
      </aside>

      {/* MAIN AREA */}
      <main style={{ flexGrow: 1, background: "#f1f5f9" }}>
        <header
          style={{
            padding: 12,
            background: "white",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
          <h3>Inventory System</h3>
          <GlobalSearch />
          <div style={{ fontSize: "14px", color: "#555" }}>Welcome, User</div>
        </header>

        <div style={{ padding: "20px" }}>{children}</div>
      </main>
    </div>
  );
}
