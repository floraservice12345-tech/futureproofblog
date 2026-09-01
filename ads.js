/* ============================================================
   FutureProof Blog — AdSense loader
   ------------------------------------------------------------
   WHY THIS FILE EXISTS
   Previously every ad box was a bare <ins class="adsbygoogle">
   with NO data-ad-slot, under a publisher ID that did not even
   belong to this account. Neither could ever have served an ad.

   STATUS: configured. The three display ad units below were
   created in the AdSense account (publisher pub-6232264636981210)
   on 1 Sept 2026 and their slot IDs are filled in. Ads begin
   serving as soon as Google finishes reviewing futureproofblog.in.

   To change a slot later: adsense.google.com -> Ads -> By ad unit,
   open the unit, copy its data-ad-slot number, paste it below.
   This is the only file to edit — every page reads from it.
   Blank a slot and that ad box is removed from the page entirely,
   so readers never see an empty grey gap.
   ============================================================ */

var FP_ADS = {
  client: "ca-pub-6232264636981210",
  slots: {
    top:    "9353433726",   // "In-article top"
    middle: "4939545996",   // "In-article middle"
    end:    "2093890806"    // "In-article end"
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
