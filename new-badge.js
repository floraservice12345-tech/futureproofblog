/* ============================================================
   FutureProof Blog — "New" badge for recently published articles
   ------------------------------------------------------------
   Reads /articles-index.json (the same data file /search runs on)
   and stamps a small "New" pill onto any .art-card whose article
   was published within the last few days. Fully automatic: every
   article gets flagged the moment it's added to
   articles-index.json (already a required publish step) and the
   badge disappears on its own once the window passes — no manual
   step, nothing to remember, nothing to go stale.

   Safe to include on any page: if there are no .art-card elements,
   or the fetch fails, it quietly does nothing.
   ============================================================ */

(function () {
  var NEW_WINDOW_DAYS = 4;

  function daysAgo(dateStr) {
    var parsed = Date.parse(dateStr);
    if (isNaN(parsed)) return Infinity;
    var diffMs = Date.now() - parsed;
    return diffMs / (1000 * 60 * 60 * 24);
  }

  function injectStyle() {
    if (document.getElementById("fp-new-badge-style")) return;
    var style = document.createElement("style");
    style.id = "fp-new-badge-style";
    style.textContent =
      ".fp-new-badge{display:inline-block;background:#e94560;color:#fff;" +
      "font-size:.68rem;font-weight:800;letter-spacing:.05em;padding:3px 10px;" +
      "border-radius:20px;text-transform:uppercase;margin-bottom:8px;" +
      "pointer-events:none}";
    document.head.appendChild(style);
  }

  function normalize(href) {
    if (!href) return "";
    // strip domain if present, strip query/hash, strip trailing slash
    try {
      href = href.replace(/^https?:\/\/[^/]+/, "");
    } catch (e) {}
    href = href.split("#")[0].split("?")[0];
    if (href.length > 1 && href.endsWith("/")) href = href.slice(0, -1);
    return href;
  }

  function apply(articles) {
    var byUrl = {};
    articles.forEach(function (a) {
      byUrl[normalize(a.url)] = a;
    });
    var cards = document.querySelectorAll(".art-card[href]");
    if (!cards.length) return;
    var stamped = 0;
    cards.forEach(function (card) {
      var url = normalize(card.getAttribute("href"));
      var article = byUrl[url];
      if (!article || !article.date) return;
      if (daysAgo(article.date) > NEW_WINDOW_DAYS) return;
      if (card.querySelector(".fp-new-badge")) return;
      var body = card.querySelector(".art-body") || card;
      injectStyle();
      var badge = document.createElement("span");
      badge.className = "fp-new-badge";
      badge.textContent = "🆕 New";
      // Insert in the normal document flow, above whatever is already first
      // (the category tag on this site's cards, itself a block element that
      // will naturally wrap to its own line) so it can never overlap text or
      // an image regardless of which card layout is in use.
      body.insertBefore(badge, body.firstChild);
      stamped++;
    });
  }

  function init() {
    fetch("/articles-index.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        apply(data.articles || []);
      })
      .catch(function () {
        /* search still works without this; fail silently */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
