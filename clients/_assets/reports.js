/* ============================================================
   BRUNN Dashboard Engine — completo (ecommerce)
   Recibe un data.json y dibuja Resumen + Recomendaciones + Métricas.
   ============================================================ */

/* ---------- helpers de formato numérico para el gráfico ---------- */
function fmtNum(n){ return (Math.round(n)).toLocaleString('es-AR'); }

/* ---------- gráfico de línea en SVG (a partir de data.serie) ---------- */
function lineChart(vals, colorVar, suffix){
  var W=720,H=250,padL=42,padR=10,padT=16,padB=24;
  var pw=W-padL-padR, ph=H-padT-padB, mx=Math.max.apply(null,vals)*1.12;
  var soft = colorVar==='pos' ? 'rgba(78,203,139,.16)' : 'var(--accent-soft)';
  var stroke = colorVar==='pos' ? 'var(--pos)' : 'var(--accent)';
  function xs(k){ return padL + k*(pw/(vals.length-1)); }
  function ys(v){ return padT + ph - (v/mx)*ph; }
  var grid='', yl='';
  for(var g=0; g<4; g++){
    var gy = padT + ph*g/3, val = mx*(1-g/3);
    grid += '<line x1="'+padL+'" y1="'+gy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+gy.toFixed(1)+'" stroke="var(--chart-grid)" stroke-width="1"/>';
    yl += '<text x="'+(padL-7)+'" y="'+(gy+3).toFixed(1)+'" text-anchor="end" font-size="9" fill="var(--ink-3)" font-family="Inter">'+Math.round(val)+'</text>';
  }
  var ln='', area='M'+xs(0).toFixed(1)+' '+(padT+ph).toFixed(1)+' ';
  for(var k=0;k<vals.length;k++){
    ln += (k?'L':'M')+xs(k).toFixed(1)+' '+ys(vals[k]).toFixed(1)+' ';
    area += 'L'+xs(k).toFixed(1)+' '+ys(vals[k]).toFixed(1)+' ';
  }
  area += 'L'+xs(vals.length-1).toFixed(1)+' '+(padT+ph).toFixed(1)+' Z';
  var pk=0; for(var j=1;j<vals.length;j++){ if(vals[j]>vals[pk]) pk=j; }
  var peak='<text x="'+xs(pk).toFixed(1)+'" y="'+(ys(vals[pk])-7).toFixed(1)+'" text-anchor="middle" font-size="9.5" font-weight="700" fill="'+stroke+'" font-family="Inter">'+fmtNum(vals[pk])+(suffix||'')+'</text>';
  var xl=''; for(var x=0;x<vals.length;x+=6){ xl += '<text x="'+xs(x).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" fill="var(--ink-3)" font-family="Inter">'+(x+1)+'</text>'; }
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+grid+yl+xl+'<path d="'+area+'" fill="'+soft+'"/><path d="'+ln+'" fill="none" stroke="'+stroke+'" stroke-width="2.4" stroke-linejoin="round"/>'+peak+'</svg>';
}

/* ---------- celda de tabla (texto / rank / stack / pct) ---------- */
function celda(c){
  if(typeof c === 'string') return c;
  if(c.rank!==undefined) return '<span class="t-rank"><span class="t-ix">'+c.rank+'</span>'+c.texto+'</span>';
  if(c.stack) return '<div class="td-stack">'+c.stack[0]+'<span class="td-sub">'+c.stack[1]+'</span></div>';
  if(c.pct!==undefined) return '<span class="pct-'+(c.tipo==='pos'?'pos':'neg')+'">'+c.pct+'</span>';
  return '';
}
function tabla(b){
  var th = b.headers.map(function(h){return '<th>'+h+'</th>';}).join('');
  var rows = b.filas.map(function(f){
    return '<tr>'+f.map(function(c){return '<td>'+celda(c)+'</td>';}).join('')+'</tr>';
  }).join('');
  return '<div class="panel"><div class="section-h">'+b.titulo+'</div><div class="section-sub">'+b.sub+'</div>'+
         '<div class="table-scroll"><table><thead><tr>'+th+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function chartBlock(b){
  var stats = b.stats.map(function(s){return '<span>'+s[0]+'<b>'+s[1]+'</b></span>';}).join('');
  return '<div class="panel"><div class="section-h">'+b.titulo+'</div><div class="section-sub">'+b.sub+'</div>'+
         '<div class="chart-stats">'+stats+'</div><div class="chart-box">'+lineChart(b.serie,b.color,b.suffix)+'</div></div>';
}

/* ---------- bloques del Resumen ---------- */
function renderBanda(banda){
  return banda.map(function(b){
    return '<div class="b"><div class="b-label">'+b.label+'</div><div class="b-val">'+b.valor+'</div>'+
           '<div class="b-delta '+b.tipo+'">'+b.delta+' <span>'+b.ctx+'</span></div></div>';
  }).join('');
}
function renderEmbudo(e){
  var html='<div class="funnel"><div class="section-h">'+e.titulo+'</div><div class="section-sub">'+e.sub+'</div>';
  for(var i=0;i<e.pasos.length;i++){
    var p=e.pasos[i], weak=p.weak?' weak':'';
    html += '<div class="fv-step'+weak+'"><div class="fv-top"><span class="fv-name">'+p.nombre+'</span><span class="fv-num">'+p.valor+'</span></div><div class="fv-bar"><i style="width:'+p.width+'%"></i></div></div>';
    if(i<e.conversiones.length){
      var c=e.conversiones[i];
      html += '<div class="fv-conv"><span class="arrow">↓</span><span class="rate '+(c.drop?'drop':'')+'">'+c.rate+'</span><span class="ctx">'+c.ctx+'</span></div>';
    }
  }
  if(e.nota) html += '<div class="fv-note">'+e.nota+'</div>';
  return html+'</div>';
}
function renderSnapshot(snap){
  return snap.map(function(s){
    var style = s.color==='pos' ? ' style="color:var(--pos)"' : '';
    return '<div class="snap-card"><div class="snap-ch">'+s.canal+'</div><div class="snap-val"'+style+'>'+s.valor+'</div><div class="snap-lbl">'+s.label+'</div></div>';
  }).join('');
}
function renderNarrativa(ps){
  return ps.map(function(p,i){ return '<p'+(i===ps.length-1?' class="key"':'')+'>'+p+'</p>'; }).join('');
}
function renderHighlights(hl){
  return hl.map(function(h){ return '<div class="hl"><div class="v">'+h.valor+'</div><div class="l">'+h.label+'</div></div>'; }).join('');
}

/* ---------- Próximos Pasos ---------- */
function renderPasos(pasos){
  var html='<div class="steps">';
  pasos.forEach(function(s){
    html += '<div class="step"><div class="step-head"><span class="step-n">'+s.n+'</span><span class="step-title">'+s.titulo+'</span></div>'+
      '<div class="step-body">'+
        '<div class="step-col diag"><div class="sc-l">Diagnóstico</div><p>'+s.diag+'</p></div>'+
        '<div class="step-col act"><div class="sc-l">Acción Sugerida</div><p>'+s.accion+'</p></div>'+
        '<div class="step-col imp"><div class="sc-l">Impacto Esperado</div><p>'+s.impacto+'</p></div>'+
      '</div></div>';
  });
  return html+'</div>';
}

/* ---------- Métricas (canales) ---------- */
function renderKpis(kpis){
  return '<div class="kpis">'+kpis.map(function(k){
    return '<div class="kpi"><div class="k-l">'+k.label+'</div><div class="k-v">'+k.valor+'</div><div class="k-d '+k.tipo+'">'+k.delta+'</div></div>';
  }).join('')+'</div>';
}
function renderCanal(c, periodo){
  var lectura = c.lectura.map(function(x){return '<li>'+x+'</li>';}).join('');
  var titulo = c.panel_titulo || 'Total del Canal';
  var sub = c.panel_sub || (c.nombre + ' · ' + periodo);
  var html = '<div class="panel"><div class="section-h">'+titulo+'</div><div class="section-sub">'+sub+'</div>'+
    renderKpis(c.kpis)+
    '<div class="quick"><div class="qt">En pocas palabras</div><ul>'+lectura+'</ul></div></div>';
  // bloques: si hay 2, van en grid-2; si hay 1, suelto
  var bloques = c.bloques.map(function(b){ return b.tipo==='chart' ? chartBlock(b) : tabla(b); });
  if(bloques.length>=2){
    html += '<div class="grid-2">'+bloques[0]+bloques[1]+'</div>';
    for(var i=2;i<bloques.length;i++) html += bloques[i];
  } else if(bloques.length===1){
    html += bloques[0];
  }
  return html;
}
function renderMetricas(metricas, periodo){
  var tabs = metricas.map(function(c,i){
    return '<button class="chtab'+(i===0?' active':'')+'" data-ch="'+c.id+'">'+c.nombre+'</button>';
  }).join('');
  var panels = metricas.map(function(c,i){
    return '<div data-cv="'+c.id+'"'+(i===0?' class="show"':'')+'>'+renderCanal(c,periodo)+'</div>';
  }).join('');
  return '<div class="chtabs">'+tabs+'</div>'+panels;
}

/* ---------- recordar/restaurar la vista activa entre cambios de período ---------- */
function capturarVista(){
  var st = {main:'resumen', sub:'exec', ch:null};
  var mainActive = document.querySelector('.tab.active');
  if(mainActive) st.main = mainActive.dataset.main;
  var subActive = document.querySelector('.subtab.active');
  if(subActive) st.sub = subActive.dataset.sub;
  var chActive = document.querySelector('.chtab.active');
  if(chActive) st.ch = chActive.dataset.ch;
  return st;
}
function restaurarVista(st){
  if(!st) return;
  // pestaña principal (Resumen / Métricas)
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.main===st.main);});
  document.querySelectorAll('[data-view="resumen"],[data-view="metricas"]').forEach(function(v){v.classList.toggle('show',v.dataset.view===st.main);});
  // sub-pestaña (Ejecutivo / Próximos)
  document.querySelectorAll('.subtab').forEach(function(s){s.classList.toggle('active',s.dataset.sub===st.sub);});
  document.querySelectorAll('[data-view="exec"],[data-view="next"]').forEach(function(v){v.classList.toggle('show',v.dataset.view===st.sub);});
  // canal activo dentro de Métricas (si el canal sigue existiendo en el nuevo período)
  if(st.ch && document.querySelector('.chtab[data-ch="'+st.ch+'"]')){
    document.querySelectorAll('.chtab').forEach(function(c){c.classList.toggle('active',c.dataset.ch===st.ch);});
    document.querySelectorAll('[data-cv]').forEach(function(v){v.classList.toggle('show',v.dataset.cv===st.ch);});
  }
}

