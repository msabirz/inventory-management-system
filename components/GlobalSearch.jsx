"use client";

import { useEffect, useState } from "react";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");
  const [results, setResults] = useState({});
  const [open, setOpen] = useState(false);

  const search = async () => {
    if (!query.trim()) {
      setResults({});
      return;
    }
    const res = await fetch(`/api/search?q=${query}&module=${module}`);
    const json = await res.json();
    setResults(json);
    setOpen(true);
  };

  useEffect(() => {
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [query, module]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "450px",
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: 6,
          overflow: "hidden",
          background: "white",
        }}
      >
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          style={{
            width: "90px",
            padding: "6px",
            border: "none",
            borderRight: "1px solid #ddd",
            background: "#f7f7f7",
            fontSize: 14,
          }}
        >
          <option value="all">All</option>
          <option value="products">Products</option>
          <option value="customers">Customers</option>
          <option value="suppliers">Suppliers</option>
          <option value="invoices">Invoices</option>
          <option value="categories">Categories</option>
        </select>

        <input
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "none",
            outline: "none",
            fontSize: 14,
          }}
        />

        <button
          style={{
            padding: "0 12px",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontSize: 14,
          }}
        >
          🔍
        </button>
      </div>

      {open && query && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: 0,
            width: "100%",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "10px",
            maxHeight: "300px",
            overflowY: "auto",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            zIndex: 9999,
          }}
        >
          {Object.keys(results).map((section) => (
            <div key={section} style={{ marginBottom: 8 }}>
              <h4
                style={{
                  margin: "5px 0",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                {section.toUpperCase()}
              </h4>

              {results[section].map((item) => (
                <a
                  key={item.id}
                  href={getLink(section, item)}
                  style={{
                    display: "block",
                    padding: "6px",
                    textDecoration: "none",
                    fontSize: "14px",
                    color: "#2563eb",
                    borderBottom: "1px solid #f2f2f2",
                  }}
                >
                  {getLabel(section, item)}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getLabel(section, item) {
  switch (section) {
    case "products":
      return `${item.name} (Stock: ${item.quantity})`;
    case "customers":
      return `${item.name} (${item.phone || ""})`;
    case "suppliers":
      return `${item.name} (${item.phone || ""})`;
    case "invoices":
      return `Invoice ${item.invoiceNumber} - ₹${item.total}`;
    case "categories":
      return item.name;
    default:
      return "";
  }
}

function getLink(section, item) {
  switch (section) {
    case "products":
      return `/products?id=${item.id}`;
    case "customers":
      return `/customers?id=${item.id}`;
    case "suppliers":
      return `/suppliers?id=${item.id}`;
    case "invoices":
      return `/invoices/${item.id}`;
    case "categories":
      return `/categories?id=${item.id}`;
    default:
      return "#";
  }
}
