(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-msg');
  if (!form || !status) return;
  var pending = false;
  function reference() {
    var random = new Uint32Array(2);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(random);
    else { random[0] = Math.floor(Math.random() * 0xffffffff); random[1] = Math.floor(Math.random() * 0xffffffff); }
    return 'FPB-' + Date.now().toString(36).toUpperCase() + '-' + Array.from(random).map(function (n) { return n.toString(16).padStart(8, '0'); }).join('').toUpperCase();
  }
  function show(kind, message, ref) {
    status.className = 'form-msg ' + kind;
    status.textContent = message + ' Reference: ' + ref + '. ';
    var email = document.createElement('a');
    email.href = 'mailto:contact@futureproofblog.in?subject=' + encodeURIComponent('Enquiry follow-up ' + ref);
    email.textContent = 'Email us with this reference';
    status.appendChild(email);
    status.setAttribute('tabindex', '-1');
    status.focus();
  }
  form.addEventListener('submit', async function (event) {
    // Keep the native Netlify POST usable when enhanced submission is unavailable.
    // Do this before preventing the browser's normal form submission.
    if (typeof fetch !== 'function' || typeof AbortController === 'undefined' ||
        typeof FormData === 'undefined' || typeof URLSearchParams === 'undefined') return;
    var refInput = form.querySelector('input[name="reference"]');
    if (!refInput) return;
    event.preventDefault();
    if (pending || (typeof form.reportValidity === 'function' && !form.reportValidity())) return;
    pending = true;
    var button = form.querySelector('button[type="submit"]');
    var ref = refInput.value || reference();
    refInput.value = ref;
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 20000);
    try {
      var response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission not accepted');
      form.reset();
      show('success', 'Your form was submitted. Keep this reference and check your inbox or spam for an acknowledgement. If none arrives, or you have no reply within two working days, email us or call +91 95405 28064. This confirmation does not verify email delivery.', ref);
      window.dispatchEvent(new CustomEvent('fp:form-sent', { detail: { formName: 'contact' } }));
    } catch (_) {
      show('error', 'We could not confirm submission. Your message is still in the form. Check your email before retrying to avoid duplicates, or contact us directly.', ref);
    } finally {
      clearTimeout(timeout);
      pending = false;
      if (button) { button.disabled = false; button.textContent = 'Send Message →'; }
    }
  });
}());