/* ---------- AWARENESS: distribución de frecuencia ---------- */
function renderFrecuencia(f){
  var html = '<div class="funnel">';
  html += '<div class="section-h">'+f.titulo+'</div><div class="section-sub">'+f.sub+'</div>';
  // barra apilada
  var barra = f.segmentos.map(function(s){
    var txt = s.pct>=9 ? (s.pct+'%') : '';   // ocultar texto en segmentos muy angostos
    return '<i style="width:'+s.pct+'%;background:'+s.color+'">'+txt+'</i>';
  }).join('');
  html += '<div class="freq">'+barra+'</div>';
  // leyenda
  var leg = f.segmentos.map(function(s){
    return '<span><i style="background:'+s.color+'"></i><b>'+s.label+'</b> · '+s.detalle+'</span>';
  }).join('');
  html += '<div class="freq-legend">'+leg+'</div>';
  if(f.nota) html += '<div class="fv-note">'+f.nota+'</div>';
  return html+'</div>';
}

/* ---------- COMMUNITY: progreso hacia la meta ---------- */
function renderProgreso(p){
  var w = Math.max(0, Math.min(100, p.pct));
  var html = '<div class="funnel">';
  html += '<div class="section-h">'+p.titulo+'</div><div class="section-sub">'+p.sub+'</div>';
  html += '<div class="goal-head"><span class="goal-now-val">'+p.actual+'</span><span class="goal-now-pct">'+p.pct+'% de la meta</span></div>';
  html += '<div class="goal-track"><div class="goal-fill" style="width:'+w+'%"></div></div>';
  html += '<div class="goal-ends"><div><b>'+p.neto+'</b>'+p.neto_ctx+'</div><div class="r"><b>'+p.meta+'</b>'+p.meta_ctx+'</div></div>';
  if(p.nota) html += '<div class="fv-note">'+p.nota+'</div>';
  return html+'</div>';
}

