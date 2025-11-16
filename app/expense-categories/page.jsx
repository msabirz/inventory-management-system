"use client";

import { useEffect, useState } from "react";

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");

  const load = async () => {
    const res = await fetch("/api/expense-categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditId(cat.id);
    setName(cat.name);
    setModalOpen(true);
  };

  const saveCategory = async () => {
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `/api/expense-categories/${editId}`
      : `/api/expense-categories`;

    await fetch(url, {
      method,
      body: JSON.stringify({ name }),
    });

    setModalOpen(false);
    load();
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;

    await fetch(`/api/expense-categories/${id}`, {
      method: "DELETE",
    });

    load();
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Expense Categories</h1>

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
          + Add Category
        </button>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>Name</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={td}>{cat.name}</td>
                <td style={td}>
                  <button onClick={() => openEdit(cat)} style={btnSecondary}>
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    style={btnDanger}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div style={modalBackdrop}>
          <div style={modalBox}>
            <h3>{editId ? "Edit Category" : "Add Category"}</h3>

            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={input}
            />

            <div style={{ marginTop: 15 }}>
              <button onClick={saveCategory} style={btnPrimary}>
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
  width: 350,
};
