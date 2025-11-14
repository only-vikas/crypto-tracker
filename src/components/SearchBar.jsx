// src/components/SearchBar.jsx
import React, { useState, useMemo } from "react";
import debounce from "lodash.debounce";

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");

  // debounce so parent doesn't get flooded
  const debounced = useMemo(() => debounce(q => onSearch(q), 350), [onSearch]);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    debounced(v.trim());
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <input
        value={value}
        onChange={handleChange}
        placeholder="Search coin name or symbol (e.g. bitcoin, eth)"
        aria-label="Search coins"
        style={{
          padding: "8px 12px",
          width: "100%",
          maxWidth: 560,
          borderRadius: 6,
          border: "1px solid #ddd",
        }}
      />
    </div>
  );
}
