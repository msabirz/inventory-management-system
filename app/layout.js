import "./globals.css";
import NavLink from "@/components/NavLink";
import GlobalSearch from "@/components/GlobalSearch";


export const metadata = {
  title: "Inventory System",
  description: "Local inventory management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100vh" }}>

          {/* SIDEBAR */}
          <aside
            style={{
              width: "260px",
              background: "#1e293b",
              color: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid #334155",
              maxHeight: "100vh",
              overflowY: "auto",
              paddingBottom: "20px"
            }}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid #334155", marginBottom: "20px" }}>
              <h2 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, margin: 0, letterSpacing: "-0.025em" }}>
                Palwe Enterprises
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: "4px 0 0 0" }}>Inventory Management</p>
            </div>

            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Overview */}
              <section>
                <h3 style={navHeaderStyle}>Overview</h3>
                <NavLink href="/" exact icon={<DashboardIcon />}>Dashboard</NavLink>
              </section>

              {/* Inventory */}
              <section>
                <h3 style={navHeaderStyle}>Inventory</h3>
                <NavLink href="/categories" exact icon={<CategoriesIcon />}>Categories</NavLink>
                <NavLink href="/products" exact icon={<ProductsIcon />}>Products</NavLink>
                <NavLink href="/purchases" exact icon={<PurchasesIcon />}>Purchases</NavLink>
                <NavLink href="/stock-adjustments" exact icon={<AdjustmentsIcon />}>Stock Adjustments</NavLink>
                <NavLink href="/low-stock" exact icon={<AlertIcon />}>Low Stock</NavLink>
              </section>

              {/* Sales & Finance */}
              <section>
                <h3 style={navHeaderStyle}>Sales & Finance</h3>
                <NavLink href="/sales" exact icon={<SalesIcon />}>Sales</NavLink>
                <NavLink href="/invoices" exact icon={<InvoicesIcon />}>Quotations</NavLink>
                <NavLink href="/returns" exact icon={<ReturnsIcon />}>Refund / Returns</NavLink>
                <NavLink href="/profit-loss" icon={<ProfitIcon />}>Profit & Loss</NavLink>
                <NavLink href="/expenses" icon={<ExpensesIcon />}>Expenses</NavLink>
                <NavLink href="/expense-categories" icon={<ExpensesCatIcon />}>Expense Categories</NavLink>
              </section>

              {/* Contacts */}
              <section>
                <h3 style={navHeaderStyle}>Contacts</h3>
                <NavLink href="/customers" exact icon={<CustomersIcon />}>Customers</NavLink>
                <NavLink href="/suppliers" exact icon={<SuppliersIcon />}>Suppliers</NavLink>
                <NavLink href="/ledger" exact icon={<LedgerIcon />}>Customer Ledger</NavLink>
              </section>

              {/* Admin */}
              <section>
                <h3 style={navHeaderStyle}>Admin</h3>
                <NavLink href="/reports" exact icon={<ReportsIcon />}>Reports</NavLink>
                <NavLink href="/import" exact icon={<ImportIcon />}>Customers Import</NavLink>
                <NavLink href="/backup" exact icon={<BackupIcon />}>Backups</NavLink>
                <NavLink href="/settings" exact icon={<SettingsIcon />}>Settings</NavLink>
              </section>
            </div>
          </aside>

          {/* MAIN AREA */}
          <main style={{ flexGrow: 1, background: "#f8fafc", maxHeight: "100vh", overflowY: "auto" }}>

            {/* HEADER */}
            <header
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                padding: "16px 24px",
                background: "white",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>Inventory System</h3>
              <div style={{ flex: 1, maxWidth: "500px" }}>
                <GlobalSearch />
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
                Welcome, User
              </div>
            </header>

            {/* PAGE CONTENT */}
            <div style={{ padding: "24px" }}>{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

const navHeaderStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#64748b",
  marginBottom: "12px",
  paddingLeft: "12px"
};

/* ---------------- ICONS ---------------- */
const DashboardIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
);
const CategoriesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const ProductsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m7.5 4.27 9 5.15m-11.23-.48 9 5.14m-12.27-1.42 9 5.14M21 7.23a2.001 2.001 0 0 1-2 3.464l-11.23-6.42a2.001 2.001 0 1 1 2-3.464L21 7.23zm-2 13.464a2.001 2.001 0 0 1-2-3.464l-11.23-6.42a2.001 2.001 0 1 1 2 3.464L19 20.694z" /></svg>
);
const PurchasesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const CustomersIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const SuppliersIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const SalesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
);
const InvoicesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
);
const ReturnsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5" /><path d="M4 9h12a5 5 0 0 1 5 5v3" /></svg>
);
const ProfitIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const ExpensesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
);
const ExpensesCatIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
);
const AdjustmentsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" /><line x1="18" x2="22" y1="16" y2="16" /></svg>
);
const ReportsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
);
const LedgerIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
);
const ImportIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);
const BackupIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
