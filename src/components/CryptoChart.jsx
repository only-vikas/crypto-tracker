import React, { useEffect, useState, useRef } from "react";
import { fetchMarketChart } from "../api/coingecko";


import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend
);

const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "180D", days: 180 },
  { label: "1Y", days: 365 },
  { label: "MAX", days: "max" }
];

export default function CryptoChart({ coinId }) {
  const [days, setDays] = useState(1);
  const [dataPoints, setDataPoints] = useState({ labels: [], prices: [] });
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!coinId) return;

    const loadChart = async () => {
      setLoading(true);
      try {
        const data = await fetchMarketChart(coinId, days);
        const labels = data.prices.map((p) => p[0]);
        const prices = data.prices.map((p) => p[1]);
        const volumes = (data.total_volumes || []).map(v => v[1] || 0);
        setDataPoints({ labels, prices, volumes });
      } catch (err) {
        console.error("Chart error:", err);
      }
      setLoading(false);
    };

    loadChart();
  }, [coinId, days]);

  const chartData = {
    labels: dataPoints.labels.map((t) => new Date(t)),
    datasets: [
      {
        data: dataPoints.prices,
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        borderColor: dark ? "#7dd3fc" : "#0066ff",
        backgroundColor: dark ? "rgba(125,211,252,0.08)" : "rgba(0,102,255,0.06)"
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: (items) => {
            if (!items || !items.length) return "";
            const d = items[0].label || items[0].parsed.x || items[0].parsed;
            return new Date(d).toLocaleString();
          },
          label: (context) => {
            const v = context.parsed.y;
            const idx = context.dataIndex;
            const vol = dataPoints.volumes ? dataPoints.volumes[idx] : undefined;
            const price = formatPrice(v);
            const volStr = vol !== undefined ? ` Vol: ${formatCompactNumber(vol)}` : "";
            return `${context.dataset.label || 'Price'}: ${price}${volStr}`;
          }
        }
      }
    },
    scales: {
      x: { type: "time", time: { unit: days === 1 ? "hour" : "day" } },
      y: {
        ticks: {
          callback: (v) => formatCompactNumber(v)
        }
      }
    }
  };

  function formatCompactNumber(value) {
    if (typeof value !== 'number') value = Number(value) || 0;
    const abs = Math.abs(value);
    if (abs >= 1e9) return "$" + (value / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return "$" + (value / 1e6).toFixed(1) + "M";
    if (abs >= 1e3) return "$" + (value / 1e3).toFixed(1) + "k";
    // dynamic decimals for small values
    if (abs < 1) return "$" + value.toFixed(4);
    if (abs < 100) return "$" + value.toFixed(2);
    return "$" + Math.round(value).toLocaleString();
  }

  function formatPrice(v) {
    if (Math.abs(v) < 1) return "$" + v.toFixed(6);
    if (Math.abs(v) < 100) return "$" + v.toFixed(4);
    return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return (
    <div className={`chart-card ${dark ? 'dark' : 'light'}`} style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8, alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TIMEFRAMES.map((t) => (
            <button key={t.label} onClick={() => setDays(t.days)} style={{ padding: '6px 8px', borderRadius: 8, fontSize: 12, background: days === t.days ? (dark ? '#0f172a' : '#111827') : 'transparent', color: days === t.days ? '#fff' : (dark ? '#d1d5db' : '#111') }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: dark ? '#cbd5e1' : '#374151' }}>• {days} day{days !== 1 ? 's' : ''}</div>
        <button onClick={() => {
          // export chart image
          try {
            const ch = chartRef.current && (chartRef.current.toBase64Image ? chartRef.current : chartRef.current.chartInstance);
            const url = ch && ch.toBase64Image ? ch.toBase64Image() : null;
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = `chart-${Date.now()}.png`;
              a.click();
            }
          } catch (err) { console.error(err); }
        }} style={{ padding: '6px 8px', borderRadius: 8 }}>Export</button>
        <button onClick={() => setDark(d => !d)} style={{ padding: '6px 8px', borderRadius: 8 }}>{dark ? 'Light' : 'Dark'}</button>
      </div>

      {/* TIMEFRAME BUTTONS (spacer) */}
      <div style={{ height: 12 }} />

      {/* CHART */}
      <div className="chart-container" style={{ position: 'relative' }}>
        {loading ? (
          <div className="skeleton" style={{ height: '100%' }} />
        ) : (
          <Line ref={chartRef} data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
