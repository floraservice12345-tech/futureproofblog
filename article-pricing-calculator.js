(function () {
  'use strict';
  var ids = ['price', 'discount', 'costs', 'time', 'fixed'];
  var defaults = [500, 0, 250, 100, 4500];
  var fields = ids.map(function (id) { return document.getElementById('calc-' + id); });
  if (fields.some(function (field) { return !field; })) return;
  var money = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2});
  var integers = new Intl.NumberFormat('en-IN', {maximumFractionDigits: 0});
  var error = document.getElementById('calculator-error');
  var netOutput = document.getElementById('calc-net');
  var contributionOutput = document.getElementById('calc-contribution');
  var orderOutput = document.getElementById('calc-orders');
  var note = document.getElementById('calc-note');
  var timer;

  function update() {
    var valid = true;
    var values = fields.map(function (field, index) {
      var value = Number(field.value);
      var maximum = index === 1 ? 100 : 1000000000;
      var ok = field.value.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= maximum;
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) valid = false;
      return value;
    });
    if (!valid) {
      error.textContent = 'Enter a number from 0 to 1,000,000,000 for each rupee amount and a discount from 0% to 100%.';
      error.hidden = false;
      netOutput.textContent = contributionOutput.textContent = orderOutput.textContent = '—';
      note.textContent = 'Complete the highlighted fields to calculate a result.';
      return;
    }
    error.hidden = true;
    // Round monetary values to paise before dividing to avoid fractional-paise break-even errors.
    var pricePaise = Math.round(values[0] * 100);
    var discountBps = Math.round(values[1] * 100);
    var netPaise = Math.round(pricePaise * (10000 - discountBps) / 10000);
    var costPaise = Math.round(values[2] * 100) + Math.round(values[3] * 100);
    var contributionPaise = netPaise - costPaise;
    var fixedPaise = Math.round(values[4] * 100);
    netOutput.textContent = money.format(netPaise / 100);
    contributionOutput.textContent = money.format(contributionPaise / 100);
    if (contributionPaise <= 0) {
      orderOutput.textContent = 'No positive contribution';
      note.textContent = 'Review price, costs or scope. Each order contributes nothing or less than zero after your owner-time allowance, so increasing volume will not fund fixed costs in this model.';
    } else {
      orderOutput.textContent = integers.format(Math.ceil(fixedPaise / contributionPaise));
      note.textContent = 'This model assumes identical orders, fixed per-order costs and no unlisted expenses or tax. Orders are rounded up to a whole number.';
    }
  }

  fields.forEach(function (field) {
    field.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(update, 200);
    });
    field.addEventListener('change', function () { clearTimeout(timer); update(); });
  });
  document.getElementById('calculator-reset').addEventListener('click', function () {
    clearTimeout(timer);
    fields.forEach(function (field, index) { field.value = String(defaults[index]); });
    update();
  });
  update();
}());
