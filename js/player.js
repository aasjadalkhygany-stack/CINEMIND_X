
const HLS_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js";

let hlsPromise;

const loadHls = () => {
  if (window.Hls) return Promise.resolve(window.Hls);

  if (!hlsPromise) {
    hlsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = HLS_CDN;
      script.onload = () => resolve(window.Hls);
      script.onerror = () => reject(new Error("تعذر تحميل مشغل HLS"));
      document.head.appendChild(script);
    });
  }

  return hlsPromise;
};

export const REASONS = {
  cors: "السيرفر لا يسمح بالتشغيل من موقعنا. جرّب مصدرًا يسمح بالتضمين.",
  mixed: "الرابط غير آمن؛ استخدم رابط HTTPS.",
  notfound: "الفيديو غير موجود أو الرابط منتهي الصلاحية.",
  codec: "صيغة الفيديو غير مدعومة في هذا المتصفح.",
  frame: "الموقع يمنع عرض الفيديو داخل مشغل مضمّن.",
  unknown: "تعذر تشغيل الفيديو. تحقق من الرابط أو جرّب مصدرًا آخر."
};

export function createPlayer(box, src, onError = () => {}) {
  box.innerHTML = "";

  let hls;
  let destroyed = false;

  const fail = (reason) => {
    if (!destroyed) {
      onError(reason, REASONS[reason] || REASONS.unknown, src);
    }
  };

  if (!src?.url || !src?.type) {
    fail("notfound");
    return { destroy() { destroyed = true; } };
  }

  if (
    location.protocol === "https:" &&
    src.url.startsWith("http:")
  ) {
    fail("mixed");
    return { destroy() { destroyed = true; } };
  }

  if (src.type === "embed") {
    const frame = document.createElement("iframe");
    frame.src = src.url;
    frame.allowFullscreen = true;
    frame.loading = "lazy";
    frame.allow = "autoplay; fullscreen; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.style.width = "100%";
    frame.style.height = "100%";
    frame.style.border = "0";

    box.appendChild(frame);

    return {
      destroy() {
        destroyed = true;
        frame.remove();
      }
    };
  }

  const video = document.createElement("video");
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.background = "#000";

  box.appendChild(video);

  video.addEventListener("error", () => {
    const code = video.error?.code;
    fail(code === 4 ? "codec" : "unknown");
  });

  if (src.type === "mp4") {
    video.src = src.url;
  } else if (src.type === "hls") {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src.url;
    } else {
      loadHls().then((Hls) => {
        if (destroyed) return;

        if (!Hls?.isSupported()) {
          fail("codec");
          return;
        }

        hls = new Hls();
        hls.loadSource(src.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;

          const status = data.response?.code;

          fail(
            status === 403 || status === 404
              ? "notfound"
              : data.details === "manifestLoadError"
                ? "cors"
                : "unknown"
          );

          hls.destroy();
        });
      }).catch(() => fail("unknown"));
    }
  } else {
    fail("codec");
  }

  return {
    destroy() {
      destroyed = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    }
  };
}
