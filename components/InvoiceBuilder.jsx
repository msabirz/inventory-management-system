"use client";
import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { formatDate } from "@/lib/utils";

export default function InvoiceBuilder() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  const [invoice, setInvoice] = useState({
    invoiceNumber: "EST-1000",
    customerId: "",
    customerPhone: "",
    date: new Date().toISOString().substring(0, 10),
    discount: 0,

    gstType: "CGST_SGST", // CGST+SGST | IGST
    cgstPercent: 0,
    sgstPercent: 0,
    igstPercent: 0,
  });

  // Totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    total: 0,
  });

  const loadMaster = async () => {
    const c = await fetch("/api/customers").then((r) => r.json());
    const p = await fetch("/api/products").then((r) => r.json());
    
    // Map customers for React Select
    const mappedCustomers = c.map(cust => ({
        ...cust,
        label: cust.name,
        value: cust.id
    }));
    
    setCustomers(mappedCustomers);
    setProducts(p);

    // Fetch next invoice number
    const res = await fetch("/api/invoices/latest-number");
    const { latestInvoiceNumber } = await res.json();
    if (latestInvoiceNumber) {
        // Handle EST- prefix and increment
        const match = latestInvoiceNumber.match(/^(EST-)?(\d+)$/);
        if (match) {
            const nextNum = parseInt(match[2], 10) + 1;
            setInvoice(prev => ({ ...prev, invoiceNumber: `EST-${nextNum}` }));
        } else {
            // Fallback if format is unexpected
            setInvoice(prev => ({ ...prev, invoiceNumber: "EST-1000" }));
        }
    } else {
        setInvoice(prev => ({ ...prev, invoiceNumber: "EST-1000" }));
    }
  };

  useEffect(() => {
    loadMaster();
  }, []);

  // Add item row
  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        pricePerUnit: 0,
        total: 0,
        sku: "",
      },
    ]);
  };

  // Update item
  const updateItem = (index, key, value) => {
    const updated = [...items];
    updated[index][key] = value;
    // Auto-update price when selecting product
    if (key === "productId") {
      const pr = products.find((p) => p.id === Number(value));

      if (pr) {
        updated[index].pricePerUnit = pr.price;
        updated[index].sku = pr.sku;
        updated[index].sellingPrice = pr.sellingPrice;
      }
    }

    // Auto-calc line total
    updated[index].total =
      updated[index].quantity * updated[index].sellingPrice;

    setItems(updated);
  };

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Calculate totals whenever items or GST changes
  useEffect(() => {
    const subtotal = items.reduce((acc, it) => acc + it.total, 0);
    const discount = Number(invoice.discount);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const taxable = subtotal - discount;

    if (invoice.gstType === "CGST_SGST") {
      cgstAmount = (taxable * Number(invoice.cgstPercent)) / 100;
      sgstAmount = (taxable * Number(invoice.sgstPercent)) / 100;
    } else {
      igstAmount = (taxable * Number(invoice.igstPercent)) / 100;
    }

    const total = taxable + cgstAmount + sgstAmount + igstAmount;

    setTotals({
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      total,
    });
  }, [items, invoice]);

  // Submit Invoice
  const saveInvoice = async () => {
    if (!invoice.customerId) {
      alert("Select or create customer");
      return;
    }
    if (items.length === 0) {
      alert("Add at least 1 item");
      return;
    }

    let currentCustomerId = invoice.customerId;

    // Create customer if it's a new name
    if (isNaN(currentCustomerId)) {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentCustomerId, phone: invoice.customerPhone }),
      });
      const newCustomer = await res.json();
      currentCustomerId = newCustomer.id;
    }

    const payload = {
      ...invoice,
      customerId: currentCustomerId,
      items,
      subtotal: totals.subtotal,
      discount: Number(invoice.discount),

      cgstPercent: Number(invoice.cgstPercent),
      cgstAmount: totals.cgstAmount,
      sgstPercent: Number(invoice.sgstPercent),
      sgstAmount: totals.sgstAmount,

      igstPercent: Number(invoice.igstPercent),
      igstAmount: totals.igstAmount,
      total: totals.total,
    };

    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("Quotation saved!");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Create Quotation</h1>

      {/* INVOICE HEADER */}
      <div
        style={{
          background: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
          <div>
            <label>Invoice No</label>
            <input
              value={invoice.invoiceNumber}
              onChange={(e) =>
                setInvoice({ ...invoice, invoiceNumber: e.target.value })
              }
            />
          </div>

          <div>
            <label>Invoice Date</label>
            <input
              type="date"
              value={invoice.date}
              onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Customer</label>
            <CreatableSelect
              isClearable
              value={customers.find((c) => c.id === invoice.customerId)}
              options={customers}
              onChange={(opt) => {
                setInvoice({
                  ...invoice,
                  customerId: opt?.value,
                  customerPhone: opt?.phone || "",
                });
              }}
              styles={{
                control: (base) => ({
                    ...base,
                    minHeight: 38,
                    borderRadius: 6
                })
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Phone Number (Optional)</label>
            <input
              type="text"
              placeholder="Enter phone..."
              value={invoice.customerPhone}
              onChange={(e) =>
                setInvoice({ ...invoice, customerPhone: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1"
              }}
            />
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div
        style={{
          background: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Invoice Items</h3>

        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>SKU</th>
              <th>Selling Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>
                  <select
                    value={it.productId}
                    onChange={(e) =>
                      updateItem(i, "productId", Number(e.target.value))
                    }
                  >
                    <option value="">Select</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.sku}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(i, "quantity", Number(e.target.value))
                    }
                  />
                </td>
                <td>{it.sku}</td>
                <td>
                  <input
                    type="number"
                    value={it.sellingPrice}
                    onChange={(e) =>
                      updateItem(i, "sellingPrice", Number(e.target.value))
                    }
                  />
                </td>

                <td>{it.total}</td>

                <td>
                  <button
                    style={{ background: "crimson" }}
                    onClick={() => removeItem(i)}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addItem}
          style={{ marginTop: 15, background: "#2563eb" }}
        >
          Add Product
        </button>
      </div>

      {/* GST + TOTALS */}
      <div
        style={{
          background: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>GST Details</h3>

        <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
          <div>
            <label>GST Type</label>
            <select
              value={invoice.gstType}
              onChange={(e) =>
                setInvoice({ ...invoice, gstType: e.target.value })
              }
            >
              <option value="CGST_SGST">CGST + SGST</option>
              <option value="IGST">IGST</option>
            </select>
          </div>

          {invoice.gstType === "CGST_SGST" && (
            <>
              <div>
                <label>CGST %</label>
                <input
                  type="number"
                  value={invoice.cgstPercent}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      cgstPercent: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label>SGST %</label>
                <input
                  type="number"
                  value={invoice.sgstPercent}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      sgstPercent: Number(e.target.value),
                    })
                  }
                />
              </div>
            </>
          )}

          {invoice.gstType === "IGST" && (
            <div>
              <label>IGST %</label>
              <input
                type="number"
                value={invoice.igstPercent}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    igstPercent: Number(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <label>Discount</label>
          <input
            type="number"
            value={invoice.discount}
            onChange={(e) =>
              setInvoice({ ...invoice, discount: Number(e.target.value) })
            }
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>Totals</h3>
          <p>Subtotal: ₹{totals.subtotal}</p>
          <p>CGST: ₹{totals.cgstAmount}</p>
          <p>SGST: ₹{totals.sgstAmount}</p>
          <p>IGST: ₹{totals.igstAmount}</p>
          <p>
            <strong>Total: ₹{totals.total}</strong>
          </p>
        </div>
      </div>

      <button
        onClick={saveInvoice}
        style={{
          background: "#16a34a",
          padding: "10px 20px",
          fontSize: 16,
        }}
      >
        Save Invoice
      </button>
    </div>
  );
}
