/* Keep the public quote forms short while asking useful questions for each job. */
(function () {
  var form = document.querySelector('form[name="project-brief"], form[name="quick-service-request"]');
  if (!form) return;
  var service = form.querySelector('select[name="service"]');
  var brief = form.querySelector('textarea[name="brief"]');
  var panels = Array.prototype.slice.call(form.querySelectorAll('[data-intake-group]'));
  if (!service || !panels.length) return;

  var quickGroups = {
    career: ['resume-summary', 'application-email', 'linkedin-starter'],
    data: ['formula-fixes', 'one-chart', 'trend-summary', 'budget-template', 'scenario-tab', 'kpi-definitions', 'progress-tracker', 'mis-commentary'],
    web: ['seo-snippets', 'calculator-spec', 'calculator-widget', 'browser-chart', 'hero-section', 'faq-section', 'one-page-audit'],
    documents: ['three-slide-deck', 'one-sop', 'lesson-plan', 'school-calendar']
  };

  function groupForSelection() {
    var option = service.options[service.selectedIndex];
    if (!option || !service.value) return '';
    if (option.dataset.intake) return option.dataset.intake;
    var value = service.value.toLowerCase();
    if (value === 'staged-project') return '';
    if (form.name === 'quick-service-request') {
      for (var group in quickGroups) {
        if (quickGroups[group].indexOf(value) !== -1) return group;
      }
      return 'writing';
    }
    var label = option.textContent.toLowerCase();
    if (/resume|linkedin|cover letter|interview|career/.test(label)) return 'career';
    if (/web tool|calculator|dashboard|landing page|one-page site|website, seo|automation/.test(label)) return 'web';
    if (/power sector|inspection|school|hr admin|proposal|quotation|presentation|deck|sop|tender/.test(label)) return 'documents';
    if (/spreadsheet|excel|budget|financial|data|chart|report|model|reconciliation/.test(label)) return 'data';
    if (/something else/.test(label)) return '';
    return 'writing';
  }

  var prompts = {
    career: 'Tell us the target role, your real experience, and which section you want written or improved.',
    writing: 'Tell us the topic or product, intended reader, key points, and any facts or sources we must use.',
    data: 'Tell us what your spreadsheet contains, the question to answer, and the exact chart, table or file you want back.',
    web: 'Tell us what a visitor should enter, what the tool or page should show, and where it will be used.',
    documents: 'Tell us which document you need, who will read it, and what source material you can provide.'
  };

  function update() {
    var group = groupForSelection();
    panels.forEach(function (panel) {
      var active = panel.dataset.intakeGroup === group;
      panel.hidden = !active;
      panel.disabled = !active;
    });
    if (brief) brief.placeholder = service.value === 'staged-project'
      ? 'Describe the full project, who will use it, and the first deliverable you need. Include any deadline or source material.'
      : prompts[group] || 'Describe the result you want, who will use it, what you already have, and any deadline or constraints.';
  }

  var requested = new URLSearchParams(window.location.search).get('service');
  if (requested) {
    var match = Array.prototype.find.call(service.options, function (option) {
      return option.value === requested;
    });
    if (match) service.value = requested;
  }
  var requestedVolume = new URLSearchParams(window.location.search).get('volume');
  var volume = form.querySelector('select[name="volume"]');
  if (requestedVolume && volume) {
    var volumeMatch = Array.prototype.find.call(volume.options, function (option) {
      return option.textContent.trim().indexOf(requestedVolume + ' articles') === 0;
    });
    if (volumeMatch) volume.value = volumeMatch.value;
  }
  service.addEventListener('change', update);
  update();
})();
