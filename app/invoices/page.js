"use client";

import { useEffect, useState } from "react";

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Invoices</h1>

      <a
        href="/invoices/create"
        style={{
          padding: "10px 15px",
          background: "#2563eb",
          color: "white",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        ➕ Create Invoice
      </a>

      {loading ? (
        <p style={{ marginTop: 20 }}>Loading invoices...</p>
      ) : (
        <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Invoice No</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Customer</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Date</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Amount</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {inv.invoiceNumber}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {inv.customer?.name || "-"}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                    {inv.date ? new Date(inv.date).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  ₹{inv.total}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  <a
                    href={`/invoices/${inv.id}`}
                    style={{
                      marginRight: 10,
                      color: "blue",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    View
                  </a>

                  <a
                    href={`/invoices/${inv.id}/print`}
                    style={{
                      color: "green",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Print
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
