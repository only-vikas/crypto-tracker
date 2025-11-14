// src/components/CryptoList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchMarkets, searchCoins } from "../api/coingecko";
import { loadWatchlist, toggleWatch } from "../utils/storage";

export default function CryptoList({ onSelect, searchQuery }) {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState(loadWatchlist());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMarkets({ per_page: 80 });
        if (mounted) setCoins(data);
      } catch (err) {
        console.error(err);
      } finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // if there's a searchQuery, try to filter locally first,
  // otherwise call CoinGecko search endpoint to map to ids
  const filtered = useMemo(() => {
    if (!searchQuery) return coins;
    const q = searchQuery.toLowerCase();
    // client-side name/symbol match
    const local = coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    if (local.length > 0) return local;
    // fallback: return empty (we'll call search api in effect)
    return [];
  }, [coins, searchQuery]);

  useEffect(() => {
    if (!searchQuery) return;
    if (filtered.length > 0) return; // local results exist
    let mounted = true;
    (async () => {
      try {
        const res = await searchCoins(searchQuery);
        if (!mounted) return;
        const ids = res.coins.slice(0, 30).map(c => c.id).join(",");
        if (ids) {
          const remote = await fetchMarkets({ per_page: 50, ids });
          if (mounted) setCoins(remote);
        }
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, [searchQuery]); // eslint-disable-line

  const handleToggle = (id) => {
    const updated = toggleWatch(id);
    setWatchlist(updated);
  };

  if (loading) return <div>Loading coins…</div>;

  const listToRender = filtered.length ? filtered : coins;

  return (
    <div style={{ overflowY: "auto", maxHeight: 420 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 8 }}>Coin</th>
            <th>Price</th>
            <th>24h</th>
            <th>Watch</th>
          </tr>
        </thead>
        <tbody>
          {listToRender.map(c => (
            <tr key={c.id} style={{ borderBottom: "1px solid #fafafa" }}>
              <td style={{ padding: 8, cursor: "pointer" }} onClick={() => onSelect(c.id)}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <img src={c.image} alt={c.symbol} width="22" height="22" style={{ borderRadius: 4 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{c.symbol.toUpperCase()}</div>
                  </div>
                </div>
              </td>
              <td style={{ textAlign: "right" }}>${Number(c.current_price).toLocaleString()}</td>
              <td style={{ textAlign: "right", color: c.price_change_percentage_24h >= 0 ? "green" : "red" }}>
                {c.price_change_percentage_24h?.toFixed(2)}%
              </td>
              <td style={{ textAlign: "center" }}>
                <button onClick={() => handleToggle(c.id)} aria-label={`toggle-watch-${c.id}`} style={{
                  padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", background: watchlist.includes(c.id) ? "#f0f8ff" : "white"
                }}>
                  {watchlist.includes(c.id) ? "✓" : "+"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
