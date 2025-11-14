// src/components/CryptoChart.jsx
import React, { useEffect, useState, useRef } from "react";
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
import 'chartjs-adapter-date-fns';
import { fetchChart } from "../api/coingecko";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

export default function CryptoChart({ coinId, days = 1, pollIntervalMs = 15000 }) {
  const [dataPoints, setDataPoints] = useState({ labels: [], prices: [] });
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!coinId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchChart(coinId, { days });
        // Convert to unix ms -> Chart.js time scale accepts Date/number
        const labels = res.prices.map(p => p[0]);
        const prices = res.prices.map(p => p[1]);
        if (mounted) setDataPoints({ labels, prices });
      } catch (err) {
        console.error("Chart load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    // polling: fetch latest price and append (keep last N points)
    if (pollIntervalMs > 0) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetchChart(coinId, { days: 0.02 }); // small window to get recent ticks (approx)
          const latest = res.prices[res.prices.length - 1];
          if (!latest) return;
          setDataPoints(prev => {
            const labels = [...prev.labels, latest[0]].slice(-240);
            const prices = [...prev.prices, latest[1]].slice(-240);
            return { labels, prices };
          });
        } catch (e) { /* ignore transient */ }
      }, pollIntervalMs);
    }

    return () => { mounted = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, [coinId, days, pollIntervalMs]);

  if (!coinId) return <div style={{ padding: 12 }}>Select a coin to see chart.</div>;
  if (loading) return <div style={{ padding: 12 }}>Loading chart…</div>;

  const chartData = {
    labels: dataPoints.labels.map(t => new Date(t)),
    datasets: [{
      label: `${coinId} price (USD)`,
      data: dataPoints.prices,
      fill: false,
      tension: 0.15,
      pointRadius: 0,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { type: 'time', time: { unit: days >= 7 ? 'day' : 'hour', tooltipFormat: 'PPpp' }, ticks: { maxTicksLimit: 8 } },
      y: { ticks: { callback: val => `$${Number(val).toLocaleString()}` } }
    },
  };

  return (
    <div style={{ height: 320 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
