// CINEMIND_X — اكتشاف نسخ مجانية مفتوحة الترخيص من Internet Archive
// لا يضيف إلا نسخة تطابق اسم العمل وسنة الإصدار، وبعد فحص بيانات الترخيص في صفحة العنصر.
const API = "https://archive.org";

const normalize = (value = "") => String(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function allowedLicense(value = "") {
  const u = String(value).toLowerCase();
  return u.includes("creativecommons.org/publicdomain/mark") ||
    u.includes("creativecommons.org/publicdomain/zero") ||
    /creativecommons\.org\/licenses\/(by|by-sa|by-nd)\//.test(u);
}

export async function findFreeArchiveMovie(title, year) {
  if (!title || !/^\d{4}$/.test(String(year || ""))) return null;
  const q = `title:"${String(title).replace(/["\\]/g, "")}" AND year:${year} AND mediatype:movies`;
  const params = new URLSearchParams({ q, output: "json", rows: "8" });
  for (const field of ["identifier", "title", "year"]) params.append("fl[]", field);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const search = await fetch(`${API}/advancedsearch.php?${params}`, { signal: controller.signal });
    if (!search.ok) return null;
    const payload = await search.json();
    const docs = payload?.response?.docs || [];
    const wanted = normalize(title);
    for (const doc of docs) {
      if (!doc.identifier || Number(doc.year) !== Number(year)) continue;
      if (normalize(doc.title).replace(new RegExp(`\\s*${year}\\s*$`), "").trim() !== wanted) continue;
      const metaRes = await fetch(`${API}/metadata/${encodeURIComponent(doc.identifier)}`, { signal: controller.signal });
      if (!metaRes.ok) continue;
      const meta = await metaRes.json();
      const license = meta?.metadata?.licenseurl || meta?.metadata?.license_url || "";
      if (!allowedLicense(license)) continue;
      return {
        type: "embed",
        url: `${API}/embed/${encodeURIComponent(doc.identifier)}`,
        label: "Internet Archive · نسخة بترخيص مفتوح",
        quality: "حسب النسخة المتاحة",
        licenseUrl: license,
        pageUrl: `${API}/details/${encodeURIComponent(doc.identifier)}`
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
