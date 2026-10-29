/* Numeric validation shared by the standalone calculators. No values are sent or stored. */
(function () {
  'use strict';
  window.FPValidateToolNumbers = function (form) {
    var first = null;
    Array.prototype.forEach.call(form.querySelectorAll('input[type="number"]'), function (field) {
      var raw = field.value.trim();
      var value = Number(raw);
      var min = field.min === '' ? 0 : Number(field.min);
      var max = field.max === '' ? 1000000000 : Number(field.max);
      var whole = field.hasAttribute('data-whole-number');
      var valid = raw !== '' && Number.isFinite(value) && value >= min && value <= max && (!whole || Number.isInteger(value));
      field.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (!valid && !first) first = {field: field, min: min, max: max, whole: whole};
    });
    var message = document.getElementById('tool-input-error');
    if (first) {
      var label = form.querySelector('label[for="' + first.field.id + '"]');
      var name = label ? label.textContent.replace(/\s+/g, ' ').trim().split('(')[0].trim() : 'Highlighted field';
      message.textContent = name + ': enter ' + (first.whole ? 'a whole number' : 'a number') + ' from ' + first.min.toLocaleString('en-IN') + ' to ' + first.max.toLocaleString('en-IN') + '. Complete every highlighted field; use 0 where allowed.';
      message.hidden = false;
      return false;
    }
    message.hidden = true;
    message.textContent = '';
    return true;
  };
}());
