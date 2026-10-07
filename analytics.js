/* ============================================================
   FutureProof Blog — analytics loader
   ------------------------------------------------------------
   ACTIVE. GA4 Measurement ID is set below (property
   "FutureProof Blog" / futureproofblog.in).
   To change it later, edit the one line and re-upload
   THIS FILE ONLY — all 51 pages read from here.
   ============================================================ */

var GA4_MEASUREMENT_ID = "G-BXCSZN56NT";   // <-- the only line to ever change

// A thank-you page is a lead only when reached from a form submitted in this tab.
var FP_LEAD_ROUTES = {
  '/thank-you-brief': 'project-brief',
  '/thank-you-quick': 'quick-service-request',
  '/thank-you-resume': 'resume-brief',
  '/thank-you-contact': 'contact'
};
// Keep the acquisition source through internal navigation and include it in
// the enquiry notification. The October offer may already occupy this field.
var FP_LEAD_SOURCE = (function () {
  try {
    var params = new URLSearchParams(location.search);
    var parts = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(function (key) {
      return (params.get(key) || '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 60);
    });
    if (parts.some(Boolean)) {
      var source = parts.join('/');
      sessionStorage.setItem('fp_lead_source', source);
      return source;
    }
    return sessionStorage.getItem('fp_lead_source') || '';
  } catch (_) { return ''; }
})();
document.addEventListener('submit', function (event) {
  var name = event.target && event.target.getAttribute && event.target.getAttribute('name');
  if (Object.keys(FP_LEAD_ROUTES).some(function (route) { return FP_LEAD_ROUTES[route] === name; })) {
    var campaign = event.target.querySelector('input[name="campaign"]');
    if (campaign && FP_LEAD_SOURCE && campaign.value.indexOf(FP_LEAD_SOURCE) === -1) {
      campaign.value = [campaign.value, FP_LEAD_SOURCE].filter(Boolean).join(' | ');
    }
    try { sessionStorage.setItem('fp_pending_lead', JSON.stringify({ name: name, at: Date.now() })); } catch (_) {}
  }
}, true);
var FP_CONFIRMED_FORM = (function () {
  var page = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
  var expected = FP_LEAD_ROUTES[page];
  if (!expected) return '';
  try {
    var pending = JSON.parse(sessionStorage.getItem('fp_pending_lead') || '{}');
    sessionStorage.removeItem('fp_pending_lead');
    if (pending.name === expected && Date.now() - pending.at < 600000) return expected;
  } catch (_) {}
  return '';
})();
window.addEventListener('fp:form-sent', function () {
  try { sessionStorage.removeItem('fp_pending_lead'); } catch (_) {}
});

(function () {
  if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID.indexOf("XXXX") !== -1) {
    return; // not configured yet — loads nothing, breaks nothing
  }
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  function savedConsent() {
    try {
      var value = localStorage.getItem('fp_cookie_consent');
      if (value === 'accepted' || value === 'declined') return value;
      value = localStorage.getItem('fpb_cookies_accepted');
      if (value === '1') return 'accepted';
      if (value === 'declined') return 'declined';
      value = localStorage.getItem('c');
      if (value === '1') return 'accepted';
      if (value === '0') return 'declined';
    } catch (_) {}
    return '';
  }
  function consentState(choice) {
    var granted = choice === 'accepted' ? 'granted' : 'denied';
    return { analytics_storage: granted, ad_storage: granted,
      ad_user_data: 'denied', ad_personalization: 'denied' };
  }
  var existingChoice = savedConsent();
  gtag('consent', 'default', consentState(existingChoice));
  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID, { anonymize_ip: true });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
  document.head.appendChild(s);

  // Article and site banners share one remembered choice. A decline now
  // changes tag consent instead of merely hiding a banner.
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('button');
    var banner = button && button.closest('#cb, #ck, #fpb-cookie-banner, .cookie-banner');
    if (!banner) return;
    var label = (button.textContent || '').trim().toLowerCase();
    var choice = /accept|allow/.test(label) ? 'accepted' :
      /decline|reject/.test(label) ? 'declined' : '';
    if (!choice) return;
    try {
      localStorage.setItem('fp_cookie_consent', choice);
      localStorage.setItem('fpb_cookies_accepted', choice === 'accepted' ? '1' : 'declined');
      localStorage.setItem('c', choice === 'accepted' ? '1' : '0');
    } catch (_) {}
    gtag('consent', 'update', consentState(choice));
    banner.style.display = 'none';
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    if (!savedConsent()) return;
    document.querySelectorAll('#cb, #ck, #fpb-cookie-banner, .cookie-banner').forEach(function (banner) {
      banner.style.display = 'none';
    });
  });

  // Track outbound affiliate clicks so you can see what actually earns
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a || !a.href) return;
    if (a.dataset.trackShare) {
      gtag('event', 'share', { method: a.dataset.trackShare,
        content_type: 'article', item_id: location.pathname });
    }
    try {
      var destination = new URL(a.href, location.href);
      if (destination.origin === location.origin &&
          /^\/(hire-me|quick-services|resume|resume-from-scratch|resume-match-checker|business-brief-builder)(?:\.html)?$/.test(destination.pathname)) {
        var area = a.closest('header, nav') ? 'navigation' :
          a.closest('footer') ? 'footer' :
          a.closest('.article-wrap, article') ? 'article' :
          a.closest('.pilot-wrap') ? 'offer' : 'content';
        gtag('event', 'service_cta_click', { destination: destination.pathname,
          source_area: area, page_path: location.pathname });
      }
    } catch (_) {}
    if (a.href.indexOf("amazon.in") !== -1) {
      gtag("event", "affiliate_click", {
        link_url: a.href,
        link_text: (a.textContent || "").trim().slice(0, 80),
        page_path: location.pathname
      });
    }
  }, true);

  // Count only a completed form route, never an attempted submit.
  var page = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
  if (FP_CONFIRMED_FORM) {
    gtag('event', 'generate_lead', { form_name: FP_CONFIRMED_FORM, page_path: page });
  }
  window.addEventListener('fp:form-sent', function (event) {
    if (event.detail && event.detail.formName === 'contact') {
      gtag('event', 'generate_lead', { form_name: 'contact', page_path: location.pathname });
    }
  });
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

  // --- Count successful routes, including quick service requests. ---
  if (FP_CONFIRMED_FORM) {
    fbq('track', 'Lead', { content_category: 'services', content_name: FP_CONFIRMED_FORM });
  }
  window.addEventListener('fp:form-sent', function (event) {
    if (event.detail && event.detail.formName === 'contact') {
      fbq('track', 'Lead', { content_category: 'services', content_name: 'contact' });
    }
  });
})();
