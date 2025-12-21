"use client";
import React, { useEffect, useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";

/* ---------------- SORT HELPER ---------------- */
function getValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export default function SalesModule() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  /* ---------------- SORT STATE ---------------- */
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sortableCols = [
    "product.name",
    "customer.name",
    "quantity",
    "rate",
    "totalAmount",
    "paidAmount",
    "creditAmount",
    "discount",
    "date",
  ];

  const sortedList = useMemo(() => {
    if (!sortKey) return list;

    return [...list].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);

      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [list, sortKey, sortDir]);

  const onSort = (key) => {
    if (!sortableCols.includes(key)) return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ---------------- FORM ---------------- */
  const [form, setForm] = useState({
    productId: "",
    customerId: "",
    quantity: 0,
    rate: 0,
    discount: 0,
    paidAmount: 0,
    creditAmount: 0,
    totalAmount: 0,
    netAmount: 0,
    remarks: "",
    date: "",
  });

  const [errors, setErrors] = useState({
    rateWarning: "",
    stockError: "",
  });

  const API = "/api/sales";

  /* ---------------- LOAD DATA ---------------- */
  const load = async () => {
    setLoading(true);
    const s = await fetch(API).then((r) => r.json());
    const p = await fetch("/api/products").then((r) => r.json());
    const c = await fetch("/api/customers").then((r) => r.json());
    c.map((cust) => {
      cust.label = cust.name;
      cust.value = cust.id;
      cust; // keep full object if needed
    });
    setList(s);
    setProducts(p);
    setCustomers(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------------- CALCULATIONS ---------------- */
  useEffect(() => {
    const qty = Number(form.quantity);
    const rate = Number(form.rate);
    const discount = Number(form.discount || 0);
    const paid = Number(form.paidAmount || 0);

    const total = qty * rate;
    const net = Math.max(total - discount, 0);
    const safePaid = Math.min(paid, net);
    const credit = net - safePaid;

    setForm((prev) => ({
      ...prev,
      totalAmount: total,
      netAmount: net,
      paidAmount: safePaid,
      creditAmount: credit,
    }));
  }, [form.quantity, form.rate, form.discount, form.paidAmount]);

  /* ---------------- PRODUCT AUTO RATE ---------------- */
  useEffect(() => {
    if (!form.productId) return;
    const product = products.find((p) => p.id === Number(form.productId));
    if (product) {
      setForm((prev) => ({ ...prev, rate: product.sellingPrice }));
    }
  }, [form.productId, products]);

  /* ---------------- VALIDATION ---------------- */
  const currentProduct = useMemo(
    () => products.find((p) => p.id === Number(form.productId)),
    [products, form.productId]
  );

  useEffect(() => {
    let w = { rateWarning: "", stockError: "" };

    if (currentProduct) {
      if (Number(form.rate) < Number(currentProduct.price)) {
        w.rateWarning = `Selling below cost price (₹${currentProduct.price})`;
      }
      if (Number(form.quantity) > Number(currentProduct.quantity)) {
        w.stockError = `Only ${currentProduct.quantity} qty available`;
      }
    }
    setErrors(w);
  }, [form.rate, form.quantity, currentProduct]);

  /* ---------------- MODAL ---------------- */
  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);

    if (item) {
      setForm({
        productId: item.productId,
        customerId: item.customerId || "",
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount || 0,
        paidAmount: item.paidAmount || 0,
        creditAmount: item.creditAmount || 0,
        totalAmount: item.totalAmount,
        netAmount: item.netAmount || item.totalAmount,
        remarks: item.remarks || "",
        date: item.date?.split("T")[0] || "",
      });
    } else {
      setForm({
        productId: "",
        customerId: "",
        quantity: 0,
        rate: 0,
        discount: 0,
        paidAmount: 0,
        creditAmount: 0,
        totalAmount: 0,
        netAmount: 0,
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

  /* ---------------- ACTIONS ---------------- */
  const save = async () => {
    if (isNaN(form.customerId)) {
      //create new customer
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.customerId }),
      });
      const newCustomer = await res.json();
      form.customerId = newCustomer.id;
    }
    const method = modal === "add" ? "POST" : "PUT";
    const url = modal === "add" ? API : `${API}/${selected.id}`;

    await fetch(url, {
      method,
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

  const saveDisabled =
    errors.stockError ||
    errors.rateWarning ||
    !form.productId ||
    !form.customerId ||
    form.quantity <= 0 ||
    form.rate <= 0 ||
    form.discount < 0 ||
    form.paidAmount < 0 ||
    form.paidAmount > form.netAmount ||
    !form.date;

  /* ---------------- UI ---------------- */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Sales</h1>

      <button onClick={() => open("add")} style={{ marginBottom: 15 }}>
        Add Sale
      </button>

      {!loading ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <SortTh label="Product" col="product.name" />
              <SortTh label="Customer" col="customer.name" />
              <SortTh label="Qty" col="quantity" />
              <SortTh label="Rate" col="rate" />
              <SortTh label="Total" col="totalAmount" />
              <SortTh label="Paid" col="paidAmount" />
              <SortTh label="Credit" col="creditAmount" />
              <SortTh label="Discount" col="discount" />
              <SortTh label="Date" col="date" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((s) => (
              <tr key={s.id}>
                <td>{s.product?.name}</td>
                <td>{s.customer?.name}</td>
                <td>{s.quantity}</td>
                <td>₹{s.rate}</td>
                <td>₹{s.totalAmount}</td>
                <td>₹{s.paidAmount || 0}</td>
                <td style={{ color: s.creditAmount > 0 ? "crimson" : "green" }}>
                  ₹{s.creditAmount || 0}
                </td>
                <td>₹{s.discount || 0}</td>
                <td>{new Date(s.date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => open("edit", s)}>Edit</button>{" "}
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
        <div style={overlay}>
          <div style={modalBox}>
            {(modal === "add" || modal === "edit") && (
              <>
                <h2 style={modalTitle}>
                  {modal === "add" ? "Add Sale" : "Edit Sale"}
                </h2>
                {renderField(
                  "Product",
                  <select
                    value={form.productId}
                    onChange={(e) =>
                      setForm({ ...form, productId: Number(e.target.value) })
                    }
                  >
                    <option value="">Select</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.quantity} in stock
                      </option>
                    ))}
                  </select>
                )}
                {renderField(
                  "Customer",
                  <CreatableSelect
                    isClearable
                    value={customers.find((c) => c.id === form.customerId)}
                    options={customers}
                    onChange={(opt) => {
                      setForm({ ...form, customerId: opt.value });
                    }}
                  />
                )}
                {renderField(
                  "Quantity",
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                  />
                )}
                {renderField(
                  "Rate",
                  <input
                    type="number"
                    value={form.rate}
                    onChange={(e) =>
                      setForm({ ...form, rate: Number(e.target.value) })
                    }
                  />
                )}
                {renderField(
                  "Discount",
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) =>
                      setForm({ ...form, discount: Number(e.target.value) })
                    }
                  />
                )}
                {renderField(
                  "Paid Amount",
                  <input
                    type="number"
                    value={form.paidAmount}
                    onChange={(e) =>
                      setForm({ ...form, paidAmount: Number(e.target.value) })
                    }
                  />
                )}
                {renderField(
                  "Credit (Auto)",
                  <input readOnly value={form.creditAmount} />
                )}
                {renderField(
                  "Date",
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                )}
                {renderField(
                  "Remarks",
                  <textarea
                    value={form.remarks}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                  />
                )}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={close}>Cancel</button>
                  <button
                    disabled={saveDisabled}
                    onClick={save}
                    style={{ marginLeft: 10 }}
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
                  <strong>
                    {selected?.product?.name} of worth Rs.
                    {selected?.netAmount} for {selected?.customer?.name}
                  </strong>
                  ?
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

  function SortTh({ label, col }) {
    return (
      <th onClick={() => onSort(col)} style={{ cursor: "pointer", padding: 8 }}>
        {label} {sortKey === col && (sortDir === "asc" ? "▲" : "▼")}
      </th>
    );
  }

  function renderField(labelText, field) {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>{labelText}</label>
        {field}
      </div>
    );
  }
}

/* ---------------- STYLES ---------------- */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalBox = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  width: "100%",
  maxWidth: 520,
};

const modalTitle = {
  marginBottom: 16,
};
