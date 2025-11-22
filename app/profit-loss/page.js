"use client";

import { useEffect, useState } from "react";

const presets = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "financial_year", label: "Financial Year" },
];

export default function ProfitLossPage() {
  const [view, setView] = useState("card"); // 'card' | 'table'
  const [preset, setPreset] = useState("this_week"); // default this week
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [ledgerRows, setLedgerRows] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // initial load default: this_week
    fetchPnl({ range: "this_week" });
  }, []);

  const fetchPnl = async ({ range, from, to } = {}) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profit-loss", {
        method: "POST",
        body: JSON.stringify({ range, from, to }),
      });
      const json = await res.json();
      setData(json);
      // also refresh ledger preview
      fetchLedger({ range, from, to });
    } catch (e) {
      console.error("fetch pnl error", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async ({ range, from, to } = {}) => {
    try {
      const res = await fetch("/api/profit-loss-ledger", {
        method: "POST",
        body: JSON.stringify({ range, from, to }),
      });
      const json = await res.json();
      setLedgerRows(json.rows || []);
    } catch (e) {
      console.error("ledger fetch err", e);
      setLedgerRows([]);
    }
  };

  const applyPreset = (key) => {
    setPreset(key);
    setFrom("");
    setTo("");
    fetchPnl({ range: key });
  };

  const applyCustomRange = () => {
    if (!from || !to) {
      alert("Select both from and to");
      return;
    }
    setPreset("custom");
    fetchPnl({ from, to });
  };

  const format = (v) => Number(v || 0).toFixed(2);

  // derive with fallback to support old field names
  const revenue = data ? data.revenue ?? data.totalSales ?? 0 : 0;
  const cogs = data ? data.cogs ?? data.totalCOGS ?? 0 : 0;
  const expenses = data ? data.expenses ?? data.totalExpenses ?? 0 : 0;
  const grossProfit = data ? data.grossProfit ?? (revenue - cogs) : 0;
  const netProfit = data ? data.netProfit ?? (grossProfit - expenses) : 0;
  const normalProfit = data ? data.normalProfit ?? 0 : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 12 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Profit &amp; Loss</h1>

      {data && (
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Showing:{" "}
          {data.from ? new Date(data.from).toLocaleDateString() : ""} to{" "}
          {data.to ? new Date(data.to).toLocaleDateString() : ""}
        </p>
      )}

      {/* Filters / Controls */}
      <div style={controlsCard}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              style={preset === p.key ? presetBtnActive : presetBtn}
            >
              {p.label}
            </button>
          ))}

          <div style={{ width: 12 }} />

          <label style={{ fontSize: 13 }}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={dateInput}
          />
          <label style={{ fontSize: 13 }}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={dateInput}
          />
          <button onClick={applyCustomRange} style={primaryBtn}>
            Apply
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setView("card")}
              style={view === "card" ? presetBtnActive : presetBtn}
            >
              Card View
            </button>
            <button
              onClick={() => setView("table")}
              style={view === "table" ? presetBtnActive : presetBtn}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && <div style={{ padding: 12 }}>Calculating...</div>}

        {!data && !loading && (
          <div style={{ padding: 12, color: "#6b7280" }}>No data</div>
        )}

        {/* CARD VIEW */}
        {data && view === "card" && (
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            <SummaryCard
              title="Revenue"
              value={revenue}
              color="#2563eb"
              icon="💰"
              tooltip={
                data.tooltips?.revenue ||
                "Revenue = Σ (Selling Price × Quantity)"
              }
            />
            <SummaryCard
              title="COGS"
              value={cogs}
              color="#f59e0b"
              icon="📦"
              tooltip={
                data.tooltips?.cogs || "COGS = Σ (Cost Price × Quantity)"
              }
            />
            <SummaryCard
              title="Gross Profit"
              value={grossProfit}
              color={grossProfit >= 0 ? "#16a34a" : "#dc2626"}
              icon="📈"
              tooltip={
                data.tooltips?.grossProfit ||
                "Gross Profit = Revenue – COGS"
              }
            />
            <SummaryCard
              title={normalProfit < 0 ? "Normal Loss" : "Normal Profit"}
              value={normalProfit}
              color={normalProfit < 0 ? "#dc2626" : "#0ea5e9"}
              icon="⚖️"
              tooltip={
                data.tooltips?.normalProfit ||
                "Normal Profit = Σ (Selling Price – Cost Price) × Qty"
              }
            />
            <SummaryCard
              title="Expenses"
              value={expenses}
              color="#6b7280"
              icon="🧾"
              tooltip={
                data.tooltips?.expenses ||
                "Expenses = Σ expense amounts in the period"
              }
            />
            <SummaryCard
              title={netProfit < 0 ? "Net Loss" : "Net Profit"}
              value={netProfit}
              color={netProfit < 0 ? "#dc2626" : "#16a34a"}
              icon="🏁"
              tooltip={
                data.tooltips?.netProfit ||
                "Net Profit = Gross Profit – Expenses"
              }
            />
          </div>
        )}

        {/* TABLE VIEW */}
        {data && view === "table" && (
          <div style={{ marginTop: 10 }}>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Summary</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td
                      style={tdKey}
                      title={
                        data.tooltips?.revenue ||
                        "Revenue = Σ (Selling Price × Quantity)"
                      }
                    >
                      Revenue
                    </td>
                    <td style={tdValue}>₹ {format(revenue)}</td>
                  </tr>
                  <tr>
                    <td
                      style={tdKey}
                      title={
                        data.tooltips?.cogs ||
                        "COGS = Σ (Cost Price × Quantity)"
                      }
                    >
                      COGS
                    </td>
                    <td style={tdValue}>₹ {format(cogs)}</td>
                  </tr>
                  <tr>
                    <td
                      style={tdKey}
                      title={
                        data.tooltips?.grossProfit ||
                        "Gross Profit = Revenue – COGS"
                      }
                    >
                      Gross Profit
                    </td>
                    <td style={tdValue}>₹ {format(grossProfit)}</td>
                  </tr>
                  <tr>
                    <td
                      style={tdKey}
                      title={
                        data.tooltips?.normalProfit ||
                        "Normal Profit = Σ (Selling Price – Cost Price) × Qty"
                      }
                    >
                      Normal Profit
                    </td>
                    <td
                      style={{
                        ...tdValue,
                        color: normalProfit < 0 ? "#dc2626" : "#0ea5e9",
                      }}
                    >
                      ₹ {format(normalProfit)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={tdKey}
                      title={
                        data.tooltips?.expenses ||
                        "Expenses = Σ expense amounts in the period"
                      }
                    >
                      Expenses
                    </td>
                    <td style={tdValue}>₹ {format(expenses)}</td>
                  </tr>
                  <tr>
                    <td
                      style={tdKey}
                      title={
                        data.tooltips?.netProfit ||
                        "Net Profit = Gross Profit – Expenses"
                      }
                    >
                      {netProfit < 0 ? "Net Loss" : "Net Profit"}
                    </td>
                    <td
                      style={{
                        ...tdValue,
                        color: netProfit < 0 ? "#dc2626" : "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      ₹ {format(netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12 }}>
              <h4>Ledger (date-wise)</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={th}>Date</th>
                      <th style={th}>Sales</th>
                      <th style={th}>COGS</th>
                      <th style={th}>Expenses</th>
                      <th style={th}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ledgerRows || []).map((r) => (
                      <tr key={r.date}>
                        <td style={td}>{r.date}</td>
                        <td style={td}>₹ {format(r.sales)}</td>
                        <td style={td}>₹ {format(r.cogs)}</td>
                        <td style={td}>₹ {format(r.expenses)}</td>
                        <td
                          style={{
                            ...td,
                            color: r.profit < 0 ? "#dc2626" : "#16a34a",
                          }}
                        >
                          ₹ {format(r.profit)}
                        </td>
                      </tr>
                    ))}
                    {(!ledgerRows || ledgerRows.length === 0) && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ padding: 12, color: "#6b7280" }}
                        >
                          No ledger rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- components ---------------- */
function SummaryCard({ title, value, color, tooltip, icon }) {
  const v = Number(value || 0);
  const [hover, setHover] = useState(false);
  const [showTip, setShowTip] = useState(false);

  return (
    <div
      style={{
        ...summaryCard,
        borderLeft: `6px solid ${color}`,
        position: "relative",
        overflow: "visible",  // << FIX
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setShowTip(false);
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            <span>{title}</span>
          </div>
        </div>

        {tooltip && (
  <div
    style={{ position: "relative", cursor: "pointer", zIndex: 50 }}
    onMouseEnter={() => setShowTip(true)}
    onMouseLeave={() => setShowTip(false)}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: "999px",
        border: "1px solid #cbd5f5",
        fontSize: 11,
        color: "#4b5563",
        background: "#f9fafb",
      }}
    >
      i
    </span>

    {showTip && (
      <div
           style={{
            position: "absolute",
            bottom: "110%",        // show ABOVE the icon
            left: "50%",           // center horizontally
            transform: "translateX(-50%)",
            width: 260,            // 👈 increase tooltip width
            background: "#111827",
            color: "white",
            padding: "8px 10px",
            fontSize: 11,
            borderRadius: 6,
            boxShadow: "0 6px 16px rgba(15,23,42,0.45)",
            zIndex: 9999,          // 👈 always stays above other cards
            lineHeight: 1.4,
            whiteSpace: "normal",  // 👈 allow wrapping
          }}
      >
        {tooltip}
      </div>
    )}
  </div>
)}

      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginTop: 10,
          color,
        }}
      >
        ₹ {v.toFixed(2)}
      </div>
    </div>
  );
}


