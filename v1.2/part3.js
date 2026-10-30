  h+=`<p style="font-size:15px;">Ta marque : <b style="color:${me.delta>=0?'#2e7d32':'#c0392b'}">${me.delta>=0?'+':''}${me.delta}</b> en ${me.role} (${lbl(me.contract)}).`;
  if(eq!==null) h+=` À poste égal (${me.role.toLowerCase()}) : <b>mieux que ${eq} %</b> des ${same.length} joueur${same.length>1?'s':''}.`;
  else h+=` Tu es le premier à tenir cette main en ${me.role.toLowerCase()}.`;
  if(all!==null) h+=` Toutes positions : mieux que ${all} %.`;
  h+=`</p><table class="score-table"><tr><th>Joueur</th><th>Rôle</th><th>Contrat</th><th>Marque</th></tr>`;
  others.slice(-8).forEach(o=>{ h+=`<tr><td>${o.pseudo}</td><td>${o.role}</td><td>${lbl(o.contract)}</td><td>${o.delta>=0?'+':''}${o.delta}</td></tr>`; });
  h+=`</table><p class="small-note">Donne d'origine : ${lbl(entry.origin?.contract)} de ${entry.origin?.taker||'—'}. Enchères libres. Cette donne ne te sera plus jamais resservie.</p></div>`;
  return h;
}
/* ================================================================
   ZOOM CARTE (survol / maintien du doigt)
   ================================================================ */
let peekTimer=null, peekLock=false;
function attachZoom(el, c){
  // V1.2 : plus de fenêtre plein écran « Retour à la main » (elle captait les clics → « triple clic »).
  // Souris : la carte se soulève + son nom s'affiche. Doigt : appui long = aperçu agrandi, sans bloquer la table.
  el.addEventListener('mouseenter',()=>{ el.classList.add('peeking'); showPeek(c,false); });
  el.addEventListener('mouseleave',()=>{ el.classList.remove('peeking'); hidePeek(); });
  el.addEventListener('touchstart',()=>{ peekLock=false; clearTimeout(peekTimer);
    peekTimer=setTimeout(()=>{ peekLock=true; el.classList.add('peeking'); showPeek(c,true); },350); },{passive:true});
  const end=()=>{ clearTimeout(peekTimer); el.classList.remove('peeking'); setTimeout(hidePeek,40); };
  el.addEventListener('touchend',end,{passive:true}); el.addEventListener('touchcancel',end,{passive:true});
}
function showPeek(c, big){
  const pk=$('#peek'); pk.innerHTML='';
  if(big){ const e=cardEl(c); e.style.setProperty('--card-w',Math.round((L.cw||60)*1.6)+'px'); e.style.setProperty('--card-h',Math.round((L.ch||86)*1.6)+'px'); pk.appendChild(e); }
  const nm=document.createElement('div'); nm.className='nm'; nm.textContent=cardName(c); pk.appendChild(nm);
  pk.hidden=false;
}
function hidePeek(){ const pk=$('#peek'); if(pk){ pk.hidden=true; pk.innerHTML=''; } }
/* ================================================================
   PANNEAUX STATS / PROBAS / PAUSE
   ================================================================ */
