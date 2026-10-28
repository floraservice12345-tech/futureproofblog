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

   If JavaScript or the configured endpoint is unavailable, the HTML fallback
   can record an address in Netlify but cannot confirm a Brevo subscription.
   /subscribe and /thank-you provide a direct hosted signup link.
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

    // Brevo's serve endpoint expects these fields alongside the email address.
    var extras = { email_address_check: "", locale: "en", html_type: "simple" };
    Object.keys(extras).forEach(function (n) {
      if (form.querySelector('input[name="' + n + '"]')) return;
      var i = document.createElement("input");
      i.type = "hidden";
      i.name = n;
      i.value = extras[n];
      form.appendChild(i);
    });

    var pending = false;
    var status = document.createElement("div");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    status.style.cssText = "display:none;width:100%;box-sizing:border-box;background:#f0f7ff;color:#17324d;border:1px solid #b7cee3;border-radius:8px;padding:12px 14px;margin-top:12px;font-size:.9rem;line-height:1.5;text-align:left";
    form.appendChild(status);

    function showStatus(message, offerHostedForm) {
      status.textContent = message;
      status.style.display = "block";
      if (offerHostedForm) {
        var hosted = document.createElement("a");
        hosted.href = action;
        hosted.textContent = "Open the hosted signup page";
        hosted.style.cssText = "display:inline-block;margin-top:8px;color:#17324d;text-decoration:underline;font-weight:700";
        status.appendChild(document.createElement("br"));
        status.appendChild(hosted);
      }
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (pending) return;
      if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
      if (typeof window.fetch !== "function" || typeof AbortController === "undefined" ||
          typeof FormData === "undefined" || typeof URLSearchParams === "undefined") {
        showStatus("Please use our email provider's signup page to request your confirmation email. Your address is still in the form.", true);
        return;
      }

      pending = true;
      form.setAttribute("aria-busy", "true");
      var buttons = Array.prototype.map.call(form.querySelectorAll('button[type="submit"], button:not([type]), input[type="submit"]'), function (button) {
        var state = { element: button, disabled: button.disabled };
        button.disabled = true;
        return state;
      });
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 18000);
      showStatus("Sending your signup request…", false);
      try {
        if (window.gtag) {
          try { window.gtag("event", "newsletter_signup_attempt", { page_path: location.pathname }); } catch (_) {}
        }
        var response = await window.fetch(action, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(new FormData(form)).toString(),
          signal: controller.signal
        });
        if (!response.ok || response.type === "opaque") throw new Error("Signup was not accepted");
        var result = await response.json();
        if (!result || result.success !== true) throw new Error("Signup was not accepted");
        // This confirms only provider acceptance of the signup request.
        // Double opt-in is completed through the email link, not local storage.
        showStatus("Your signup request was accepted. Check your email for the confirmation link.", false);
        location.assign("/thank-you");
      } catch (_) {
        showStatus(controller.signal.aborted
          ? "We could not confirm the signup before the request timed out. Check your inbox and Spam folder before retrying, or use the hosted signup page. Your address is still in the form."
          : "We could not confirm the signup. Check your inbox and Spam folder in case it was accepted, then retry or use the hosted signup page. Your address is still in the form.", true);
      } finally {
        clearTimeout(timeout);
        pending = false;
        form.removeAttribute("aria-busy");
        buttons.forEach(function (state) { state.element.disabled = state.disabled; });
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

/* A local visit or form attempt cannot verify Brevo double opt-in.
   Remove the old browser-only confirmation flag and keep signup forms usable.
   The hosted form and its confirmation email are the source of subscription status. */
(function () {
  try {
    localStorage.removeItem('fp_subscribed');
    localStorage.removeItem('fp_newsletter_pending');
  } catch (_) { /* Storage is optional; signup continues without it. */ }
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
  var WHATSAPP_NUMBER = "919540528064";   /* digits only, e.g. "919876543210" — blank renders nothing */

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
    career: card("FREE RESUME SAMPLE", "Want a clearer, role-targeted resume?",
      "Request a free opening-section sample using your real career details. We confirm timing by email, and full paid work begins only after you accept a written quote.",
      "/resume", "Get my free sample rewrite"),
    money: card("DATA & DOCUMENTS", "Need the spreadsheet, deck or report itself?",
      "Get a written scope, fixed price and delivery date for a workbook, chart, report or deck built from the source material you provide.",
      "/hire-me#order", "Request a fixed quote"),
    write: card("WRITING SERVICES", "Want this written for your business instead?",
      "Start with one scoped article, product listing, email or website section. Your written quote shows the current price and included revisions before payment.",
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
    if (document.querySelector(".reader-next-step, .article-cta")) return;
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
    var text = location.pathname.indexOf("/resume-from-scratch") === 0
      ? "Hi, I need a resume written from scratch. Please confirm the scope, price and delivery date."
      : onResume
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


  /* Adds the reviews link to the footer of every page that loads this file. */
  function reviews() {
    var f = document.querySelector("footer p");
    if (!f || f.innerHTML.indexOf('href="/reviews"') > -1) return;
    if (location.pathname.indexOf("/reviews") === 0) return;
    var sep = document.createTextNode(" \u00b7 ");
    var a = document.createElement("a");
    a.href = "/reviews";
    a.textContent = "Reviews";
    f.appendChild(sep);
    f.appendChild(a);
  }


  ready(function () { nav(); offer(); whatsapp(); reviews(); });
})();
