"use client";

import { useEffect, useState } from "react";

export default function InvoiceDetailPage({ params }) {
  const { id } = params;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInvoice = async () => {
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    setInvoice(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoice();
  }, []);

  if (loading) return <p>Loading invoice...</p>;
  if (!invoice) return <p>Invoice not found.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>Invoice Details</h1>

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h2 style={{ marginBottom: 10 }}>
          Invoice #{invoice.invoiceNumber}
        </h2>

        <p>
          <strong>Date:</strong>{" "}
          {invoice.date
            ? new Date(invoice.date).toLocaleDateString()
            : "—"}
        </p>

        <p>
          <strong>Customer:</strong>{" "}
          {invoice.customer?.name || "Walk-in"}
        </p>

        <p>
          <strong>Remarks:</strong>{" "}
          {invoice.remarks || "-"}
        </p>
      </div>

      {/* ITEMS TABLE */}
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>Items</h3>
        <table style={{ width: "100%", marginTop: 10 }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Qty</th>
              <th style={th}>Price</th>
              <th style={th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id}>
                <td style={td}>{it.product?.name}</td>
                <td style={td}>{it.quantity}</td>
                <td style={td}>₹{it.pricePerUnit}</td>
                <td style={td}>₹{it.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GST & TOTAL */}
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
        }}
      >
        <h3>Billing Summary</h3>

        <p>
          <strong>Subtotal:</strong> ₹{invoice.subtotal}
        </p>

        <p>
          <strong>Discount:</strong> ₹{invoice.discount}
        </p>

        {/* GST */}
        {invoice.cgstPercent > 0 && (
          <p>
            <strong>CGST ({invoice.cgstPercent}%):</strong> ₹
            {invoice.cgstAmount}
          </p>
        )}

        {invoice.sgstPercent > 0 && (
          <p>
            <strong>SGST ({invoice.sgstPercent}%):</strong> ₹
            {invoice.sgstAmount}
          </p>
        )}

        {invoice.igstPercent > 0 && (
          <p>
            <strong>IGST ({invoice.igstPercent}%):</strong> ₹
            {invoice.igstAmount}
          </p>
        )}

        <p style={{ fontSize: 20, marginTop: 10 }}>
          <strong>Total: ₹{invoice.total}</strong>
        </p>
      </div>

      <a
        href={`/invoices/${id}/print`}
        style={{
          marginTop: 20,
          display: "inline-block",
          background: "#2563eb",
          color: "white",
          padding: "10px 20px",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        🖨 Print Invoice
      </a>
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <a
          href={`/invoices/${id}/edit`}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "8px 14px",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ✏️ Edit
        </a>

        <button
          onClick={async () => {
            const ok = confirm("Delete this invoice?");
            if (!ok) return;
            await fetch(`/api/invoices/${id}`, { method: "DELETE" });
            window.location.href = "/invoices";
          }}
          style={{
            background: "crimson",
            color: "white",
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🗑 Delete
        </button>
      </div>

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
