
// Force dark mode on load
document.addEventListener('DOMContentLoaded', function(){
  var root = document.documentElement;
  root.classList.add('dark');
  root.setAttribute('data-theme','dark');
  try{ localStorage.setItem('theme','dark'); }catch(e){}
});
\nconst state = { allergens: [], menu: [], selected: new Set(), mode: 'safe', q: '', ingQ: '', lang: 'en' };

/* --- i18n --- */
const I18N = {"en": {"hero_title": "Shang Shi FOH Allegern Selector", "hero_body": "Tick allergens, see safe dishes instantly.", "open_selector": "Open selector", "ingredients": "Ingredients", "select_allergens": "Select allergens", "mode_safe": "SAFE (exclude)", "mode_contains": "CONTAINS", "search_dishes": "Search dishes\u2026", "search_ingredients": "Search by ingredient\u2026", "search_dishes_or_ing": "Search dishes or ingredients\u2026", "disclaimer": "\u26a0\ufe0f Chef must verify codes before FOH use.", "no_matches": "No dishes match your filters.", "clear": "Clear", "back": "Back", "preset_glutenfree": "Gluten\u2011free", "preset_dairyfree": "Dairy\u2011free", "preset_nutfree": "Nut\u2011free"}, "et": {"hero_title": "Allergeenide kontroll kiireks teeninduseks", "hero_body": "M\u00e4rgi allergeenid ja n\u00e4e kohe sobivaid roogasid. M\u00f5eldud iPhone\u2019i/iPadi ja kiireks suhtluseks.", "open_selector": "Ava valik", "ingredients": "Koostisosad", "select_allergens": "Vali allergeenid", "mode_safe": "TURVALISED (v\u00e4lista)", "mode_contains": "SISALDAB", "search_dishes": "Otsi roogasid\u2026", "search_ingredients": "Otsi koostisosade j\u00e4rgi\u2026", "search_dishes_or_ing": "Otsi roogi v\u00f5i koostisosi\u2026", "disclaimer": "\u26a0\ufe0f Kokk peab koodid FOH jaoks kinnitama.", "no_matches": "Sinu filtritega roogasid ei leitud.", "clear": "T\u00fchjenda", "back": "Tagasi", "preset_glutenfree": "Gluteenivaba", "preset_dairyfree": "Laktoosivaba", "preset_nutfree": "P\u00e4hklivaba"}};
function applyI18n(){
  const lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n'); if (I18N[lang][k]) el.textContent = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder'); if (I18N[lang][k]) el.placeholder = I18N[lang][k];
  });
  const btn = document.getElementById('langToggle'); if (btn) btn.textContent = lang.toUpperCase();
}

/* --- Theme --- */
function applyTheme(){
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  const btn = document.getElementById('themeToggle'); if (btn) btn.textContent = (t==='dark'?'🌙':'☀️');
}

/* --- Rendering helpers --- */
const badge = c => `<span class="badge">${c}</span>`;
const tag   = t => `<span class="tag">${t}</span>`;
const safeTag = () => `<span class="safe-tag">✓ SAFE</span>`;

function filterMatches(d){ const q=state.q.toLowerCase(); const iq=state.ingQ.toLowerCase();
  const matchesQ = !q || d.dish.toLowerCase().includes(q) || (d.notes||'').toLowerCase().includes(q);
  const matchesI = !iq || (d.ingredients||[]).join(' ').toLowerCase().includes(iq);
  return matchesQ && matchesI;
}
function isSafe(d){ for(const c of state.selected){ if(d.codes.includes(c)) return false; } return true; }
function containsSel(d){ if(!state.selected.size) return false; for(const c of state.selected){ if(d.codes.includes(c)) return true; } return false; }

