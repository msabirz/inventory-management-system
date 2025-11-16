"use client";

import { useEffect, useState } from "react";

export default function StockAdjustmentsPage() {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    type: "damaged",
    note: "",
  });

  const loadData = async () => {
    const pRes = await fetch("/api/products");
    const pData = await pRes.json();
    setProducts(pData);

    const aRes = await fetch("/api/stock-adjustments");
    const aData = await aRes.json();
    setAdjustments(aData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async () => {
    const res = await fetch("/api/stock-adjustments", {
      method: "POST",
      body: JSON.stringify(form),
    });

    setForm({ productId: "", quantity: "", type: "damaged", note: "" });
    loadData();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Stock Adjustments</h1>

      {/* ADD FORM */}
      <div style={{ background: "white", padding: 20, borderRadius: 8 }}>
        <h3>Add Adjustment</h3>

        <label>Product</label>
        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: Number(e.target.value) })}
          style={input}
        >
          <option value="">Select</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Stock: {p.quantity})
            </option>
          ))}
        </select>

        <label>Quantity</label>
        <input
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          style={input}
        />

        <label>Type</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          style={input}
        >
          <option value="damaged">Damaged</option>
          <option value="expired">Expired</option>
          <option value="lost">Lost</option>
          <option value="manual">Manual Adjustment</option>
        </select>

        <label>Note</label>
        <input
          type="text"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button
          onClick={submit}
          style={btn}
        >
          Submit
        </button>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 30 }}>
        <h3>Adjustment History</h3>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Qty</th>
              <th style={th}>Type</th>
              <th style={th}>Note</th>
              <th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id}>
                <td style={td}>{a.product?.name}</td>
                <td style={td}>-{a.quantity}</td>
                <td style={td}>{a.type}</td>
                <td style={td}>{a.note}</td>
                <td style={td}>
                  {new Date(a.date).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const input = {
  display: "block",
  width: "100%",
  padding: 8,
  margin: "8px 0 15px",
  border: "1px solid #ccc",
  borderRadius: 4,
};

const btn = {
  padding: "10px 15px",
  background: "#2563eb",
  color: "white",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};

const th = {
  padding: 8,
  background: "#f3f3f3",
  border: "1px solid #ddd",
  textAlign: "left",
};

const td = {
  padding: 8,
  border: "1px solid #ddd",
};
