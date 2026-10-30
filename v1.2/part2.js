    el.innerHTML=`<div class="corner" style="color:#7d5ba6;">EX<span class="s">★</span></div>
      <div style="font-size:13px;font-weight:700;color:#7d5ba6;text-align:center;line-height:1.1;">L'EXCUSE<br><span class="star">★ bout ★</span></div>
      <div class="corner br" style="color:#7d5ba6;">EX<span class="s">★</span></div>`;
  }
  el.dataset.cid=c.id;
  return el;
}
function renderHand(){
  const hand=G.players[G.me].hand; sortHand(hand);
  const box=$('#hand'); box.innerHTML='';
  const n=hand.length; if(!n) return;
  // Éventail à arc unique (pivot sous la main) — cartes grandes et entièrement visibles
  const cw=L.cw||58, areaW=(L.W||window.innerWidth)-(L.railW||190)-24;
  const step = n>1 ? Math.min(cw*0.62, (areaW*0.92-cw)/(n-1)) : 0;
  const totalArc = Math.min(34, n*2.1);
  const a0 = -totalArc/2, da = n>1? totalArc/(n-1) : 0;
  const x0 = -((n-1)*step)/2;
  const legal = (G.phase==='play' && G.turn===G.me && !AUTO) ? legalPlays(hand) : null;
  hand.forEach((c,i)=>{
    const el=cardEl(c);
    el.style.setProperty('--x', (x0+step*i)+'px');
    el.style.setProperty('--r', (a0+da*i)+'deg');
    el.style.zIndex=i+1;
    if(legal){
      if(legal.includes(c)){ el.classList.add('playable'); el.onclick=()=>{ if(peekLock){ peekLock=false; return; } hidePeek(); playHumanCard(c); }; }
      else{ el.classList.add('disabled'); el.onclick=()=>{ if(peekLock){ peekLock=false; return; } explainIllegal(c, hand); }; }
    }else if(G.phase==='ecart' && G.taker===G.me && !AUTO){
      el.classList.add('playable');
      if(G.discardSel.has(c.id)) el.classList.add('selected');
      el.onclick=()=>{ if(peekLock){ peekLock=false; return; } toggleDiscard(c, el); };
    }
    attachZoom(el, c);
    box.appendChild(el);
  });
}
// Tap sur une carte grisée → on explique pourquoi elle n'est pas jouable (règles FFT : fournir / couper / surcouper)
function explainIllegal(c, hand){
  const lead=ledColor(G.trick);
  let msg;
  if(!G.trick.length && G.n===5 && G.called && G.trickNo===0 && c.kind==='suit' && c.suit===G.called.suit)
    msg=`1ᵉʳ tour : interdit d'entamer à ${SUIT_NAME[G.called.suit]} ${G.called.suit} (couleur appelée), sauf avec la carte appelée. Dès le 2ᵉ tour, c'est libre.`;
  else if(!lead) msg="L'Excuse ouvre le pli : tu peux jouer la carte de ton choix.";
  else if(lead.kind==='atout'){
    const best=Math.max(0,...G.trick.filter(t=>t.card.kind==='atout').map(t=>t.card.num));
    msg = hand.some(x=>x.kind==='atout'&&x.num>best)
      ? `Obligation de surcouper : joue un atout plus fort que le ${best}.`
      : "Obligation de jouer atout.";
  }else if(hand.some(x=>x.kind==='suit'&&x.suit===lead.suit)){
    msg = `Tu dois fournir à ${SUIT_NAME[lead.suit]} ${lead.suit}.`;
  }else if(hand.some(x=>x.kind==='atout')){
    msg = `Pas de ${SUIT_NAME[lead.suit]} ${lead.suit} en main : obligation de couper (joue un atout).`;
  }else{
    msg = "Tu n'as ni la couleur demandée ni atout : défausse libre — toutes tes cartes sont jouables.";
  }
  toast(msg, 2600);
}
function renderTrick(){
  for(let i=0;i<G.n;i++){
    const s=$('#slot-'+i); if(!s) continue;
    s.innerHTML=''; s.classList.remove('glow');
    const pl=G.trick.find(t=>t.player===i);
    if(pl) s.appendChild(cardEl(pl.card));
  }
}
function setActive(i){
  document.querySelectorAll('.seat').forEach(s=>s.classList.remove('active'));
  const el=$('#seat-'+i); if(el) el.classList.add('active');
}
function setBidTag(i, txt, pass=false){
  const av=$('#seat-'+i+' .avatar'); if(!av) return;
  av.querySelectorAll('.bid-tag').forEach(t=>t.remove());
  if(!txt) return;
  const t=document.createElement('div'); t.className='bid-tag'+(pass?' pass':''); t.textContent=txt;
  av.appendChild(t);
}
function clearBidTags(){ document.querySelectorAll('.bid-tag').forEach(t=>t.remove()); }
function renderCrowns(){
  for(let i=0;i<G.n;i++){
    const seat=$('#seat-'+i), cr=$('#crown-'+i); if(!seat||!cr) continue;
    seat.classList.toggle('taker', i===G.taker && !!G.contract);
    seat.querySelectorAll('.called-mini,.role-tag').forEach(e=>e.remove());
    if(i===G.taker){ cr.hidden=false; cr.textContent='👑'; cr.title='Preneur'; }
    else if(G.partnerKnown && i===G.partner){ cr.hidden=false; cr.textContent='🤝'; cr.title='Appelé'; }
    else cr.hidden=true;
    if(i===G.taker && G.contract){
      const c=CONTRACTS.find(x=>x.id===G.contract);
      const tag=document.createElement('div'); tag.className='role-tag '+c.cls; tag.textContent='Preneur · '+c.label;
      seat.appendChild(tag);
      if(G.n===5 && G.called){
        // le dessin de la carte appelée à côté du preneur (retour Marc du 30/10)
        const m=document.createElement('div');
        m.className='called-mini '+((G.called.suit==='♥'||G.called.suit==='♦')?'red':'black');
        m.innerHTML=`<b>${{14:'R',13:'D',12:'C'}[G.called.rank]}</b><span>${G.called.suit}</span>`;
        m.title=`Carte appelée : ${RANK_LABEL[G.called.rank]} de ${SUIT_NAME[G.called.suit]}`;
        seat.appendChild(m);
      }
    }
  }
}
function renderDonnePanel(){
  const p=$('#donne-panel');
  let html='';
  if(G.contract){
    const c=CONTRACTS.find(x=>x.id===G.contract);
    html+=`<div class="row"><span>Contrat</span><span class="badge ${c.cls}">${c.label}</span></div>`;
    html+=`<div class="row"><span>Preneur</span><b>${G.players[G.taker].name}</b></div>`;
    if(G.n===5){
      const callLbl = G.called? `${RANK_LABEL[G.called.rank]} de ${SUIT_NAME[G.called.suit]}` : '—';
      html+=`<div class="row"><span>Appel</span><b>${callLbl}</b></div>`;
      if(G.alone) html+=`<div class="row"><span></span><span class="badge gs">Seul contre 4</span></div>`;
      else if(G.partnerKnown) html+=`<div class="row"><span>Appelé</span><span class="badge appele">${G.players[G.partner].name}</span></div>`;
    }
    const camps = attackCards();
    const nb = camps.filter(isBout).length + (G.taker===G.me ? G.players[G.me].hand.filter(isBout).length : 0);
    html+=`<div class="row"><span>Points attaque</span><b>${fmtPts(sumPts(camps))}</b></div>`;
    html+=`<div class="row"><span>Bouts (attaque)</span><b>★ ${nb}</b></div>`;
  }else{
    html=`<div style="text-align:center;color:#7a6a55;">Enchères en cours…</div>`;
  }
  if(G.dup) html=`<div class="row"><span>Donne</span><span class="badge dup">🏆 ${G.dup.id}</span></div>`+html;
  p.innerHTML=html;
  $('#my-score').textContent='Marque : '+(G.marque? G.marque[G.me]:0);
}
const fmtPts = x => (Math.round(x*2)/2).toString().replace('.',',');
function attackCards(){
  // V1.2 : uniquement ce qui est PUBLIC — les plis remportés par l'attaque.
  // L'écart n'est compté que si c'est MOI le preneur (sinon le compteur trahissait les points
  // cachés de l'écart dès le premier pli : « il compte les points du chien » — retour Marc 30/10).
  let cards=[];
  attackCamp().forEach(i=>{ (G.tricksWon[i]||[]).forEach(c=>cards.push(c)); });
  if(G.taker===G.me) cards=cards.concat(G.ecart);
  return cards;
}
function attackCamp(){
  if(G.n!==5) return [G.taker];
  if(G.alone) return [G.taker];
  if(G.partnerKnown) return [G.taker, G.partner];
  return [G.taker];
}
/* ================================================================
   DÉROULEMENT D'UNE DONNE — machine à états robuste
   ================================================================ */
