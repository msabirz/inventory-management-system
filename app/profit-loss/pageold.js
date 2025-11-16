"use client";

import { useState } from "react";

export default function ProfitLossPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [source, setSource] = useState("sales");
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!from || !to) {
      alert("Select both dates");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/profit-loss", {
      method: "POST",
      body: JSON.stringify({ from, to, source }),
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  // small helper for color
  const colorFor = (v) => (v > 0 ? "#16a34a" : v < 0 ? "#dc2626" : "#6b7280");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, marginBottom: 18 }}>Profit & Loss</h1>

      <div style={card}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label style={label}>From</label>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} style={input} />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label style={label}>To</label>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} style={input} />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label style={label}>Source</label>
            <select value={source} onChange={(e)=>setSource(e.target.value)} style={input}>
              <option value="sales">Sales</option>
              <option value="invoices">Invoices</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={calculate} style={primaryBtn} disabled={loading}>
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <SummaryCard
              title="Total Sales"
              value={data.totalSales}
              color="#2563eb"
              tooltip={`Source: ${data.source}`}
            />

            <SummaryCard
              title="COGS"
              value={data.totalCOGS}
              color="#f59e0b"
              tooltip="Cost of goods sold"
            />

            <SummaryCard
              title="Gross Profit"
              value={data.grossProfit}
              color={colorFor(data.grossProfit)}
              tooltip={`Gross = Sales - COGS`}
            />

            <SummaryCard
              title="Net Profit"
              value={data.netProfit}
              color={colorFor(data.netProfit)}
              tooltip={`Net = Gross Profit - Expenses (${data.totalExpenses ?? 0})`}
            />
          </div>

          {/* DETAILS CARD */}
          <div style={{ marginTop: 16 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Details</h3>
                <div>
                  <button onClick={()=>setExpanded(!expanded)} style={linkBtn}>
                    {expanded ? "See less" : "See more"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <DetailRow label="Total Sales" value={data.totalSales} />
                  <DetailRow label="Total COGS" value={data.totalCOGS} />
                  <DetailRow label="Total Expenses" value={data.totalExpenses} />
                  <DetailRow label="Gross Profit" value={data.grossProfit} />
                  <DetailRow label="Net Profit" value={data.netProfit} highlight />
                </div>

                {/* expandable ledger */}
                {expanded && (
                  <div style={{ marginTop: 18 }}>
                    <h4 style={{ marginBottom: 12 }}>Date-wise ledger (limited preview)</h4>
                    <LedgerPreview from={from} to={to} source={source} />
                    <p style={{ marginTop: 8, color: "#6b7280" }}>Note: this is a compact preview. For full exports use the export option (Phase 2).</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- components ---------------- */

function SummaryCard({ title, value, color, tooltip }) {
  const v = Number(value || 0);
  return (
    <div style={{ ...summaryCard, borderLeft: `6px solid ${color}` }} title={tooltip}>
      <div style={{ fontSize: 13, color: "#374151" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: color }}>
        ₹ {v.toFixed(2)}
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  const v = Number(value || 0);
  return (
    <div style={{ padding: 8, borderBottom: "1px dashed #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ color: "#374151" }}>{label}</div>
      <div style={{ color: highlight ? "#16a34a" : "#111", fontWeight: highlight ? 700 : 500 }}>
        ₹ {v.toFixed(2)}
      </div>
    </div>
  );
}

/* Ledger preview: fetches date-wise summary and shows a few rows */
function LedgerPreview({ from, to, source }) {
  const [rows, setRows] = useState(null);

  useState(() => {
    // small IIFE to fetch ledger preview
    (async () => {
      try {
        const res = await fetch("/api/profit-loss-ledger", {
          method: "POST",
          body: JSON.stringify({ from, to, source }),
        });
        const json = await res.json();
        setRows(json.rows || []);
      } catch (e) {
        console.error("ledger preview error", e);
        setRows([]);
      }
    })();
  });

  if (!rows) return <div style={{ padding: 12 }}>Loading...</div>;
  if (rows.length === 0) return <div style={{ padding: 12, color: "#6b7280" }}>No ledger rows in range</div>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", color: "#374151" }}>
          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Date</th>
          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Sales</th>
          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>COGS</th>
          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Expenses</th>
          <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Profit</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 10).map(r => (
          <tr key={r.date}>
            <td style={{ padding: 8 }}>{r.date}</td>
            <td style={{ padding: 8 }}>₹ {Number(r.sales || 0).toFixed(2)}</td>
            <td style={{ padding: 8 }}>₹ {Number(r.cogs || 0).toFixed(2)}</td>
            <td style={{ padding: 8 }}>₹ {Number(r.expenses || 0).toFixed(2)}</td>
            <td style={{ padding: 8, color: (r.profit > 0 ? "#16a34a" : r.profit < 0 ? "#dc2626" : "#111") }}>₹ {Number(r.profit || 0).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------- styles ---------------- */

const card = {
  background: "white",
  padding: 16,
  borderRadius: 10,
  border: "1px solid #e6e9ee",
};

const summaryCard = {
  minWidth: 200,
  background: "white",
  padding: 14,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
};

const primaryBtn = {
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
};

const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
};

const label = { display: "block", marginBottom: 6, fontWeight: 600 };

const linkBtn = {
  background: "transparent",
  color: "#2563eb",
  border: "none",
  cursor: "pointer",
  padding: 8,
  fontWeight: 600,
};
