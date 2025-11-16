"use client";
import React, { useEffect, useState } from "react";

export default function SupplierModule() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const API = "/api/suppliers";

  const load = async () => {
    setLoading(true);
    const data = await fetch(API).then((r) => r.json());
    setList(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);
    setForm(
      item || {
        name: "",
        phone: "",
        email: "",
        address: "",
      }
    );
  };

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  const createItem = async () => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    close();
    load();
  };

  const updateItem = async () => {
    await fetch(`${API}/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    close();
    load();
  };

  const deleteItem = async () => {
    await fetch(`${API}/${selected.id}`, { method: "DELETE" });
    close();
    load();
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Suppliers</h1>

      <button
        onClick={() => open("add")}
        style={{ padding: "8px 12px", marginBottom: 15 }}
      >
        Add Supplier
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Phone</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {s.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {s.phone}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {s.email}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  <button
                    onClick={() => open("edit", s)}
                    style={{ marginRight: 10 }}
                  >
                    Edit
                  </button>
                  <button onClick={() => open("delete", s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              width: "100%",
              maxWidth: 450,
            }}
          >
            {(modal === "add" || modal === "edit") && (
              <>
                <h2>{modal === "add" ? "Add Supplier" : "Edit Supplier"}</h2>

                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <textarea
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <button onClick={close}>Cancel</button>
                  <button onClick={modal === "add" ? createItem : updateItem}>
                    Save
                  </button>
                </div>
              </>
            )}

            {modal === "delete" && (
              <>
                <h2 style={{ color: "crimson" }}>Delete Supplier?</h2>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selected?.name}</strong>?
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <button onClick={close}>Cancel</button>
                  <button
                    onClick={deleteItem}
                    style={{ background: "crimson", color: "#fff" }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
