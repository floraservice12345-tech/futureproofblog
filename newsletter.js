/* ============================================================
   FutureProof Blog — newsletter delivery
   ------------------------------------------------------------
   THE PROBLEM THIS SOLVES
   Every sign-up box on this site posted to Netlify Forms. That
   collects addresses and emails Rahul — but it never sends the
   subscriber anything. So the site promised a weekly email and a
   free guide, and delivered neither.

   STATUS: live. Configured in Brevo on 1 Sept 2026 —
   list "FutureProof subscribers", form "FutureProof newsletter
   signup", double opt-in confirmation, and after the subscriber
   clicks the confirmation link they land on /thank-you where the
   free guide downloads immediately.

   To point the site at a different Brevo form later, replace the
   formAction URL below with the action="..." value from that
   form's Share -> Simple HTML embed code. This is the only file
   to edit; every sign-up box on every page reads from it.

   Blank the URL and all forms fall back to Netlify Forms, exactly
   as before — nothing breaks.
   ============================================================ */

var FP_NEWSLETTER = {
  formAction: "https://c41c7132.sibforms.com/serve/MUIFAIRI_BT2kX6zoEHASBR6BbpMnRr4hAblkMGctjq14OTQlLVcuG3e_XRhXwYNcvryHth6e-LlOJKOPbEgIj9y-o1TTCuV7Egcn4H8LqlE79nhoolPWB5ieeZiLaHw4Jkv4Cy3VDRhjuA3cr8cmT40M6EOD7qdC3TjrBD8XW0Zf0NTF79195nPDzGtfhjiDyRD3Jh7tJ4u6aGK3Q==",

  // The field name Brevo expects for the email address.
  // Brevo's standard embedded form uses EMAIL.
  emailField: "EMAIL"
};

