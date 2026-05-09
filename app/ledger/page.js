"use client";

import { Fragment, useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

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
            {/* Summary Cards */}
            {(() => {
              const totalCredit = data?.rows?.reduce((acc, r) => acc + (r.credit || 0), 0) || 0;
              const totalDebit = data?.rows?.reduce((acc, r) => acc + (r.debit || 0), 0) || 0;
              const currentBalance = (data?.openingBalance || 0) + totalCredit - totalDebit;

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
                  <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 10, border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>Opening Balance</p>
                    <h2 style={{ margin: "8px 0 0 0", color: "#374151" }}>₹ {format(data.openingBalance)}</h2>
                  </div>
                  <div style={{ background: "#fff1f2", padding: 16, borderRadius: 10, border: "1px solid #fecdd3" }}>
                    <p style={{ fontSize: 12, color: "#e11d48", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>Total Credit (+)</p>
                    <h2 style={{ margin: "8px 0 0 0", color: "#9f1239" }}>₹ {format(totalCredit)}</h2>
                  </div>
                  <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 10, border: "1px solid #bbf7d0" }}>
                    <p style={{ fontSize: 12, color: "#16a34a", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>Total Repaid (-)</p>
                    <h2 style={{ margin: "8px 0 0 0", color: "#14532d" }}>₹ {format(totalDebit)}</h2>
                  </div>
                  <div style={{ background: currentBalance > 0 ? "#fffbeb" : "#f0fdf4", padding: 16, borderRadius: 10, border: "1px solid " + (currentBalance > 0 ? "#fef3c7" : "#bbf7d0") }}>
                    <p style={{ fontSize: 12, color: currentBalance > 0 ? "#d97706" : "#16a34a", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>Net Outstanding</p>
                    <h2 style={{ margin: "8px 0 0 0", color: currentBalance > 0 ? "#92400e" : "#14532d" }}>₹ {format(currentBalance)}</h2>
                  </div>
                </div>
              );
            })()}

            {/* Ledger Table */}
            <div style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={table}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ ...th, width: 100 }}>Date</th>
                    <th style={{ ...th, width: 140 }}>Customer</th>
                    <th style={th}>Transaction Details</th>
                    <th style={{ ...th, width: 120 }}>Mode/Ref</th>
                    <th style={thRight}>Credit (+)</th>
                    <th style={thRight}>Debit (-)</th>
                    <th style={thRight}>Balance</th>
                    <th style={{ ...th, width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows || []).map((r, idx) => {
                    const isSale = r.type === "SALE";
                    return (
                      <Fragment key={idx}>
                        <tr style={{ background: isSale ? "transparent" : "#f0fdf4", borderBottom: "1px solid #f1f5f9" }}>
                          <td style={td}>{formatDate(r.date)}</td>
                          <td style={{ ...td, fontWeight: 500 }}>{r.customerName}</td>
                          <td style={td}>
                            <div style={{ fontWeight: 500 }}>{r.description}</div>
                            {isSale && (
                              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                                Net: ₹{format(r.billAmount)} | Paid: ₹{format(r.paidAmount)}
                              </div>
                            )}
                          </td>
                          <td style={td}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{r.paymentMode || "-"}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{r.paymentRef || "-"}</div>
                          </td>
                          <td style={{ ...tdRight, color: "#dc2626", fontWeight: 600 }}>
                            {r.credit > 0 ? `+ ₹${format(r.credit)}` : "-"}
                          </td>
                          <td style={{ ...tdRight, color: "#16a34a", fontWeight: 600 }}>
                            {r.debit > 0 ? `- ₹${format(r.debit)}` : "-"}
                          </td>
                          <td style={{ ...tdRight, fontWeight: 700, color: r.balance > 0 ? "#dc2626" : "#16a34a" }}>
                            ₹ {format(r.balance)}
                          </td>
                          <td style={td}>
                            {isSale && (
                              <button
                                onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                                style={expandBtn}
                              >
                                {expandedRow === r.id ? "−" : "+"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedRow === r.id && isSale && (
                          <tr>
                            <td colSpan={7} style={expandRow}>
                              <div style={{ padding: "8px 20px" }}>
                                <strong style={{ fontSize: 14 }}>Items Details:</strong>
                                <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr>
                                      <th style={{ ...miniTh, paddingLeft: 0 }}>Product Name</th>
                                      <th style={miniTh}>Quantity</th>
                                      <th style={miniTh}>Rate</th>
                                      <th style={{ ...miniTh, textAlign: "right" }}>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.items?.map((it, i) => (
                                      <tr key={i}>
                                        <td style={{ ...miniTd, paddingLeft: 0 }}>{it.productName}</td>
                                        <td style={miniTd}>{it.quantity}</td>
                                        <td style={miniTd}>₹ {format(it.rate)}</td>
                                        <td style={{ ...miniTd, textAlign: "right", fontWeight: 500 }}>₹ {format(it.lineTotal)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  
                  {(!data?.rows || data.rows.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                        <p style={{ margin: 0, fontSize: 16 }}>No ledger entries found for the selected criteria.</p>
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