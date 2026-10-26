// js/tmdb.js — جلب بيانات الأفلام والمسلسلات (منفصل تماماً عن مصادر الفيديو)
import { CONFIG } from "./config.js";

const cache = new Map();

export async function tmdb(path, params = {}) {
  const base = CONFIG.tmdbProxy || "https://api.themoviedb.org/3";
  const q = new URLSearchParams({ language: CONFIG.lang, ...params });
  if (!CONFIG.tmdbProxy) q.set("api_key", CONFIG.tmdbKey);
  const url = `${base}${path}?${q}`;
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

const vid = { append_to_response: "videos,watch/providers", include_video_language: "en," + CONFIG.lang.slice(0, 2) };
export const getMovie = (id) => tmdb(`/movie/${id}`, vid);
export const getShow = (id) => tmdb(`/tv/${id}`, vid);
export async function findId(type, query, year) {
  const p = { query };
  if (year) p[type === "tv" ? "first_air_date_year" : "year"] = year;
  const r = (await tmdb(`/search/${type}`, p)).results || [];
  return r[0]?.id || null;
}
export const getSeason = (id, n) => tmdb(`/tv/${id}/season/${n}`);
export const poster = (p, size = "w342") => (p ? `${CONFIG.img}${size}${p}` : "");
