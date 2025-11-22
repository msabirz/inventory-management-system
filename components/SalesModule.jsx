"use client";
import React, { useEffect, useState, useMemo } from "react";

export default function SalesModule() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    productId: "",
    customerId: "",
    quantity: 0,
    rate: 0,
    totalAmount: 0,
    remarks: "",
    date: "",
  });

  const [errors, setErrors] = useState({
    rateWarning: "",
    stockError: "",
  });

  const API = "/api/sales";

  const load = async () => {
    setLoading(true);
    const s = await fetch(API).then((r) => r.json());
    const p = await fetch("/api/products").then((r) => r.json());
    const c = await fetch("/api/customers").then((r) => r.json());
    setList(s);
    setProducts(p);
    setCustomers(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-calc total = rate × qty
  useEffect(() => {
    const qty = Number(form.quantity);
    const rate = Number(form.rate);

    setForm((prev) => ({
      ...prev,
      totalAmount: qty * rate,
    }));
  }, [form.quantity, form.rate]);

  // When product changes → auto-fill selling rate = product price
  useEffect(() => {
    if (!form.productId) return;
    const product = products.find((p) => p.id === Number(form.productId));
    if (product) {
      setForm((prev) => ({
        ...prev,
        rate: product.price,
      }));
    }
  }, [form.productId]);

  // ---------------------------
  // VALIDATION LOGIC
  // ---------------------------
  const currentProduct = useMemo(() => {
    return products.find((p) => p.id === Number(form.productId));
  }, [products, form.productId]);

  useEffect(() => {
    let warnings = { rateWarning: "", stockError: "" };

    if (currentProduct) {
      // selling below cost warning
      if (Number(form.rate) < Number(currentProduct.price)) {
        warnings.rateWarning = `Warning: Selling below cost price (₹${currentProduct.price})`;
      }

      // stock check
      if (Number(form.quantity) > Number(currentProduct.quantity)) {
        warnings.stockError = `Only ${currentProduct.quantity} qty available in stock`;
      }
    }

    setErrors(warnings);
  }, [form.rate, form.quantity, currentProduct]);

  // ---------------------------
  // MODAL OPEN / CLOSE
  // ---------------------------
  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);

    if (item) {
      setForm({
        productId: item.productId,
        customerId: item.customerId || "",
        quantity: item.quantity,
        rate: item.rate,
        totalAmount: item.totalAmount,
        remarks: item.remarks || "",
        date: item.date?.split("T")[0] || "",
      });
    } else {
      setForm({
        productId: "",
        customerId: "",
        quantity: 0,
        rate: 0,
        totalAmount: 0,
        remarks: "",
        date: new Date().toISOString().slice(0, 10),
      });
    }
  };

  const close = () => {
    setModal(null);
    setSelected(null);
    setErrors({ rateWarning: "", stockError: "" });
  };

  // ---------------------------
  // ACTIONS
  // ---------------------------
  const createItem = async () => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    close();
    load();
  };

  const updateItem = async () => {
    await fetch(`${API}/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    close();
    load();
  };

  const deleteItem = async () => {
    await fetch(`${API}/${selected.id}`, { method: "DELETE" });
    close();
    load();
  };

  const saveDisabled =
    errors.stockError !== "" ||
    errors.rateWarning !== "" ||
    !form.productId ||
    !form.customerId ||
    form.quantity <= 0 ||
    form.rate <= 0 ||
    !form.date;

  // ---------------------------
  // MAIN UI
  // ---------------------------
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Sales</h1>

      <button
        onClick={() => open("add")}
        style={{ padding: "8px 12px", marginBottom: 15 }}
      >
        Add Sale
      </button>

      {/* TABLE */}
      {!loading ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Product</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Customer</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Qty</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Rate</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Total</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Date</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {s.product?.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {s.customer?.name}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {s.quantity}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  ₹{s.rate}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  ₹{s.totalAmount}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {new Date(s.date).toLocaleDateString()}
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
      ) : (
        <p>Loading...</p>
      )}

      {/* MODAL */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              width: "100%",
              maxWidth: 520,
            }}
          >
            {(modal === "add" || modal === "edit") && (
              <>
                <h2 style={{ marginBottom: 12 }}>
                  {modal === "add" ? "Add Sale" : "Edit Sale"}
                </h2>

                {/* PRODUCT */}
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
                      {p.name} (Stock: {p.quantity})
                    </option>
                  ))}
                </select>

                {/* CUSTOMER */}
                <select
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({ ...form, customerId: Number(e.target.value) })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* QUANTITY */}
                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 5 }}
                />

                {errors.stockError && (
                  <p style={{ color: "red", marginBottom: 10 }}>
                    {errors.stockError}
                  </p>
                )}

                {/* RATE */}
                <input
                  type="number"
                  placeholder="Selling Rate"
                  value={form.rate}
                  onChange={(e) =>
                    setForm({ ...form, rate: Number(e.target.value) })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 5 }}
                />

                {errors.rateWarning && (
                  <p style={{ color: "orange", marginBottom: 10 }}>
                    ⚠ {errors.rateWarning}
                  </p>
                )}

                {/* TOTAL */}
                <input
                  type="number"
                  value={form.totalAmount}
                  readOnly
                  style={{
                    padding: 8,
                    width: "100%",
                    marginBottom: 10,
                    background: "#f2f2f2",
                  }}
                />

                {/* DATE */}
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                {/* REMARKS */}
                <textarea
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  style={{ padding: 8, width: "100%", marginBottom: 10 }}
                />

                {/* BUTTONS */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <button onClick={close}>Cancel</button>
                  <button
                    disabled={saveDisabled}
                    style={{
                      background: saveDisabled ? "#999" : "#2563eb",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      cursor: saveDisabled ? "not-allowed" : "pointer",
                    }}
                    onClick={modal === "add" ? createItem : updateItem}
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            {modal === "delete" && (
              <>
                <h2 style={{ color: "crimson" }}>Delete Sale?</h2>
                <p>
                  Are you sure you want to delete sale of{" "}
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
