// js/player.js — مشغّل يدعم HLS وMP4 وiframe مع تشخيص الأخطاء
const HLS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js";
let hlsPromise;
const loadHls = () => (hlsPromise ||= new Promise((ok, no) => {
  if (window.Hls) return ok(window.Hls);
  const s = document.createElement("script");
  s.src = HLS_CDN; s.onload = () => ok(window.Hls); s.onerror = () => no(new Error("hls.js"));
  document.head.appendChild(s);
}));

export const REASONS = {
  cors: "المزوّد لا يسمح بالتشغيل من موقعك (CORS: غياب ترويسة Access-Control-Allow-Origin). الحل: استضف الملف عندك أو استخدم Cloudflare R2/Bunny مع ضبط CORS، أو اطلب من المزوّد السماح بنطاقك.",
  mixed: "الرابط http داخل موقع https فيمنعه المتصفح. استخدم رابط https.",
  notfound: "الملف غير موجود أو انتهت صلاحية الرابط (404/403). تحقق من الرابط أو من التوقيع المؤقت.",
  codec: "المتصفح لا يدعم صيغة أو ترميز الملف. أعد الترميز إلى H.264 + AAC (MP4) أو HLS.",
  frame: "المزوّد يمنع التضمين داخل iframe (X-Frame-Options / CSP). استخدم زر «فتح عند المزوّد» أو مصدراً آخر.",
  timeout: "انتهت مهلة التحميل (20 ثانية) دون أن يبدأ الفيديو. قد يكون الخادم بطيئاً أو يحجب موقعك.",
  unknown: "تعذّر التشغيل لسبب غير محدد. افتح أدوات المطوّر (Network) لمعرفة السبب.",
};

export function createPlayer(box, src, onError = () => {}, onReady = () => {}) {
  box.innerHTML = "";
  let hls, timer, done = false;
  const fail = (k) => { if (done) return; done = true; clearTimeout(timer); onError(k, REASONS[k], src); };
  const ready = () => { if (done) return; done = true; clearTimeout(timer); onReady(); };
  if (location.protocol === "https:" && src.url.startsWith("http:")) { fail("mixed"); return { destroy() {} }; }

  if (src.type === "embed") {
    const f = document.createElement("iframe");
    f.src = src.url; f.allowFullscreen = true; f.loading = "lazy";
    f.allow = "autoplay; fullscreen; picture-in-picture";
    f.referrerPolicy = "no-referrer";
    box.appendChild(f);
    return { destroy() { f.remove(); } };
  }

  const v = document.createElement("video");
  v.controls = true; v.playsInline = true; v.preload = "metadata";
  box.appendChild(v);
  v.addEventListener("error", () => fail(v.error?.code === 4 ? "codec" : "unknown"));
  v.addEventListener("loadeddata", ready);
  timer = setTimeout(() => fail("timeout"), 20000);

  if (src.type === "mp4") { v.src = src.url; }
  else if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = src.url; } // Safari/iOS
  else loadHls().then((Hls) => {
    if (!Hls?.isSupported()) return fail("codec");
    hls = new Hls({ enableWorker: true });
    hls.loadSource(src.url); hls.attachMedia(v);
    hls.on(Hls.Events.ERROR, (_, d) => {
      if (!d.fatal) return;
      const code = d.response?.code;
      fail(code === 404 || code === 403 ? "notfound"
        : code === 0 || d.details === "manifestLoadError" ? "cors" : "unknown");
      hls.destroy();
    });
  }).catch(() => fail("unknown"));
  return { destroy() { done = true; clearTimeout(timer); hls?.destroy(); v.pause(); v.removeAttribute("src"); v.load(); v.remove(); } };
}