async function startTable(n, opts={}){
  G.n=n; loadStats(); setupPlayers();
  G.marque=G.players.map(()=>0);
  renderSeats();
  $('#screen-select').hidden=true; $('#screen-table').hidden=false;
  $('#my-name').textContent=PROFILE.pseudo||'Moi';
  updateProbaPanel();
  await newDeal(opts.dup||null);
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
async function newDeal(dup=null){
  const deal=(G.dealId=(G.dealId||0)+1); // jeton : toute boucle d'une donne abandonnée s'arrête
  const alive=()=>deal===G.dealId;
  G.phase='deal'; G.chien=[]; G.bids=[]; G.taker=-1; G.contract=null;
  G.called=null; G.partner=-1; G.partnerKnown=false; G.alone=false;
  G.trick=[]; G.tricksWon=G.players.map(()=>[]); G.ecart=[];
  G.petitAuBout=null; G.poignees={}; G.discardSel=new Set(); G._excuseSwap=[]; G.trickNo=0;
  G.dup=dup; G.rec=null;
  const cfg=CFG[G.n];
  let hands, chienCards;
  if(dup){
    // DUPLICATE : la donne est servie à l'identique (mêmes mains, même chien, même donneur)
    const byId=Object.fromEntries(buildDeck().map(c=>[c.id,c]));
    hands=dup.hands.map(h=>h.map(id=>byId[id])); chienCards=dup.chien.map(id=>byId[id]);
    G.dealer=dup.dealer;
    markSeen(dup.id); // règle Marc : jamais deux fois la même donne pour un même joueur (même abandonnée)
  }else{
    G.dealer=(G.dealer+1)%G.n;
    const deck=shuffle(buildDeck());
    hands=G.players.map((_,i)=>deck.slice(i*cfg.cards,(i+1)*cfg.cards));
    chienCards=deck.slice(G.n*cfg.cards);
  }
  G.players.forEach(p=>p.hand=[]);
  clearBidTags(); renderCrowns(); renderDonnePanel(); renderTrick(); renderHand();
  $('#chien-area').innerHTML=''; $('#chien-area').hidden=true;
  // Distribution ANIMÉE et visible (retour Marc : voir la donne se faire)
  const first=(G.dealer+1)%G.n;
  toast(dup ? `🏆 Duplicate ${dup.id} — distribution…` : 'Distribution…', cfg.cards*G.n*70);
  // paquets de 3 par joueur, chien pioché en cours de distribution
  // (emplacements du chien DISTINCTS : un doublon amputait le chien et la main du preneur — bug bloquant)
  const chienQueue=[...chienCards];
  const chienSlots=new Set(); while(chienSlots.size<cfg.chien) chienSlots.add(Math.floor(Math.random()*(cfg.cards/3)));
  for(let pkt=0; pkt<cfg.cards/3; pkt++){
    for(let j=0;j<G.n;j++){
      if(!alive()) return; // donne abandonnée (changement de table)
      const pi=(first+j)%G.n;
      if(chienSlots.has(pkt) && chienQueue.length && j===Math.floor(G.n/2)){
        G.chien.push(chienQueue.shift());
        flyCard('chien'); await T(90);
      }
      for(let k=0;k<3;k++){
        const c=hands[pi][pkt*3+k]; G.players[pi].hand.push(c);
        if(!AUTO) flyCardToSeat(pi);
      }
      if(pi===G.me) renderHand();
      await T(110);
    }
  }
  G.chien.push(...chienQueue); // sécurité : le chien est TOUJOURS complet
  // invariant FFT : chaque main a exactement cfg.cards cartes, le chien cfg.chien
  if(G.players.some(p=>p.hand.length!==cfg.cards) || G.chien.length!==cfg.chien){
    console.warn('distribution invalide — on redonne');
    logEv('Erreur de distribution — on redonne');
    if(alive()) return newDeal();
    return;
  }
  // enregistrement de la donne (graine = distribution complète) pour le vivier de duplicate
  if(!dup) G.rec={id:newDealId(G.n), n:G.n, dealer:G.dealer, hands:G.players.map(p=>p.hand.map(c=>c.id)), chien:G.chien.map(c=>c.id), date:Date.now()};
  renderHand();
  logEv(dup ? `Duplicate ${dup.id} — donne par ${G.players[G.dealer].name}` : `Donne par ${G.players[G.dealer].name}`);
  await T(400);
  if(deal===G.dealId) runBidding(deal);
}
function flyCardToSeat(i){
  const seat=$('#seat-'+i); if(!seat) return;
  const r=seat.getBoundingClientRect(), w=$('#table-wrap').getBoundingClientRect();
  const d=document.createElement('div'); d.className='deal-pile';
  d.style.left=(w.left+w.width/2 - w.left)+'px'; d.style.top=(w.top+80 - w.top)+'px';
  $('#table-wrap').appendChild(d);
  requestAnimationFrame(()=>{ d.style.left=(r.left+r.width/2-w.left)+'px'; d.style.top=(r.top+r.height/2-w.top)+'px'; });
  setTimeout(()=>{d.style.opacity=0; setTimeout(()=>d.remove(),300);},300);
}
function flyCard(where){
  const d=document.createElement('div'); d.className='deal-pile';
  d.style.left='50%'; d.style.top='80px'; $('#table-wrap').appendChild(d);
  setTimeout(()=>{d.style.opacity=0; setTimeout(()=>d.remove(),300);},250);
}

/* ================================================================
   ENCHÈRES — jamais bloquantes : tout le monde passe → on redonne
   ================================================================ */
function evalBid(hand){
  const nA=atouts(hand).length, nB=bouts(hand).length, nR=rois(hand).length;
  const strongA=atouts(hand).filter(c=>c.num>=16).length;
  const pts=sumPts(hand);
  let s = nA*1.7 + nB*6 + nR*2.4 + strongA*1.2 + Math.max(0,pts-20)*0.18;
  if(hand.some(isPetit)) s+=1.5;
  return s;
}
function botBidChoice(p, currentIdx){
  const s=evalBid(p.hand);
  const n=G.n;
  // seuils adaptés à la taille de main + soupçon d'aléa pour un comportement crédible
  // (calibrés pour que les bots PRENNENT régulièrement — retour Marc : « tous les joueurs passent »)
  const base = CFG[n].cards*0.72; // 3j≈17 · 4j≈13 · 5j≈11
  const jitter = (Math.random()*6-3) + (p.level-2)*1.5;
  const v=s+jitter;
  let want=-1;
  if(v>=base+17) want=3; else if(v>=base+11) want=2; else if(v>=base+5) want=1; else if(v>=base) want=0;
  if(want<=currentIdx) return null;
  return want;
}
async function runBidding(deal){
  const alive=()=>deal===undefined||deal===G.dealId;
  G.phase='bid'; renderDonnePanel();
  const start=(G.dealer+1)%G.n;
  let best=-1, bestPlayer=-1, passCount=0;
  for(let k=0;k<G.n;k++){
    const i=(start+k)%G.n;
    if(!alive()) return;
    G.turn=i; setActive(i);
    if(i===G.me){
      const choice=await humanBid(best);
      if(!alive()) return;
      if(choice===null){ setBidTag(i,'Passe',true); passCount++; logEv('Moi : Passe'); }
      else{ best=choice; bestPlayer=i; passCount=0; setBidTag(i,CONTRACTS[choice].label); logEv(`Moi : ${CONTRACTS[choice].label}`); }
    }else{
      await T(700+Math.random()*600);
      if(!alive()) return;
      const c=botBidChoice(G.players[i], best);
      if(c===null){ setBidTag(i,'Passe',true); passCount++; logEv(`${G.players[i].name} : Passe`); }
      else{ best=c; bestPlayer=i; passCount=0; setBidTag(i,CONTRACTS[c].label); logEv(`${G.players[i].name} : ${CONTRACTS[c].label}`); toast(`${G.players[i].name} : ${CONTRACTS[c].label}`); }
    }
    // Si un joueur a enchéri et que TOUS les autres ont passé → fin immédiate
    if(bestPlayer>=0 && passCount>=G.n-1) break;
  }
  setActive(-1);
  if(!alive()) return;
  if(bestPlayer<0){
    toast('Tout le monde passe — on redonne 🔄', 2200);
    logEv('Donne annulée (tout le monde passe)');
    await T(1600);
    if(alive()) return newDeal(); // jamais bloqué (retour Marc)
    return;
  }
  G.taker=bestPlayer; G.contract=CONTRACTS[best].id;
  toast(`${G.players[bestPlayer].name} prend : ${CONTRACTS[best].label}`, 2000);
  renderCrowns(); renderDonnePanel();
  await T(1200);
  clearBidTags();
  if(G.n===5) await runCallKing();
  await runChien();
}
function humanBid(currentIdx){
  if(AUTO){ const c=botBidChoice(G.players[G.me], currentIdx); return Promise.resolve(c===null?null:c); }
  return new Promise(res=>{
    const bar=$('#bid-bar');
    bar.querySelectorAll('button').forEach(b=>b.remove());
    const mk=(label,cls,val)=>{
      const b=document.createElement('button');
      b.className='bid-btn'+cls; b.textContent=label;
      b.onclick=()=>{ bar.hidden=true; res(val); };
      bar.appendChild(b);
    };
    mk('Passe',' pass', null);
    CONTRACTS.forEach((c,idx)=>{ if(idx>currentIdx) mk(c.label,'',idx); });
    $('#bell-txt').textContent='À toi de parler';
    bar.hidden=false; bell();
  });
}

/* ---------- Appel au Roi (5 joueurs) ---------- */
async function runCallKing(){
  G.phase='call';
  if(G.phase==='idle') return;
  const meTaker=G.taker===G.me;
  const hand=G.players[G.taker].hand;
  // hiérarchie FFT : Roi, sinon Dame (4 rois en main), sinon Cavalier (4 dames)
  let rank=14;
  const countRank=r=>hand.filter(c=>c.kind==='suit'&&c.rank===r).length;
  if(countRank(14)>=4) rank=13;
  if(rank===13 && countRank(13)>=4) rank=12;
  const choices=['♠','♥','♦','♣'].map(s=>({suit:s, rank}));
  if(meTaker && !AUTO){
    toast(`Tu prends : appelle un ${RANK_LABEL[rank]} (avant le chien)`, 2600);
    G.called=await humanCall(choices, hand);
  }else{
    await T(900);
    // bot : appelle la couleur où il n'a pas le Roi et le moins de cartes
    const noKing=choices.filter(c=>!hand.some(x=>x.kind==='suit'&&x.suit===c.suit&&x.rank===c.rank));
    const pool=noKing.length?noKing:choices;
    pool.sort((a,b)=>hand.filter(x=>x.kind==='suit'&&x.suit===a.suit).length - hand.filter(x=>x.kind==='suit'&&x.suit===b.suit).length);
    G.called=pool[0];
    toast(`${G.players[G.taker].name} appelle le ${RANK_LABEL[rank]} de ${SUIT_NAME[G.called.suit]} ${G.called.suit}`, 2200);
  }
  logEv(`Appel : ${RANK_LABEL[rank]} de ${SUIT_NAME[G.called.suit]} ${G.called.suit}`);
  // Le preneur possède lui-même la carte appelée → seul contre 4
  if(hand.some(c=>c.kind==='suit'&&c.suit===G.called.suit&&c.rank===G.called.rank)){
    G.alone=true; G.partner=G.taker; G.partnerKnown=true;
    toast(`${G.players[G.taker].name} s'appelle lui-même : 1 contre 4 !`, 2400);
  }
  renderDonnePanel(); renderCrowns();
  await T(1200);
}
function humanCall(choices, hand){
  return new Promise(res=>{
    const bar=$('#call-bar');
    bar.querySelectorAll('button').forEach(b=>b.remove());
    choices.forEach(ch=>{
      const mine=hand.some(c=>c.kind==='suit'&&c.suit===ch.suit&&c.rank===ch.rank);
      const b=document.createElement('button');
      b.className='call-btn '+((ch.suit==='♥'||ch.suit==='♦')?'red':'black');
      b.textContent=`${RANK_LABEL[ch.rank]} ${ch.suit}${mine?' (en main)':''}`;
      b.onclick=()=>{ bar.hidden=true; res(ch); };
      bar.appendChild(b);
    });
    $('#bell-txt').textContent=`À toi d'appeler`;
    bar.hidden=false; bell();
  });
}
/* ================================================================
   CHIEN & ÉCART
   ================================================================ */
async function runChien(deal){
  const alive=()=>deal===undefined||deal===G.dealId;
  G.phase='chien';
  const area=$('#chien-area'); area.innerHTML=''; area.hidden=true;
  if(G.contract==='petite' || G.contract==='garde'){
    // V1.2 : le chien est ÉTALÉ en grand au centre de la table, visible par tous ~2 s (retour Marc 30/10)
    area.style.setProperty('--card-w', Math.round((L.cw||60)*1.3)+'px');
    area.style.setProperty('--card-h', Math.round((L.ch||86)*1.3)+'px');
    area.innerHTML='<div class="lbl">Le chien</div><div class="row"></div>';
    const row=area.querySelector('.row'); area.hidden=false;
    for(const c of G.chien){ row.appendChild(cardEl(c)); await T(180); }
    if(G.n===5 && G.called && !G.partnerKnown && G.chien.some(c=>c.kind==='suit'&&c.suit===G.called.suit&&c.rank===G.called.rank)){
      G.alone=true; G.partner=G.taker; G.partnerKnown=true;
      toast(`La carte appelée est au chien : ${G.players[G.taker].name} joue seul contre 4 !`, 2600);
      logEv('Carte appelée au chien : 1 contre 4'); renderDonnePanel(); renderCrowns();
    }
    await T(2200);
    if(!alive()) return;
    area.hidden=true; area.innerHTML='';
    logEv(`Chien révélé (${G.chien.length} cartes)`);
    if(G.taker===G.me && !AUTO){
      // écart interactif
      G.players[G.me].hand.push(...G.chien);
      G.chien=[];
      sortHand(G.players[G.me].hand);
      G.phase='ecart'; G.discardSel=new Set();
      toast(`Fais ton écart : choisis ${CFG[G.n].chien} cartes (ni bouts ni rois)`, 3200);
      renderHand();
      await waitEcart();
      if(!alive()) return;
    }else{
      toast(`${G.players[G.taker].name} fait son écart…`, 2000);
      botEcart();
      await T(1600);
      if(!alive()) return;
    }
  }else{
    // Garde sans / Garde contre : le chien n'est pas dévoilé
    const msg = G.contract==='gs' ? 'Garde sans : le chien reste caché (il compte pour le preneur)' : 'Garde contre : le chien reste caché (il va à la défense)';
    logEv(msg); toast(msg, 2200);
    await T(1400);
  }
  renderHand(); renderDonnePanel();
  await runPoignees();
  if(!alive()) return;
  runPlay(deal);
}
function toggleDiscard(c, el){
  const need=CFG[G.n].chien;
  if(G.discardSel.has(c.id)){ G.discardSel.delete(c.id); el.classList.remove('selected'); return; }
  if(isBout(c)||(c.kind==='suit'&&c.rank===14)){ toast('Interdit d\'écarter un bout ou un roi (FFT)'); return; }
  if(G.discardSel.size>=need){ toast(`Écart déjà complet (${need} cartes) — reclique une carte pour la retirer`); return; }
  G.discardSel.add(c.id); el.classList.add('selected');
  if(G.discardSel.size===need) confirmEcart();
}
function waitEcart(){ return new Promise(res=>{ G._ecartDone=res; }); }
async function confirmEcart(){
  const hand=G.players[G.me].hand;
  G.ecart=hand.filter(c=>G.discardSel.has(c.id));
  G.players[G.me].hand=hand.filter(c=>!G.discardSel.has(c.id));
  logEv(`Écart fait (${G.ecart.length} cartes)`);
  G.phase='play-prep'; renderHand();
  await T(500);
  if(G._ecartDone){ const r=G._ecartDone; G._ecartDone=null; r(); }
}
function botEcart(){
  const p=G.players[G.taker];
  p.hand.push(...G.chien); G.chien=[];
  const need=CFG[G.n].chien;
  const ok=c=>!isBout(c) && !(c.kind==='suit'&&c.rank===14);
  // jette les cartes de couleur les plus faibles, puis atouts faibles si nécessaire
  const cand=p.hand.filter(ok).sort((a,b)=>{
    const va=(a.kind==='atout'? a.num*0.05 : a.pts) , vb=(b.kind==='atout'? b.num*0.05 : b.pts);
    return va-vb;
  });
  G.ecart=cand.slice(0,need);
  const ids=new Set(G.ecart.map(c=>c.id));
  p.hand=p.hand.filter(c=>!ids.has(c.id));
}
/* ---------- Poignées ---------- */
function poigneeOf(hand){
  const nA=atouts(hand).length; const th=CFG[G.n].poignees;
  if(nA>=th[2]) return {n:nA, val:40, label:`Triple poignée (${th[2]} atouts)`};
  if(nA>=th[1]) return {n:nA, val:30, label:`Double poignée (${th[1]} atouts)`};
  if(nA>=th[0]) return {n:nA, val:20, label:`Poignée (${th[0]} atouts)`};
  return null;
}
async function runPoignees(){
  G.phase='poignee';
  for(let i=0;i<G.n;i++){
    const pg=poigneeOf(G.players[i].hand);
    if(!pg) continue;
    if(i===G.me){
      const yes=await askPoignee(pg);
      if(yes){ G.poignees[i]=pg; logEv(`Moi : ${pg.label} déclarée`); toast(`${pg.label} déclarée !`); }
    }else if(Math.random()<0.9){
      G.poignees[i]=pg; logEv(`${G.players[i].name} déclare une ${pg.label.toLowerCase()}`);
      toast(`${G.players[i].name} : ${pg.label.toLowerCase()} !`, 2200); await T(1100);
      if(G.phase==='idle') return;
    }
  }
}
function askPoignee(pg){
  if(AUTO) return Promise.resolve(true);
  return new Promise(res=>{
    $('#poignee-txt').textContent=`Tu as ${pg.n} atouts — ${pg.label} (+${pg.val} pts). La déclarer ?`;
    $('#poignee-overlay').hidden=false;
    $('#btn-poignee-yes').onclick=()=>{ $('#poignee-overlay').hidden=true; res(true); };
    $('#btn-poignee-no').onclick =()=>{ $('#poignee-overlay').hidden=true; res(false); };
    $('#bell-txt').textContent='Poignée possible !'; bell();
  });
}
/* ================================================================
   JEU DES PLIS — règles FFT : fournir, couper, surcouper, Excuse
   ================================================================ */
function ledColor(trick){
  // la couleur demandée = première carte non-Excuse du pli
  for(const t of trick){ if(t.card.kind!=='excuse') return t.card; }
  return null;
}
function legalPlays(hand){
  const pl=hand; if(!pl.length) return [];
  // ENTRAME (premier à jouer)
  if(!G.trick.length){
    // à 5 (FFT) : au PREMIER TOUR seulement, interdiction d'entamer dans la couleur appelée,
    // sauf en jouant la carte appelée elle-même. Dès le 2ᵉ tour, la couleur est libre
    // (V1.1 bloquait tant que l'appelé n'était pas révélé — bug signalé par Marc le 30/10).
    if(G.n===5 && G.called && G.trickNo===0){
      const legal=pl.filter(c=> !(c.kind==='suit'&&c.suit===G.called.suit) || (c.kind==='suit'&&c.suit===G.called.suit&&c.rank===G.called.rank));
      if(legal.length) return legal;
    }
    return [...pl];
  }
  const lead=ledColor(G.trick);
  if(!lead) return [...pl]; // Excuse en tête (cas rarissime) : libre
  const bestAtoutOnTable=Math.max(0,...G.trick.filter(t=>t.card.kind==='atout').map(t=>t.card.num));
  if(lead.kind==='atout'){
    const myAtouts=pl.filter(c=>c.kind==='atout');
    if(myAtouts.length){
      const higher=myAtouts.filter(c=>c.num>bestAtoutOnTable);
      const forced=higher.length?higher:myAtouts;
      return forced.concat(pl.filter(c=>c.kind==='excuse'));
    }
    return [...pl];
  }
  // couleur demandée
  const inSuit=pl.filter(c=>c.kind==='suit'&&c.suit===lead.suit);
  if(inSuit.length) return inSuit.concat(pl.filter(c=>c.kind==='excuse'));
  // pas la couleur → obligation de couper
  const myAtouts=pl.filter(c=>c.kind==='atout');
  if(myAtouts.length){
    if(bestAtoutOnTable>0){
      const higher=myAtouts.filter(c=>c.num>bestAtoutOnTable);
      const forced=higher.length?higher:myAtouts; // surcouper si possible, sinon pisser
      return forced.concat(pl.filter(c=>c.kind==='excuse'));
    }
    return myAtouts.concat(pl.filter(c=>c.kind==='excuse'));
  }
  return [...pl];
}
function trickWinner(trick){
  const lead=ledColor(trick);
  let win=trick[0];
  for(const t of trick){
    const c=t.card, w=win.card;
    if(c.kind==='excuse') continue;
    if(w.kind==='excuse'){ win=t; continue; }
    if(c.kind==='atout'){ if(w.kind!=='atout'||c.num>w.num) win=t; }
    else if(lead && c.kind==='suit' && c.suit===lead.suit && (w.kind!=='suit'||w.suit!==lead.suit||c.rank>w.rank)){
      if(w.kind==='atout') continue; else win=t;
    }
  }
  return win;
}
function sameTeam(a,b){
  if(a===b) return true;
  const camp=attackCamp();
  return camp.includes(a)===camp.includes(b);
}
function botPlayCard(p){
  const legal=legalPlays(p.hand);
  const L=p.level||1;
  // FFT (tous niveaux) : jamais l'Excuse au dernier pli — avec 2 cartes en main, on s'en défausse
  // MAINTENANT, sinon elle serait forcée au dernier pli et changerait de camp (régression signalée par Marc)
  const excLegal=legal.find(c=>c.kind==='excuse');
  if(excLegal && legal.length>1 && p.hand.length===2) return excLegal;
  // Protection du Petit — TOUS niveaux (V1.2, cas de Karim filmé le 30/10) : on ne pose le Petit
  // que si l'on y est obligé ou si l'on est CERTAIN de remporter le pli (dernier à jouer et maître,
  // ou plus aucun atout en circulation chez les autres).
  const petitL=legal.find(isPetit);
  let base=legal;
  if(petitL && legal.length>1 && !petitSure(p, petitL)) base=legal.filter(c=>!isPetit(c));
  const pick=rnd(base);
  if(L===1) return pick; // débutant : légal aléatoire (mais ne brade plus le Petit)
  const trick=G.trick, lead=ledColor(trick);
  const currentWin=trick.length? trickWinner(trick) : null;
  const isWinning=c=>{
    const sim=trick.concat([{player:G.players.indexOf(p), card:c}]);
    return trickWinner(sim).card===c;
  };
  const nonBout=c=>!isBout(c)&&c.kind!=='excuse';
  const cheap=list=>[...list].sort((a,b)=>a.pts-b.pts || ((a.num||a.rank)-(b.num||b.rank)))[0];
  // niveaux 2+ : en cours de donne, l'Excuse est réservée comme défausse sûre
  let pool=base;
  if(excLegal && base.length>1 && L>=2) pool=base.filter(c=>c.kind!=='excuse');
  // protection du Petit : ne le jouer pour prendre que si CERTAIN de gagner
  const petitIn=pool.find(isPetit);
  const atoutsRestantsAilleurs = ()=>{
    const played=G.tricksWon.flat().concat(G.trick.map(t=>t.card)).concat(p.hand);
    const playedAtouts=new Set(played.filter(c=>c.kind==='atout').map(c=>c.num));
    let maxOut=0;
    for(let a=21;a>=1;a--) if(!playedAtouts.has(a)){ maxOut=a; break; }
    return maxOut;
  };
  if(!trick.length){
    // ENTRAME
    if(L>=3){
      // preneur fort en atouts → faire tomber les atouts ; sinon longue
      const myA=atouts(p.hand);
      const iamTaker=G.players.indexOf(p)===G.taker;
      if(iamTaker && myA.length>=Math.ceil(p.hand.length/3)){
        const c=cheap(myA.filter(nonBout)); // jamais d'entame du Petit pour « faire tomber les atouts »
        if(c&&pool.includes(c)) return c;
      }
      // chasse au petit en défense : petit atout d'entame
      if(!iamTaker && myA.some(c=>c.num<=6 && !isPetit(c))){
        const c=cheap(myA.filter(c=>c.num<=6 && !isPetit(c)));
        if(c&&pool.includes(c)) return c;
      }
    }
    const suits=pool.filter(c=>c.kind==='suit'&&c.rank<14);
    return cheap(suits)||cheap(pool.filter(nonBout))||pool[0];
  }
  // EN COURS DE PLI
  const winners=pool.filter(c=>isWinning(c));
  const partnerWinning=currentWin && sameTeam(currentWin.player, G.players.indexOf(p));
  if(partnerWinning && L>=2){
    // charge le partenaire : carte à points non-bout la plus forte
    const give=pool.filter(nonBout).sort((a,b)=>b.pts-a.pts)[0];
    if(give) return give;
    return pool[0];
  }
  if(winners.length){
    if(petitIn && winners.includes(petitIn)){
      // certitude requise pour risquer le Petit
      const sure = petitIn.num > atoutsRestantsAilleurs() || (!lead || lead.kind!=='atout') && trick.every(t=>t.card.kind!=='atout');
      if(!sure && pool.length>1){
        const alt=winners.filter(c=>!isPetit(c));
        if(alt.length) return cheap(alt);
        const discard=pool.filter(c=>!winners.includes(c)&&nonBout(c));
        if(discard.length) return cheap(discard);
      }
    }
    return cheap(winners.filter(nonBout))||cheap(winners);
  }
  // perdant → défausse économique (jamais de bout)
  return cheap(pool.filter(nonBout))||cheap(pool.filter(c=>c.kind!=='excuse'))||pool[0];
}
function maxAtoutOutside(p){
  // plus fort atout dont le bot ne connaît PAS la position (ni joué, ni dans sa main, ni dans son écart)
  const known=G.tricksWon.flat().concat(G.trick.map(t=>t.card)).concat(p.hand)
    .concat(G.players.indexOf(p)===G.taker ? G.ecart : []);
  const ks=new Set(known.filter(c=>c.kind==='atout').map(c=>c.num));
  for(let a=21;a>=1;a--) if(!ks.has(a)) return a;
  return 0;
}
function petitSure(p, petit){
  const sim=G.trick.concat([{player:G.players.indexOf(p), card:petit}]);
  if(trickWinner(sim).card!==petit) return false;   // il serait capturé tout de suite
  if(G.trick.length===G.n-1) return true;           // dernier à jouer et maître du pli
  return maxAtoutOutside(p)===0;                    // plus aucun atout dehors
}
/* ---------- Animations : carte posée sur la table, pli qui part vers le gagnant ---------- */
function wrapPoint(el){
  const r=el.getBoundingClientRect(), w=$('#table-wrap').getBoundingClientRect();
  return {x:r.left+r.width/2-w.left, y:r.top+r.height/2-w.top};
}
async function flyToSlot(i, card, from){
  const slot=$('#slot-'+i); if(AUTO||!slot||!from) return;
  const to=wrapPoint(slot);
  const el=cardEl(card); el.classList.add('fly');
  el.style.left=from.x+'px'; el.style.top=from.y+'px'; el.style.transform='translate(-50%,-50%) scale(.75)';
  $('#table-wrap').appendChild(el);
  el.getBoundingClientRect();
  el.style.left=to.x+'px'; el.style.top=to.y+'px'; el.style.transform='translate(-50%,-50%) scale(1)';
  await sleep(290);
  el.remove();
}
async function collectTrick(w){
  const seatAv=$('#seat-'+w+' .avatar');
  if(AUTO||!seatAv){ G.trick=[]; renderTrick(); return; }
  const to=wrapPoint(seatAv);
  const wr=$('#table-wrap').getBoundingClientRect();
  const clones=[...document.querySelectorAll('#slots .slot .card')].map(c=>{
    const r=c.getBoundingClientRect(); const k=c.cloneNode(true); k.classList.add('fly');
    k.style.left=(r.left+r.width/2-wr.left)+'px'; k.style.top=(r.top+r.height/2-wr.top)+'px';
    $('#table-wrap').appendChild(k); return k;
  });
  G.trick=[]; renderTrick();
  clones.forEach((k,j)=>{ k.getBoundingClientRect(); k.style.left=(L.cx+(j-(clones.length-1)/2)*8)+'px'; k.style.top=L.cy+'px'; });
  await sleep(300);
  clones.forEach(k=>{ k.style.transition='left .5s ease-in, top .5s ease-in, transform .5s ease-in, opacity .5s ease-in';
    k.style.left=to.x+'px'; k.style.top=to.y+'px'; k.style.transform='translate(-50%,-50%) scale(.3)'; k.style.opacity='.15'; });
  await sleep(520);
  clones.forEach(k=>k.remove());
}
async function runPlay(deal){
  const alive=()=>deal===undefined||deal===G.dealId;
  G.phase='play';
  G.trickLeader=(G.dealer+1)%G.n;
  const totalTricks=G.players[0].hand.length + (G.taker===G.me?0:0);
  while(G.players.some(p=>p.hand.length)){
    G.trick=[]; renderTrick();
    for(let k=0;k<G.n;k++){
      if(!alive()) return;
      const i=(G.trickLeader+k)%G.n;
      G.turn=i; setActive(i);
      let card;
      if(i===G.me && !AUTO){
        $('#bell-txt').textContent='À toi de jouer';
        renderHand(); bell();
        card=await waitHumanCard();
      }else{
        renderHand();
        await T(650+Math.random()*550);
        card=botPlayCard(G.players[i]);
      }
      if(!alive()||!card) return; // donne abandonnée en cours de pli
      // jouer la carte : elle part de la main (ou du siège du bot) et se pose sur la table, à taille normale
      let from=null;
      if(i===G.me){ const he=document.querySelector(`#hand .card[data-cid="${card.id}"]`); if(he) from=wrapPoint(he); }
      else { const av=$('#seat-'+i+' .avatar'); if(av) from=wrapPoint(av); }
      const hand=G.players[i].hand;
      const ci=hand.indexOf(card); if(ci<0) return;
      hand.splice(ci,1);
      if(i===G.me) renderHand();
      await flyToSlot(i, card, from);
      if(!alive()) return;
      G.trick.push({player:i, card});
      // révélation de l'appelé à 5
      if(G.n===5 && G.called && !G.partnerKnown && card.kind==='suit' && card.suit===G.called.suit && card.rank===G.called.rank){
        G.partner=i; G.partnerKnown=true;
        if(i===G.taker){ G.alone=true; toast(`${G.players[i].name} joue la carte appelée… il était SEUL !`, 2400); }
        else toast(`🤝 ${G.players[i].name} est l'appelé de ${G.players[G.taker].name} !`, 2400);
        logEv(`Appelé révélé : ${G.players[i].name}`);
        renderCrowns(); renderDonnePanel();
        await T(1300);
      }
      renderTrick(); renderHand();
      await T(450);
    }
    const win=trickWinner(G.trick);
    G.trickLeader=win.player;
    const cards=G.trick.map(t=>t.card);
    G.tricksWon[win.player].push(...cards);
    // gestion Excuse : elle reste à son camp (sauf dernier pli)
    const exc=G.trick.find(t=>t.card.kind==='excuse');
    if(exc && exc.player!==win.player){
      const lastTrick = !G.players.some(p=>p.hand.length);
      if(!lastTrick){
        // retourne dans le camp de son propriétaire ; échange d'une carte 0,5 différé en fin de donne
        G.tricksWon[win.player]=G.tricksWon[win.player].filter(c=>c.kind!=='excuse');
        G.tricksWon[exc.player].push(exc.card);
        G._excuseSwap=G._excuseSwap||[]; G._excuseSwap.push({from:win.player, to:exc.player});
      }
    }
    logEv(`${G.players[win.player].name} remporte le pli`);
    $('#slot-'+win.player).classList.add('glow'); setActive(win.player);
    await T(750);
    if(!alive()) return;
    await collectTrick(win.player); // les cartes se regroupent et partent vers le gagnant du pli
    G.trickNo++;
  }
  await T(600);
  if(alive()) scoreDeal();
}
function waitHumanCard(){ return new Promise(res=>{ G._humanPlay=res; }); }
function playHumanCard(c){
  if(G.phase!=='play'||G.turn!==G.me) return;
  if(!legalPlays(G.players[G.me].hand).includes(c)) return;
  if(G._humanPlay){ const r=G._humanPlay; G._humanPlay=null; r(c); }
}
/* ================================================================
   MARQUE FFT
   ================================================================ */
function scoreDeal(){
  G.phase='score';
  const n=G.n, taker=G.taker, contract=CONTRACTS.find(c=>c.id===G.contract);
  // --- attribution des cartes ---
  // à 5 : carte appelée jamais apparue (restée au chien en Garde sans / contre) → le preneur était seul
  if(n===5 && !G.partnerKnown){ G.alone=true; G.partner=taker; G.partnerKnown=true; }
  const campAtt=attackCamp();
  let attCards=[], defCards=[];
  for(let i=0;i<n;i++){
    if(campAtt.includes(i)) attCards.push(...G.tricksWon[i]);
    else defCards.push(...G.tricksWon[i]);
  }
  attCards.push(...G.ecart);
  if(contract.id==='gs') attCards.push(...G.chien);
  if(contract.id==='gc') defCards.push(...G.chien);
  // échanges différés de l'Excuse : le camp qui l'a rendue donne une carte 0,5 en retour
  (G._excuseSwap||[]).forEach(sw=>{
    const giver = campAtt.includes(sw.to)? attCards : defCards;
    const recv  = campAtt.includes(sw.to)? defCards : attCards;
    const idx=giver.findIndex(c=>c.pts===0.5 && !isBout(c) && c.kind!=='excuse');
    if(idx>=0){ recv.push(giver.splice(idx,1)[0]); }
  });
  G._excuseSwap=[];
  // Excuse jouée au dernier pli → elle change de camp (déjà restée chez le vainqueur du dernier pli : rien à faire,
  // le retour automatique a été inhibé au dernier pli)
  // un camp sans AUCUN pli ne peut conserver l'Excuse : elle part chez l'adversaire
  const noTrick=(cards,playerSet)=> G.players.every((p,i)=>!playerSet.includes(i) || (G.tricksWon[i]||[]).length===0);
  // (cas limite couvert implicitement par l'échange ci-dessus)
  const ptsAtt=sumPts(attCards);
  const nBouts=attCards.filter(isBout).length;
  const target=TARGET[nBouts];
  const diff=Math.round((ptsAtt-target)*2)/2;
  const success=diff>=0;
  const base=(25+Math.abs(diff))*contract.coef;
  // petit au bout : le Petit dans le DERNIER pli → prime au camp vainqueur de ce pli
  const lastTrickWinner=G.trickLeader; // vainqueur du dernier pli
  let petitPrime=0, petitCamp=null;
  // on retrouve le petit dans le dernier pli via tricksWon du vainqueur (dernières cartes)
  const lastCards=G.tricksWon[lastTrickWinner].slice(-n);
  if(lastCards.some(isPetit)){ petitPrime=10*contract.coef; petitCamp=campAtt.includes(lastTrickWinner)?'att':'def'; }
  // poignées
  let poigneeAtt=0, poigneeDef=0;
  Object.entries(G.poignees).forEach(([i,pg])=>{
    const inAtt=campAtt.includes(+i);
    if(inAtt) poigneeAtt+=pg.val; else poigneeDef+=pg.val;
  });
  // chelem (non annoncé : +200 ; le camp gagne TOUS les plis)
  const attAll = G.players.every((p,i)=> !campAtt.includes(i) ? (G.tricksWon[i]||[]).length===0 : true);
  const defAll = G.players.every((p,i)=>  campAtt.includes(i) ? (G.tricksWon[i]||[]).length===0 : true);
  let chelem=0;
  if(attAll) chelem=200; else if(defAll) chelem=-200;
  let value=(success?1:-1)*base;
  if(petitCamp==='att') value+=(success?1:-1)*petitPrime; else if(petitCamp==='def') value-=(success?1:-1)*petitPrime;
  value+=(success?1:-1)*(poigneeAtt)- (success?1:-1)*poigneeDef*0; // primes poignée défense : déduites
  if(poigneeDef) value-=(success?1:-1)*poigneeDef;
  value+=chelem;
  value=Math.round(value);
  // --- marque par configuration ---
  const deltas=G.players.map(()=>0);
  const v=Math.abs(value)* (success?1:-1);
  if(n===3){ deltas[taker]=2*v; G.players.forEach((_,i)=>{ if(i!==taker) deltas[i]=-v; }); }
  else if(n===4){ deltas[taker]=3*v; G.players.forEach((_,i)=>{ if(i!==taker) deltas[i]=-v; }); }
  else{
    if(G.alone){ deltas[taker]=4*v; G.players.forEach((_,i)=>{ if(i!==taker) deltas[i]=-v; }); }
    else{
      const partner=G.partner>=0?G.partner:taker;
      deltas[taker]=2*v; deltas[partner]+=1*v;
      G.players.forEach((_,i)=>{ if(i!==taker&&i!==partner) deltas[i]=-v; });
    }
  }
  deltas.forEach((d,i)=>{ G.marque[i]+=d; });
  // --- statistiques locales ---
  G.stats.donnes++;
  if(G.taker===G.me){ G.stats.prises++; if(success) G.stats.reussies++; }
  if(n===5 && G.partnerKnown && G.partner===G.me) G.stats.appele++;
  deltas[G.me]>0 ? G.stats.ptsPlus+=deltas[G.me] : G.stats.ptsMoins+=-deltas[G.me];
  if(petitCamp){ const mine=(petitCamp==='att')===campAtt.includes(G.me); if(mine) G.stats.petitGagne++; else G.stats.petitPerdu++; }
  if(G.poignees[G.me]) G.stats.poignees++;
  saveStats();
  // --- affichage ---
  const role = G.taker===G.me ? 'Preneur' : (n===5&&G.partner===G.me&&G.partnerKnown)?'Appelé':'Défense';
  $('#score-title').textContent = success
    ? `✅ ${G.players[taker].name} réussit sa ${contract.label}` : `❌ ${G.players[taker].name} chute sa ${contract.label}`;
  let html=`<table class="score-table">
    <tr><td>Points de l'attaque</td><td><b>${fmtPts(ptsAtt)}</b> / ${target} (${nBouts} bout${nBouts>1?'s':''})</td></tr>
    <tr><td>Écart</td><td>${diff>=0?'+':''}${fmtPts(diff)}</td></tr>
    <tr><td>Base (25 + |écart|) × ${contract.coef}</td><td>${base}</td></tr>`;
  if(petitPrime) html+=`<tr><td>Petit au bout (${petitCamp==='att'?'attaque':'défense'})</td><td>${petitCamp==='att'?'+':'−'}${petitPrime}</td></tr>`;
  if(poigneeAtt) html+=`<tr><td>Poignée attaque</td><td>+${poigneeAtt}</td></tr>`;
  if(poigneeDef) html+=`<tr><td>Poignée défense</td><td>−${poigneeDef}</td></tr>`;
  if(chelem) html+=`<tr><td>Chelem ${attAll?'attaque':'défense'} (non annoncé)</td><td>${chelem>0?'+':''}${chelem}</td></tr>`;
  html+=`<tr class="total"><td>Valeur de la donne</td><td>${v>0?'+':''}${v}</td></tr></table>`;
  html+=`<h3 style="margin-top:12px;">Marque (${n===3?'preneur ±2, défenseurs ∓1':n===4?'preneur ±3, défenseurs ∓1':G.alone?'seul ±4, défenseurs ∓1':'preneur ±2, appelé ±1, défenseurs ∓1'})</h3>
    <table class="score-table">`;
  G.players.forEach((p,i)=>{
    html+=`<tr><td>${p.emoji} ${p.name}${i===G.me?' (toi)':''}${i===taker?' 👑':''}${n===5&&i===G.partner&&G.partnerKnown?' 🤝':''}</td>
      <td style="color:${deltas[i]>=0?'#2e7d32':'#c0392b'};font-weight:700;">${deltas[i]>=0?'+':''}${deltas[i]}</td>
      <td style="color:#7a6a55;">total ${G.marque[i]>=0?'+':''}${G.marque[i]}</td></tr>`;
  });
  html+=`</table><p class="small-note">Ton rôle : <b>${role}</b> · somme des marques = ${deltas.reduce((a,b)=>a+b,0)} (contrôle)</p>`;
  // --- duplicate : enregistrement au vivier / comparaison à poste égal ---
  const result={pid:PROFILE.id||'anon', pseudo:PROFILE.pseudo||'Moi', delta:deltas[G.me], role, contract:G.contract, takerName:G.players[taker].name, date:Date.now()};
  if(G.dup){
    const v=loadVivier(n); const entry=v.find(d=>d.id===G.dup.id) || G.dup;
    const others=(entry.results||[]).slice();
    entry.results=others.concat([result]);
    if(!v.includes(entry)) v.push(entry);
    saveVivier(n, v); markSeen(entry.id);
    html+=dupCompareHtml(entry, others, result);
  }else if(G.rec && (G.contract==='garde' || G.contract==='gs')){
    const v=loadVivier(n);
    v.push({...G.rec, origin:{contract:G.contract, taker:G.players[taker].name, by:PROFILE.pseudo||'Moi'}, results:[result]});
    saveVivier(n, v); markSeen(G.rec.id);
    html+=`<p class="small-note">🏆 Donne <b>${G.rec.id}</b> jouée en ${contract.label} : elle entre dans le vivier de duplicate (les autres profils pourront la rejouer).</p>`;
  }
  const boutsAtt=attCards.filter(isBout).map(c=>c.kind==='excuse'?'Excuse':c.num===1?'Petit':'21');
  html=html.replace('</table>', `<tr><td>Bouts de l'attaque</td><td>${boutsAtt.length? boutsAtt.join(', ') : 'aucun'}</td></tr></table>`);
  $('#score-detail').innerHTML=html;
  updateDupButtons();
  if(AUTO){ window.__deals=(window.__deals||0)+1; (window.__sums=window.__sums||[]).push(deltas.reduce((a,b)=>a+b,0)); }
  renderDonnePanel(); renderCrowns();
  $('#score-overlay').hidden=false;
  logEv(success?`${contract.label} réussie`:`${contract.label} chutée`);
  if(AUTO && (window.__deals||0) < (window.__target||12)){
    setTimeout(()=>{ $('#score-overlay').hidden=true;
      if(AUTO_DUP){ const d=pickDuplicate(G.n); if(d){ newDeal(d); return; } }
      newDeal(); }, 5);
  }
}
function dupCompareHtml(entry, others, me){
  const pct=(list)=>{ if(!list.length) return null; let s=0; list.forEach(o=>{ if(me.delta>o.delta) s+=1; else if(me.delta===o.delta) s+=.5; }); return Math.round(100*s/list.length); };
  const same=others.filter(o=>o.role===me.role);
  const all=pct(others), eq=pct(same);
  const lbl=x=>CONTRACTS.find(c=>c.id===x)?.label||x;
  let h=`<div class="dup-box"><h3>🏆 Duplicate ${entry.id} — même main que les joueurs précédents</h3>`;
