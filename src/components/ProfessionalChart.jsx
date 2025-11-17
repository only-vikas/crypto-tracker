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

export default function ProfessionalChart({ coinId }) {
  const [days, setDays] = useState(7);
  const [dataPoints, setDataPoints] = useState({ labels: [], prices: [] });
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!coinId) return;

    const loadChart = async () => {
      setLoading(true);
      try {
        const data = await fetchMarketChart(coinId, days);
        const labels = data.prices.map((p) => p[0]);
        const prices = data.prices.map((p) => p[1]);
        setDataPoints({ labels, prices });
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
        label: 'Price',
        data: dataPoints.prices,
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        borderColor: "#0066ff",
        backgroundColor: "rgba(0,102,255,0.06)"
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
            return `Price: $${v.toFixed(6)}`;
          }
        }
      }
    },
    scales: {
      x: { type: "time", time: { unit: days === 1 ? "hour" : "day" } },
      y: {
        ticks: {
          callback: (v) => `$${v.toFixed(2)}`
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8, alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TIMEFRAMES.map((t) => (
            <button 
              key={t.label} 
              onClick={() => setDays(t.days)} 
              style={{
                padding: '6px 8px', 
                borderRadius: 8, 
                fontSize: 12, 
                background: days === t.days ? '#111827' : 'transparent', 
                color: days === t.days ? '#fff' : '#111',
                border: '1px solid #ddd'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', height: 400 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#999' }}>
            Loading chart...
          </div>
        ) : (
          <Line ref={chartRef} data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
