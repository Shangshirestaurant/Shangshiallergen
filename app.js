const state = { allergens: [], menu: [], selected: new Set(), mode: 'safe', q: '', ingQ: '' };

const badge = c => `<span class="badge">${c}</span>`;
const tag   = t => `<span class="tag">${t}</span>`;

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
  wrap.innerHTML=list.map(d=>`
    <article class="card">
      <h4>${d.dish}</h4>
      <div class="badges">${d.codes.map(b=>badge(b)).join(' ')||badge('No codes')}</div>
      ${(d.ingredients&&d.ingredients.length)?`<div class="tags">${d.ingredients.slice(0,4).map(tag).join(' ')}${d.ingredients.length>4?` <span class="note">+ ${d.ingredients.length-4} more</span>`:''}</div>`:''}
      ${d.notes?`<div class="note">${d.notes}</div>`:''}
    </article>`).join('');
  if(empty) empty.style.display=list.length?'none':'block';
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
      renderList(); // update immediately
    });
  });
}

function wireUI(){
  const s=document.getElementById('search'); s && s.addEventListener('input',e=>{state.q=e.target.value; renderList();});
  const ing=document.getElementById('ingInline'); ing && ing.addEventListener('input',e=>{state.ingQ=e.target.value; renderList();});
  document.getElementById('clearBtn')?.addEventListener('click',()=>{ state.selected.clear(); if(s) s.value=''; if(ing) ing.value=''; state.q=''; state.ingQ=''; renderDropdown(); renderList(); });

  // Mode toggles
  document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', e => { state.mode = e.target.value; renderList(); }));

  // Bottom-sheet interactions
  const sheet=document.getElementById('stickyPanel');
  const handle=document.getElementById('sheetHandle');
  const open = ()=>{ sheet.classList.add('expanded'); handle.setAttribute('aria-expanded','true'); };
  const close= ()=>{ sheet.classList.remove('expanded'); handle.setAttribute('aria-expanded','false'); };
  handle?.addEventListener('click', e=>{ e.stopPropagation(); sheet.classList.contains('expanded')?close():open(); });
  document.addEventListener('click', e=>{ if(sheet.classList.contains('expanded') && !sheet.contains(e.target)) close(); });

  // iOS toolbar overlap
  function setToolbar(){
    const vv=window.visualViewport; const inner=window.innerHeight; const vis=vv?vv.height:inner;
    const overlap=Math.max(0, Math.round(inner-vis));
    document.documentElement.style.setProperty('--toolbar', overlap+'px');
  }
  setToolbar(); window.visualViewport && (visualViewport.addEventListener('resize', setToolbar, {passive:true}), visualViewport.addEventListener('scroll', setToolbar, {passive:true}));
}

async function load(){
  const [a,m] = await Promise.all([fetch('allergens.json'), fetch('menu.json')]);
  state.allergens = await a.json(); state.menu = await m.json();
  renderDropdown(); renderList(); wireUI();
}
load();
