"use client";

export default function NavLink({ href, children }) {
  return (
    <a
      href={href}
      style={{
        padding: "10px 15px",
        borderRadius: "6px",
        textDecoration: "none",
        color: "white",
        display: "block",
        fontSize: "15px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.target.style.background = "#334155")}
      onMouseLeave={(e) => (e.target.style.background = "transparent")}
    >
      {children}
    </a>
  );
}
