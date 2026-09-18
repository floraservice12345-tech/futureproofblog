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


/* ============================================================
   Meta (Facebook / Instagram) Pixel
   ------------------------------------------------------------
   Added 18 Sep 2026 so Meta ads can measure which clicks turn
   into real enquiries, instead of only counting traffic.

   TO TURN IT ON: create the pixel in Meta Events Manager, copy
   its numeric ID, and paste it into the one line below. Until
   then this block loads nothing at all and breaks nothing.

   A Pixel ID is NOT a secret — it is visible in the page source
   of every site that runs one, by design. It identifies an ad
   account's dataset; it grants no access. Safe to commit here.

   What it reports back to Meta once live:
     PageView      every page
     ViewContent   the two pages that sell something
                   (/resume, /hire-me)
     Lead          an enquiry form actually submitted
   ============================================================ */

var META_PIXEL_ID = "";   // <-- the only line to ever change

(function () {
  if (!META_PIXEL_ID) return;   // not configured yet

  // --- Meta base code (standard fbq snippet) ---
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');

  // --- ViewContent on the pages that actually sell ---
  var p = location.pathname.replace(/\/+$/, '').toLowerCase();
  if (p === '/resume' || p === '/resume.html') {
    fbq('track', 'ViewContent', { content_name: 'Resume rewrite service', content_category: 'resume' });
  } else if (p === '/hire-me' || p === '/hire-me.html') {
    fbq('track', 'ViewContent', { content_name: 'Hire me services', content_category: 'services' });
  }

  // --- Lead when an enquiry form is genuinely submitted ---
  var LEAD_FORMS = { 'resume-brief': 'resume', 'project-brief': 'project', 'contact': 'contact' };
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.getAttribute) return;
    var name = form.getAttribute('name');
    if (!LEAD_FORMS[name]) return;
    fbq('track', 'Lead', { content_category: LEAD_FORMS[name], content_name: name });
    if (window.gtag) {
      gtag('event', 'generate_lead', { form_name: name, page_path: location.pathname });
    }
  }, true);

  // --- thank-you pages count as a confirmed lead too ---
  if (p.indexOf('/thank-you-brief') === 0) {
    fbq('track', 'Lead', { content_category: 'brief-confirmed', content_name: 'thank-you-brief' });
  }
})();
