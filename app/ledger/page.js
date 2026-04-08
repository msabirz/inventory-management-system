"use client";

import { Fragment, useEffect, useState } from "react";

export default function CustomerLedgerPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [data, setData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLedger(); // initial load (all data)
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
  try {
    const res = await fetch("/api/customers/");
    const json = await res.json();
    setCustomers(json);
  } catch (e) {
    console.error("customer fetch error", e);
  }
};
  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer-ledger", {
        method: "POST",
        body: JSON.stringify({
          from: from || undefined,
          to: to || undefined,
          customerId: customerId ? Number(customerId) : undefined,
        }),
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("ledger fetch error", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const format = (v) => Number(v || 0).toFixed(2);
  console.log("ledger data", data);
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 12 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>
        Customer Credit Ledger
      </h1>

      {/* Filters */}
<div style={filterCard}>
  <div>
    <label style={fieldLabel}>Date From</label>
    <input
      type="date"
      value={from}
      onChange={(e) => setFrom(e.target.value)}
      style={input}
    />
  </div>

  <div>
    <label style={fieldLabel}>Date To</label>
    <input
      type="date"
      value={to}
      onChange={(e) => setTo(e.target.value)}
      style={input}
    />
  </div>

  <div>
    <label style={fieldLabel}>Customer</label>
    <select
      value={customerId}
      onChange={(e) => setCustomerId(e.target.value)}
      style={input}
    >
      <option value="">All Customers</option>
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  </div>

  <div>
    <button onClick={fetchLedger} style={primaryBtn}>
      Apply
    </button>
  </div>
</div>

      {/* Content */}
      <div style={{ marginTop: 16 }}>
        {loading && <div>Loading ledger...</div>}

        {!loading && data && (
          <>
            {/* Opening Balance */}
            <div style={openingRow}>
              <strong>Opening Balance</strong>
              <span
                style={{
                  color: data.openingBalance < 0 ? "#dc2626" : "#16a34a",
                  fontWeight: 700,
                }}
              >
                ₹ {format(data.openingBalance)}
              </span>
            </div>

            {/* Ledger Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Date</th>
                    <th style={th}>Customer</th>
                    {/* <th style={th}>Reference</th> */}
                    <th>Bill Amount</th>
                    <th>Paid</th>
                    {/* <th style={thRight}>Debit</th> */}
                    <th style={thRight}>Credit</th>
                    <th style={{ ...thRight, position: "relative" }}>
  Balance{" "}
  <span
    style={{
      cursor: "help",
      color: "#6b7280",
      fontWeight: "normal",
      marginLeft: 4,
    }}
    onMouseEnter={(e) => {
  const tip = document.getElementById("balance-tooltip");
  const rect = e.target.getBoundingClientRect();

  const tooltipWidth = tip.offsetWidth || 260;
  const tooltipHeight = tip.offsetHeight || 40;
  const padding = 8;

  let left = rect.right + padding;
  let top = rect.top - tooltipHeight - padding;

  // 🔒 Prevent overflow on right
  if (left + tooltipWidth > window.innerWidth) {
    left = rect.left - tooltipWidth - padding;
  }

  // 🔒 Prevent overflow on top
  if (top < padding) {
    top = rect.bottom + padding;
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.style.opacity = 1;
  tip.style.visibility = "visible";
}}
    onMouseLeave={() => {
      const tip = document.getElementById("balance-tooltip");
      tip.style.opacity = 0;
      tip.style.visibility = "hidden";
    }}
  >
    ⓘ
  </span>
</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, idx) => (
                    <Fragment key={idx}>
                      <tr>
                        <td style={td}>{r.date}</td>
                        <td style={td}>{r.customerName}</td>
                        {/* <td style={td}>{r.ref}</td> */}
                        <td>₹ {format(r.billAmount)}</td>
                        <td>₹ {format(r.paidAmount)}</td>
                        <td style={tdRight}>
                          {r.debit ? `₹ ${format(r.debit)}` : "-"}
                        </td>
                        {/* <td style={tdRight}>
                          {r.credit ? `₹ ${format(r.credit)}` : "-"}
                        </td> */}
                        <td
                          style={{
                            ...tdRight,
                            fontWeight: 600,
                            color: r.balance < 0 ? "#dc2626" : "#16a34a",
                          }}
                        >
                          ₹ {format(r.balance)}
                        </td>
                        <td style={td}>
                          <button
                            onClick={() =>
                              setExpandedRow(expandedRow === r.id ? null : r.id)
                            }
                            style={expandBtn}
                          >
                            {expandedRow === r.id ? "−" : "+"}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === r.id && (
  <tr>
    <td colSpan={8} style={expandRow}>
      <strong>Item details</strong>

      <table style={{ width: "100%", marginTop: 6 }}>
        <thead>
          <tr>
            <th style={miniTh}>Product</th>
            <th style={miniTh}>Qty</th>
            <th style={miniTh}>Rate</th>
            <th style={miniTh}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={miniTd}>{r.item.productName}</td>
            <td style={miniTd}>{r.item.quantity}</td>
            <td style={miniTd}>₹ {r.item.rate}</td>
            <td style={miniTd}>₹ {r.item.lineTotal}</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
)}
                    </Fragment>
                  ))}
                  
                  {data.rows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 12, color: "#6b7280" }}>
                        No ledger entries
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <div
  id="balance-tooltip"
  style={{
    position: "fixed",
    background: "#111827",
    color: "#fff",
    padding: "6px 8px",
    borderRadius: 6,
    fontSize: 12,
    whiteSpace: "nowrap",
    zIndex: 9999,
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 0.15s ease",
    pointerEvents: "none",
  }}
>
  Running total of outstanding amount across all customers
</div>
    </div>
  );
}


/* ---------------- styles ---------------- */

const filterCard = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1.5fr auto",
  gap: 12,
  alignItems: "end",
  background: "white",
  padding: 16,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const fieldLabel = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 4,
  display: "block",
};

const input = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "white",
  fontSize: 14,
};
const openingRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 12px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  marginBottom: 8,
};

const primaryBtn = {
  padding: "9px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
    height: 38,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
};

const th = {
  padding: 10,
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  background: "#f3f4f6",
};

const thRight = { ...th, textAlign: "right" };

const td = {
  padding: 10,
  borderBottom: "1px solid #f1f5f9",
};

const tdRight = { ...td, textAlign: "right" };

const expandBtn = {
  border: "1px solid #d1d5db",
  background: "white",
  borderRadius: 4,
  width: 24,
  height: 24,
  cursor: "pointer",
};

const expandRow = {
  background: "#f9fafb",
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
};

const miniTh = {
  textAlign: "left",
  padding: 6,
  fontSize: 13,
  borderBottom: "1px solid #e5e7eb",
};

const miniTd = {
  padding: 6,
  fontSize: 13,
};