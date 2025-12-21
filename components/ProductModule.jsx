"use client";
import React, { useEffect, useState } from "react";

export default function ProductModule() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: 0,
    sellingPrice: 0,
    quantity: 0,
    description: "",
    categoryId: "",
  });

  const API = "/api/products";

  const load = async () => {
    setLoading(true);
    const p = await fetch(API).then((r) => r.json());
    const c = await fetch("/api/categories").then((r) => r.json());
    setList(p);
    setCategories(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);

    if (item) {
      // EDIT — sanitize incoming DB object
      setForm({
        name: item.name || "",
        sku: item.sku || "",
        price: item.price ?? 0,
        quantity: item.quantity ?? 0,
        description: item.description || "",
        categoryId: item.categoryId ?? "",
      });
    } else {
      // ADD
      setForm({
        name: "",
        sku: "",
        price: 0,
        sellingPrice: 0,
        quantity: 0,
        description: "",
        categoryId: "",
      });
    }
  };

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  const createItem = async () => {
    const payload = {
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      sellingPrice: Number(form.sellingPrice),
      quantity: Number(form.quantity),
      description: form.description,
      categoryId: Number(form.categoryId),
    };

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    close();
    load();
  };

  const updateItem = async () => {
    const payload = {
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      quantity: Number(form.quantity),
      sellingPrice: Number(form.sellingPrice),
      description: form.description,
      categoryId: Number(form.categoryId),
    };

    await fetch(`${API}/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Products</h1>

      <button
        onClick={() => open("add")}
        style={{ padding: "8px 12px", marginBottom: 15 }}
      >
        Add Product
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>SKU</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Price</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>
                Selling Price
              </th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Qty</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Category</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>
                Description
              </th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.sku}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.price}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.sellingPrice}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.quantity}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.category?.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.description}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  <button
                    onClick={() => open("edit", p)}
                    style={{ marginRight: 10 }}
                  >
                    Edit
                  </button>
                  <button onClick={() => open("delete", p)}>Delete</button>
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
              maxWidth: 500,
            }}
          >
            {(modal === "add" || modal === "edit") && (
              <>
                <h2>{modal === "add" ? "Add Product" : "Edit Product"}</h2>

                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  type="number"
                  placeholder="Selling Price"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: Number(e.target.value) })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
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
                <h2 style={{ color: "crimson" }}>Delete Product?</h2>
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