(function () {
  var action = (FP_NEWSLETTER.formAction || "").trim();
  if (!action || action.indexOf("sibforms.com") === -1) return; // not configured yet

  var NAMES = ["newsletter", "nl-sidebar", "newsletter-article", "newsletter-home"];

  function convert(form) {
    if (form.getAttribute("data-fp-converted")) return;
    form.setAttribute("data-fp-converted", "1");

    form.setAttribute("action", action);
    form.setAttribute("method", "POST");
    // Netlify's attributes would otherwise intercept the submission
    form.removeAttribute("data-netlify");
    form.removeAttribute("netlify");
    form.removeAttribute("netlify-honeypot");

    // Netlify-only plumbing that Brevo's endpoint must not receive
    var strip = form.querySelectorAll(
      'input[name="form-name"], input[name="bot-field"], p.hp, .hp'
    );
    for (var s = 0; s < strip.length; s++) {
      var node = strip[s];
      // remove the honeypot's wrapper too, not just the input
      if (node.tagName === "INPUT" && node.name === "bot-field" &&
          node.closest && node.closest("p")) node = node.closest("p");
      if (node.parentNode) node.parentNode.removeChild(node);
    }

    var email = form.querySelector('input[type="email"]');
    if (email) email.setAttribute("name", FP_NEWSLETTER.emailField);

    // Any other visible input would be posted as an unknown attribute and
    // rejected. The Brevo form collects the email address only.
    var others = form.querySelectorAll("input");
    for (var o = 0; o < others.length; o++) {
      var inp = others[o];
      if (inp.type === "hidden" || inp.type === "submit") continue;
      if (inp === email) continue;
      inp.disabled = true;
      if (inp.parentNode) inp.parentNode.removeChild(inp);
    }

    // Brevo's serve endpoint expects these two alongside the fields
    var extras = { email_address_check: "", locale: "en", html_type: "simple" };
    Object.keys(extras).forEach(function (n) {
      if (form.querySelector('input[name="' + n + '"]')) return;
      var i = document.createElement("input");
      i.type = "hidden";
      i.name = n;
      i.value = extras[n];
      form.appendChild(i);
    });

    form.addEventListener("submit", function () {
      if (window.gtag) {
        gtag("event", "newsletter_signup", { page_path: location.pathname });
      }
    });
  }

  function run() {
    NAMES.forEach(function (n) {
      var list = document.querySelectorAll('form[name="' + n + '"]');
      for (var i = 0; i < list.length; i++) convert(list[i]);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();

/* ------------------------------------------------------------
   Already-subscribed state
   ------------------------------------------------------------
   Brevo dedupes on its side — an address that is already a
   confirmed contact is updated, never added twice. But it will
   still send that person another confirmation email if they hit
   the form again, and being asked to subscribe to something you
   already subscribed to is the most irritating thing a site does.

   So once someone subscribes from this browser we remember it and
   replace every sign-up box with a short acknowledgement plus a
   link to the guide. There is a "not me" link for shared devices.
   ------------------------------------------------------------ */
(function () {
  var KEY = "fp_subscribed";
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
  }
  function forget() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  }
  window.fpForgetSubscription = forget;

  var NAMES = ["newsletter", "nl-sidebar", "newsletter-article", "newsletter-home"];

  function replaceForms() {
    NAMES.forEach(function (n) {
      var list = document.querySelectorAll('form[name="' + n + '"]');
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        if (f.getAttribute("data-fp-done")) continue;
        f.setAttribute("data-fp-done", "1");
        var box = document.createElement("div");
        box.style.cssText =
          "border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.10);" +
          "border-radius:8px;padding:14px 16px;font-size:.92rem;line-height:1.6";
        box.innerHTML =
          '<strong>You are already on the list.</strong> ' +
          '<a href="/guides/10-ai-tools-india-2026.pdf" style="color:inherit;text-decoration:underline">' +
          'Download the free guide again</a>' +
          ' &middot; <a href="#" style="color:inherit;text-decoration:underline;opacity:.75" ' +
          'onclick="fpForgetSubscription();return false;">not me</a>';
        if (f.parentNode) f.parentNode.replaceChild(box, f);
      }
    });
  }

  function markOnSubmit() {
    NAMES.forEach(function (n) {
      var list = document.querySelectorAll('form[name="' + n + '"]');
      for (var i = 0; i < list.length; i++) {
        list[i].addEventListener("submit", remember);
      }
    });
  }

  function run() {
    // Landing on the confirmation page means the address is confirmed.
    if (location.pathname.indexOf("/thank-you") === 0) { remember(); return; }
    if (stored()) replaceForms(); else markOnSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else { run(); }
})();

/* ============================================================
   Site-wide conversion layer  (added 4 Sep 2026)
   ------------------------------------------------------------
   This file is already loaded by every article and every key
   page, so it is the one place that can reach the whole site in
   a single deploy. Three jobs:

     1. Put the "Resume Fix" link in the nav.
     2. Put an offer at the end of every article, matched to what
        the article is about.
     3. Render the WhatsApp button.

   Everything here is IDEMPOTENT: if a page already carries the
   real HTML version of any of these, this file leaves it alone.
   So when the hand-written HTML eventually ships, this quietly
   stops doing anything rather than duplicating it.
   ============================================================ */
(function () {
  var WHATSAPP_NUMBER = "";   /* digits only, e.g. "919876543210" — blank renders nothing */

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  /* ---------- 1. nav link + stop the logo wrapping ---------- */
  function nav() {
    var n = document.querySelector(".nav-inner nav") || document.querySelector("header nav");
    if (!n || n.querySelector('a[href="/resume"]')) return;
    var hire = n.querySelector('a[href="/hire-me"]');
    var a = document.createElement("a");
    a.href = "/resume";
    a.textContent = "Resume Fix";
    if (location.pathname.indexOf("/resume") === 0) a.className = "active";
    if (hire && hire.nextSibling) n.insertBefore(a, hire.nextSibling);
    else n.appendChild(a);

    var css = document.createElement("style");
    css.textContent =
      ".logo{white-space:nowrap;flex:none}.nav-inner{gap:14px}" +
      ".nav-inner nav{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;row-gap:2px}" +
      "@media(max-width:1180px){nav a{margin-left:13px;font-size:.87rem}}" +
      "@media(max-width:980px){.nav-inner{height:auto;padding:10px 0}nav a{margin-left:11px;font-size:.85rem}}";
    document.head.appendChild(css);
  }

  /* ---------- 2. end-of-article offer ---------- */
  var SHELL = 'background:linear-gradient(135deg,#1a1a2e,#0f3460);color:#fff;border-radius:12px;padding:26px 28px;margin:34px 0';
  var TAG   = 'display:inline-block;background:#e94560;font-size:.7rem;font-weight:800;letter-spacing:.08em;padding:5px 12px;border-radius:20px;margin-bottom:12px';
  var H     = 'color:#fff;font-size:1.24rem;margin:0 0 10px;font-weight:800';
  var P     = 'color:#c9d1e3;font-size:.96rem;line-height:1.75;margin:0 0 18px';
  var BTN   = 'display:inline-block;background:#e94560;color:#fff;padding:12px 26px;border-radius:7px;text-decoration:none;font-weight:800';

  function card(tag, head, body, href, cta) {
    return '<div style="' + SHELL + '"><span style="' + TAG + '">' + tag + '</span>' +
           '<h3 style="' + H + '">' + head + '</h3><p style="' + P + '">' + body + '</p>' +
           '<a href="' + href + '" style="' + BTN + '">' + cta + ' &rarr;</a></div>';
  }

  var CARDS = {
    career: card("FREE — NO CATCH", "Is your resume even being read?",
      "Most CVs are rejected by screening software before a person opens them &mdash; usually for formatting, not for the person. Send me yours and I will rewrite the top third free, today, with nothing to pay and nothing to cancel.",
      "/resume", "Get my free sample rewrite"),
    money: card("SAME-DAY DELIVERY", "Need the spreadsheet, deck or report itself?",
      "Working Excel models, data cleaned and analysed, decks and reports built to your brief &mdash; delivered as finished files you own and can edit. Fixed price quoted within one working day, nothing payable until you approve it.",
      "/hire-me#sameday", "See same-day services"),
    write: card("FROM &#8377;1,200", "Want this written for your business instead?",
      "Articles, website copy, product listings and content calendars &mdash; researched first, written second, publish-ready. This article is the standard your brief gets, so judge the work rather than a sales page.",
      "/hire-me", "See services &amp; prices")
  };

  var CAREER_PAGES = ["ai-proof-job", "first-freelance-client", "freelance-platforms-india",
                      "ai-side-income", "earn-money-with-ai-india", "side-income-50k",
                      "ai-for-students", "salary-negotiate", "work-from-home-jobs-india"];
  var MONEY_WORDS = ["tax", "sip", "property", "invest", "excel", "budget", "loan", "emi", "itr", "wealth"];

  function pick() {
    var path = location.pathname.toLowerCase();
    for (var i = 0; i < CAREER_PAGES.length; i++) {
      if (path.indexOf(CAREER_PAGES[i]) !== -1) return CARDS.career;
    }
    var hits = 0;
    for (var j = 0; j < MONEY_WORDS.length; j++) {
      if (path.indexOf(MONEY_WORDS[j]) !== -1) hits++;
    }
    return hits ? CARDS.money : CARDS.write;
  }

  function offer() {
    if (location.pathname.indexOf("/article-") !== 0) return;
    var body = document.body.innerHTML;
    // already carries the hand-written version — leave it alone
    if (body.indexOf("FREE — NO CATCH") !== -1 ||
        body.indexOf("SAME-DAY DELIVERY") !== -1 ||
        body.indexOf("Want this written for your business") !== -1) return;

    var host = document.querySelector("article") ||
               document.querySelector(".page-content") ||
               document.querySelector("main");
    if (!host) return;
    var box = document.createElement("div");
    box.innerHTML = pick();
    host.appendChild(box.firstChild);
  }

  /* ---------- 3. WhatsApp ---------- */
  function whatsapp() {
    var num = (WHATSAPP_NUMBER || "").replace(/\D/g, "");
    if (!num || document.getElementById("fp-wa")) return;

    var onResume = location.pathname.indexOf("/resume") === 0;
    var text = onResume
      ? "Hi, I'd like the free sample rewrite of my resume."
      : "Hi, I found futureproofblog.in and I'd like to ask about your services.";

    var a = document.createElement("a");
    a.id = "fp-wa";
    a.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Message me on WhatsApp");
    a.innerHTML = '<span aria-hidden="true" style="font-size:1.15rem;line-height:1">&#128172;</span><span class="fp-wa-t">Message me</span>';

    var css = document.createElement("style");
    css.textContent =
      "#fp-wa{position:fixed;right:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:9px;" +
      "background:#25d366;color:#fff;text-decoration:none;padding:12px 18px 12px 14px;border-radius:40px;" +
      "font:700 .93rem/1 'Segoe UI',Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.24);" +
      "transition:transform .18s ease}" +
      "#fp-wa:hover{transform:translateY(-2px)}" +
      "#fp-wa:focus-visible{outline:3px solid #fff;outline-offset:2px}" +
      "@media(max-width:560px){#fp-wa{right:12px;bottom:12px;padding:13px}#fp-wa .fp-wa-t{display:none}}" +
      "@media(prefers-reduced-motion:reduce){#fp-wa{transition:none}}";
    document.head.appendChild(css);
    document.body.appendChild(a);
    a.addEventListener("click", function () {
      if (window.gtag) gtag("event", "whatsapp_click", { page_path: location.pathname });
    });
  }

  ready(function () { nav(); offer(); whatsapp(); });
})();
