
import { CONFIG } from "./config.js";

const cache = new Map();

export async function tmdb(path, params = {}) {
  const base = CONFIG.tmdbProxy || "https://api.themoviedb.org/3";
  const query = new URLSearchParams({
    language: CONFIG.lang,
    ...params
  });

  if (!CONFIG.tmdbProxy) {
    query.set("api_key", CONFIG.tmdbKey);
  }

  const url = `${base}${path}?${query}`;

  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}

const videoOptions = {
  append_to_response: "videos",
  include_video_language: `en,${CONFIG.lang.slice(0, 2)}`
};

export const getMovie = (id) =>
  tmdb(`/movie/${id}`, videoOptions);

export const getShow = (id) =>
  tmdb(`/tv/${id}`, videoOptions);

export async function findId(type, query, year) {
  const params = { query };

  if (year) {
    params[type === "tv" ? "first_air_date_year" : "year"] = year;
  }

  const result = await tmdb(`/search/${type}`, params);
  return result.results?.[0]?.id || null;
}

export const getSeason = (id, number) =>
  tmdb(`/tv/${id}/season/${number}`);

export const poster = (path, size = "w342") =>
  path ? `${CONFIG.img}${size}${path}` : "";
