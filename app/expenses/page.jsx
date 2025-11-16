"use client";

import { useEffect, useState } from "react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    notes: "",
  });

  const loadExpenses = async () => {
    const res = await fetch("/api/expenses");
    setExpenses(await res.json());
  };

  const loadCategories = async () => {
    const res = await fetch("/api/expense-categories");
    setCategories(await res.json());
  };

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({
      title: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (exp) => {
    setEditId(exp.id);
    setForm({
      title: exp.title,
      amount: exp.amount,
      date: exp.date.split("T")[0],
      categoryId: exp.categoryId,
      notes: exp.notes || "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/expenses/${editId}` : `/api/expenses`;

    await fetch(url, {
      method,
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
      }),
    });

    setModalOpen(false);
    loadExpenses();
  };

  const remove = async (id) => {
    if (!confirm("Delete this expense?")) return;

    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    loadExpenses();
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Expenses</h1>

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      >
        <button
          onClick={openAdd}
          style={{
            padding: "10px 14px",
            background: "#2563eb",
            color: "white",
            borderRadius: 6,
            border: "none",
            marginBottom: 20,
          }}
        >
          + Add Expense
        </button>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>Date</th>
              <th style={th}>Title</th>
              <th style={th}>Category</th>
              <th style={th}>Amount</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td style={td}>{exp.date.split("T")[0]}</td>
                <td style={td}>{exp.title}</td>
                <td style={td}>{exp.category.name}</td>
                <td style={td}>₹{exp.amount}</td>
                <td style={td}>
                  <button onClick={() => openEdit(exp)} style={btnSecondary}>
                    Edit
                  </button>
                  <button onClick={() => remove(exp.id)} style={btnDanger}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={modalBackdrop}>
          <div style={modalBox}>
            <h3>{editId ? "Edit Expense" : "Add Expense"}</h3>

            <label>Title</label>
            <input
              style={input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label>Amount (₹)</label>
            <input
              type="number"
              style={input}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <label>Date</label>
            <input
              type="date"
              style={input}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <label>Category</label>
            <select
              style={input}
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: Number(e.target.value) })
              }
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label>Notes</label>
            <textarea
              style={{ ...input, height: 80 }}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div style={{ marginTop: 15 }}>
              <button onClick={save} style={btnPrimary}>
                Save
              </button>
              <button onClick={() => setModalOpen(false)} style={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th = { padding: 10, borderBottom: "1px solid #ddd", textAlign: "left" };
const td = { padding: 10, borderBottom: "1px solid #eee" };
const input = {
  width: "100%",
  padding: "10px",
  marginTop: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const btnPrimary = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  marginRight: 10,
};

const btnSecondary = {
  padding: "8px 14px",
  background: "#e5e7eb",
  border: "none",
  borderRadius: 6,
  marginRight: 10,
};

const btnDanger = {
  padding: "8px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 6,
};

const modalBackdrop = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox = {
  background: "white",
  padding: 20,
  borderRadius: 8,
  width: 400,
};
