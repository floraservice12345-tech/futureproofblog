/* ============================================================
   FutureProof Blog — reader engagement module
   ------------------------------------------------------------
   Added 19 September 2026. Three things, all driven off
   /articles-index.json so nothing needs maintaining per article:

     1. Related articles  — 3 genuinely relevant pieces at the
        end of every article, scored on shared category and
        keyword overlap. This is the pages-per-session lever:
        a reader who reads two articles instead of one is worth
        roughly double in ad impressions and is far likelier to
        reach a service page.

     2. Table of contents — auto-built from the article's own
        H2s when there are 5 or more. Helps readers skim, helps
        dwell time, and gives Google jump-link candidates.

     3. Reading progress bar — a thin bar at the top. Cheap,
        and it measurably reduces mid-article drop-off.

   Safe everywhere: if there is no <main class="article-wrap">,
   or the fetch fails, it does nothing at all and throws nothing.
   ============================================================ */

(function () {
  "use strict";

  var main = document.querySelector("main.article-wrap");
  if (!main) return;

  /* ---------- shared styles ---------- */
  function injectStyle() {
    if (document.getElementById("fp-enhance-style")) return;
    var s = document.createElement("style");
    s.id = "fp-enhance-style";
    s.textContent = [
      /* progress bar */
      "#fp-progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;",
      "background:linear-gradient(90deg,#e94560,#ff7a90);transition:width .1s linear}",
      /* table of contents */
      ".fp-toc{background:#f8f9fc;border:1px solid #e3e6ee;border-left:4px solid #e94560;",
      "border-radius:10px;padding:18px 20px;margin:0 0 26px}",
      ".fp-toc h2{font-size:.82rem!important;text-transform:uppercase;letter-spacing:.09em;",
      "color:#0f3460!important;margin:0 0 10px!important;border:0!important;padding:0!important}",
      ".fp-toc ol{margin:0;padding-left:20px;color:#333}",
      ".fp-toc li{margin-bottom:5px;font-size:.93rem;line-height:1.5;text-align:left}",
      ".fp-toc a{color:#1a1a2e;text-decoration:none;border-bottom:1px solid transparent}",
      ".fp-toc a:hover{color:#e94560;border-bottom-color:#e94560}",
      /* related articles */
      ".fp-related{margin:2.6rem 0 0;padding-top:1.6rem;border-top:2px solid #eef0f6}",
      ".fp-related>h2{font-size:1.25rem!important;margin:0 0 4px!important;border:0!important;padding:0!important}",
      ".fp-related>p.fp-rsub{color:#666;font-size:.9rem;margin:0 0 16px;text-align:left}",
      ".fp-rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:14px}",
      ".fp-rcard{display:flex;flex-direction:column;background:#fff;border:1px solid #e3e6ee;",
      "border-radius:10px;padding:16px 16px 14px;text-decoration:none;transition:box-shadow .15s,transform .15s}",
      ".fp-rcard:hover{box-shadow:0 6px 18px rgba(0,0,0,.09);transform:translateY(-2px)}",
      ".fp-rcat{font-size:.66rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;",
      "color:#e94560;margin-bottom:7px}",
      ".fp-rtitle{font-size:.97rem;font-weight:700;color:#1a1a2e;line-height:1.35;margin-bottom:6px}",
      ".fp-rex{font-size:.82rem;color:#5a5f6e;line-height:1.55;flex:1;text-align:left}",
      ".fp-rmeta{font-size:.72rem;color:#999;margin-top:10px}",
      "@media(max-width:768px){.fp-rgrid{grid-template-columns:1fr}",
      ".fp-toc li{font-size:15px}.fp-rtitle{font-size:16px}.fp-rex{font-size:14px}}"
    ].join("");
    document.head.appendChild(s);
  }

  /* ---------- 1. reading progress ---------- */
  function progressBar() {
    var bar = document.createElement("div");
    bar.id = "fp-progress";
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var rect = main.getBoundingClientRect();
      var total = main.offsetHeight - window.innerHeight;
      var done = -rect.top;
      var pct = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
      bar.style.width = pct + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- 2. table of contents ---------- */
  function slug(t) {
    return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
  }
  function tableOfContents() {
    var heads = [].slice.call(main.querySelectorAll("h2"))
      .filter(function (h) {
        var t = (h.textContent || "").trim();
        return t && !/frequently asked questions/i.test(t) && !h.closest(".fp-toc") && !h.closest(".fp-related");
      });
    if (heads.length < 5) return;

    var ol = document.createElement("ol");
    heads.forEach(function (h) {
      if (!h.id) h.id = slug(h.textContent);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = (h.textContent || "").trim();
      li.appendChild(a);
      ol.appendChild(li);
    });

    var box = document.createElement("nav");
    box.className = "fp-toc";
    box.setAttribute("aria-label", "Table of contents");
    var h2 = document.createElement("h2");
    h2.textContent = "In this article";
    box.appendChild(h2);
    box.appendChild(ol);

    // place it just before the first H2 so the intro is read first
    heads[0].parentNode.insertBefore(box, heads[0]);
  }

  /* ---------- 3. related articles ---------- */
  function norm(u) {
    if (!u) return "";
    return u.replace(/^https?:\/\/[^/]+/, "").split("#")[0].split("?")[0]
             .replace(/\.html$/i, "").replace(/\/$/, "").toLowerCase();
  }
  function tokens(s) {
    return (s || "").toLowerCase().split(/[^a-z0-9]+/).filter(function (w) {
      return w.length > 3 && ["with","that","this","from","your","what","which","have",
        "2026","2025","india","indian","best","guide","about","more","than","will"].indexOf(w) === -1;
    });
  }
  function relatedArticles() {
    fetch("/articles-index.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.articles) return;
        var here = norm(location.pathname);
        var meCat = (document.querySelector(".article-hero .tag, .article-hero .art-category") || {}).textContent || "";
        meCat = meCat.trim().toLowerCase();
        var title = (document.querySelector("h1") || {}).textContent || "";
        var kwEl = document.querySelector('meta[name="keywords"]');
        var mine = tokens(title + " " + (kwEl ? kwEl.content : ""));

        var scored = data.articles
          .filter(function (a) { return norm(a.url) !== here; })
          .map(function (a) {
            var s = 0;
            var cat = (a.tags && a.tags[0] ? a.tags[0] : "").toLowerCase();
            if (cat && cat === meCat) s += 5;
            var theirs = tokens(a.title + " " + (a.keywords || ""));
            var seen = {};
            theirs.forEach(function (w) {
              if (!seen[w] && mine.indexOf(w) !== -1) { seen[w] = 1; s += 2; }
            });
            // recency is only a tie-breaker between already-relevant pieces,
            // never enough on its own to surface something unrelated
            if (s >= 4 && a.date) {
              var days = (Date.now() - Date.parse(a.date)) / 86400000;
              if (days < 30) s += 1.5; else if (days < 90) s += 0.5;
            }
            return { a: a, s: s };
          })
          .filter(function (x) { return x.s >= 4; })
          .sort(function (x, y) { return y.s - x.s; })
          .slice(0, 3);

        if (scored.length < 2) return;

        var wrap = document.createElement("section");
        wrap.className = "fp-related";
        var h = document.createElement("h2");
        h.textContent = "Read next";
        var sub = document.createElement("p");
        sub.className = "fp-rsub";
        sub.textContent = "Picked from the archive because they cover the same ground.";
        var grid = document.createElement("div");
        grid.className = "fp-rgrid";

        scored.forEach(function (x) {
          var a = x.a;
          var card = document.createElement("a");
          card.className = "fp-rcard";
          card.href = a.url;
          var cat = document.createElement("div");
          cat.className = "fp-rcat";
          cat.textContent = (a.tags && a.tags[0]) ? a.tags[0] : "Article";
          var t = document.createElement("div");
          t.className = "fp-rtitle";
          t.textContent = a.title;
          var ex = document.createElement("div");
          ex.className = "fp-rex";
          ex.textContent = (a.excerpt || "").slice(0, 118);
          var mt = document.createElement("div");
          mt.className = "fp-rmeta";
          mt.textContent = (a.readTime || "") + (a.date ? " · " + a.date.split("-").reverse().join("/") : "");
          card.appendChild(cat); card.appendChild(t); card.appendChild(ex); card.appendChild(mt);
          card.addEventListener("click", function () {
            if (window.gtag) gtag("event", "related_click", { link_url: a.url, from: location.pathname });
          });
          grid.appendChild(card);
        });

        wrap.appendChild(h); wrap.appendChild(sub); wrap.appendChild(grid);
        main.appendChild(wrap);
      })
      .catch(function () { /* silent — never break the page */ });
  }

  try {
    injectStyle();
    progressBar();
    tableOfContents();
    relatedArticles();
  } catch (e) { /* silent */ }
})();
