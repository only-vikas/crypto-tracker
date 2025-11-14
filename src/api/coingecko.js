// src/api/coingecko.js
import axios from "axios";
const API = axios.create({ baseURL: "https://api.coingecko.com/api/v3", timeout: 10000 });

export async function fetchMarkets({ vs_currency = "usd", per_page = 50, page = 1, ids = "" } = {}) {
  const res = await API.get("/coins/markets", {
    params: { vs_currency, order: "market_cap_desc", per_page, page, ids, price_change_percentage: "24h" }
  });
  return res.data;
}

export async function fetchChart(id, { vs_currency = "usd", days = 1, interval = "minute" } = {}) {
  const res = await API.get(`/coins/${id}/market_chart`, { params: { vs_currency, days, interval }});
  return res.data; // prices: [[ts, price], ...]
}

export async function searchCoins(query) {
  const res = await API.get("/search", { params: { query }});
  return res.data; // contains coins array with id, name, symbol
}