function renderList(){
  const wrap=document.getElementById('results'); const empty=document.getElementById('empty'); if(!wrap) return;
  let list=state.menu.filter(filterMatches);
  list=(state.mode==='safe')?list.filter(isSafe):list.filter(containsSel);
  // optional grouping by category
  const groups = {};
  list.forEach(d => { const cat = d.category || 'Other'; (groups[cat] ||= []).push(d); });

  wrap.innerHTML = Object.keys(groups).sort().map(cat => {
    const items = groups[cat].map(d => {
      const safeBadge = (state.selected.size && state.mode==='safe' && isSafe(d)) ? safeTag() : '';
      return `<article class="card">
        <h4>${d.dish} ${safeBadge}</h4>
        <div class="badges">${d.codes.map(b=>badge(b)).join(' ')||badge('No codes')}</div>
        ${(d.ingredients&&d.ingredients.length)?`<div class="tags">${d.ingredients.slice(0,4).map(tag).join(' ')}${d.ingredients.length>4?` <span class="note">+ ${d.ingredients.length-4} more</span>`:''}</div>`:''}
        ${d.notes?`<div class="note">${d.notes}</div>`:''}
      </article>`;
    }).join('');
    return `<h3 class="section-title">${cat}</h3><div class="cards">${items}</div>`;
  }).join('');

  if(empty) empty.style.display = list.length ? 'none' : 'block';
}

function renderIngredients(){
  const box=document.getElementById('ingList'); if(!box) return;
  const empty=document.getElementById('ingEmpty');
  const q=(document.getElementById('ingSearch')?.value||'').toLowerCase();
  const list=state.menu.filter(d => (!q) || d.dish.toLowerCase().includes(q) || (d.ingredients||[]).join(' ').toLowerCase().includes(q));
  box.innerHTML=list.map(d=>{
    const ings=d.ingredients && d.ingredients.length ? d.ingredients.map(i=>`<span class="tag">${i}</span>`).join('') : '';
    return `<article class="card">
      <h4>${d.dish}</h4>
      <div class="badges">${d.codes.map(c=>`<span class="badge">${c}</span>`).join(' ')}</div>
      ${ings?`<div class="tags">${ings}</div>`:`<div class="note">Ingredients: add later in <code>menu.json</code>.</div>`}
      ${d.notes?`<div class="note">${d.notes}</div>`:''}
    </article>`;
  }).join('');
  if (empty) empty.style.display = list.length ? 'none' : 'block';
}

function renderDropdown(){
  const list = document.getElementById('msList'); if(!list) return;
  list.innerHTML = state.allergens.map(a => `
    <label class="ms-item">
      <input type="checkbox" value="${a.code}" ${state.selected.has(a.code)?'checked':''}>
      <span class="code">${a.code}</span><span class="name">${a.name}</span>
    </label>`).join('');
  list.querySelectorAll('input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', e => {
      const c=e.target.value; e.target.checked?state.selected.add(c):state.selected.delete(c);
      renderList();
    });
  });
}

/* --- Presets --- */
function applyPreset(name){
  // Map preset -> allergen name substrings to include
  const map = {
    gluten: ['gluten','wheat','gluteen'],
    dairy: ['milk','lactose','dairy','piim','laktoos'],
    nuts: ['nut','almond','hazelnut','peanut','pähkel','maapähkel']
  };
  const keys = map[name]; if(!keys) return;
  state.selected.clear();
  for(const a of state.allergens){
    const nm = a.name.toLowerCase();
    if(keys.some(k => nm.includes(k))) state.selected.add(a.code);
  }
  renderDropdown(); renderList();
}

