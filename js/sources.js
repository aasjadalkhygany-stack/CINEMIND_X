
const LS_KEY = "cinemind.sources.v1";

export const TYPES = ["hls", "mp4", "embed"];

export const keyOf = (type, id, season, episode) => {
  if (type === "movie") return `movie:${id}`;
  if (season != null && episode != null) {
    return `tv:${id}:${season}:${episode}`;
  }
  return `tv:${id}`;
};

export class SourceStore {
  constructor({
    storage = globalThis.localStorage,
    fetchFn = globalThis.fetch
  } = {}) {
    this.storage = storage;
    this.fetchFn = fetchFn;
    this.items = {};
  }

  async load(url) {
    let base = {};

    try {
      const response = await this.fetchFn(url);
      if (response.ok) {
        base = (await response.json()).items || {};
      }
    } catch (error) {
      console.warn("تعذر تحميل مصادر الفيديو:", error);
    }

    try {
      const local = JSON.parse(
        this.storage?.getItem(LS_KEY) || "null"
      );
      this.items = local || base;
    } catch {
      this.items = base;
    }

    return this;
  }

  _save() {
    try {
      this.storage?.setItem(LS_KEY, JSON.stringify(this.items));
    } catch (error) {
      console.warn("تعذر حفظ مصادر الفيديو:", error);
    }
  }

  list(key) {
    return this.items[key] || [];
  }

  add(key, { type, url, label = "", quality = "" }) {
    if (!TYPES.includes(type)) {
      throw new Error("نوع المصدر غير مدعوم");
    }

    if (!/^https:\/\//i.test(url)) {
      throw new Error("الرابط يجب أن يبدأ بـ https://");
    }

    const source = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      url,
      label,
      quality
    };

    (this.items[key] ||= []).push(source);
    this._save();

    return source;
  }

  update(key, id, patch) {
    const source = this.list(key).find(item => item.id === id);

    if (!source) throw new Error("المصدر غير موجود");
    if (patch.type && !TYPES.includes(patch.type)) {
      throw new Error("نوع المصدر غير مدعوم");
    }

    Object.assign(source, patch);
    this._save();

    return source;
  }

  remove(key, id) {
    this.items[key] = this.list(key).filter(
      item => item.id !== id
    );

    if (!this.items[key].length) {
      delete this.items[key];
    }

    this._save();
  }

  replaceBase(oldBase, newBase) {
    let count = 0;

    for (const sources of Object.values(this.items)) {
      for (const source of sources) {
        if (source.url.startsWith(oldBase)) {
          source.url =
            newBase + source.url.slice(oldBase.length);
          count++;
        }
      }
    }

    this._save();
    return count;
  }

  resolve(type, id, season, episode) {
    const own = this.list(
      keyOf(type, id, season, episode)
    );

    if (own.length) return own;

    return type === "tv"
      ? this.list(keyOf("tv", id))
      : [];
  }

  exportJSON() {
    return JSON.stringify({ items: this.items }, null, 2);
  }

  importJSON(text) {
    this.items = JSON.parse(text).items || {};
    this._save();
  }

  reset() {
    this.storage?.removeItem(LS_KEY);
  }
}
