"use client";

import { useState } from "react";

export default function BackupPage() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const downloadDB = () => {
    window.location.href = "/api/backup/export-db";
  };

  const uploadDB = async () => {
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/backup/import-db", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setMsg(json.message || json.error);
  };

  const downloadTable = (table) => {
    window.location.href = `/api/backup/export-table?table=${table}`;
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Backup & Restore</h1>

      <div
        style={{
          padding: 20,
          background: "white",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>📥 Download Full Database</h3>
        <button onClick={downloadDB} style={btn}>
          Download .db File
        </button>
      </div>

      <div
        style={{
          padding: 20,
          background: "white",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>📤 Restore Database (Upload .db)</h3>
        <input
          type="file"
          accept=".db"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br />
        <button onClick={uploadDB} style={btn}>
          Restore Database
        </button>
        <p>{msg}</p>
      </div>

      <div
        style={{
          padding: 20,
          background: "white",
          borderRadius: 8,
        }}
      >
        <h3>📊 Export Tables as CSV</h3>
        {["customers", "products", "suppliers", "categories"].map((t) => (
          <button
            key={t}
            onClick={() => downloadTable(t)}
            style={{ ...btn, marginRight: 10 }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

const btn = {
  marginTop: 10,
  padding: "10px 15px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