function renderStatsPanel(){
  const s=G.stats;
  $('#stats-mode').textContent=`— table à ${G.n}`;
  const rows=[
    ['Donnes jouées', s.donnes], ['Contrats pris', s.prises], ['Contrats réussis', s.reussies],
    ['Taux de réussite', s.prises? Math.round(100*s.reussies/s.prises)+' %':'—'],
    ['Fois appelé (à 5)', s.appele], ['Poignées déclarées', s.poignees],
    ['Points gagnés', '+'+s.ptsPlus], ['Points perdus', '−'+s.ptsMoins],
    ['Petit au bout gagné', s.petitGagne], ['Petit au bout perdu', s.petitPerdu],
    ['Marque à cette table', (G.marque?G.marque[G.me]:0)],
  ];
  $('#stats-grid').innerHTML=rows.map(r=>`<div style="color:#7a6a55;">${r[0]}</div><div style="text-align:right;font-weight:700;">${r[1]}</div>`).join('');
}
function updateProbaPanel(){
  const m={
    3:{main:"À 3 : en moyenne <b>1 bout, 7 à 8 atouts</b>, 2 rois et 6 figures par main.", chien:"Chien de 6 : bout ≈ 1 chance sur 3,6 · roi ≈ 1 sur 2,8. Le chien renouvelle ¼ du jeu."},
    4:{main:"À 4 : en moyenne <b>1 bout, 5 à 6 atouts</b>, 1 roi et 4 figures par main.", chien:"Chien de 6 : bout ≈ 21,6 % (≈ 1/4,6) · roi ≈ 27,9 % (≈ 1/3,6). Le chien renouvelle ⅓ du jeu."},
    5:{main:"À 5 : un peu plus que la moyenne = <b>1 bout, 4 à 5 atouts</b>, 1 roi et 3 figures.", chien:"Chien de 3 : bout ≈ 11,2 % (≈ 1/9) · roi ≈ 14,8 % (≈ 1/7). Le chien renouvelle ⅕ du jeu."},
  }[G.n];
  $('#proba-main').innerHTML=m.main;
  $('#proba-chien').innerHTML=m.chien;
}
const THEMES={
  vif:    {felt:'#1f8f4e', dark:'#146b38', light:'#3cbf73', name:'Feutrine vive'},
  clair:  {felt:'#58bd7c', dark:'#43a262', light:'#83daa1', name:'Feutrine claire'},
  classic:{felt:'#4e9e6b', dark:'#3d8557', light:'#63b57f', name:'Feutrine classique'},
  tournoi:{felt:'#b05a52', dark:'#96463f', light:'#c9756c', name:'Rouge tournoi'},
  nuit:   {felt:'#5a6f9e', dark:'#475a83', light:'#7187b5', name:'Nuit de club'},
};
function renderThemes(){
  const row=$('#theme-row'); row.innerHTML='';
  Object.entries(THEMES).forEach(([id,t])=>{
    const b=document.createElement('button');
    b.className='cta secondary'; b.style.cssText=`font-size:14px;padding:6px 12px;background:${t.felt};box-shadow:0 3px 0 ${t.dark};`;
    b.textContent=t.name;
    b.onclick=()=>applyTheme(id);
    row.appendChild(b);
  });
}
function applyTheme(id){
  const t=THEMES[id]; if(!t) return;
  const r=document.documentElement.style;
  r.setProperty('--felt',t.felt); r.setProperty('--felt-dark',t.dark); r.setProperty('--felt-light',t.light);
  store.set('tarot.theme',id);
}
function renderSpeeds(){
  const row=$('#speed-row'); row.innerHTML='';
  [['Posé',1.4],['Standard',1],['Rapide',0.7]].forEach(([label,v])=>{
    const b=document.createElement('button');
    b.className='cta secondary'; b.style.cssText='font-size:14px;padding:6px 12px;';
    if(SPEED===v) b.style.outline='3px solid var(--accent)';
    b.textContent=label;
    b.onclick=()=>{SPEED=v; renderSpeeds();};
    row.appendChild(b);
  });
}
/* ================================================================
   NAVIGATION & DÉMARRAGE
   ================================================================ */
