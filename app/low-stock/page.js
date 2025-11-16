"use client";

import { useEffect, useState } from "react";

export default function LowStockPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const res = await fetch("/api/low-stock");
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Low Stock Alerts</h1>

      {items.length === 0 ? (
        <p>No low stock items 🎉</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Quantity</th>
              <th style={th}>Threshold</th>
            </tr>
          </thead>

          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.name}</td>
                <td style={{ ...td, color: "red", fontWeight: "bold" }}>
                  {p.quantity}
                </td>
                <td style={td}>{p.lowStockThreshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
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