/* ---------- router de sección diferenciadora según el tipo de reporte ---------- */
function renderDiferenciadora(data){
  if(data.embudo)    return renderEmbudo(data.embudo);       // ecommerce, leads
  if(data.frecuencia) return renderFrecuencia(data.frecuencia); // awareness (futuro)
  if(data.progreso)   return renderProgreso(data.progreso);     // community (futuro)
  return '';
}

/* ---------- FUNCIÓN PRINCIPAL ---------- */
function renderDashboard(data){
  var __prev = capturarVista();
  document.querySelector('.client').textContent = data.meta.cliente;
  document.querySelector('.client-sub').textContent = data.meta.subtitulo;
  document.title = data.meta.cliente + ' · ' + data.meta.periodo;

  // Vista RESUMEN — Resumen Ejecutivo
  var exec =
    '<div class="month-title"><div class="mt-eyebrow">'+data.portada.eyebrow+'</div>'+
      '<h1 class="mt-h">'+data.portada.titular+'</h1><div class="mt-rule"></div></div>'+
    '<div class="tldr"><div class="eyebrow">En pocas palabras</div><p>'+data.portada.resumen+'</p></div>'+
    '<div class="hero"><div class="hero-main">'+
        '<div class="h-label">'+data.hero.label+'</div><div class="h-val">'+data.hero.valor+'</div>'+
        '<div class="h-delta"><span class="pill">'+data.hero.delta+'</span> '+data.hero.delta_ctx+'</div></div>'+
      '<div class="h-desc-wrap"><div class="h-desc">'+data.hero.desc1+'</div><div class="h-desc">'+data.hero.desc2+'</div></div></div>'+
    '<div class="band">'+renderBanda(data.banda)+'</div>'+
    renderDiferenciadora(data)+
    '<p class="snap-intro">Snapshot del mes · un vistazo por canal</p>'+
    '<div class="snap">'+renderSnapshot(data.snapshot)+'</div>'+
    '<div class="exec"><div class="narr">'+renderNarrativa(data.narrativa)+'</div>'+
      '<div class="hl-stack">'+renderHighlights(data.highlights)+'</div></div>';

  // Vista RESUMEN — Recomendaciones
  var next = data.recomendaciones ? renderPasos(data.recomendaciones) : '<p class="section-sub">Sin recomendaciones para este período.</p>';

  // Vista MÉTRICAS
  var metricas = data.metricas ? renderMetricas(data.metricas, data.meta.periodo) : '<p class="section-sub">Sin métricas cargadas para este período.</p>';

  document.getElementById('dashboard-body').innerHTML =
    '<div class="tabs"><button class="tab active" data-main="resumen">Resumen</button><button class="tab" data-main="metricas">Métricas</button></div>'+
    '<div data-view="resumen" class="show">'+
      '<div class="subtabs"><button class="subtab active" data-sub="exec">Resumen Ejecutivo</button><button class="subtab" data-sub="next">Recomendaciones</button></div>'+
      '<div data-view="exec" class="show">'+exec+'</div>'+
      '<div data-view="next">'+next+'</div>'+
    '</div>'+
    '<div data-view="metricas">'+metricas+'</div>';

  wireTabs();
  restaurarVista(__prev);
}

