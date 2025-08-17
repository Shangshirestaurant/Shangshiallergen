const state = { allergens: [], menu: [], selected: new Set(), mode: 'safe', q: '', ingQ: '', lang: 'en' };

/* --- i18n --- */
const I18N = {"en": {"hero_title": "Effortless allergen checks for flawless service", "hero_body": "Tick allergens, see safe dishes instantly. Designed for iPhone/iPad and quick guest interactions.", "open_selector": "Open selector", "ingredients": "Ingredients", "select_allergens": "Select allergens", "mode_safe": "SAFE (exclude)", "mode_contains": "CONTAINS", "search_dishes": "Search dishes\u2026", "search_ingredients": "Search by ingredient\u2026", "search_dishes_or_ing": "Search dishes or ingredients\u2026", "disclaimer": "\u26a0\ufe0f Chef must verify codes before FOH use.", "no_matches": "No dishes match your filters.", "clear": "Clear", "back": "Back", "preset_glutenfree": "Gluten\u2011free", "preset_dairyfree": "Dairy\u2011free", "preset_nutfree": "Nut\u2011free"}, "et": {"hero_title": "Allergeenide kontroll kiireks teeninduseks", "hero_body": "M\u00e4rgi allergeenid ja n\u00e4e kohe sobivaid roogasid. M\u00f5eldud iPhone\u2019i/iPadi ja kiireks suhtluseks.", "open_selector": "Ava valik", "ingredients": "Koostisosad", "select_allergens": "Vali allergeenid", "mode_safe": "TURVALISED (v\u00e4lista)", "mode_contains": "SISALDAB", "search_dishes": "Otsi roogasid\u2026", "search_ingredients": "Otsi koostisosade j\u00e4rgi\u2026", "search_dishes_or_ing": "Otsi roogi v\u00f5i koostisosi\u2026", "disclaimer": "\u26a0\ufe0f Kokk peab koodid FOH jaoks kinnitama.", "no_matches": "Sinu filtritega roogasid ei leitud.", "clear": "T\u00fchjenda", "back": "Tagasi", "preset_glutenfree": "Gluteenivaba", "preset_dairyfree": "Laktoosivaba", "preset_nutfree": "P\u00e4hklivaba"}};
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



// FIX: Only hide header.nav (top) and #stickyPanel (bottom) on scroll
(function(){
  var topEls = []; var t = document.querySelector('header.nav'); if (t) topEls.push(t);
  var bottomEls = []; var b = document.getElementById('stickyPanel'); if (b) bottomEls.push(b);

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
  window.addEventListener('scroll', function(){
    if (!ticking){ requestAnimationFrame(onScroll); ticking = true; }
  }, { passive:true });
})();
