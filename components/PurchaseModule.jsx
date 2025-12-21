"use client";
import React, { useEffect, useState } from "react";

export default function PurchaseModule() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    productId: "",
    supplierId: "",
    quantity: 0,
    pricePerUnit: 0,
    totalAmount: 0,
    remarks: "",
    date: "",
  });

  const API = "/api/purchases";

  const load = async () => {
    setLoading(true);

    const p = await fetch(API).then((r) => r.json());
    const productsList = await fetch("/api/products").then((r) => r.json());
    const suppliersList = await fetch("/api/suppliers").then((r) => r.json());

    setList(p);
    setProducts(productsList);
    setSuppliers(suppliersList);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Auto calculate totalAmount
  useEffect(() => {
    const qty = Number(form.quantity);
    const price = Number(form.pricePerUnit);
    setForm((prev) => ({
      ...prev,
      totalAmount: qty * price,
    }));
  }, [form.quantity, form.pricePerUnit]);

  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);

    if (item) {
      setForm({
        productId: item.productId,
        supplierId: item.supplierId ?? "",
        quantity: String(item.quantity),
        pricePerUnit: String(item.pricePerUnit),
        totalAmount: item.totalAmount,
        remarks: item.remarks || "",
        date: item.date
          ? item.date.substring(0, 10)
          : new Date().toISOString().substring(0, 10),
      });
    } else {
      setForm({
        productId: "",
        supplierId: "",
        quantity: "0",
        pricePerUnit: "0",
        totalAmount: 0,
        remarks: "",
        date: new Date().toISOString().substring(0, 10),
      });
    }
  };

  const close = () => {
    setModal(null);
    setSelected(null);
  };

  const createItem = async () => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
        totalAmount: Number(form.totalAmount),
      }),
    });

    close();
    load();
  };

  const updateItem = async () => {
    await fetch(`${API}/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
        totalAmount: Number(form.totalAmount),
      }),
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
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Purchases</h1>

      <button
        onClick={() => open("add")}
        style={{ padding: "8px 12px", marginBottom: 15 }}
      >
        Add Purchase
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Product</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Supplier</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Qty</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>
                Price/Unit
              </th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Total</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Date</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.product?.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.supplier?.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.quantity}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.pricePerUnit}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {p.totalAmount}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {new Date(p.date).toLocaleDateString()}
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
                <h2>{modal === "add" ? "Add Purchase" : "Edit Purchase"}</h2>

                <select
                  value={form.productId}
                  onChange={(e) =>
                    setForm({ ...form, productId: Number(e.target.value) })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p?.quantity} in stock
                    </option>
                  ))}
                </select>

                <select
                  value={form.supplierId}
                  onChange={(e) =>
                    setForm({ ...form, supplierId: Number(e.target.value) })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  type="number"
                  placeholder="Price per Unit"
                  value={form.pricePerUnit}
                  onChange={(e) =>
                    setForm({ ...form, pricePerUnit: e.target.value })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <input
                  type="number"
                  placeholder="Total Amount"
                  value={form.totalAmount}
                  readOnly
                  style={{
                    padding: 8,
                    width: "100%",
                    marginBottom: 10,
                    background: "#eee",
                  }}
                />

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                <textarea
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
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
                <h2 style={{ color: "crimson" }}>Delete Purchase?</h2>
                <p>
                  Are you sure you want to delete purchase of{" "}
                  <strong>{selected?.product?.name}</strong>?
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
