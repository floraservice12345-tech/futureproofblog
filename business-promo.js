/* The enquiry remains a normal Netlify POST if JavaScript is unavailable. */
(function () {
  'use strict';
  var select = document.getElementById('promo-service');
  var brief = document.getElementById('promo-message');
  var help = document.getElementById('brief-help');
  var prompts = {
    'Resume writing from scratch': 'Tell us your target role, education, experience, projects and skills. Rough notes are enough to start; use only facts you can confirm.',
    'Resume rewrite': 'Tell us your target role and what needs improving in your CV. Mention whether you have an editable CV and a job description.',
    'LinkedIn profile content': 'Tell us your target role, experience and which profile sections you need. Please do not share your LinkedIn password.',
    'Cover letter or job application email': 'Tell us the job title, employer, your relevant experience and whether you want a cover letter or short application email.',
    'Interview preparation documents': 'Tell us the target role, interview stage and the skills or questions you want to prepare for.',
    'SEO article or article section': 'Tell us the topic, audience, approximate word count and whether you need a full article, outline or one section.',
    'Website or product copy': 'Tell us the product or service, target customer and the pages or listings you need. Mention the source facts you can supply.',
    'Social captions or content calendar': 'Tell us your brand, platform, audience and how many captions or days of ideas you need.',
    'Email sequence or newsletter': 'Tell us your audience, goal, number of emails and the action readers should take.',
    'Business proposal or presentation': 'Tell us the recipient, purpose, approximate length and the source information available.',
    'Spreadsheet formula fixes': 'Describe the broken formulas, expected results and workbook format. Please do not include confidential account details.',
    'Data cleaning, charts or report': 'Tell us the file format, approximate row count, the question to answer and the output you need.',
    'Small website or landing page': 'Tell us the page goal, sections, content you have and whether you need code only or deployment too.',
    'Browser calculator or dashboard': 'Describe the inputs, calculations or charts, desired output and where the tool will be used.'
  };
  function updateHelp() {
    var text = prompts[select.value] || 'Tell us what you want delivered, your audience, the source material you have and your preferred timing. You can request just one small part.';
    help.textContent = text;
    brief.placeholder = text;
  }
  document.querySelectorAll('[data-promo-service]').forEach(function (link) {
    link.addEventListener('click', function () {
      select.value = link.dataset.promoService;
      updateHelp();
      select.focus({ preventScroll: true });
    });
  });
  select.addEventListener('change', updateHelp);
  var requested = new URLSearchParams(location.search).get('service');
  if (requested && Array.from(select.options).some(function (option) { return option.value === requested; })) {
    select.value = requested;
  }
  updateHelp();

  var indiaDay = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  var offer = document.querySelector('[data-promo-offer]');
  offer.hidden = indiaDay < '2026-10-06' || indiaDay > '2026-10-31';
  document.getElementById('promo-expired').hidden = indiaDay <= '2026-10-31';

  var shareText = document.getElementById('share-copy');
  document.getElementById('whatsapp-share').href = 'https://wa.me/?text=' + encodeURIComponent(shareText.value);
  var copyButton = document.getElementById('copy-share');
  copyButton.hidden = false;
  copyButton.addEventListener('click', async function () {
    var status = document.getElementById('share-status');
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareText.value);
      status.textContent = 'Message copied. Paste it with the poster in your preferred app.';
    } catch (_) {
      shareText.focus();
      shareText.select();
      status.textContent = 'The message is selected. Use your device’s Copy command, then paste it with the poster.';
    }
  });
  document.querySelectorAll('a[href^="/media/"]').forEach(function (link) {
    var extension = link.pathname.split('.').pop();
    if (/^(pdf|png|svg|gif|webm)$/.test(extension)) link.dataset.promoDownload = extension;
  });
})();
