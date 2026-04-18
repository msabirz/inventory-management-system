"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, icon, children, exact = false }) {
  const pathname = usePathname();
  
  const isActive = exact 
    ? pathname === href 
    : pathname.startsWith(href) && (href === "/" ? pathname === "/" : true);

  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        textDecoration: "none",
        color: isActive ? "#fff" : "#94a3b8",
        background: isActive ? "#2563eb" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: isActive ? 600 : 500,
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        marginBottom: "2px"
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#334155";
          e.currentTarget.style.color = "#fff";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#94a3b8";
        }
      }}
    >
      {icon && (
        <span style={{ 
          display: "flex", 
          alignItems: "center", 
          opacity: isActive ? 1 : 0.7,
          transition: "opacity 0.2s" 
        }}>
          {icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{children}</span>
    </Link>
  );
}
