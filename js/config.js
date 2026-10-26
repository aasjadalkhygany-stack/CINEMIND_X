
const ls = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const LANGUAGES = {
  ar: "ar",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  tr: "tr-TR",
  fa: "fa-IR"
};

const savedLanguage = ls("cm-lang");
const ui = LANGUAGES[savedLanguage] ? savedLanguage : "ar";

export const CONFIG = {
  tmdbKey: ls("cm-key") || "14169778c1429a0057cc2e019e83b463",
  tmdbProxy: "",
  ui,
  lang: LANGUAGES[ui],
  img: "https://image.tmdb.org/t/p/",
  sourcesUrl: "./data/sources.json"
};
