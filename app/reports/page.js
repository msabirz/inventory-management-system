"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [type, setType] = useState("sales");

  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .substring(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");

  const [data, setData] = useState(null);

  // Load dropdown data
  const loadMaster = async () => {
    const c = await fetch("/api/customers").then((r) => r.json());
    const s = await fetch("/api/suppliers").then((r) => r.json());
    const p = await fetch("/api/products").then((r) => r.json());
    setCustomers(c);
    setSuppliers(s);
    setProducts(p);
  };

  useEffect(() => {
    loadMaster();
  }, []);

  const loadReport = async () => {
    const res = await fetch("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        type,
        startDate,
        endDate,
        customerId,
        productId,
        supplierId
      }),
    });

    const json = await res.json();
    console.log("report data", json);
    setData(json);
  };

  const exportCSV = () => {
    if (!data || !Array.isArray(data)) return;

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
      const values = headers.map((h) => JSON.stringify(row[h] || ""));
      csvRows.push(values.join(","));
    });

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}-report.csv`;
    link.click();
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Reports</h1>

      {/* FILTERS */}
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <label>Report Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="sales">Sales Report</option>
              <option value="purchases">Purchase Report</option>
              <option value="profit">Profit Report</option>
            </select>
          </div>

          <div>
            <label>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label>To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* CONDITIONAL FILTERS */}
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          {type === "sales" && (
            <>
              <div>
                <label>Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">All</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {type === "purchases" && (
            <>
              <div>
                <label>Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}>
                  <option>All</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label>Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">All</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={loadReport}
          style={{ marginTop: 20, background: "#2563eb" }}
        >
          Load Report
        </button>
      </div>

      {/* REPORT DATA */}
      {data && type !== "profit" && (
        <div>
          <h2>{type === "sales" ? "Sales Report" : "Purchase Report"}</h2>

          <button
            onClick={exportCSV}
            style={{ marginBottom: 10, background: "#16a34a" }}
          >
            Export CSV
          </button>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Product</th>
                <th style={th}>
                  {type === "sales" ? "Customer" : "Supplier"}
                </th>
                <th style={th}>Qty</th>
                <th style={th}>Total</th>
              </tr>
            </thead>

            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td style={td}>{new Date(row.date).toLocaleDateString()}</td>
                  <td style={td}>{row.product?.name}</td>
                  <td style={td}>
                    {row.customer?.name || row.supplier?.name}
                  </td>
                  <td style={td}>{row.quantity}</td>
                  <td style={td}>₹{row.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && type === "profit" && (
        <div
          style={{
            background: "white",
            padding: 20,
            borderRadius: 6,
            fontSize: 18,
          }}
        >
          <p>Total Sales: ₹{data.totalSales}</p>
          <p>Total Purchases: ₹{data.totalPurchase}</p>
          <p>Total Expenses: ₹{data.totalExpenses}</p>
          <p>
            <strong>Profit: ₹{data.profit}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: 8,
  border: "1px solid #ddd",
  background: "#f3f3f3",
};

const td = {
  padding: 8,
  border: "1px solid #ddd",
};
