const state = { allergens: [], menu: [], selected: new Set(), mode: 'safe', q: '' };
const badge = c => `<span class="badge">${c}</span>`;
const pill = c => `<span class="pill">${c}</span>`;

function renderFilterPills(){
  const el = document.getElementById('activeFilters');
  el.innerHTML = state.selected.size ? ('Selected: ' + Array.from(state.selected).map(pill).join(' ')) : '';
  const msCount = document.getElementById('msCount');
  if (state.selected.size){ msCount.textContent = state.selected.size; msCount.hidden = false; }
  else { msCount.hidden = true; }
}

function matchesQ(d){ if(!state.q) return true; const q=state.q.toLowerCase(); return d.dish.toLowerCase().includes(q) || (d.notes||'').toLowerCase().includes(q); }
function isSafe(d){ for(const c of state.selected){ if(d.codes.includes(c)) return false; } return true; }
function containsSel(d){ if(!state.selected.size) return false; for(const c of state.selected){ if(d.codes.includes(c)) return true; } return false; }

function renderList(){
  const wrap=document.getElementById('results'); const empty=document.getElementById('empty');
  let list=state.menu.filter(matchesQ);
  list=(state.mode==='safe')?list.filter(isSafe):list.filter(containsSel);
  wrap.innerHTML=list.map(d=>`<article class="card"><h4>${d.dish}</h4><div>${d.codes.map(badge).join(' ')||'<span class="badge">No codes</span>'}</div>${d.notes?`<div class="note" style="margin-top:6px; color:var(--muted)">${d.notes}</div>`:''}</article>`).join('');
  empty.style.display=list.length?'none':'block';
}

function renderDropdown(){
  const list = document.getElementById('msList');
  list.innerHTML = state.allergens.map(a => `
    <label class="ms-item">
      <input type="checkbox" value="${a.code}" ${state.selected.has(a.code)?'checked':''}>
      <span class="code">${a.code}</span>
      <span class="name">${a.name}</span>
    </label>
  `).join('');
  list.querySelectorAll('input[type=checkbox]').forEach(chk => {
    chk.addEventListener('change', e => {
      const c = e.target.value;
      if (e.target.checked) state.selected.add(c); else state.selected.delete(c);
      renderFilterPills(); renderList();
    });
  });
}

function wireMultiSelect(){
  const toggle = document.getElementById('msToggle');
  const menu = document.getElementById('msMenu');
  const done = document.getElementById('msDone');
  const clear = document.getElementById('msClear');
  function close(){ menu.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); }
  function open(){ menu.classList.add('open'); toggle.setAttribute('aria-expanded','true'); menu.setAttribute('aria-hidden','false'); }
  toggle.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
  done.addEventListener('click', close);
  clear.addEventListener('click', () => { state.selected.clear(); renderDropdown(); renderFilterPills(); renderList(); });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target) && !toggle.contains(e.target)) close(); });
}

function wireCommon(){
  const s = document.getElementById('search');
  s.addEventListener('input', e => { state.q = e.target.value; renderList(); });
  document.getElementById('clearBtn').addEventListener('click', () => {
    state.selected.clear();
    renderDropdown(); s.value=''; state.q=''; renderFilterPills(); renderList();
  });
  document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', e => { state.mode = e.target.value; renderList(); }));
}

async function load(){
  const [aRes,mRes]=await Promise.all([fetch('allergens.json'), fetch('menu.json')]);
  state.allergens=await aRes.json(); state.menu=await mRes.json();
  renderDropdown(); renderFilterPills(); renderList();
}

wireMultiSelect(); wireCommon(); load();
