// src/App.jsx
import React, { useState } from "react";
import SearchBar from "./components/SearchBar";
import CryptoList from "./components/CryptoList";
import CryptoChart from "./components/CryptoChart";

export default function App() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  return (
    <div style={{ padding: 20, fontFamily: "Inter, system-ui, Arial", maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0 }}>Crypto Tracker Dashboard</h1>
          <div style={{ fontSize: 13, color: "#666" }}>Real-time prices · Watchlist · Charts</div>
        </div>
      </header>

      <SearchBar onSearch={q => setQuery(q)} />

      <div style={{ display: "grid", gridTemplateColumns: "460px 1fr", gap: 18 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Coins</h3>
          <CryptoList onSelect={id => setSelected(id)} searchQuery={query} />
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{selected ? selected.toUpperCase() : "Chart"}</h3>
            <div style={{ fontSize: 13, color: "#666" }}>{selected ? "USD" : ""}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <CryptoChart coinId={selected} days={1} pollIntervalMs={15000} />
          </div>
        </div>
      </div>
    </div>
  );
}