/* --- Common wiring --- */
function wireUI(){
  // Search fields
  const s=document.getElementById('search'); s && s.addEventListener('input',e=>{state.q=e.target.value; renderList();});
  const ing=document.getElementById('ingInline'); ing && ing.addEventListener('input',e=>{state.ingQ=e.target.value; renderList();});
  document.getElementById('clearBtn')?.addEventListener('click',()=>{ state.selected.clear(); if(s) s.value=''; if(ing) ing.value=''; state.q=''; state.ingQ=''; renderDropdown(); renderList(); });

  // Mode toggles
  document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', e => { state.mode = e.target.value; renderList(); }));

  // Preset chips
  document.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));

  // Bottom-sheet interactions
  const sheet=document.getElementById('stickyPanel');
  const handle=document.getElementById('sheetHandle');
  const open = ()=>{ sheet.classList.add('expanded'); handle.setAttribute('aria-expanded','true'); };
  const close= ()=>{ sheet.classList.remove('expanded'); handle.setAttribute('aria-expanded','false'); };
  handle?.addEventListener('click', e=>{ e.stopPropagation(); sheet.classList.contains('expanded')?close():open(); });
  document.addEventListener('click', e=>{ if(sheet.classList.contains('expanded') && !sheet.contains(e.target)) close(); });

  // FAB scroll to top
  const fab = document.getElementById('toTop');
  if (fab) {
    fab.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    window.addEventListener('scroll', () => { fab.style.display = (window.scrollY > 400 ? 'block' : 'none'); }, {passive:true});
  }

  // i18n toggle
  const savedLang = localStorage.getItem('lang') || 'en';
  state.lang = savedLang; applyI18n();
  document.getElementById('langToggle')?.addEventListener('click', () => {
    state.lang = (state.lang === 'en' ? 'et' : 'en'); localStorage.setItem('lang', state.lang); applyI18n();
  });

  // Theme toggle
  applyTheme();
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const t = (localStorage.getItem('theme') || 'light') === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', t); applyTheme();
  });

  // Auto-collapse on scroll (keep peek only)
  (function autoCollapseOnScroll(){
    let last = window.pageYOffset;
    window.addEventListener('scroll', () => {
      const y = window.pageYOffset;
      if (y > last + 8) sheet?.classList.remove('expanded');
      last = y;
    }, { passive: true });
  })();

  // iOS toolbar overlap
  function setToolbar(){
    const vv=window.visualViewport; const inner=window.innerHeight; const vis=vv?vv.height:inner;
    const overlap=Math.max(0, Math.round(inner-vis));
    document.documentElement.style.setProperty('--toolbar', overlap+'px');
  }
  setToolbar(); window.visualViewport && (visualViewport.addEventListener('resize', setToolbar, {passive:true}), visualViewport.addEventListener('scroll', setToolbar, {passive:true}));
}

async function load(){
  try{
    const [a,m] = await Promise.all([fetch('allergens.json'), fetch('menu.json')]);
    state.allergens = await a.json(); state.menu = await m.json();
  }catch(e){ /* offline first load will use cache */ }
  renderDropdown(); renderList(); renderIngredients(); wireUI();
}
load();



// --- Extra Presets Wiring (robust to unknown DOM structures) ---
(function(){
  const bar = document.querySelector('#preset-bar') || document;
  const map = {
    'gluten-free': ['gluten'],
    'crustacean-free': ['crustacean','crustaceans'],
    'milk-free': ['milk','dairy'],
    // shellfish often means crustaceans + molluscs
    'shellfish-free': ['shellfish','mollusc','molluscs','crustacean','crustaceans']
  };

  function setCheckboxChecked(cb, val){
    if(!cb) return;
    if(cb.checked !== val){
      cb.checked = val;
      cb.dispatchEvent(new Event('change', {bubbles:true}));
      cb.dispatchEvent(new Event('input', {bubbles:true}));
    }
  }

  function labelTextFor(cb){
    // try common structures: <label for=id>, parent label, sibling label
    const id = cb.getAttribute('id');
    let lbl = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    if(!lbl && cb.closest('label')) lbl = cb.closest('label');
    if(!lbl && cb.parentElement && cb.parentElement.tagName.toLowerCase()==='label') lbl = cb.parentElement;
    if(!lbl && cb.nextElementSibling && cb.nextElementSibling.tagName.toLowerCase()==='label') lbl = cb.nextElementSibling;
    return (lbl ? lbl.textContent : cb.getAttribute('data-allergen') || cb.value || '').toLowerCase();
  }

  function applyPresetName(name){
    const keywords = map[name];
    if(!keywords) return;
    // Strategy: mark allergen checkboxes that MATCH keywords to "ON" (meaning: exclude dishes containing them)
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    const allergenBoxes = cbs.filter(el => /allergen|allergy|filter/i.test(el.name||'') || /allergen|allergy|filter/i.test(el.id||'') || el.hasAttribute('data-allergen'));
    // First, do not touch unrelated checkboxes; only toggle those whose labels match the keywords
    allergenBoxes.forEach(cb => {
      const txt = labelTextFor(cb);
      const hit = keywords.some(kw => txt.includes(kw));
      if(hit){
        setCheckboxChecked(cb, true);
      }
    });
    // Optionally, trigger any recompute if the app exposes a function
    if(typeof window.applyPreset === 'function' && window.applyPreset.length <= 1){
      try{ window.applyPreset(name); }catch(e){/* no-op */}
    }
  }

  bar.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-preset]');
    if(!btn) return;
    e.preventDefault();
    applyPresetName(btn.getAttribute('data-preset'));
  }, {passive:false});
})();



