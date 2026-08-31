/* ============================================================
   FutureProof Blog — AdSense loader
   ------------------------------------------------------------
   WHY THIS FILE EXISTS
   Previously every ad box on the site was written as a bare
   <ins class="adsbygoogle"> with NO data-ad-slot value. Google
   will not fill an ad unit that has no slot ID, so none of the
   93 ad boxes on the site could ever have earned a rupee.

   HOW TO TURN ADS ON (once AdSense approves the site)
   1. adsense.google.com -> Ads -> By ad unit -> Display ads
   2. Create THREE units named exactly: "In-article top",
      "In-article middle", "In-article end"
   3. Each one gives you a 10-digit number (data-ad-slot).
   4. Paste those three numbers below. Nothing else to change.

   Until real numbers are pasted in, every ad box is REMOVED
   from the page — so readers never see empty grey gaps, and
   Google's reviewer never sees a broken ad implementation.
   ============================================================ */

var FP_ADS = {
  client: "ca-pub-8999111703320899",
  slots: {
    top:    "",   // <-- paste the "In-article top" slot number here
    middle: "",   // <-- paste the "In-article middle" slot number here
    end:    ""    // <-- paste the "In-article end" slot number here
  }
};

(function () {
  var boxes = document.querySelectorAll("[data-fp-ad]");
  if (!boxes.length) return;

  var seen = {};
  for (var i = 0; i < boxes.length; i++) {
    var box = boxes[i];
    var pos = box.getAttribute("data-fp-ad");
    var slot = (FP_ADS.slots[pos] || "").replace(/\D/g, "");

    // No slot configured, or this position already rendered once on
    // the page (never stack two units) -> take the box out entirely.
    if (!slot || seen[pos]) {
      if (box.parentNode) box.parentNode.removeChild(box);
      continue;
    }
    seen[pos] = true;

    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", FP_ADS.client);
    ins.setAttribute("data-ad-slot", slot);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");

    var label = document.createElement("span");
    label.textContent = "Advertisement";
    label.style.cssText =
      "display:block;font-size:.66rem;letter-spacing:.06em;text-transform:uppercase;" +
      "color:#9aa0ad;margin:0 0 4px;text-align:center";

    box.appendChild(label);
    box.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* adblocker or script not loaded — fail quietly */ }
  }
})();