/* ---------------- styles ---------------- */
const controlsCard = {
  background: "white",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #e6e9ee",
  boxShadow: "0 4px 10px rgba(15,23,42,0.04)",
};

const summaryCard = {
  minWidth: 180,
  flex: "1 1 180px",
  background: "linear-gradient(135deg, #ffffff, #f9fafb)",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  border: "1px solid #e5e7eb",
  position: "relative",
  overflow: "visible", // important so tooltip is not clipped
  transition: "transform 0.12s ease, box-shadow 0.12s ease",
};

const card = {
  background: "white",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #e6e9ee",
};

const primaryBtn = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const presetBtn = {
  padding: "6px 10px",
  background: "#f3f4f6",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};

const presetBtnActive = {
  ...presetBtn,
  background: "#2563eb",
  color: "white",
};

const dateInput = {
  padding: 6,
  borderRadius: 6,
  border: "1px solid #ddd",
};

const th = {
  padding: 8,
  borderBottom: "1px solid #eee",
  textAlign: "left",
  fontSize: 13,
};
const td = { padding: 8, borderBottom: "1px solid #f1f1f1", fontSize: 13 };
const tdKey = { padding: 8, width: 220, color: "#374151", fontSize: 13 };
const tdValue = {
  padding: 8,
  textAlign: "right",
  fontWeight: 600,
  fontSize: 13,
};
