"use client";
import React, { useEffect, useState, useMemo } from "react";
import { formatDate, formatCurrency } from "@/lib/utils";
import CreatableSelect from "react-select/creatable";

/* ---------------- SORT HELPER ---------------- */
function getValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export default function SalesModule() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
    "customer.name",
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
      const matchProduct = filters.productId 
        ? s.items?.some(item => item.productId === Number(filters.productId)) 
        : true;
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
    customerId: "",
    items: [{ productId: "", quantity: 1, rate: 0, totalAmount: 0 }],
    discount: 0,
    paidAmount: 0,
    creditAmount: 0,
    totalAmount: 0,
    netAmount: 0,
    remarks: "",
    date: "",
    paymentMode: "CASH",
    paymentRef: "",
    billNumber: "",
    customerPhone: "",
    newProductModal: null, // index of the item being configured
  });

  const [errors, setErrors] = useState({
    stockError: "",
  });

  const API = "/api/sales";

  /* ---------------- LOAD DATA ---------------- */
  const load = async () => {
    setLoading(true);
    const s = await fetch(API).then((r) => r.json());
    const p = await fetch("/api/products").then((r) => r.json());
    const c = await fetch("/api/customers").then((r) => r.json());
    const cats = await fetch("/api/categories").then((r) => r.json());
    c.map((cust) => {
      cust.label = cust.name;
      cust.value = cust.id;
      return cust;
    });
    setList(s);
    setProducts(p);
    setCustomers(c);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------------- CALCULATIONS ---------------- */
  useEffect(() => {
    const itemsTotal = form.items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    const discount = Number(form.discount || 0);
    const paid = Number(form.paidAmount || 0);

    const net = Math.max(itemsTotal - discount, 0);
    const credit = net - paid;

    setForm((prev) => ({
      ...prev,
      totalAmount: itemsTotal,
      netAmount: net,
      creditAmount: credit,
    }));
  }, [form.items, form.discount, form.paidAmount]);

  /* ---------------- ITEM UPDATES ---------------- */
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    const item = { ...newItems[index], [field]: value };

    if (field === "productId" && value === "0") {
      setForm({ ...form, newProductModal: index });
      return;
    }

    if (field === "productId") {
      const product = products.find(p => p.id === Number(value));
      if (product) {
        item.rate = product.sellingPrice;
      }
    }

    if (field === "productId" || field === "quantity" || field === "rate") {
      item.totalAmount = Number(item.quantity || 0) * Number(item.rate || 0);
    }

    newItems[index] = item;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { productId: "", quantity: 1, rate: 0, totalAmount: 0 }]
    });
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      const newItems = form.items.filter((_, i) => i !== index);
      setForm({ ...form, items: newItems });
    }
  };

  /* ---------------- MODAL ---------------- */
  const open = (type, item = null) => {
    setModal(type);
    setSelected(item);

    if (item) {
      setForm({
        customerId: item.customerId || "",
        items: item.items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          rate: it.rate,
          totalAmount: it.totalAmount
        })),
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
        newProductModal: null,
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
        customerId: "",
        items: [{ productId: "", quantity: 1, rate: 0, totalAmount: 0 }],
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
        newProductModal: null,
      });
    }
  };

  const close = () => {
    setModal(null);
    setSelected(null);
    setErrors({ stockError: "" });
  };

  /* ---------------- ACTIONS ---------------- */
  const save = async () => {
    let customerId = form.customerId;
    if (isNaN(customerId)) {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.customerId, phone: form.customerPhone }),
      });
      const newCustomer = await res.json();
      customerId = newCustomer.id;
    }
    
    const method = modal === "add" ? "POST" : "PUT";
    const url = modal === "add" ? API : `${API}/${selected.id}`;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, customerId }),
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
    form.items.some(it => !it.productId || it.quantity <= 0) ||
    !form.customerId ||
    form.discount < 0 ||
    form.paidAmount < 0 ||
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
              <th style={{ width: 40 }}></th>
              <SortTh label="Bill No" col="billNumber" />
              <SortTh label="Date" col="date" />
              <SortTh label="Customer" col="customer.name" />
              <SortTh label="Total" col="totalAmount" />
              <SortTh label="Discount" col="discount" />
              <SortTh label="Net" col="netAmount" />
              <SortTh label="Paid" col="paidAmount" />
              <SortTh label="Credit" col="creditAmount" />
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedList.map((s) => {
              const isExpanded = expandedId === s.id;
              return (
                <React.Fragment key={s.id}>
                  <tr 
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    style={{ cursor: "pointer", background: isExpanded ? "#f8fafc" : "transparent" }}
                  >
                    <td style={{ textAlign: "center", padding: 10 }}>
                      <span style={{ 
                        display: "inline-block", 
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        fontSize: 12,
                        color: "#64748b"
                      }}>▶</span>
                    </td>
                    <td style={tdStyle}>{s.billNumber || "-"}</td>
                    <td style={tdStyle}>{formatDate(s.date)}</td>
                    <td style={tdStyle}>{s.customer?.name}</td>
                    <td style={tdStyle}>₹{formatCurrency(s.totalAmount)}</td>
                    <td style={tdStyle}>₹{formatCurrency(s.discount || 0)}</td>
                    <td style={tdStyle}>₹{formatCurrency(s.netAmount)}</td>
                    <td style={tdStyle}>₹{formatCurrency(s.paidAmount || 0)}</td>
                    <td style={{ ...tdStyle, color: s.creditAmount > 0 ? "crimson" : "green" }}>
                      ₹{formatCurrency(s.creditAmount || 0)}
                    </td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => open("edit", s)} style={{ marginRight: 6 }}>Edit</button>
                      <button onClick={() => open("delete", s)} style={{ background: "red", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Delete</button>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr style={{ background: "#f8fafc" }}>
                      <td colSpan="10" style={{ padding: "0 20px 20px 50px" }}>
                        <div style={{ 
                          background: "white", 
                          borderRadius: 8, 
                          border: "1px solid #e2e8f0", 
                          padding: 15,
                          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)"
                        }}>
                          <h4 style={{ fontSize: 13, marginBottom: 10, color: "#475569" }}>Purchased Products</h4>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                                <th style={subThStyle}>Product Name</th>
                                <th style={subThStyle}>Qty</th>
                                <th style={subThStyle}>Rate</th>
                                <th style={subThStyle}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.items?.map((it) => (
                                <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={subTdStyle}>{it.product?.name}</td>
                                  <td style={subTdStyle}>{it.quantity}</td>
                                  <td style={subTdStyle}>₹{it.rate}</td>
                                  <td style={subTdStyle}>₹{it.totalAmount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {s.remarks && (
                            <div style={{ marginTop: 15, fontSize: 13, color: "#64748b" }}>
                              <strong>Remarks:</strong> {s.remarks}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredAndSortedList.length === 0 && (
              <tr>
                <td colSpan="10" style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
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
          <div style={{ ...modalBox, maxWidth: 800 }}>
            {(modal === "add" || modal === "edit") && (
              <>
                <h2 style={modalTitle}>
                  {modal === "add" ? "Add Sale" : "Edit Sale"}
                </h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                  {renderField(
                    "Customer",
                    <CreatableSelect
                      isClearable
                      value={customers.find((c) => c.id === form.customerId) || (form.customerId ? { label: form.customerId, value: form.customerId } : null)}
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
                    "Date",
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      style={fieldInputStyle}
                    />
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
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
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 14, fontWeight: 700, display: "block", marginBottom: 10 }}>Products</label>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={itemThStyle}>Product</th>
                        <th style={itemThStyle}>Qty</th>
                        <th style={itemThStyle}>Rate</th>
                        <th style={itemThStyle}>Total</th>
                        <th style={itemThStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={index}>
                          <td style={itemTdStyle}>
                            <select
                              value={item.productId}
                              onChange={(e) => updateItem(index, "productId", e.target.value)}
                              style={itemInputStyle}
                            >
                              <option value="">Select</option>
                              {/* <option value="0" style={{ fontWeight: "bold", color: "#2563eb" }}>+ Add New Product</option> */}
                              {products
                                .filter(p => !form.items.some((otherItem, i) => i !== index && Number(otherItem.productId) === p.id))
                                .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.quantity} in stock)
                                </option>
                              ))}
                            </select>
                            {item.isNew && (
                              <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4, cursor: "pointer" }} onClick={() => setForm({...form, newProductModal: index})}>
                                Edit New Product: {item.name}
                              </div>
                            )}
                          </td>
                          <td style={itemTdStyle}>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              style={itemInputStyle}
                            />
                          </td>
                          <td style={itemTdStyle}>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(index, "rate", e.target.value)}
                              style={itemInputStyle}
                            />
                          </td>
                          <td style={itemTdStyle}>
                            ₹{item.totalAmount}
                          </td>
                          <td style={itemTdStyle}>
                            <button onClick={() => removeItem(index)} style={{ color: "red", border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addItem} style={{ marginTop: 10, padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
                    + Add Another Product
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 15, background: "#f8fafc", padding: 15, borderRadius: 8, marginBottom: 20 }}>
                  {renderField(
                    "Subtotal",
                    <div style={{ fontWeight: 700, fontSize: 16 }}>₹{form.totalAmount}</div>
                  )}
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
                    "Net Amount",
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#2563eb" }}>₹{form.netAmount}</div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 15 }}>
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
                  {renderField(
                    "Credit Amount",
                    <div style={{ fontWeight: 700, color: form.creditAmount > 0 ? "crimson" : "green" }}>₹{form.creditAmount}</div>
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
                </div>

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
                    Save Sale
                  </button>
                </div>
              </>
            )}
            
            {/* NEW PRODUCT MODAL */}
            {typeof form.newProductModal === "number" && (
              <div style={overlay}>
                <div style={{ ...modalBox, maxWidth: 400 }}>
                  <h3 style={modalTitle}>Configure New Product</h3>
                  <div style={{ marginBottom: 15 }}>
                    <label style={miniLabel}>Product Name</label>
                    <input 
                      style={fieldInputStyle}
                      value={form.items[form.newProductModal]?.name || ""}
                      onChange={(e) => updateItem(form.newProductModal, "name", e.target.value)}
                      placeholder="Enter name..."
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={miniLabel}>Unit</label>
                    <input 
                      style={fieldInputStyle}
                      value={form.items[form.newProductModal]?.unit || "unit"}
                      onChange={(e) => updateItem(form.newProductModal, "unit", e.target.value)}
                      placeholder="kg, grams, etc."
                    />
                  </div>
                  <div style={{ marginBottom: 15 }}>
                    <label style={miniLabel}>Description</label>
                    <textarea 
                      style={{ ...fieldInputStyle, height: 60 }}
                      value={form.items[form.newProductModal]?.description || ""}
                      onChange={(e) => updateItem(form.newProductModal, "description", e.target.value)}
                      placeholder="Optional description..."
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={miniLabel}>Category</label>
                    <select 
                      style={fieldInputStyle}
                      value={form.items[form.newProductModal]?.categoryId || ""}
                      onChange={(e) => updateItem(form.newProductModal, "categoryId", e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button 
                      onClick={() => {
                        const newItems = [...form.items];
                        newItems[form.newProductModal].productId = ""; // reset
                        setForm({ ...form, items: newItems, newProductModal: null });
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4 }}
                      onClick={() => {
                        const newItems = [...form.items];
                        newItems[form.newProductModal].isNew = true;
                        newItems[form.newProductModal].productId = "NEW"; // temporary marker
                        setForm({ ...form, items: newItems, newProductModal: null });
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modal === "delete" && (
              <>
                <h2 style={{ color: "crimson" }}>Delete Sale?</h2>
                <p>
                  Are you sure you want to delete bill <strong>{selected?.billNumber}</strong>?
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button onClick={close}>Cancel</button>
                  <button onClick={deleteItem} style={{ background: "crimson", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Delete</button>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
  width: "95%",
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

const itemThStyle = {
  fontSize: 12,
  textAlign: "left",
  padding: "8px 4px",
  borderBottom: "1px solid #e2e8f0"
};

const itemTdStyle = {
  padding: "8px 4px",
  borderBottom: "1px solid #f1f5f9"
};

const itemInputStyle = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid #cbd5e1",
  fontSize: 13
};

const subThStyle = {
  fontSize: 12,
  fontWeight: 600,
  textAlign: "left",
  padding: "8px 4px",
  color: "#64748b"
};

const subTdStyle = {
  fontSize: 13,
  padding: "10px 4px",
  color: "#334155"
};

const miniLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  display: "block",
  marginBottom: 4
};
