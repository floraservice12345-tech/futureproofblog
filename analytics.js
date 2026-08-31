/* ============================================================
   FutureProof Blog — analytics loader
   ------------------------------------------------------------
   ACTIVE. GA4 Measurement ID is set below (property
   "FutureProof Blog" / futureproofblog.in).
   To change it later, edit the one line and re-upload
   THIS FILE ONLY — all 51 pages read from here.
   ============================================================ */

var GA4_MEASUREMENT_ID = "G-BXCSZN56NT";   // <-- the only line to ever change

(function () {
  if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID.indexOf("XXXX") !== -1) {
    return; // not configured yet — loads nothing, breaks nothing
  }
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID, { anonymize_ip: true });

  // Track outbound affiliate clicks so you can see what actually earns
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !a.href) return;
    if (a.href.indexOf("amazon.in") !== -1) {
      gtag("event", "affiliate_click", {
        link_url: a.href,
        link_text: (a.textContent || "").trim().slice(0, 80),
        page_path: location.pathname
      });
    }
  }, true);
})();
