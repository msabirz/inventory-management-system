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
              width: "220px",
              background: "#1e293b",
              color: "white",
              padding: "20px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "20px" }}>
              Palwe Enterprises
            </h2>

            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/categories" exact>Categories</NavLink>
            <NavLink href="/products" exact>Products</NavLink>
            <NavLink href="/customers" exact>Customers</NavLink>
            <NavLink href="/suppliers" exact>Suppliers</NavLink>
            <NavLink href="/purchases" exact>Purchases</NavLink>
            <NavLink href="/sales" exact>Sales</NavLink>
           <NavLink href="/expense-categories">Expense Categories</NavLink>
            <NavLink href="/expenses">Expenses</NavLink>
            <NavLink href="/profit-loss">Profit & Loss</NavLink>
            <NavLink href="/low-stock" exact>
              Low Stock {` `}
              {/* <span style={{ color: "red", fontWeight: "bold" }}>
                ({lowStockCount})
              </span> */}
            </NavLink>
            <NavLink href="/stock-adjustments" exact>Stock Adjustments</NavLink>
            <NavLink href="/import" exact>Customers Import</NavLink>
            <NavLink href="/invoices" exact>Invoices</NavLink>
            <NavLink href="/reports" exact>Reports</NavLink>
            <NavLink href="/backup" exact>Backups</NavLink>
            <NavLink href="/settings" exact>Settings</NavLink>
          </aside>

          {/* MAIN AREA */}
          <main style={{ flexGrow: 1, background: "#f1f5f9" }}>
            
            {/* HEADER */}
            
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
              <div style={{ fontSize: "14px", color: "#555" }}>
                Welcome, User
              </div>
            </header>

            {/* PAGE CONTENT */}
            <div style={{ padding: "20px" }}>{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
