"use client";

import { useEffect, useState } from "react";

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteInvoice = async (id) => {
    const ok = confirm("Are you sure you want to delete this invoice?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      await load();
    } catch (e) {
      console.error("Failed to delete invoice", e);
      alert("Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

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
        ➕ Create Quotation
      </a>

      {loading ? (
        <p style={{ marginTop: 20 }}>Loading invoices...</p>
      ) : (
        <table
          style={{
            width: "100%",
            marginTop: 20,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={th}>Invoice No</th>
              <th style={th}>Customer</th>
              <th style={th}>Date</th>
              <th style={th}>Amount</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={td}>{inv.invoiceNumber}</td>
                <td style={td}>{inv.customer?.name || "-"}</td>
                <td style={td}>
                  {inv.date
                    ? new Date(inv.date).toLocaleDateString()
                    : "—"}
                </td>
                <td style={td}>₹{inv.total}</td>
                <td style={td}>
                  <a
                    href={`/invoices/${inv.id}`}
                    style={link}
                  >
                    View
                  </a>
                  <span> | </span>
                  <a
                    href={`/invoices/${inv.id}/edit`}
                    style={link}
                  >
                    Edit
                  </a>
                  <span> | </span>
                  <a
                    href={`/invoices/${inv.id}/print`}
                    style={{ ...link, color: "green" }}
                  >
                    Print
                  </a>
                  <span> | </span>
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    disabled={deletingId === inv.id}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "crimson",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {deletingId === inv.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 10, textAlign: "center" }}>
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = {
  padding: 8,
  border: "1px solid #ddd",
};
const td = {
  padding: 8,
  border: "1px solid #ddd",
};
const link = {
  color: "blue",
  textDecoration: "underline",
  cursor: "pointer",
};
