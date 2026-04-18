"use client";
import React, { useEffect, useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";

export default function ReturnModule() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    productId: "",
    customerId: "",
    quantity: 1,
    amount: 0,
    reason: "",
    date: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    isBroken: false,
  });

  const API = "/api/returns";

  const load = async () => {
    setLoading(true);
    try {
      const [r, p, c] = await Promise.all([
        fetch(API).then((res) => res.json()),
        fetch("/api/products").then((res) => res.json()),
        fetch("/api/customers").then((res) => res.json()),
      ]);
      setList(r);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      console.error("Load ReturnModule error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);
    if (item && type === "edit") {
        // Not really implementing edit for returns to keep it simple (delete/re-add)
    } else {
      setForm({
        productId: "",
        customerId: "",
        quantity: 1,
        amount: 0,
        reason: "",
        date: new Date().toISOString().split("T")[0],
        invoiceNumber: "",
        isBroken: false,
      });
    }
  };

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  const createItem = async () => {
    if (!form.productId || !form.quantity) {
      alert("Product and quantity are required");
      return;
    }

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    close();
    load();
  };

  const deleteItem = async () => {
    await fetch(`${API}?id=${selected.id}`, { method: "DELETE" });
    close();
    load();
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>Refund & Returns</h1>
        <button 
          onClick={() => open("add")}
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          + Add Return
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={th}>Date</th>
                <th style={th}>Invoice#</th>
                <th style={th}>Product</th>
                <th style={th}>Customer</th>
                <th style={th}>Qty</th>
                <th style={th}>Amount</th>
                <th style={th}>Condition</th>
                <th style={th}>Reason</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={td}>{formatDate(item.date)}</td>
                  <td style={td}>{item.invoiceNumber || "-"}</td>
                  <td style={td}>{item.product?.name}</td>
                  <td style={td}>{item.customer?.name || "-"}</td>
                  <td style={td}>{item.quantity}</td>
                  <td style={td}>₹ {item.amount.toFixed(2)}</td>
                  <td style={td}>
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: 12, 
                      fontSize: 12,
                      background: item.isBroken ? "#fee2e2" : "#dcfce7",
                      color: item.isBroken ? "#dc2626" : "#16a34a"
                    }}>
                      {item.isBroken ? "Broken" : "Good"}
                    </span>
                  </td>
                  <td style={td}>{item.reason}</td>
                  <td style={td}>
                    <button 
                        onClick={() => open("delete", item)}
                        style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    No return records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            {modal === "add" && (
              <>
                <h2 style={{ marginBottom: 20 }}>Record Return</h2>
                
                <div style={fieldGroup}>
                  <label style={label}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={input}
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={label}>Product *</label>
                  <select
                    value={form.productId}
                    onChange={(e) => {
                      const p = products.find(x => x.id === Number(e.target.value));
                      setForm({ ...form, productId: e.target.value, amount: p ? p.sellingPrice : 0 });
                    }}
                    style={input}
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ ...fieldGroup, flex: 1 }}>
                    <label style={label}>Quantity</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                      style={input}
                    />
                  </div>
                  <div style={{ ...fieldGroup, flex: 1 }}>
                    <label style={label}>Refund Amount</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                      style={input}
                    />
                  </div>
                </div>

                <div style={fieldGroup}>
                    <label style={label}>Customer (Optional)</label>
                    <select
                        value={form.customerId}
                        onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                        style={input}
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div style={fieldGroup}>
                  <label style={label}>Invoice Number (Optional)</label>
                  <input
                    placeholder="INV-..."
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    style={input}
                  />
                </div>

                <div style={fieldGroup}>
                  <label style={label}>Reason / Remarks</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    style={{ ...input, height: 60 }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 10, 
                    cursor: "pointer",
                    padding: "10px 12px",
                    background: form.isBroken ? "#fff1f2" : "#f8fafc",
                    border: `1px solid ${form.isBroken ? "#fecdd3" : "#e2e8f0"}`,
                    borderRadius: 8,
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="checkbox"
                      checked={form.isBroken}
                      onChange={(e) => setForm({ ...form, isBroken: e.target.checked })}
                      style={{ 
                        marginTop: 4, 
                        width: 16, 
                        height: 16, 
                        cursor: "pointer",
                        accentColor: "#2563eb"
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: form.isBroken ? "#991b1b" : "#334155" }}>
                        Item is Broken
                      </span>
                      <span style={{ fontSize: 12, color: form.isBroken ? "#b91c1c" : "#64748b" }}>
                        Do not add back to stock
                      </span>
                    </div>
                  </label>
                </div>

                <div style={modalActions}>
                  <button onClick={close} style={btnSecondary}>Cancel</button>
                  <button onClick={createItem} style={btnPrimary}>Save Return</button>
                </div>
              </>
            )}

            {modal === "delete" && (
              <>
                <h2 style={{ color: "#dc2626", marginBottom: 15 }}>Delete Return?</h2>
                <p style={{ marginBottom: 20 }}>
                  This will delete the return record and **reverse any stock adjustments** made.
                  Continue?
                </p>
                <div style={modalActions}>
                  <button onClick={close} style={btnSecondary}>Cancel</button>
                  <button onClick={deleteItem} style={{ ...btnPrimary, background: "#dc2626" }}>Yes, Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const th = { padding: "12px 15px", textAlign: "left", fontSize: 13, color: "#475569", fontWeight: 600 };
const td = { padding: "12px 15px", fontSize: 13, color: "#1e293b" };

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContent = {
  background: "white",
  padding: 24,
  borderRadius: 12,
  width: "100%",
  maxWidth: 450,
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
};

const fieldGroup = { marginBottom: 15 };
const label = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 5, color: "#334155" };
const input = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14 };

const modalActions = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 };
const btnPrimary = { padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const btnSecondary = { padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
