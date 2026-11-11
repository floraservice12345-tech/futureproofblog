/* Year-End Reset offer: visible only from 11 Nov to 31 Dec 2026, India time.
   Outside that window nothing here runs, so the offer cannot linger past its end date. */
(function () {
  var START = '2026-11-11';
  var END = '2026-12-31';
  var today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  if (today < START || today > END) return;
  document.documentElement.classList.add('ye-offer-active');

  var CAMPAIGN = 'YEAREND26';
  var BUNDLES = [
    {
      value: 'career-reset-bundle',
      intake: 'career',
      label: 'Career Reset Bundle — resume + LinkedIn, cover letter, interview kit (₹3,499, normally ₹4,700)'
    },
    {
      value: 'launch-kit-bundle',
      intake: 'web',
      label: 'Launch Kit — one-page site, 3-email sequence, repurposing pack (₹9,999, normally from ₹13,500)'
    }
  ];

  // Tag every enquiry from this offer so it can be told apart in the inbox.
  document.querySelectorAll(
    'form[name="project-brief"], form[name="quick-service-request"], form[name="resume-brief"]'
  ).forEach(function (form) {
    var campaign = form.querySelector('input[name="campaign"]');
    if (campaign && !campaign.value) campaign.value = CAMPAIGN;
  });

  // Add the two bundles to the Hire Me order form.
  var form = document.querySelector('form[name="project-brief"]');
  var select = form && form.querySelector('select[name="service"]');
  if (!select) return;

  var heading = document.createElement('option');
  heading.disabled = true;
  heading.textContent = '— Year-End Reset bundles (to 31 Dec 2026) —';
  var anchor = select.options[1] || null; // keep the "Select a service" prompt first
  select.insertBefore(heading, anchor);
  BUNDLES.forEach(function (bundle) {
    var option = document.createElement('option');
    option.value = bundle.value;
    option.textContent = bundle.label;
    option.setAttribute('data-intake', bundle.intake);
    select.insertBefore(option, anchor);
  });

  // Honour ?service=career-reset-bundle even if the intake script has already run.
  var requested = new URLSearchParams(window.location.search).get('service');
  if (requested) {
    var match = Array.prototype.find.call(select.options, function (option) {
      return option.value === requested;
    });
    if (match && select.value !== requested) {
      select.value = requested;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
})();
