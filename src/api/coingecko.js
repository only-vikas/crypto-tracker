import axios from "axios";

const API = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

export async function fetchMarkets(options = {}) {
  const { vs_currency = "usd", per_page = 50, ids = null, page = 1, order = "market_cap_desc" } = options;
  const params = {
    vs_currency,
    per_page,
    page,
    order
  };
  if (ids) params.ids = ids;
  
  const res = await API.get("/coins/markets", { params });
  return res.data;
}

export async function fetchMarketChart(id, days = 7) {
  const res = await API.get(`/coins/${id}/market_chart`, {
    params: {
      vs_currency: "usd",
      days: days
    }
  });
  return res.data;
}

export async function searchCoins(query) {
  const res = await API.get("/search", {
    params: { query }
  });
  return res.data;
}
