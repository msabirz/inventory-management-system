"use client";
import React, { useEffect, useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";
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

  /* ---------------- SORT STATE ---------------- */
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    customerId: "",
    productId: "",
    startDate: "",
    endDate: "",
    billNumber: "",
  });

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

  const onSort = (key) => {
    if (!sortableCols.includes(key)) return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ---------------- FILTERED & SORTED LIST ---------------- */
  const filteredAndSortedList = useMemo(() => {
    // 1. Filter
    let result = list.filter((s) => {
      const matchCustomer = filters.customerId ? s.customerId === Number(filters.customerId) : true;
      const matchProduct = filters.productId ? s.productId === Number(filters.productId) : true;
      const matchBill = filters.billNumber
        ? s.billNumber?.toLowerCase().includes(filters.billNumber.toLowerCase())
        : true;

      let matchDate = true;
      if (filters.startDate || filters.endDate) {
        const d = new Date(s.date);
        if (filters.startDate) {
          matchDate = matchDate && d >= new Date(filters.startDate);
        }
        if (filters.endDate) {
          matchDate = matchDate && d <= new Date(filters.endDate);
        }
      }

      return matchCustomer && matchProduct && matchBill && matchDate;
    });

    // 2. Sort
    if (sortKey) {
      result.sort((a, b) => {
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
    }

    return result;
  }, [list, sortKey, sortDir, filters]);

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
    paymentMode: "CASH",
    paymentRef: "",
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
      return cust;
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
        billNumber: item.billNumber || "",
        customerPhone: item.customer?.phone || "",
        paymentMode: item.paymentMode || "CASH",
        paymentRef: item.paymentRef || "",
      });
    } else {
      // For "Add", suggested bill number
      const fetchNextBill = async () => {
        const res = await fetch("/api/sales/latest-bill");
        const { latestBillNumber } = await res.json();
        let nextBill = "";
        if (latestBillNumber) {
          const match = latestBillNumber.match(/(.*?)(\d+)$/);
          if (match) {
            const prefix = match[1];
            const num = parseInt(match[2], 10) + 1;
            nextBill = prefix + num;
          } else {
            nextBill = latestBillNumber + "1";
          }
        } else {
          nextBill = "1";
        }
        setForm((prev) => ({ ...prev, billNumber: nextBill }));
      };
      fetchNextBill();

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
        billNumber: "",
        customerPhone: "",
        paymentMode: "CASH",
        paymentRef: "",
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
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.customerId, phone: form.customerPhone }),
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
    !form.date ||
    !form.billNumber;

  const resetFilters = () => {
    setFilters({
      customerId: "",
      productId: "",
      startDate: "",
      endDate: "",
      billNumber: "",
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Sales</h1>

      {/* Filter Section */}
      <div style={{ background: "#f8fafc", padding: 15, borderRadius: 8, marginBottom: 20, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15 }}>
          <div>
            <label style={filterLabelStyle}>Customer</label>
            <select
              value={filters.customerId}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
              style={filterInputStyle}
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={filterLabelStyle}>Product</label>
            <select
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              style={filterInputStyle}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={filterLabelStyle}>Bill Number</label>
            <input
              placeholder="Search Bill No..."
              value={filters.billNumber}
              onChange={(e) => setFilters({ ...filters, billNumber: e.target.value })}
              style={filterInputStyle}
            />
          </div>
          <div>
            <label style={filterLabelStyle}>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              style={filterInputStyle}
            />
          </div>
          <div>
            <label style={filterLabelStyle}>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              style={filterInputStyle}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <button 
              onClick={resetFilters} 
              style={{ 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 16px", 
                background: "#f1f5f9", 
                color: "#475569",
                border: "1px solid #e2e8f0", 
                borderRadius: 6, 
                cursor: "pointer", 
                flex: 1,
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
            <button 
              onClick={() => open("add")} 
              style={{ 
                padding: "8px 16px", 
                background: "#2563eb", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6, 
                cursor: "pointer", 
                flex: 1,
                fontSize: 13,
                fontWeight: 500,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              + Add Sale
            </button>
          </div>
        </div>
      </div>

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
              <SortTh label="Bill No" col="billNumber" />
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedList.map((s) => (
              <tr key={s.id}>
                <td style={tdStyle}>{s.product?.name}</td>
                <td style={tdStyle}>{s.customer?.name}</td>
                <td style={tdStyle}>{s.quantity}</td>
                <td style={tdStyle}>₹{s.rate}</td>
                <td style={tdStyle}>₹{s.totalAmount}</td>
                <td style={tdStyle}>₹{s.paidAmount || 0}</td>
                <td style={{ ...tdStyle, color: s.creditAmount > 0 ? "crimson" : "green" }}>
                  ₹{s.creditAmount || 0}
                </td>
                <td style={tdStyle}>₹{s.discount || 0}</td>
                <td style={tdStyle}>{formatDate(s.date)}</td>
                <td style={tdStyle}>{s.billNumber || "-"}</td>
                <td style={tdStyle}>
                  <button onClick={() => open("edit", s)} style={{ marginRight: 6 }}>Edit</button>
                  <button onClick={() => open("delete", s)} style={{ background: "red", border: "1px solid #cbd5e1" }}>Delete</button>
                </td>
              </tr>
            ))}
            {filteredAndSortedList.length === 0 && (
              <tr>
                <td colSpan="11" style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
                  No sales found matching the current filters.
                </td>
              </tr>
            )}
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
                    style={fieldInputStyle}
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
                      setForm({
                        ...form,
                        customerId: opt?.value,
                        customerPhone: opt?.phone || "",
                      });
                    }}
                  />
                )}
                {renderField(
                  "Phone Number (Optional)",
                  <input
                    type="text"
                    value={form.customerPhone}
                    placeholder="Enter phone..."
                    onChange={(e) =>
                      setForm({ ...form, customerPhone: e.target.value })
                    }
                    style={fieldInputStyle}
                  />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                  {renderField(
                    "Quantity",
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: Number(e.target.value) })
                      }
                      style={fieldInputStyle}
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
                      style={fieldInputStyle}
                    />
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                  {renderField(
                    "Discount",
                    <input
                      type="number"
                      value={form.discount}
                      onChange={(e) =>
                        setForm({ ...form, discount: Number(e.target.value) })
                      }
                      style={fieldInputStyle}
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
                      style={fieldInputStyle}
                    />
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                  {renderField(
                    "Credit (Auto)",
                    <input readOnly value={form.creditAmount} style={{ ...fieldInputStyle, background: "#f8fafc" }} />
                  )}
                  {renderField(
                    "Date",
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      style={fieldInputStyle}
                    />
                  )}
                </div>
                {renderField(
                  "Bill Number",
                  <input
                    type="text"
                    value={form.billNumber}
                    placeholder="Suggested automatically..."
                    onChange={(e) =>
                      setForm({ ...form, billNumber: e.target.value })
                    }
                    style={fieldInputStyle}
                  />
                )}
                  {renderField(
                  "Payment Mode",
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    style={fieldInputStyle}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                )}
                {renderField(
                  form.paymentMode === "CASH" ? "Payment Ref (e.g. Bill No)" : 
                  form.paymentMode === "UPI" ? "Transaction ID" : "Cheque Number",
                  <input
                    type="text"
                    value={form.paymentRef}
                    onChange={(e) => setForm({ ...form, paymentRef: e.target.value })}
                    placeholder="Enter reference details..."
                    style={fieldInputStyle}
                  />
                )}
                {renderField(
                  "Remarks",
                  <textarea
                    value={form.remarks}
                    onChange={(e) =>
                      setForm({ ...form, remarks: e.target.value })
                    }
                    style={{ ...fieldInputStyle, height: 60 }}
                  />
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={close} style={{ padding: "8px 16px" }}>Cancel</button>
                  <button
                    disabled={saveDisabled}
                    onClick={save}
                    style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: saveDisabled ? "not-allowed" : "pointer" }}
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
      <th
        onClick={() => onSort(col)}
        style={{
          cursor: "pointer",
          padding: 8,
          color: sortKey === col ? "#000" : "#64748b",
          fontSize: "13px",
          fontWeight: 600,
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: "10px" }}>
            {sortKey === col ? (sortDir === "asc" ? "▲" : "▼") : "▲▼"}
          </span>
        </div>
      </th>
    );
  }

  function renderField(labelText, field) {
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>{labelText}</label>
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
  padding: 24,
  borderRadius: 12,
  width: "100%",
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalTitle = {
  marginBottom: 20,
  fontSize: 20,
  fontWeight: 700,
  color: "#1e293b",
};

const filterLabelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
};

const filterInputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  outline: "none",
};

const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
  color: "#334155",
};

const fieldInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  outline: "none",
};
