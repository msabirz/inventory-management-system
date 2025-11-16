"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    gstin: "",
    invoiceFooter: "",
    defaultLowStock: 5,
  });

  const [msg, setMsg] = useState("");

  const loadSettings = async () => {
    const res = await fetch("/api/settings");
    const s = await res.json();
    setForm(s);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setMsg("Settings saved!");
    setForm(json);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 10px" }}>
      <h1
        style={{
          fontSize: 26,
          marginBottom: 20,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        Settings
      </h1>

      <div
        style={{
          padding: 25,
          background: "white",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <SectionTitle title="Business Details" />

        <Field
          label="Business Name"
          value={form.businessName}
          onChange={(v) => setForm({ ...form, businessName: v })}
        />

        <Field
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
        />

        <Field
          label="Address Line 1"
          value={form.addressLine1}
          onChange={(v) => setForm({ ...form, addressLine1: v })}
        />

        <Field
          label="Address Line 2"
          value={form.addressLine2}
          onChange={(v) => setForm({ ...form, addressLine2: v })}
        />

        <Field
          label="GSTIN"
          value={form.gstin}
          onChange={(v) => setForm({ ...form, gstin: v })}
        />

        <SectionTitle title="Invoice Footer" />

        <TextareaField
          value={form.invoiceFooter}
          onChange={(v) => setForm({ ...form, invoiceFooter: v })}
        />

        <SectionTitle title="Default Low Stock Threshold" />

        <Field
          type="number"
          value={form.defaultLowStock}
          onChange={(v) => setForm({ ...form, defaultLowStock: Number(v) })}
        />

        <button
          onClick={saveSettings}
          style={{
            marginTop: 25,
            padding: "12px 18px",
            background: "#2563eb",
            color: "white",
            borderRadius: 8,
            border: "none",
            fontSize: 15,
            fontWeight: 500,
            width: "100%",
          }}
        >
          Save Settings
        </button>

        {msg && (
          <p
            style={{
              marginTop: 12,
              color: "green",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------- */
/* Smaller helper components for clean UI */
/* -------------------------------------- */

function SectionTitle({ title }) {
  return (
    <h3
      style={{
        marginTop: 25,
        marginBottom: 12,
        fontSize: 18,
        fontWeight: 600,
        borderBottom: "1px solid #eee",
        paddingBottom: 5,
      }}
    >
      {title}
    </h3>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          fontSize: 15,
        }}
      />
    </div>
  );
}

function TextareaField({ value, onChange }) {
  return (
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        fontSize: 15,
        resize: "vertical",
      }}
    />
  );
}
