import { useState, useMemo } from "react";

function getValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export default function useTableSort(rows = [], columns = []) {
  const [sortKey, setSortKey] = useState(null);
  const [direction, setDirection] = useState("asc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;

    return [...rows].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);

      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number") {
        return direction === "asc" ? av - bv : bv - av;
      }

      // date or string
      return direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, sortKey, direction]);

  const onSort = (key) => {
    if (!columns.includes(key)) return;

    if (sortKey === key) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  return { rows: sortedRows, sortKey, direction, onSort };
}
