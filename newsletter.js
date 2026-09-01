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
