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
  const isLoss = (v) => Number(v) < 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 12 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Profit & Loss</h1>

      <div style={controlsCard}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} style={dateInput} />
          <label style={{ fontSize: 13 }}>To</label>
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} style={dateInput} />
          <button onClick={applyCustomRange} style={primaryBtn}>Apply</button>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("card")} style={view === "card" ? presetBtnActive : presetBtn}>Card View</button>
            <button onClick={() => setView("table")} style={view === "table" ? presetBtnActive : presetBtn}>Table View</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && <div style={{ padding: 12 }}>Calculating...</div>}

        {!data && !loading && <div style={{ padding: 12, color: "#6b7280" }}>No data</div>}

        {data && view === "card" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
            <SummaryCard title="Revenue" value={data.totalSales} color="#2563eb" tooltip="Sum of sales (rate × qty)" />
            <SummaryCard title="COGS" value={data.totalCOGS} color="#f59e0b" tooltip="Sum of purchase costs for sold items" />
            <SummaryCard title="Gross Profit" value={data.grossProfit} color={data.grossProfit>=0 ? "#16a34a" : "#dc2626"} tooltip="Revenue - COGS" />
            <SummaryCard title="Expenses" value={data.totalExpenses} color="#6b7280" tooltip="Sum of expenses in range" />
            <SummaryCard title={Number(data.netProfit) < 0 ? "Net Loss" : "Net Profit"} value={data.netProfit} color={Number(data.netProfit) < 0 ? "#dc2626" : "#16a34a"} tooltip="Gross - Expenses" />
          </div>
        )}

        {data && view === "table" && (
          <div style={{ marginTop: 10 }}>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Summary</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={tdKey}>Revenue</td>
                    <td style={tdValue}>₹ {format(data.totalSales)}</td>
                  </tr>
                  <tr>
                    <td style={tdKey}>COGS</td>
                    <td style={tdValue}>₹ {format(data.totalCOGS)}</td>
                  </tr>
                  <tr>
                    <td style={tdKey}>Gross Profit</td>
                    <td style={tdValue}>₹ {format(data.grossProfit)}</td>
                  </tr>
                  <tr>
                    <td style={tdKey}>Expenses</td>
                    <td style={tdValue}>₹ {format(data.totalExpenses)}</td>
                  </tr>
                  <tr>
                    <td style={tdKey}>{Number(data.netProfit) < 0 ? "Net Loss" : "Net Profit"}</td>
                    <td style={{ ...tdValue, color: Number(data.netProfit) < 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>₹ {format(data.netProfit)}</td>
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
                        <td style={{ ...td, color: r.profit < 0 ? "#dc2626" : "#16a34a" }}>₹ {format(r.profit)}</td>
                      </tr>
                    ))}
                    {(!ledgerRows || ledgerRows.length === 0) && <tr><td colSpan={5} style={{ padding: 12, color: "#6b7280" }}>No ledger rows</td></tr>}
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
function SummaryCard({ title, value, color, tooltip }) {
  const v = Number(value || 0);
  return (
    <div style={{ ...summaryCard, borderLeft: `6px solid ${color}` }} title={tooltip}>
      <div style={{ fontSize: 13, color: "#374151" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color }}>
        ₹ {v.toFixed(2)}
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */
const controlsCard = {
  background: "white",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #e6e9ee",
};

const summaryCard = {
  minWidth: 180,
  background: "white",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const card = {
  background: "white",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #e6e9ee",
};

const primaryBtn = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
};

const presetBtn = {
  padding: "6px 10px",
  background: "#f3f4f6",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
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

const th = { padding: 8, borderBottom: "1px solid #eee", textAlign: "left" };
const td = { padding: 8, borderBottom: "1px solid #f1f1f1" };
const tdKey = { padding: 8, width: 220, color: "#374151" };
const tdValue = { padding: 8, textAlign: "right", fontWeight: 600 };
