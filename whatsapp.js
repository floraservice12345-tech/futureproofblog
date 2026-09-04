/* ============================================================
   FutureProof Blog — WhatsApp contact button
   ------------------------------------------------------------
   In India WhatsApp converts freelance enquiries far better than
   a web form: a form asks for commitment, a message asks for
   almost nothing. This puts one button on every page.

   TO TURN IT ON: put the number below in full international
   form, digits only, no +, no spaces. India example:
       number: "919876543210"

   While the number is blank NOTHING renders — no broken button,
   no dead link. This is the only file to edit.
   ============================================================ */

var FP_WHATSAPP = {
  number: "919540528064",

  // Pre-filled message. The client just hits send.
  message: "Hi, I found futureproofblog.in and I'd like to ask about your services.",

  // A different opener on the resume page, where the visitor
  // already knows what they want.
  messageResume: "Hi, I'd like the free sample rewrite of my resume."
};

(function () {
  var num = (FP_WHATSAPP.number || "").replace(/\D/g, "");
  if (!num) return; // not configured — render nothing

  var onResume = location.pathname.indexOf("/resume") === 0;
  var text = onResume ? FP_WHATSAPP.messageResume : FP_WHATSAPP.message;
  var href = "https://wa.me/" + num + "?text=" + encodeURIComponent(text);

  function build() {
    if (document.getElementById("fp-wa")) return;

    var a = document.createElement("a");
    a.id = "fp-wa";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Message me on WhatsApp");
    a.innerHTML =
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">' +
      '<path fill="#fff" d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.470 1.06 2.53c.08.13 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.7.22 1.33.19 1.83.12.56-.08 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"/>' +
      '<path fill="#fff" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.87 9.87 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01c-1.48 0-2.94-.4-4.2-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.21 8.22z"/>' +
      "</svg>" +
      '<span class="fp-wa-t">Message me</span>';

    var css = document.createElement("style");
    css.textContent =
      "#fp-wa{position:fixed;right:16px;bottom:16px;z-index:9998;display:flex;align-items:center;gap:9px;" +
      "background:#25d366;color:#fff;text-decoration:none;padding:12px 18px 12px 14px;border-radius:40px;" +
      "font:700 .93rem/1 'Segoe UI',Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.24);" +
      "transition:transform .18s ease,box-shadow .18s ease}" +
      "#fp-wa:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.3)}" +
      "#fp-wa:focus-visible{outline:3px solid #fff;outline-offset:2px}" +
      "@media(max-width:560px){#fp-wa{right:12px;bottom:12px;padding:13px}" +
      "#fp-wa .fp-wa-t{display:none}}" +
      "@media(prefers-reduced-motion:reduce){#fp-wa{transition:none}}";

    document.head.appendChild(css);
    document.body.appendChild(a);

    a.addEventListener("click", function () {
      if (window.gtag) {
        gtag("event", "whatsapp_click", { page_path: location.pathname });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
