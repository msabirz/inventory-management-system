"use client";
import React, { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

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
    unit: "unit",
  });

  const API = "/api/products";

  const load = async () => {
    setLoading(true);
    const p = await fetch(API).then((r) => r.json());
    const c = await fetch("/api/categories").then((r) => r.json());
    console.log("products--", p);
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
        sellingPrice: item.sellingPrice ?? 0,
        quantity: item.quantity ?? 0,
        description: item.description || "",
        categoryId: item.categoryId ?? "",
        unit: item.unit || "unit",
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
        unit: "unit",
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
      unit: form.unit,
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
      unit: form.unit,
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
    <Suspense fallback={<div>Loading search...</div>}>
      <ProductModuleContent
        list={list}
        loading={loading}
        categories={categories}
        modal={modal}
        selected={selected}
        form={form}
        setForm={setForm}
        open={open}
        close={close}
        createItem={createItem}
        updateItem={updateItem}
        deleteItem={deleteItem}
      />
    </Suspense>
  );
}

function ProductModuleContent({
  list,
  loading,
  categories,
  modal,
  selected,
  form,
  setForm,
  open,
  close,
  createItem,
  updateItem,
  deleteItem,
}) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [filters, setFilters] = useState({
    categoryId: "",
    search: "",
  });

  useEffect(() => {
    if (productId && !loading && list.length > 0) {
      const product = list.find((p) => String(p.id) === String(productId));
      if (product) {
        open("edit", product);
      }
    }
  }, [productId, loading, list]);

  const filteredProducts = useMemo(() => {
    return list.filter((p) => {
      const matchCategory = filters.categoryId
        ? p.categoryId === Number(filters.categoryId)
        : true;
      const matchSearch = filters.search
        ? p.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return matchCategory && matchSearch;
    });
  }, [list, filters]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 15 }}>Products</h1>

      {/* Filter Options */}
      <div
        style={{
          display: "flex",
          gap: 15,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            placeholder="Search by name or SKU..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              padding: "10px 12px",
              width: "100%",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 14,
            }}
          />
        </div>
        <div>
          <select
            value={filters.categoryId}
            onChange={(e) =>
              setFilters({ ...filters, categoryId: e.target.value })
            }
            style={{
              padding: "10px 12px",
              minWidth: 180,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              background: "#fff",
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Unit</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => (
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
                  {p.unit}
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
            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  style={{ padding: 20, textAlign: "center", color: "#666" }}
                >
                  No products found matching the criteria.
                </td>
              </tr>
            )}
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
            zIndex: 100,
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
                
                <input
                  placeholder="Unit (e.g. kg, grams, meters)"
                  value={form.unit}
                  onChange={(e) =>
                    setForm({ ...form, unit: e.target.value })
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
