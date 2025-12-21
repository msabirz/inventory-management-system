"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Printable Invoice Page (A4 + Thermal)
 * Usage:
 *  - /invoices/123/print           -> defaults to A4
 *  - /invoices/123/print?format=a4 -> A4
 *  - /invoices/123/print?format=thermal -> thermal layout (58/80mm)
 *
 * Download as PDF:
 *  - Click "Download as PDF" button -> opens print dialog; choose Save as PDF.
 *
 * Note: this is a client component for window.print usage.
 */

export default function InvoicePrintPage({ params }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const format = (searchParams.get("format") || "a4").toLowerCase();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setInvoice(data);
    } catch (e) {
      console.error("Failed to load invoice", e);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p>Loading printable invoice...</p>;
  if (!invoice) return <p>Invoice not found.</p>;

  const onPrint = () => {
    window.print();
  };

  // Simple header info
  const business = {
    name: "Palwe Ply and Hardware",
    addressLine1: "Shri Shivaji Colony, beside Nasre Sabhagruh, ",
    addressLine2: "Dubey Nagar Dominos, Hudkeshwar road, ",
    addressLine3: "Nagpur, Maharashtra - 440034",
    phone: "Phone: 8262983401",
    gstin: "GSTIN: N/A",
  };

  return (
    <div>
      <div style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <a href="/invoices" style={linkStyle}>← Back</a>
        <button onClick={() => (location.search = "?format=a4")} style={buttonStyle}>
          A4 View
        </button>
        <button onClick={() => (location.search = "?format=thermal")} style={buttonStyle}>
          Thermal View
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={onPrint} style={{ ...buttonStyle, background: "#16a34a" }}>
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>
    <div className="print-container">
      <div className={format === "thermal" ? "print-thermal" : "print-a4"}>
        <div className="print-sheet">
          {/* Header */}
          <div className="inv-header">
            <div>
              <h2 className="business-name">{business.name}</h2>
              <div>{business.addressLine1}</div>
              <div>{business.addressLine2}</div>
              <div>{business.addressLine3}</div>
              <div>{business.phone}</div>
              <div>{business.gstin}</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <h3>Invoice</h3>
              <div><strong>No:</strong> {invoice.invoiceNumber}</div>
              <div><strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : "-"}</div>
              <div><strong>Customer:</strong> {invoice.customer?.name || "Walk-in"}</div>
            </div>
          </div>

          <hr />

          {/* Items */}
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.product?.name}</td>
                  <td style={{ textAlign: "center" }}>{it.quantity}</td>
                  <td style={{ textAlign: "center" }}>{formatMoney(it.pricePerUnit)}</td>
                  <td style={{ textAlign: "right" }}>{formatMoney(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr />

          {/* Totals & GST */}
          <div className="totals-row">
            <div style={{ flex: 1 }}>
              <div><strong>Remarks:</strong> {invoice.remarks || "-"}</div>
            </div>

            <div style={{ width: 260 }}>
              <div className="totals-line"><span>Subtotal</span><span>₹{formatMoney(invoice.subtotal)}</span></div>
              <div className="totals-line"><span>Discount</span><span>₹{formatMoney(invoice.discount)}</span></div>

              {Number(invoice.cgstPercent) > 0 && (
                <div className="totals-line"><span>CGST ({invoice.cgstPercent}%)</span><span>₹{formatMoney(invoice.cgstAmount)}</span></div>
              )}
              {Number(invoice.sgstPercent) > 0 && (
                <div className="totals-line"><span>SGST ({invoice.sgstPercent}%)</span><span>₹{formatMoney(invoice.sgstAmount)}</span></div>
              )}
              {Number(invoice.igstPercent) > 0 && (
                <div className="totals-line"><span>IGST ({invoice.igstPercent}%)</span><span>₹{formatMoney(invoice.igstAmount)}</span></div>
              )}

              <div className="totals-line total"><span>Total</span><span>₹{formatMoney(invoice.total)}</span></div>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 12 }}>
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
      {/* Styles */}
      <style jsx>{`
        .print-a4 { padding: 24px; display: flex; justify-content: center; }
        .print-sheet {
          width: 800px;
          background: white;
          padding: 20px;
          box-shadow: 0 0 4px rgba(0,0,0,0.05);
          color: #111;
        }

        .inv-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
        .business-name { margin: 0 0 6px 0; }

        .inv-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .inv-table th, .inv-table td { padding: 6px 8px; border-bottom: 1px dotted #ddd; font-size: 14px; }
        .inv-table thead th { border-bottom: 2px solid #ddd; }

        .totals-row { display: flex; gap: 16px; margin-top: 12px; align-items: flex-start; }
        .totals-line { display:flex; justify-content:space-between; padding:4px 0; font-size: 14px; }
        .totals-line.total { font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 6px; }

        /* Thermal layout (narrow) */
        .print-thermal { padding: 8px; display:flex; justify-content:center; }
        .print-thermal .print-sheet { width: 320px; padding: 12px; font-size: 12px; }

        /* Print styles */
        @media print {
          body * { visibility: hidden; }
          .print-sheet, .print-sheet * { visibility: visible; }
          .print-sheet { box-shadow: none; margin: 0; }
          .print-a4 .print-sheet { width: auto; }
          @page { size: ${format === "thermal" ? "80mm auto" : "A4"}; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

// small helpers
function formatMoney(v) {
  if (v === undefined || v === null) return "0.00";
  return Number(v).toFixed(2);
}

const buttonStyle = {
  padding: "8px 12px",
  background: "#1e293b",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const linkStyle = {
  color: "#1e293b",
  textDecoration: "none",
  fontSize: 14,
  marginRight: 12,
};
