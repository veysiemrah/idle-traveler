/* V2 DOM views. One delegated listener; no timers or game state writes. */
(function(root){
'use strict';
const IT=root.IT,V=IT.V2;
const h=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanHTML=html=>html.replace(/></g,'>\n<');
const t=(k,vars)=>h(IT.t('v2.'+k,vars));
const button=(action,id,label,disabled=false,extra='')=>`<button type="button" class="v2-button" data-v2="${action}" data-key="${h(id)}" ${disabled?'disabled':''} ${extra}>${label}</button>`;
function choiceLabel(choice,expedition,worldId){
 const ability=IT.t('v2.'+choice.ability),skill=expedition.loadout.stats[choice.ability];
 const energy=expedition.resources.energy;
 const ready=skill>=3&&energy>=choice.energy;
 const hint=choice.safe
  ?t('safe',{n:worldId==='upper'||worldId==='void'?2:1})
  :t(ready?'prepared':'slow');
 const requirement=choice.safe?'':`<small>${t('choiceRequirement',{ability,skill,energy,required:choice.energy})}</small>`;
 return `<strong>${h(V.text(choice.text))}</strong><small>${hint}</small>${requirement}`;
}
function sceneView(state){const e=state.expedition;return {worldId:state.worldId,nodeId:e?.nodeId||'',travelProgress:e?e.workDone/e.workRequired:0,landmarks:state.completedNodes,weather:state.worldId==='storm'?'storm':'clear',scanReveal:Math.min(1,(e?.resources.scan||0)/2+state.completedNodes.filter(id=>id.startsWith('nebula')).length/6),transitionProgress:1,frontierOpen:state.claimedRewards.includes('frontier-dawn')};}
function mount(rootEl,onAction){
 let signature='',state,model,vehicle='',role='guide',abandonUntil=0,inspectedWorld='';
 const panes={voyage:rootEl.querySelector('#pane-voyage'),atlas:rootEl.querySelector('#pane-atlas'),camp:rootEl.querySelector('#pane-camp')};
 const listener=e=>{
  const b=e.target.closest('[data-v2]');if(!b||!rootEl.contains(b)||b.disabled)return;
  if(b.dataset.v2==='selectWorld'){
   inspectedWorld=b.dataset.key;
   if(state.expedition)render(state,model);
   else onAction('selectWorld',inspectedWorld);
   rootEl.scrollTop=0;
   panes.atlas.querySelector('#v2AtlasTitle').focus({preventScroll:true});
   return;
  }
  if(b.dataset.v2==='abandon'&&Date.now()>abandonUntil){abandonUntil=Date.now()+4000;b.textContent=IT.t('v2.confirmAbandon');return;}
  if(b.dataset.v2==='abandon')abandonUntil=0;
  onAction(b.dataset.v2,b.dataset.key,{vehicleId:vehicle||model.active,role,slot:b.dataset.slot});
 };
 const change=e=>{if(e.target.id==='v2Vehicle')vehicle=e.target.value;else if(e.target.id==='v2Role')role=e.target.value;else return;signature='';render(state,model);};
 rootEl.addEventListener('click',listener);rootEl.addEventListener('change',change);
 function render(s,m){
  state=s;model=m;
  if(inspectedWorld&&!m.entries.includes(inspectedWorld))inspectedWorld='';
  const e=s.expedition,percent=e?Math.floor(100*e.workDone/e.workRequired):0;
  const mark=JSON.stringify([s.worldId,s.unlockedWorlds,s.claimedRewards,s.research,s.camp,s.equipment,s.clues,e&&[e.id,e.status,e.nodeIndex,e.resources],m.active,m.owned,m.entries,m.locked,IT.lang(),vehicle,role,inspectedWorld,s.fleet.map(f=>[f.id,f.status,f.nodeIndex])]);
  if(mark===signature){ for (const f of s.fleet) { const p=rootEl.querySelector(`[data-fleet-progress="${f.slot}"]`); if(p)p.value=Math.floor(100*f.workDone/f.workRequired); } const bar=panes.voyage.querySelector('.v2-expedition progress');if(bar)bar.value=percent;const p=panes.voyage.querySelector('[data-progress]');if(p)p.textContent=percent+'%';return;}
  signature=mark;
  const focus=document.activeElement,focusKey=rootEl.contains(focus)?[focus.dataset.v2,focus.dataset.key,focus.id]:null;
  const world=V.WORLD[s.worldId],locked=m.locked;
  const heading=`<div class="v2-heading"><span class="v2-world-mark" aria-hidden="true">${['◈','☁','ϟ','◜','◉','✧','✦','⌁','·','✺','⋈','❋'][world.index]}</span><div><h2>${h(V.text(world.name))}</h2><p>${h(V.text(world.description))}</p></div></div>`;
  let body='';
  if(!e)body=`<p class="v2-intro">${t('idle')}</p><p>${t('intro')}</p>${button('showAtlas','',t('openAtlas'),locked)}`;
  else {
   const template=V.TEMPLATE[e.templateId],node=template.nodes[e.nodeIndex];
   body=`<div class="v2-expedition"><p class="v2-status">${t(e.status)}</p><h3>${h(V.text(template.name))}</h3><div class="v2-progress-row"><span>${e.nodeIndex+1} / ${template.nodes.length}</span><strong data-progress>${percent}%</strong></div><progress max="100" value="${percent}" aria-label="${t('traveling')}"></progress><p class="v2-energy">${t('energy')}: ${e.resources.energy} / 5</p><p class="v2-mechanic">${t('mechanic.'+s.worldId)}</p><dl class="v2-stats">${Object.entries(e.resources).filter(([key])=>key!=='energy').map(([key,value])=>`<div><dt>${t(key)}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
   if(e.status==='awaitingChoice')body+=`<p>${t('choiceHelp')}</p><div class="v2-choices">`+node.choices.map(c=>button('choose',c.id,choiceLabel(c,e,template.worldId),locked)).join('')+'</div>';
   if(e.status==='readyToClaim')body+=`<p>${t('claimHelp')}</p>`+button('claim','',t('claim'),locked);
   body+=button('abandon','',t('abandon'),locked,'data-quiet="true"')+'</div>';
  }
  let fleet='';
  if(s.fleet.length)fleet=`<h3 id="v2FleetTitle" tabindex="-1">${t('fleet')}</h3>`+s.fleet.map(f=>{
   const mission=V.TEMPLATE[f.templateId];let controls='';
   if(f.status==='awaitingChoice')controls=mission.nodes[f.nodeIndex].choices.map(c=>button('fleetChoose',c.id,choiceLabel(c,f,mission.worldId),locked,`data-slot="${f.slot}"`)).join('');
   if(f.status==='readyToClaim')controls=button('fleetClaim','',t('claim'),locked,`data-slot="${f.slot}"`);
   return `<article class="v2-mission"><h3>${t('ship')} ${f.slot+1} · ${h(V.text(mission.name))}</h3><p>${t(f.status)} · ${t(f.loadout.role)}</p><progress data-fleet-progress="${f.slot}" max="100" value="${Math.floor(100*f.workDone/f.workRequired)}" aria-label="${t('traveling')}"></progress><div class="v2-choices">${controls}</div></article>`;
  }).join('');
  panes.voyage.innerHTML=cleanHTML(heading+(locked?`<p role="alert">${t('saveProtected')}</p>`:'')+body+fleet);
  const equippedVehicle=m.owned[vehicle]?vehicle:m.active;vehicle=equippedVehicle;
  const stats=V.loadoutStats(vehicle,s.equipment,role,s.camp);
  const preparation=`<h3>${t('preparation')}</h3><p class="v2-note">${t('preparationHelp')}</p><div class="v2-preparation"><label for="v2Vehicle">${t('vehicle')}</label><select id="v2Vehicle">${IT.VEHICLES.filter(v=>m.owned[v.id]).map(v=>`<option value="${v.id}" ${v.id===vehicle?'selected':''}>${h(v.name)}</option>`).join('')}</select><label for="v2Role">${t('role')}</label><select id="v2Role">${['guide','engineer','researcher'].map(r=>`<option value="${r}" ${role===r?'selected':''}>${t(r)}</option>`).join('')}</select><dl class="v2-stats">${Object.entries(stats).map(([k,n])=>`<div><dt>${t(k)}</dt><dd>${n}/5</dd></div>`).join('')}</dl></div>`;
  const atlasWorld=V.WORLD[inspectedWorld]||world;
  const atlasHeading=`<div class="v2-heading"><div><h2 id="v2AtlasTitle" tabindex="-1">${h(V.text(atlasWorld.name))}</h2><p>${h(V.text(atlasWorld.description))}</p></div></div>`;
  const fleetOpen=s.unlockedWorlds.includes('galaxies');
  const freeSlot=[0,1,2].find(slot=>!s.fleet.some(f=>f.slot===slot));
  const crewBusy=s.fleet.some(f=>f.loadout.role===role);
  const worldMissions=V.TEMPLATES.filter(x=>x.worldId===atlasWorld.id);
  const done=worldMissions.filter(x=>s.claimedRewards.includes(x.id)).length;
  const missions=V.availableTemplates(s,atlasWorld.id).map(x=>{
   const complete=s.claimedRewards.includes(x.id);
   return `<article class="v2-mission"><h4>${h(V.text(x.name))}</h4><p>${t(complete?'repeatReward':'firstReward',{n:x.research})}</p><div class="v2-actions">${button('start',x.id,t(complete?'revisit':'start'),!!e||locked)}${fleetOpen?button('startFleet',x.id,t('sendFleet'),locked||freeSlot===undefined||crewBusy,`data-slot="${freeSlot??0}"`):''}</div></article>`;
  }).join('');
  const fleetHelp=fleetOpen
   ?`<p>${t('fleetHelp',{n:s.fleet.length})}</p>${freeSlot===undefined||crewBusy?`<p>${t(freeSlot===undefined?'fleetFull':'crewBusy')}</p>`:''}`
   :`<p>${t('fleetLocked',{world:V.text(V.WORLD.galaxies.name)})}</p>`;
  const voyageLink=button('showVoyage','',t('openVoyage'));
  const fleetLink=s.fleet.length?button('showVoyage','fleet',t('openFleet')):'';
  const missionHelp=`<div class="v2-guide"><p><strong>${t('discoveryProgress',{done,total:worldMissions.length})}</strong></p><p>${t('mechanic.'+atlasWorld.id)}</p>${e?`<p>${t('activeExpedition')}</p>${voyageLink}`:''}</div>`;
  panes.atlas.innerHTML=cleanHTML(atlasHeading+missionHelp+preparation+`<div class="v2-guide"><h3>${t('fleet')}</h3>${fleetHelp}${fleetLink}</div><div class="v2-missions"><h3>${t('missions')}</h3>${missions}</div><h3>${t('next')}</h3><ol class="v2-world-list">`+V.WORLDS.map(w=>{
   const open=m.entries.includes(w.id);
   const previous=V.WORLDS.find(candidate=>candidate.next===w.id);
   const shortcut={cloud:'unlockBalloon',planets:'unlockRocket',rim:'unlockDistance'}[w.id];
   const requirement=open?'':`<small>${t('requires',{world:V.text(previous.name)})}${shortcut?' '+t(shortcut):''}</small>`;
   return `<li class="${w.id===s.worldId?'is-here':''} ${open?'':'is-locked'}"><span class="v2-map-dot" aria-hidden="true"></span><div><h3>${h(V.text(w.name))}</h3><p>${h(V.text(w.description))}</p>${open?button('selectWorld',w.id,t(e?'inspectWorld':'visit'),locked):requirement}</div></li>`;
  }).join('')+'</ol>');
  const buildings=Object.entries(s.camp).map(([id,level])=>`<article class="v2-building"><div class="v2-building-drawing" data-building="${id}" style="--level:${level}" aria-hidden="true"><i></i><i></i><i></i></div><h3>${t(id)} <small>${level}/5</small></h3><p>${t('campEffect.'+id)}</p>${button('upgradeCamp',id,level===5?t('max'):`${t('upgrade')} · ${V.COSTS[level]} ${t('research')}`,locked||level===5||s.research<V.COSTS[level])}</article>`).join('');
  const equipment=Object.entries(V.EQUIPMENT).map(([slot,items])=>`<fieldset><legend>${t(slot)}</legend>${items.map(item=>button('equip',item.id,`${t(item.id)} <small>${t(item.ability)} +1</small>`,locked||!!e,`data-slot="${slot}" aria-pressed="${s.equipment[slot]===item.id}"`)).join('')}</fieldset>`).join('');
  panes.camp.innerHTML=cleanHTML(`<div class="v2-heading"><span class="v2-world-mark" aria-hidden="true">⌂</span><div><h2>${t('camp')}</h2><p>${t('research')}: <strong>${s.research}</strong></p></div></div><div class="v2-guide"><p>${t('researchHelp')}</p>${e?voyageLink:button('showAtlas','',t('openAtlas'),locked)}</div><div class="v2-buildings">${buildings}</div><h3 class="v2-section-title">${t('equipment')}</h3><p class="v2-note">${t(e?'equipmentBusy':'campHelp')}</p><div class="v2-equipment">${equipment}</div><h3>${t('clues')}</h3><div class="v2-clues">`+(s.clues.length?s.clues.map(id=>{const template=V.TEMPLATES.find(t=>t.clueId===id),w=V.WORLD[template.worldId];return `<article><h4>${h(V.text(template.name))}</h4><p>${h(V.text(w.clues[template.index]))}</p></article>`;}).join(''):`<p>${t('noClues')}</p>`)+ '</div>');
  if(focusKey){const candidates=rootEl.querySelectorAll('[data-v2],select,[tabindex="-1"][id]');const replacement=[...candidates].find(el=>focusKey[2]?el.id===focusKey[2]:el.dataset.v2===focusKey[0]&&el.dataset.key===focusKey[1]);if(replacement)replacement.focus({preventScroll:true});}
 }
 return {render,invalidate(){signature='';},destroy(){rootEl.removeEventListener('click',listener);rootEl.removeEventListener('change',change);}};
}
V.sceneView=sceneView;V.Views={mount};
})(window);
