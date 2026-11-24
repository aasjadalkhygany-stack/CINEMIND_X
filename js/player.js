function play(srcs, i = 0, auto = false) {
  cur?.destroy();
  const box = $("#player");
  if (!auto) $("#note").textContent = "";

  // Interstellar يفتح Albox مباشرة ويتجاوز كل المصادر القديمة
  if (type === "movie" && id === ALBOX_TEST_ID) {
    $("#srcs").innerHTML = "";
    $("#note").textContent = "مشاهدة Interstellar عبر Albox";

    box.innerHTML = `
      <iframe
        src="${ALBOX_TEST_URL}"
        title="Interstellar — Albox"
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin">
      </iframe>`;
    return;
  }

  if (!srcs.length) {
    $("#srcs").innerHTML = "";
    box.innerHTML = `<div class="msg">${esc(T.nosrc)}</div>`;
    return;
  }

  $("#srcs").innerHTML = srcs.map((s, n) =>
    `<button data-n="${n}" class="${n === i ? "on" : ""}">
      ${esc(s.label || T.src + " " + (n + 1))}
      ${s.quality ? " • " + esc(s.quality) : ""}
      • ${esc(s.type === "embed" ? T.embed : T.direct)}
    </button>`
  ).join("");

  $("#srcs").onclick = (e) => {
    const n = e.target.closest("button")?.dataset.n;
    if (n != null) play(srcs, +n);
  };

  cur = createPlayer(box, srcs[i], (k, why, s) => {
    if (i + 1 < srcs.length) {
      $("#note").textContent = T.next;
      play(srcs, i + 1, true);
      return;
    }
    $("#note").textContent = srcs.length > 1 ? T.allfail : "";
    box.innerHTML = `<div class="msg err">${esc(why)}<br>
      <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(T.open)}</a>
    </div>`;
  }, () => {
    if (auto) $("#note").textContent = "";
  });
}