/* ---------- interacciones (tabs, subtabs, channel tabs) ---------- */
function wireTabs(){
  document.querySelectorAll('.tab').forEach(function(t){t.onclick=function(){
    document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');}); t.classList.add('active');
    document.querySelectorAll('[data-view="resumen"],[data-view="metricas"]').forEach(function(v){v.classList.toggle('show',v.dataset.view===t.dataset.main);});
  };});
  document.querySelectorAll('.subtab').forEach(function(s){s.onclick=function(){
    document.querySelectorAll('.subtab').forEach(function(x){x.classList.remove('active');}); s.classList.add('active');
    document.querySelectorAll('[data-view="exec"],[data-view="next"]').forEach(function(v){v.classList.toggle('show',v.dataset.view===s.dataset.sub);});
  };});
  document.querySelectorAll('.chtab').forEach(function(c){c.onclick=function(){
    document.querySelectorAll('.chtab').forEach(function(x){x.classList.remove('active');}); c.classList.add('active');
    document.querySelectorAll('[data-cv]').forEach(function(v){v.classList.toggle('show',v.dataset.cv===c.dataset.ch);});
  };});
}

/* ---------- dropdown de períodos ---------- */
function renderDropdown(periodos, onChange){
  var sel = document.getElementById('periodSel');
  sel.innerHTML = periodos.map(function(p){ return '<option value="'+p.id+'">'+p.label+'</option>'; }).join('');
  sel.onchange = function(){ onChange(sel.value); };
}

/* ---------- estado vacío: cliente sin reportes cargados todavía ---------- */
function renderEstadoVacio(meta){
  var c = document.querySelector('.client'); if(c) c.textContent = meta.cliente || '—';
  var s = document.querySelector('.client-sub'); if(s) s.textContent = meta.subtitulo || '';
  var pp = document.querySelector('.period-pick'); if(pp) pp.style.display = 'none';
  document.title = (meta.cliente || 'BRUNN');
  document.getElementById('dashboard-body').innerHTML =
    '<div class="empty-state">'+
      '<div class="empty-mark"></div>'+
      '<div class="empty-h">Todavía no hay reportes cargados</div>'+
      '<div class="empty-sub">El primer reporte de este cliente va a aparecer acá en cuanto se publique.</div>'+
    '</div>';
}
