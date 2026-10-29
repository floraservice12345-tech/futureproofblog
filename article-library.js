(function () {
  'use strict';
  var items = [], ready = false, limit = 12, timer;
  var input = document.getElementById('searchInput');
  var topic = document.getElementById('library-topic');
  var sort = document.getElementById('library-sort');
  var saved = document.getElementById('library-saved');
  var list = document.getElementById('articleList');
  var count = document.getElementById('resultsCount');
  var more = document.getElementById('library-more');
  var form = document.getElementById('library-form');
  var clear = document.getElementById('library-clear');
  if (!input || !topic || !sort || !saved || !list || !count || !more || !form || !clear) return;

  function node(tag, text, cls) {
    var el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function safeURL(value) {
    if (typeof value !== 'string') return '';
    try {
      var u = new URL(value, location.origin);
      return u.origin === location.origin && /^\/article-[a-z0-9-]+$/.test(u.pathname) ? u.pathname : '';
    } catch (_) { return ''; }
  }
  function savedPages() {
    var clean = Object.create(null);
    try {
      var data = JSON.parse(localStorage.getItem('fp_reading_places_v1') || '{}');
      if (!data || typeof data !== 'object' || Array.isArray(data)) return clean;
      Object.keys(data).forEach(function (path) {
        var record = data[path];
        if (safeURL(path) === path && record && typeof record === 'object' &&
            typeof record.anchor === 'string' && record.anchor.length <= 200 &&
            Number.isFinite(record.at) && record.at > 0) clean[path] = record;
      });
    } catch (_) {}
    return clean;
  }
  function category(a) {
    var s = (a.title + ' ' + a.tags.join(' ') + ' ' + a.keywords).toLowerCase();
    if (/\b(tax|taxes|gst|sip|wealth|property|invest\w*|nifty|ipo|pension|nps)\b/.test(s)) return 'money';
    if (/\b(resume|hiring|naukri|career|salary|jobs?|interview)\b/.test(s) && !/freelanc/.test(s)) return 'career';
    if (/\b(excel|spreadsheet|no.code|coding|productivity)\b|research.writers|writing.tools/.test(s)) return 'ai';
    if (/\b(business|ondc|youtube|weekend)\b|side.hustle|freelanc|side.income|earn.money/.test(s)) return 'business';
    return 'ai';
  }
  function containsTerm(text, term) {
    // Short acronyms such as AI must not match the middle of FSSAI or 'paid'.
    if (/^[a-z0-9]{1,2}$/.test(term)) return new RegExp('(?:^|[^a-z0-9])' + term + '(?:$|[^a-z0-9])').test(text);
    return text.includes(term);
  }
  function card(a, record) {
    var el = node('article', undefined, 'result-card'), h = node('h3'), link = node('a', a.title);
    link.href = a.url + (saved.checked && record && record.anchor ? '#' + encodeURIComponent(record.anchor) : '');
    h.appendChild(link); el.appendChild(h);
    el.appendChild(node('p', a.excerpt, 'excerpt'));
    var tags = node('div', undefined, 'tags');
    a.tags.slice(0, 3).forEach(function (t) { tags.appendChild(node('span', t, 'tag')); });
    el.appendChild(tags);
    var date = a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : '';
    var minutes = parseInt(a.readTime, 10);
    el.appendChild(node('p', [date ? 'Published ' + date : '', Number.isFinite(minutes) && minutes > 0 ? minutes + ' min read' : '', saved.checked && record && record.anchor ? 'Opens your saved section' : ''].filter(Boolean).join(' · '), 'library-meta'));
    return el;
  }
  function render(reset, focusIndex) {
    if (!ready) return;
    if (reset) limit = 12;
    var q = input.value.trim().slice(0, 120).toLowerCase();
    var terms = q.split(/\s+/).filter(Boolean), places = savedPages();
    var matches = items.filter(function (a) {
      return (!topic.value || category(a) === topic.value) && (!saved.checked || places[a.url]);
    }).map(function (a) {
      var title = a.title.toLowerCase(), body = [a.excerpt, a.keywords, a.tags.join(' ')].join(' ').toLowerCase();
      var score = 0;
      var allTermsMatch = terms.every(function (term) {
        var inTitle = containsTerm(title, term), inBody = containsTerm(body, term);
        score += (inTitle ? 10 : 0) + (inBody ? 3 : 0);
        return inTitle || inBody;
      });
      return {a:a, score:score, matches:allTermsMatch};
    }).filter(function (x) { return x.matches; });
    matches.sort(function (a, b) {
      if (sort.value === 'relevance' && q && a.score !== b.score) return b.score - a.score;
      return b.a.date.localeCompare(a.a.date) || a.a.title.localeCompare(b.a.title);
    });
    list.replaceChildren();
    matches.slice(0, limit).forEach(function (x) { list.appendChild(card(x.a, places[x.a.url])); });
    var shown = Math.min(limit, matches.length), remaining = matches.length - shown;
    count.textContent = matches.length + ' article' + (matches.length === 1 ? '' : 's') + (q ? ' matching “' + input.value.trim().slice(0, 120) + '”' : '') + '. Showing ' + shown + '.';
    more.hidden = remaining === 0;
    more.textContent = 'Show ' + Math.min(12, remaining) + ' more article' + (remaining === 1 ? '' : 's');
    if (!matches.length) {
      var empty = node('div', undefined, 'library-empty');
      empty.appendChild(node('h3', saved.checked ? 'No saved articles match these filters' : 'No matching articles yet'));
      empty.appendChild(node('p', saved.checked ? 'Use Save reading place inside an article, then return here. Saved places are kept only in this browser.' : 'Try a shorter term such as Excel, resume, pricing or AI, or clear the filters.'));
      list.appendChild(empty);
    }
    // Move keyboard users to the first newly revealed result, including the final batch.
    if (typeof focusIndex === 'number' && list.children[focusIndex]) {
      var firstNew = list.children[focusIndex].querySelector('a');
      if (firstNew) firstNew.focus();
    }
    try {
      var url = new URL(location.href);
      q ? url.searchParams.set('q', input.value.trim().slice(0, 120)) : url.searchParams.delete('q');
      topic.value ? url.searchParams.set('topic', topic.value) : url.searchParams.delete('topic');
      url.searchParams.set('sort', sort.value);
      saved.checked ? url.searchParams.set('saved', '1') : url.searchParams.delete('saved');
      history.replaceState(null, '', url);
    } catch (_) {}
  }
  // Restore the URL before loading so typing while the request is in flight is retained.
  var params = new URLSearchParams(location.search);
  input.value = (params.get('q') || '').slice(0, 120);
  if (['career', 'business', 'money', 'ai'].includes(params.get('topic'))) topic.value = params.get('topic');
  sort.value = params.get('sort') === 'relevance' ? 'relevance' : 'newest';
  saved.checked = params.get('saved') === '1';
  form.addEventListener('submit', function (event) { event.preventDefault(); clearTimeout(timer); render(true); });
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { render(true); }, 180); });
  [topic, sort, saved].forEach(function (el) { el.addEventListener('change', function () { render(true); }); });
  clear.addEventListener('click', function () { input.value = ''; topic.value = ''; saved.checked = false; sort.value = 'newest'; render(true); input.focus(); });
  more.addEventListener('click', function () { var previous = list.children.length; limit += 12; render(false, previous); });
  window.addEventListener('storage', function (event) { if (event.key === 'fp_reading_places_v1' || event.key === null) render(false); });
  // A back/forward-cache return must reflect articles saved in the meantime.
  window.addEventListener('pageshow', function (event) { if (event.persisted) render(false); });

  function load() {
    ready = false;
    list.replaceChildren(node('p', 'Loading the article library…'));
    list.setAttribute('aria-busy', 'true');
    count.textContent = 'Loading articles…';
    more.hidden = true;
    var requestTimer, controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = new Promise(function (_, reject) {
      requestTimer = setTimeout(function () { if (controller) controller.abort(); reject(Error('Library request timed out')); }, 12000);
    });
    Promise.race([fetch('/articles-index.json', controller ? {signal:controller.signal} : {}).then(function (response) {
      if (!response.ok) throw Error('Library unavailable');
      return response.json();
    }), timeout]).then(function (data) {
      if (!data || !Array.isArray(data.articles)) throw Error('Invalid library');
      var seen = Object.create(null);
      items = data.articles.reduce(function (valid, a) {
        if (!a || typeof a.title !== 'string' || !a.title.trim()) return valid;
        var url = safeURL(a.url);
        if (!url || seen[url]) return valid;
        seen[url] = true;
        valid.push({url:url, title:a.title, excerpt:typeof a.excerpt === 'string' ? a.excerpt : '', keywords:typeof a.keywords === 'string' ? a.keywords : '', tags:Array.isArray(a.tags) ? a.tags.filter(function (t) { return typeof t === 'string'; }) : [], date:typeof a.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.date) && !isNaN(Date.parse(a.date)) ? a.date : '', readTime:a.readTime});
        return valid;
      }, []);
      if (!items.length) throw Error('Empty library');
      clearTimeout(requestTimer); list.removeAttribute('aria-busy'); ready = true; render(true);
    }).catch(function () {
      clearTimeout(requestTimer); list.removeAttribute('aria-busy'); count.textContent = 'The article library could not load.'; list.replaceChildren();
      var p = node('p', 'Try again, or browse the topic guides on the '), a = node('a', 'Start here page'); a.href = '/start-here'; p.appendChild(a); list.appendChild(p);
      var retry = node('button', 'Retry loading articles', 'library-retry'); retry.type = 'button'; retry.addEventListener('click', load); list.appendChild(retry); more.hidden = true;
    });
  }
  load();
}());
