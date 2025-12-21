"use client";

import React, { useEffect, useState } from "react";

export default function InvoiceEditPage({ params }) {
  const { id } = params;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  const [invoice, setInvoice] = useState(null);
  const [totals, setTotals] = useState({
    subtotal: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMasterAndInvoice = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, invRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch(`/api/invoices/${id}`),
      ]);

      const [c, p, inv] = await Promise.all([
        cRes.json(),
        pRes.json(),
        invRes.json(),
      ]);

      setCustomers(c);
      setProducts(p);

      if (!inv || inv.error) {
        setInvoice(null);
        return;
      }

      // Infer GST type
      let gstType = "CGST_SGST";
      if (inv.igstPercent > 0) gstType = "IGST";

      setInvoice({
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId || "",
        date: inv.date ? inv.date.split("T")[0] : new Date().toISOString().slice(0, 10),
        discount: inv.discount || 0,
        gstType,
        cgstPercent: inv.cgstPercent || 0,
        sgstPercent: inv.sgstPercent || 0,
        igstPercent: inv.igstPercent || 0,
        remarks: inv.remarks || "",
      });

      setItems(
        (inv.items || []).map((it) => ({
          id: it.id, // not required for API but handy in UI
          productId: it.productId,
          quantity: it.quantity,
          pricePerUnit: it.pricePerUnit,
          total: it.total,
        }))
      );

      setTotals({
        subtotal: inv.subtotal || 0,
        cgstAmount: inv.cgstAmount || 0,
        sgstAmount: inv.sgstAmount || 0,
        igstAmount: inv.igstAmount || 0,
        total: inv.total || 0,
      });
    } catch (e) {
      console.error("Failed to load invoice", e);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterAndInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Recalculate totals whenever items or invoice GST/discount changes
  useEffect(() => {
    if (!invoice) return;

    const subtotal = items.reduce(
      (acc, it) => acc + Number(it.total || 0),
      0
    );
    const discount = Number(invoice.discount || 0);
    const taxable = subtotal - discount;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (invoice.gstType === "CGST_SGST") {
      cgstAmount = (taxable * Number(invoice.cgstPercent || 0)) / 100;
      sgstAmount = (taxable * Number(invoice.sgstPercent || 0)) / 100;
    } else {
      igstAmount = (taxable * Number(invoice.igstPercent || 0)) / 100;
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

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        pricePerUnit: 0,
        total: 0,
      },
    ]);
  };

  const updateItem = (index, key, value) => {
    const updated = [...items];
    updated[index][key] = value;

    // Auto-update price when product selected
    if (key === "productId") {
      const pr = products.find((p) => p.id === Number(value));
      if (pr) {
        updated[index].pricePerUnit = pr.price;
      }
    }

    // Recalculate line total
    const qty = Number(updated[index].quantity || 0);
    const price = Number(updated[index].pricePerUnit || 0);
    updated[index].total = qty * price;

    setItems(updated);
  };

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const saveInvoice = async () => {
    if (!invoice.customerId) {
      alert("Select customer");
      return;
    }
    if (items.length === 0) {
      alert("Add at least 1 item");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        date: invoice.date,
        items,
        subtotal: totals.subtotal,
        discount: Number(invoice.discount || 0),

        cgstPercent:
          invoice.gstType === "CGST_SGST"
            ? Number(invoice.cgstPercent || 0)
            : 0,
        cgstAmount:
          invoice.gstType === "CGST_SGST" ? totals.cgstAmount : 0,
        sgstPercent:
          invoice.gstType === "CGST_SGST"
            ? Number(invoice.sgstPercent || 0)
            : 0,
        sgstAmount:
          invoice.gstType === "CGST_SGST" ? totals.sgstAmount : 0,

        igstPercent:
          invoice.gstType === "IGST" ? Number(invoice.igstPercent || 0) : 0,
        igstAmount: invoice.gstType === "IGST" ? totals.igstAmount : 0,

        total: totals.total,
        remarks: invoice.remarks || "",
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to update invoice");
        return;
      }

      alert("Invoice updated!");
      // optionally redirect back to detail:
      // window.location.href = `/invoices/${id}`;
    } catch (e) {
      console.error("Failed to update invoice", e);
      alert("Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading invoice...</p>;
  if (!invoice) return <p>Invoice not found.</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>
        Edit Invoice #{invoice.invoiceNumber}
      </h1>

      {/* HEADER */}
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
                setInvoice({
                  ...invoice,
                  invoiceNumber: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label>Invoice Date</label>
            <input
              type="date"
              value={invoice.date}
              onChange={(e) =>
                setInvoice({
                  ...invoice,
                  date: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label>Customer</label>
            <select
              value={invoice.customerId}
              onChange={(e) =>
                setInvoice({
                  ...invoice,
                  customerId: Number(e.target.value),
                })
              }
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Remarks</label>
          <br />
          <textarea
            value={invoice.remarks}
            onChange={(e) =>
              setInvoice({ ...invoice, remarks: e.target.value })
            }
            rows={2}
            style={{ width: "100%", padding: 6 }}
          />
        </div>
      </div>

      {/* ITEMS */}
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
              <th>Price</th>
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
                        {p.name}
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

                <td>
                  <input
                    type="number"
                    value={it.pricePerUnit}
                    onChange={(e) =>
                      updateItem(i, "pricePerUnit", Number(e.target.value))
                    }
                  />
                </td>

                <td>{it.total}</td>

                <td>
                  <button
                    style={{ background: "crimson", color: "white" }}
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
          style={{ marginTop: 15, background: "#2563eb", color: "white" }}
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
              setInvoice({
                ...invoice,
                discount: Number(e.target.value),
              })
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
        disabled={saving}
        style={{
          background: "#16a34a",
          padding: "10px 20px",
          fontSize: 16,
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        {saving ? "Saving..." : "Save Invoice"}
      </button>
    </div>
  );
}
