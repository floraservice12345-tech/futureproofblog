(function(){
 'use strict';
 function init(){
  var body=document.querySelector('main.article-body, main.article-main, main.article-wrap, article.article-wrap, .article-content')||document.querySelector('.article-body,.article-wrap');
  if(!body||document.getElementById('fp-reading-tools'))return;
  var key='fp_reading_places_v1',path=location.pathname.replace(/\.html$/,'').replace(/\/$/,'');
  if(!/^\/article-[a-z0-9-]+$/.test(path))return;
  document.body.classList.add('fp-reading-page');
  function el(tag,text){var e=document.createElement(tag);if(text)e.textContent=text;return e;}
  function read(){
   var clean=Object.create(null);
   try{var data=JSON.parse(localStorage.getItem(key)||'{}');if(!data||typeof data!=='object'||Array.isArray(data))return clean;
    Object.keys(data).forEach(function(p){var record=data[p];if(/^\/article-[a-z0-9-]+$/.test(p)&&record&&typeof record==='object'&&typeof record.anchor==='string'&&record.anchor.length<=200&&Number.isFinite(record.at)&&record.at>0)clean[p]={anchor:record.anchor,at:record.at};});
   }catch(_){}return clean;
  }
  function save(data){try{localStorage.setItem(key,JSON.stringify(data));return true;}catch(_){return false;}}
  var heads=Array.from(body.querySelectorAll('h2')).filter(function(h){return !h.closest('aside,.sidebar,.guide-help,.reader-next-step,.author-box,.newsletter,.cta-box,.fp-toc,.fp-related,.toc,.guide-toc');});
  heads.forEach(function(h,i){if(!h.id){var base='reading-section-'+(i+1),id=base,n=1;while(document.getElementById(id))id=base+'-'+(++n);h.id=id;}if(!h.hasAttribute('tabindex'))h.setAttribute('tabindex','-1');});
  var tools=el('section');tools.id='fp-reading-tools';tools.className='fp-reading-tools';tools.setAttribute('aria-label','Reading tools');var row=el('div');row.className='fp-reading-actions';
  var saveBtn=el('button','Save reading place'),remove=el('button','Remove saved place'),print=el('button','Print article');[saveBtn,remove,print].forEach(function(b){b.type='button';row.appendChild(b);});
  var resume=el('a','Resume saved section'),library=el('a','Article library');library.href='/search';resume.hidden=true;row.appendChild(resume);row.appendChild(library);tools.appendChild(row);
  var message=el('p','Saved places stay in this browser. No account is needed.');message.className='fp-reading-status';message.setAttribute('role','status');message.setAttribute('aria-live','polite');tools.appendChild(message);
  function showSaved(){var record=read()[path];remove.hidden=!record;resume.hidden=true;if(record&&typeof record.anchor==='string'&&body.contains(document.getElementById(record.anchor))){resume.href='#'+encodeURIComponent(record.anchor);resume.hidden=false;}}
  saveBtn.addEventListener('click',function(){var selected=heads[0];heads.forEach(function(h){if(h.getBoundingClientRect().top<Math.max(120,window.innerHeight/2))selected=h;});var data=read();data[path]={anchor:selected?selected.id:'',at:Date.now()};var entries=Object.keys(data).sort(function(a,b){return Number(data[b].at||0)-Number(data[a].at||0);});entries.slice(100).forEach(function(p){delete data[p];});message.textContent=save(data)?'Article saved. Your furthest section is updated when you leave this page. Find it under Saved articles in the library.':'This browser could not save your place. You can bookmark this page instead.';showSaved();});
  remove.addEventListener('click',function(){var data=read();delete data[path];message.textContent=save(data)?'Saved place removed from this browser.':'This browser could not remove the saved place.';showSaved();});print.addEventListener('click',function(){window.print();});showSaved();
  // Only an explicitly saved article remembers its later position when the reader leaves.
  function rememberOnExit(){var data=read();if(!data[path])return;var selected=heads[0];heads.forEach(function(h){if(h.getBoundingClientRect().top<Math.max(120,window.innerHeight/2))selected=h;});var previous=heads.findIndex(function(h){return h.id===data[path].anchor;});if(previous>heads.indexOf(selected))return;data[path]={anchor:selected?selected.id:'',at:Date.now()};save(data);}
  window.addEventListener('pagehide',rememberOnExit);
  window.addEventListener('storage',function(e){if(e.key===key||e.key===null)showSaved();});
  window.addEventListener('pageshow',function(e){if(e.persisted)showSaved();});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')rememberOnExit();});
  var existing=body.querySelector('.toc,.guide-toc,.fp-toc,nav[aria-label="In this article"],nav[aria-label="Table of contents"],#toc');
  if(!existing&&heads.length>2){var details=el('details');details.className='fp-reading-toc';details.appendChild(el('summary','Jump to a section ('+heads.length+')'));var list=el('ol');heads.forEach(function(h){var li=el('li'),a=el('a',h.textContent.trim());a.href='#'+h.id;li.appendChild(a);list.appendChild(li);});details.appendChild(list);tools.appendChild(details);}
  body.insertBefore(tools,body.firstChild);
  // Keep jump targets visible beneath the existing sticky navigation, including wrapped mobile menus.
  var header=document.querySelector('body>header,body>nav');
  function updateOffset(){var height=0;if(header){var position=window.getComputedStyle(header).position;if(position==='sticky'||position==='fixed')height=header.getBoundingClientRect().height;}document.body.style.setProperty('--fp-reader-offset',(height+20)+'px');}
  updateOffset();window.addEventListener('resize',updateOffset);
  if(header&&typeof ResizeObserver==='function')new ResizeObserver(updateOffset).observe(header);
  // Saved-library links can target IDs created by this script after the initial HTML parse.
  if(location.hash){try{var initial=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(heads.indexOf(initial)!==-1)requestAnimationFrame(function(){initial.scrollIntoView();initial.focus({preventScroll:true});});}catch(_){}}

  var footer=el('p');footer.className='fp-reading-end';[['/start-here','Choose your next step'],['/about#editorial','Sources and corrections'],['/search?saved=1','Saved articles']].forEach(function(pair){var a=el('a',pair[1]);a.href=pair[0];footer.appendChild(a);});body.appendChild(footer);
  if(!document.querySelector('#fpb-progress,#fp-progress,#progress-bar,#reading-progress,.reading-progress')){var bar=el('div');bar.className='fp-reading-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);var scheduled=false;function progress(){var rect=body.getBoundingClientRect(),range=Math.max(1,body.offsetHeight-window.innerHeight),value=Math.max(0,Math.min(1,-rect.top/range));bar.style.transform='scaleX('+value+')';scheduled=false;}window.addEventListener('scroll',function(){if(!scheduled){scheduled=true;requestAnimationFrame(progress);}},{passive:true});window.addEventListener('resize',progress);progress();}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
}());
