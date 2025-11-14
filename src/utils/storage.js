// src/utils/storage.js
const WATCH_KEY = "crypto_watchlist_v1";

export const loadWatchlist = () => {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveWatchlist = (list = []) => {
  try {
    localStorage.setItem(WATCH_KEY, JSON.stringify(list));
  } catch {}
};

export const toggleWatch = (id) => {
  const list = loadWatchlist();
  const exists = list.includes(id);
  const updated = exists ? list.filter(x => x !== id) : [...list, id];
  saveWatchlist(updated);
  return updated;
};
