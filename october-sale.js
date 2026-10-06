/* Show the temporary October offer only while it is open in India. */
(function () {
  var inIndia = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  if (inIndia < '2026-10-06' || inIndia > '2026-10-31') return;
  document.documentElement.classList.add('october-sale-active');
  if (location.hash === '#pilot-offer') {
    history.replaceState(null, '', '#october-offer');
    requestAnimationFrame(function () {
      var offer = document.getElementById('october-offer');
      if (offer) offer.scrollIntoView();
    });
  }

  var currency = /₹\s*([\d,]+(?:\.\d{1,2})?)/g;
  function amount(raw) { return Number(raw.replace(/,/g, '')); }
  function money(value) {
    return '₹' + new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function markedText(raw, withBadge) {
    var html = '';
    var cursor = 0;
    var eligible = false;
    currency.lastIndex = 0;
    var match;
    while ((match = currency.exec(raw))) {
      html += escapeHTML(raw.slice(cursor, match.index));
      var standard = amount(match[1]);
      if (standard >= 1000) {
        eligible = true;
        html += '<span class="oct-price"><del>' + money(standard) + '</del> <strong>' + money(standard / 2) + '</strong></span>';
      } else {
        html += escapeHTML(match[0]);
      }
      cursor = currency.lastIndex;
    }
    html += escapeHTML(raw.slice(cursor));
    if (eligible && withBadge) html += ' <span class="oct-badge">50% OFF</span>';
    return { html: html, eligible: eligible, hasPrice: cursor > 0 };
  }

  document.querySelectorAll('.svc-price, .pkg-price, .grid .card .price, .rz-tier .pr').forEach(function (element) {
    var result = markedText(element.textContent, true);
    if (result.eligible) {
      element.innerHTML = result.html;
      element.classList.add('oct-eligible');
      var card = element.closest('.card, .svc-card, .pkg, .rz-tier');
      if (card) card.classList.add('oct-card-eligible');
    } else if (result.hasPrice && element.matches('.svc-price, .grid .card .price, .rz-tier .pr')) {
      element.insertAdjacentHTML('afterend', '<small class="oct-regular">Regular price · under ₹1,000</small>');
    }
  });

  function markTextNodes(selector) {
    document.querySelectorAll(selector).forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        if (node.parentElement.closest('.oct-price')) return;
        var result = markedText(node.nodeValue, false);
        if (!result.eligible) return;
        var span = document.createElement('span');
        span.innerHTML = result.html;
        node.parentNode.replaceChild(span, node);
      });
    });
  }
  markTextNodes('.svc-card p, a[href*="/quick-services?service="]');
  if (location.pathname.indexOf('/resume-from-scratch') === 0) markTextNodes('#process li, .faq p, .faq h3');
  if (location.pathname.indexOf('/resume') === 0) markTextNodes('.rz-free p');

  document.querySelectorAll('form[name="project-brief"], form[name="quick-service-request"], form[name="resume-brief"]').forEach(function (form) {
    var campaign = form.querySelector('input[name="campaign"]');
    if (campaign) campaign.value = 'OCTOBER50';
    var select = form.querySelector('select[name="service"]');
    if (!select) return;
    Array.prototype.forEach.call(select.options, function (option) {
      if (option.disabled) return;
      var original = option.textContent;
      currency.lastIndex = 0;
      var match = currency.exec(original);
      if (!match) return;
      var standard = amount(match[1]);
      if (!option.hasAttribute('value')) option.value = original;
      if (standard >= 1000) {
        option.textContent = original.replace(match[0], money(standard) + ' → ' + money(standard / 2)) + ' · OCT 50%';
      } else if (standard > 0) {
        option.textContent = original + ' · regular price';
      }
    });
  });
})();