const NIV_LABELS={1:'1 — Débutant',2:'2 — Initié',3:'3 — Confirmé',4:'4 — Bon joueur',5:'5 — Très bon',6:'6 — Excellent'};
const CAR_LABELS={1:'très prudent',2:'prudent',3:'équilibré',4:'entreprenant',5:'audacieux',6:'casse-cou'};
function bindUI(){
  $('#p-niv').oninput=e=>$('#p-niv-val').textContent=NIV_LABELS[e.target.value];
  $('#p-car').oninput=e=>$('#p-car-val').textContent=CAR_LABELS[e.target.value];
  $('#btn-profile-ok').onclick=()=>{
    const vals={pseudo:$('#p-pseudo').value.trim()||'Moi', niveau:+$('#p-niv').value, caractere:+$('#p-car').value};
    if(EDIT && EDIT.id && PROFILES.some(p=>p.id===EDIT.id)) Object.assign(EDIT, vals);
    else{ EDIT={id:'p'+Date.now().toString(36), ...vals}; PROFILES.push(EDIT); }
    PROFILE=EDIT; saveProfiles(); store.set('tarot.current', PROFILE.id);
    $('#screen-profile').hidden=true; showSelect();
    if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
  };
  $('#btn-back-profile').onclick=()=>{ $('#screen-select').hidden=true; showProfile(); };
  document.querySelectorAll('.mode-card').forEach(c=>c.onclick=()=>startTable(+c.dataset.mode));
  $('#btn-dup').onclick=()=>launchDuplicate(G.n);
  $('#btn-next-dup').onclick=()=>{ $('#score-overlay').hidden=true; launchDuplicate(G.n); };
  window.addEventListener('resize',()=>{ if(!$('#screen-table').hidden){ renderSeats(); renderHand(); } else layout(); });
  $('#btn-home').onclick=quitToSelect;
  $('#btn-quit').onclick=()=>{ $('#pause-overlay').hidden=true; quitToSelect(); };
  $('#btn-score-quit').onclick=()=>{ $('#score-overlay').hidden=true; quitToSelect(); };
  $('#btn-next-deal').onclick=()=>{ $('#score-overlay').hidden=true; newDeal(); };
  $('#btn-pause').onclick=()=>{ renderThemes(); renderSpeeds(); $('#pause-overlay').hidden=false; };
  $('#btn-resume').onclick=()=>$('#pause-overlay').hidden=true;
  $('#btn-music').onclick=toggleMusic;
  $('#btn-stats').onclick=()=>{ renderStatsPanel(); $('#stats-overlay').hidden=false; };
  $('#btn-stats-close').onclick=()=>$('#stats-overlay').hidden=true;
  $('#btn-stats-reset').onclick=()=>{ store.del(statsKey()); loadStats(); renderStatsPanel(); };
  $('#btn-proba').onclick=()=>$('#proba-overlay').hidden=false;
  $('#btn-proba-close').onclick=()=>$('#proba-overlay').hidden=true;
  $('#btn-edit-profile').onclick=()=>{ abortDeal(); $('#screen-table').hidden=true; showProfile(); };
}
function fillForm(p){
  $('#p-pseudo').value=p.pseudo||''; $('#p-niv').value=p.niveau||3; $('#p-car').value=p.caractere||3;
  $('#p-niv-val').textContent=NIV_LABELS[p.niveau||3]; $('#p-car-val').textContent=CAR_LABELS[p.caractere||3];
}
function renderProfileChips(){
  const row=$('#profiles-row'); row.innerHTML='';
  PROFILES.forEach(p=>{
    const b=document.createElement('button'); b.className='chip'+(EDIT&&p.id===EDIT.id?' on':''); b.textContent=p.pseudo;
    b.onclick=()=>{ EDIT=p; fillForm(p); renderProfileChips(); };
    row.appendChild(b);
  });
  const add=document.createElement('button'); add.className='chip add'; add.textContent='＋ Nouveau profil';
  add.onclick=()=>{ EDIT={id:null,pseudo:'',niveau:3,caractere:3}; fillForm(EDIT); renderProfileChips(); $('#p-pseudo').focus(); };
  row.appendChild(add);
  if(EDIT && EDIT.id && PROFILES.length>1){
    const del=document.createElement('button'); del.className='chip'; del.textContent='🗑 Supprimer';
    del.onclick=()=>{ if(!confirm(`Supprimer le profil « ${EDIT.pseudo} » et ses statistiques ?`)) return;
      [3,4,5].forEach(n=>store.del('tarot.stats.'+EDIT.id+'.'+n)); store.del('tarot.seen.'+EDIT.id);
      PROFILES=PROFILES.filter(p=>p.id!==EDIT.id); saveProfiles();
      EDIT=PROFILES[0]; PROFILE=EDIT; store.set('tarot.current',EDIT.id); fillForm(EDIT); renderProfileChips(); };
    row.appendChild(del);
  }
}
function showProfile(){ EDIT=PROFILE; fillForm(EDIT); renderProfileChips(); $('#screen-profile').hidden=false; }
function updateDupButtons(){
  const row=$('#dup-row'); if(row){ row.innerHTML='';
    [3,4,5].forEach(n=>{ const k=dupAvailable(n).length; const b=document.createElement('button'); b.className='dup-btn';
      b.textContent=`🏆 Duplicate à ${n} · ${k} donne${k>1?'s':''}`; b.disabled=!k; b.onclick=()=>startTable(n,{dup:pickDuplicate(n)}); row.appendChild(b); }); }
  const k=G.n? dupAvailable(G.n).length : 0;
  const nb=$('#btn-next-dup'); if(nb){ nb.textContent=`🏆 Duplicate (${k})`; nb.disabled=!k; nb.style.opacity=k?1:.5; }
  const tb=$('#btn-dup'); if(tb) tb.title=`Duplicate : rejouer une donne déjà jouée par un autre joueur (${k} disponible${k>1?'s':''})`;
}
function showSelect(){
  $('#screen-select').hidden=false;
  $('#who').textContent=`Joueur : ${PROFILE.pseudo}${PROFILES.length>1?` · ${PROFILES.length} profils sur ce navigateur`:''}`;
  updateDupButtons();
}
function launchDuplicate(n){
  const d=pickDuplicate(n);
  if(!d){ toast(`Aucune donne de duplicate disponible à ${n} pour ${PROFILE.pseudo} — joue (ou fais jouer un autre profil) des donnes en Garde / Garde sans`, 3600); return; }
  abortDeal(true); newDeal(d);
}
function abortDeal(keepTable=false){
  // abandon propre : le jeton change → toutes les boucles de la donne s'arrêtent
  G.dealId=(G.dealId||0)+1;
  G.phase='idle';
  ['#bid-bar','#call-bar','#poignee-overlay','#score-overlay','#peek'].forEach(s=>{ const e=$(s); if(e) e.hidden=true; });
  if(G._humanPlay){ const r=G._humanPlay; G._humanPlay=null; r(null); }
  if(G._ecartDone){ const r=G._ecartDone; G._ecartDone=null; r(); }
  document.querySelectorAll('.fly').forEach(e=>e.remove());
}
function quitToSelect(){
  abortDeal();
  $('#screen-table').hidden=true; showSelect();
}
/* init */
bindUI(); layout(); ensureSeeds();
fillForm(PROFILE); renderProfileChips();
applyTheme(store.get('tarot.theme')||'vif');
// profil déjà enregistré → on entre directement au club (retour Marc : « il ne garde pas mon profil »)
if(savedProfile){ $('#screen-profile').hidden=true; showSelect(); }
if(AUTO){ window.__target=+(location.hash.match(/n(\d+)/)||[0,12])[1]; const an=+(location.hash.match(/auto(?:dup)?(\d)/)||[0,5])[1]; startTable(an, AUTO_DUP?{dup:pickDuplicate(an)}:{}); }