// Intro overlay: always show until user taps Enter (iOS-safe)
document.addEventListener('DOMContentLoaded', function(){
  var intro = document.getElementById('intro-screen');
  var enterBtn = document.getElementById('enter-btn');
  var appContent = document.getElementById('app-content');
  function reveal(){
    if (intro && intro.parentNode) { try { intro.parentNode.removeChild(intro); } catch(e){} }
    if (appContent) appContent.classList.remove('hidden');
  }
  if (intro && enterBtn){
    enterBtn.addEventListener('click', function(){
      intro.classList.add('hide');
      setTimeout(reveal, 600);
    }, { once:true });
  } else {
    reveal();
  }
});



// Scoped scroll fade: header.nav, toolbar (filters), and bottom-sheet if present
(function(){
  var topEls = [];
  var header = document.querySelector('header.nav'); if (header) topEls.push(header);
  var toolbar = document.querySelector('.toolbar, .allergen-bar, .filters-bar, .top-controls'); if (toolbar) topEls.push(toolbar);

  var bottomEls = [];
  var sticky = document.getElementById('stickyPanel'); if (sticky) bottomEls.push(sticky);
  var sheet = document.querySelector('.bottom-sheet'); if (sheet) bottomEls.push(sheet);

  topEls.forEach(function(el){ el.classList.add('show-on-scroll'); });
  bottomEls.forEach(function(el){ el.classList.add('show-on-scroll-bottom'); });

  var lastY = window.scrollY || 0, ticking = false;
  function onScroll(){
    var y = window.scrollY || 0;
    var down = y > lastY + 6, up = y < lastY - 6;
    if (down){
      topEls.forEach(el => { el.classList.remove('show-on-scroll'); el.classList.add('hide-on-scroll'); });
      bottomEls.forEach(el => { el.classList.remove('show-on-scroll-bottom'); el.classList.add('hide-on-scroll-bottom'); });
    } else if (up){
      topEls.forEach(el => { el.classList.remove('hide-on-scroll'); el.classList.add('show-on-scroll'); });
      bottomEls.forEach(el => { el.classList.remove('hide-on-scroll-bottom'); el.classList.add('show-on-scroll-bottom'); });
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function(){ if (!ticking){ requestAnimationFrame(onScroll); ticking = true; } }, { passive:true });
})();


// Ensure intro logo element also has a CSS background as fallback
document.addEventListener('DOMContentLoaded', function(){
  var logoBtn = document.querySelector('#intro-screen .intro-logo');
  if (logoBtn && logoBtn.dataset.bg){
    logoBtn.style.backgroundImage = 'url("' + logoBtn.dataset.bg + '")';
  }
});



// Intro overlay: show every load; logo acts as button (logo.jpg?v=20250818_logoJPG_introGlow_fullscreen_zipfix)
document.addEventListener('DOMContentLoaded', function(){
  var intro = document.getElementById('intro-screen');
  var app   = document.getElementById('app-content');
  var btn   = document.getElementById('enter-btn');
  function reveal(){
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    if (app) app.classList.remove('hidden');
    document.body.classList.remove('intro-active');
  }
  if (intro){
    document.body.classList.add('intro-active');
    // ensure CSS background fallback applied
    var logoBtn = document.querySelector('#intro-screen .intro-logo');
    if (logoBtn){ logoBtn.style.backgroundImage = 'url("logo.jpg?v=20250818_logoJPG_introGlow_fullscreen_zipfix")'; }
    (btn || intro).addEventListener('click', function(){
      intro.classList.add('hide');
      setTimeout(reveal, 500);
    }, { once:true });
  } else {
    reveal();
  }
});



// Scoped scroll fade only for header + stickyPanel
(function(){
  var topEls = [];
  var header = document.querySelector('header.nav'); if (header) topEls.push(header);

  var bottomEls = [];
  var sticky = document.getElementById('stickyPanel'); if (sticky) bottomEls.push(sticky);

  topEls.forEach(el => el.classList.add('show-on-scroll'));
  bottomEls.forEach(el => el.classList.add('show-on-scroll-bottom'));

  var lastY = window.scrollY || 0, ticking = false;
  function onScroll(){
    var y = window.scrollY || 0;
    var down = y > lastY + 6, up = y < lastY - 6;
    if (down){
      topEls.forEach(el => { el.classList.remove('show-on-scroll'); el.classList.add('hide-on-scroll'); });
      bottomEls.forEach(el => { el.classList.remove('show-on-scroll-bottom'); el.classList.add('hide-on-scroll-bottom'); });
    } else if (up){
      topEls.forEach(el => { el.classList.remove('hide-on-scroll'); el.classList.add('show-on-scroll'); });
      bottomEls.forEach(el => { el.classList.remove('hide-on-scroll-bottom'); el.classList.add('show-on-scroll-bottom'); });
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function(){ if(!ticking){ requestAnimationFrame(onScroll); ticking = true; } }, { passive:true });
})();

document.addEventListener('click', function(e){
  var btn = e.target.closest('#stickyPanel .cta-btn');
  if (!btn) return;
  var ev = new CustomEvent('openAllergens', { bubbles: true });
  document.dispatchEvent(ev);
  var target = document.querySelector('#filters, .filters, .allergen-bar, .toolbar');
  if (target){ target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});



// Self-heal: ensure stickyPanel exists and is clickable
document.addEventListener('DOMContentLoaded', function(){
  var panel = document.getElementById('stickyPanel');
  if (!panel){
    panel = document.createElement('div');
    panel.id = 'stickyPanel';
    panel.innerHTML = '<button id="open-allergens" class="cta-btn" type="button">Select allergens</button>';
    var header = document.querySelector('header.nav');
    (header && header.parentNode) ? header.parentNode.insertBefore(panel, header.nextSibling) : document.body.appendChild(panel);
  }
  var btn = panel.querySelector('.cta-btn');
  if (btn){
    btn.addEventListener('click', function(){
      // Dispatch custom event for your app to handle
      document.dispatchEvent(new CustomEvent('openAllergens', { bubbles:true }));
      // Fallback: scroll to filters if present
      var target = document.querySelector('#filters, .filters, .allergen-bar, .toolbar');
      if (target){ target.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  }
});



// Disable any auto-hide-on-scroll behavior; keep header & bar visible
(function(){
  try{
    var header = document.querySelector('header.nav');
    if (header){
      header.classList.add('show-on-scroll');
      header.classList.remove('hide-on-scroll');
      // If an old scroll handler exists, replace with a no-op
      window.addEventListener('scroll', function(){ 
        header.classList.add('show-on-scroll'); 
        header.classList.remove('hide-on-scroll'); 
      }, { passive:true });
    }
    var panel = document.getElementById('stickyPanel');
    if (panel){
      panel.classList.add('show-on-scroll-bottom');
      panel.classList.remove('hide-on-scroll-bottom');
    }
  }catch(e){/* noop */}
})();

\n
// Back-to-top behavior
(function(){
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    btn.style.pointerEvents = 'auto';
    var ticking = false;
    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (y > 300) btn.classList.add('show'); else btn.classList.remove('show');
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
    btn.addEventListener('click', function(){
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top:0, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
})();
\n

// ----- Quick Preset Filters (Gluten-free, Nut-free, etc.) -----
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('presetBar');
  if (!bar) return;

  // Allergen keys (adjust to match your allergens.json keys)
  const A = {
    gluten: 'gluten',
    peanuts: 'peanuts',
    treenuts: 'tree_nuts',
    dairy: 'dairy',
    eggs: 'eggs',
    fish: 'fish',
    shellfish: 'shellfish',
    soy: 'soy',
    sesame: 'sesame',
  };

  const PRESETS = [
    { id: 'gf',    label: 'Gluten-free',     exclude: [A.gluten] },
    { id: 'nf',    label: 'Nut-free',        exclude: [A.peanuts, A.treenuts, A.sesame] },
    { id: 'df',    label: 'Dairy-free',      exclude: [A.dairy] },
    { id: 'ef',    label: 'Egg-free',        exclude: [A.eggs] },
    { id: 'shell', label: 'Shellfish-free',  exclude: [A.shellfish] },
    { id: 'soyf',  label: 'Soy-free',        exclude: [A.soy] },
    { id: 'fishf', label:'Fish-free',        exclude: [A.fish] },
  ];

  // Render preset buttons
  bar.innerHTML = PRESETS.map(p => 
    `<button class="preset-btn" type="button" data-id="${p.id}">${p.label}</button>`
  ).join('');

  const btns = Array.from(bar.querySelectorAll('.preset-btn'));

  function applyPreset(preset){
    const excludeSet = new Set(preset.exclude);

    // Integration path A: native globals
    let integrated = false;
    try {
      if (window.selectedAllergens instanceof Set && typeof window.renderMenu === 'function') {
        window.selectedAllergens.clear();
        excludeSet.forEach(a => window.selectedAllergens.add(a));
        window.renderMenu();
        integrated = true;
      }
    } catch(e){}

    // Integration path B: broadcast an event for your existing filter logic
    if (!integrated){
      document.dispatchEvent(new CustomEvent('applyAllergens', {
        detail: { include: new Set(), exclude: excludeSet }
      }));
    }

    // Visual state + persistence
    btns.forEach(b => b.classList.toggle('active', b.dataset.id === preset.id));
    try { localStorage.setItem('lastPreset', preset.id); } catch(e){}
  }

  // Wire click handlers
  btns.forEach(b => b.addEventListener('click', () => {
    const preset = PRESETS.find(p => p.id === b.dataset.id);
    if (preset) applyPreset(preset);
  }));

  // Restore last preset on load
  const last = (localStorage.getItem('lastPreset') || '').trim();
  const start = PRESETS.find(p => p.id === last);
  if (start) applyPreset(start);
});

// Example listener for apps that prefer event-based integration:
document.addEventListener('applyAllergens', (e) => {
  // If your code is checkbox-based, update your UI here and call render.
  // This is a placeholder hook — keep if needed, or remove if you use Set+renderMenu path.
});



// Intro: ensure logo click reveals app
(function(){
  function ready(fn){ if (document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    var intro = document.getElementById('intro-screen');
    var app   = document.getElementById('app-content');
    var btn   = document.getElementById('enter-btn');

    function reveal(){
      if (intro && intro.parentNode){ intro.parentNode.removeChild(intro); }
      if (app){ app.classList.remove('hidden'); }
      document.body.classList.remove('intro-active');
      // notify other scripts if they need to recalc layout
      document.dispatchEvent(new CustomEvent('introHidden', { bubbles:true }));
    }

    if (intro){
      document.body.classList.add('intro-active');
      // Click anywhere in the center block or on the button
      (btn || intro).addEventListener('click', function(){
        intro.classList.add('hide');
        setTimeout(reveal, 500);
      }, { once:true });
      // Escape key fallback
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape'){ reveal(); }
      }, { once:true });
    } else {
      // If no intro, ensure content is visible
      if (app){ app.classList.remove('hidden'); }
      document.body.classList.remove('intro-active');
    }
  });
})();



// Intro: make sure clicking the logo (or overlay) enters
document.addEventListener('DOMContentLoaded', function(){
  var intro = document.getElementById('intro-screen');
  var app   = document.getElementById('app-content');
  var btn   = document.getElementById('enter-btn');

  function reveal(){
    if (intro && intro.parentNode){ intro.parentNode.removeChild(intro); }
    if (app){ app.classList.remove('hidden'); }
    document.body.classList.remove('intro-active');
    document.dispatchEvent(new CustomEvent('introHidden', { bubbles: true }));
  }

  if (intro){
    document.body.classList.add('intro-active');
    var handle = function(ev){
      if (ev){ ev.preventDefault(); ev.stopPropagation(); }
      intro.classList.add('hide');
      setTimeout(reveal, 350);
    };
    if (btn){
      btn.addEventListener('pointerdown', handle, { once:true, capture:true });
      btn.addEventListener('click', handle, { once:true, capture:true });
      btn.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') handle(e);
      }, { once:true, capture:true });
    }
    // Fallback: allow tapping anywhere on the overlay to proceed
    intro.addEventListener('pointerdown', handle, { once:true, capture:true });
    intro.addEventListener('click', handle, { once:true, capture:true });
  } else {
    if (app) app.classList.remove('hidden');
  }

  // If someone lands on a deep link (e.g., #selector), auto-dismiss the intro
  if (location.hash && intro){
    setTimeout(() => intro.dispatchEvent(new Event('click', { bubbles:true })), 50);
  }
});

