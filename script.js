(() => {
  "use strict";
  const STORAGE_KEY = "pptArenHead_v1";
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const offsetISO = (days) => {
    const d = new Date(); d.setDate(d.getDate()+days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
  const shortMoney = n => {
    n = Number(n)||0; const a=Math.abs(n);
    if(a>=1e9) return `Rp${(n/1e9).toLocaleString("id-ID",{maximumFractionDigits:1})} M`;
    if(a>=1e6) return `Rp${(n/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})} jt`;
    if(a>=1e3) return `Rp${(n/1e3).toLocaleString("id-ID",{maximumFractionDigits:1})} rb`;
    return money(n);
  };
  const dateLabel = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const esc = s => String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const defaultState = () => {
    const catBank = {id:uid(),name:"Perbankan"}, catEdu={id:uid(),name:"Universitas"}, catDist={id:uid(),name:"Distribusi"}, catMan={id:uid(),name:"Manufaktur"}, catTech={id:uid(),name:"Teknologi"};
    const g1={id:uid(),name:"Grup Contoh Nusantara",description:"Contoh grup usaha untuk mencoba dashboard."};
    const c1={id:uid(),name:"PT Contoh Finansial",categoryId:catBank.id,groupId:g1.id,description:"Perusahaan contoh bidang finansial.",openingBalance:10000000};
    const c2={id:uid(),name:"PT Distribusi Mandiri",categoryId:catDist.id,groupId:g1.id,description:"Contoh perusahaan distribusi.",openingBalance:5000000};
    const c3={id:uid(),name:"Universitas Contoh",categoryId:catEdu.id,groupId:"",description:"Contoh institusi pendidikan mandiri.",openingBalance:2500000};
    const t = [
      {id:uid(),companyId:c1.id,date:offsetISO(-1),type:"income",category:"Penerimaan jasa",amount:1800000,description:"Penerimaan harian"},
      {id:uid(),companyId:c1.id,date:offsetISO(-1),type:"expense",category:"Operasional",amount:650000,description:"Biaya operasional"},
      {id:uid(),companyId:c1.id,date:todayISO(),type:"income",category:"Penerimaan jasa",amount:2400000,description:"Penerimaan harian"},
      {id:uid(),companyId:c1.id,date:todayISO(),type:"expense",category:"Operasional",amount:450000,description:"Biaya operasional"},
      {id:uid(),companyId:c2.id,date:offsetISO(-1),type:"income",category:"Penjualan",amount:1250000,description:"Penjualan barang"},
      {id:uid(),companyId:c2.id,date:todayISO(),type:"expense",category:"Pengiriman",amount:350000,description:"Biaya pengiriman"},
      {id:uid(),companyId:c3.id,date:todayISO(),type:"income",category:"Pembayaran",amount:800000,description:"Pembayaran contoh"}
    ];
    return {groups:[g1],categories:[catBank,catEdu,catDist,catMan,catTech],companies:[c1,c2,c3],transactions:t,hasSeed:true};
  };
  function loadState(){
    try {
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){const parsed=JSON.parse(raw); if(parsed&&Array.isArray(parsed.groups)&&Array.isArray(parsed.companies)&&Array.isArray(parsed.transactions)&&Array.isArray(parsed.categories)) return parsed;}
    } catch(e){console.warn("Data lokal tidak bisa dibaca:",e);}
    const fresh=defaultState(); saveState(fresh); return fresh;
  }
  let state=loadState(), currentView="overview", currentCompanyId=null, currentGroupId=null;
  let filters={search:"",categoryId:"",groupId:"",companyId:"",transactionType:"",period:"7"};
  let modalSubmit=null, toastTimer=null;
  function saveState(s=state){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch(e){alert("Penyimpanan gagal. Browser mungkin penuh atau mode privat membatasi penyimpanan.");}}
  function categoryName(id){return state.categories.find(x=>x.id===id)?.name||"Tanpa kategori";}
  function groupName(id){return state.groups.find(x=>x.id===id)?.name||"Mandiri / tanpa grup";}
  function companyName(id){return state.companies.find(x=>x.id===id)?.name||"Perusahaan dihapus";}
  function transactionsFor(companyIds){return state.transactions.filter(t=>companyIds.includes(t.companyId));}
  function statsFor(transactions, date=null){
    const list=date?transactions.filter(t=>t.date===date):transactions;
    const income=list.filter(t=>t.type==="income").reduce((a,t)=>a+Number(t.amount),0);
    const expense=list.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount),0);
    return {income,expense,net:income-expense,count:list.length};
  }
  function balanceFor(companyIds){
    const opening=state.companies.filter(c=>companyIds.includes(c.id)).reduce((a,c)=>a+Number(c.openingBalance||0),0);
    return opening+transactionsFor(companyIds).reduce((a,t)=>a+(t.type==="income"?1:-1)*Number(t.amount),0);
  }
  function compareText(now,prev,lowerIsBetter=false){
    if(prev===0&&now===0) return {text:"Sama dengan hari sebelumnya",cls:"muted"};
    if(prev===0) return {text:now>0?`Baru tercatat: ${money(now)}`:"Tidak ada transaksi",cls:now>0?"positive":"muted"};
    const delta=now-prev, pct=Math.abs(delta/prev*100);
    const sign=delta>0?"+":delta<0?"−":"";
    const cls=delta===0?"muted":((delta>0)!==lowerIsBetter?"positive":"negative");
    return {text:`${sign}${pct.toLocaleString("id-ID",{maximumFractionDigits:1})}% (${sign}${money(Math.abs(delta))})`,cls};
  }
  function cardStat(label,value,icon,foot=""){
    return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`;
  }
  function emptyState(icon,title,description,buttonText,action){
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${description}</p>${buttonText?`<button class="btn btn-primary" data-action="${action}">${buttonText}</button>`:""}</div>`;
  }
  function setHeader(title,subtitle,eyebrow="WORKSPACE / RINGKASAN"){
    $("#pageTitle").textContent=title;$("#pageSubtitle").textContent=subtitle;$("#eyebrow").textContent=eyebrow;
  }
  function setNav(){
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
    $("#quickAddBtn").textContent=currentView==="groups"?"＋ Buat grup":currentView==="categories"?"＋ Tambah kategori":currentView==="companies"?"＋ Tambah perusahaan":"＋ Tambah perusahaan";
  }
  function navigate(view){currentView=view;currentCompanyId=null;currentGroupId=null;setNav();render();}
  function render(){
    setNav();
    if(currentView==="overview") renderOverview();
    else if(currentView==="companies") renderCompanies();
    else if(currentView==="groups") renderGroups();
    else if(currentView==="categories") renderCategories();
    else if(currentView==="companyDetail") renderCompanyDetail();
    else if(currentView==="groupDetail") renderGroupDetail();
    else renderOverview();
    $("#year").textContent=new Date().getFullYear();
  }
  function renderOverview(){
    setHeader("Dashboard","Pantau seluruh grup dan perusahaan dalam satu tempat.");
    const ids=state.companies.map(c=>c.id), all=transactionsFor(ids), total=statsFor(all), today=statsFor(all,todayISO()), yesterday=statsFor(all,offsetISO(-1));
    const incCmp=compareText(today.income,yesterday.income), expCmp=compareText(today.expense,yesterday.expense,true);
    const latest=[...all].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
    $("#appView").innerHTML=`
      <div class="stats-grid">
        ${cardStat("Total grup",state.groups.length,"◫","Grup yang kamu kelola")}
        ${cardStat("Total perusahaan",state.companies.length,"▣","Termasuk perusahaan mandiri")}
        ${cardStat("Saldo seluruh perusahaan",shortMoney(balanceFor(ids)),"◉","Saldo awal + transaksi bersih")}
        ${cardStat("Selisih dana hari ini",shortMoney(today.net),"↗",`Masuk ${shortMoney(today.income)} · Keluar ${shortMoney(today.expense)}`)}
      </div>
      <div class="content-grid">
        <section class="panel"><div class="panel-head"><div><h2>Arus keuangan</h2><p class="panel-desc">Pemasukan dan pengeluaran seluruh perusahaan.</p></div><select class="select" id="overviewPeriod" style="width:115px"><option value="7" ${filters.period==="7"?"selected":""}>7 hari</option><option value="14" ${filters.period==="14"?"selected":""}>14 hari</option><option value="30" ${filters.period==="30"?"selected":""}>30 hari</option></select></div><div class="chart-wrap"><canvas id="overviewChart"></canvas></div><div class="legend"><span><i style="background:#3f8053"></i>Dana masuk</span><span><i style="background:#e28a78"></i>Pengeluaran</span></div></section>
        <section class="panel"><div class="panel-head"><div><h2>Perbandingan harian</h2><p class="panel-desc">Hari ini dibandingkan hari sebelumnya.</p></div></div>
          <div class="insight-list">
            <div class="insight"><span class="insight-icon">↗</span><div><strong>Dana masuk hari ini</strong><p>${money(today.income)} · <span class="${incCmp.cls}">${incCmp.text}</span></p></div></div>
            <div class="insight"><span class="insight-icon">↘</span><div><strong>Pengeluaran hari ini</strong><p>${money(today.expense)} · <span class="${expCmp.cls}">${expCmp.text}</span></p></div></div>
            <div class="insight"><span class="insight-icon">◎</span><div><strong>Transaksi hari ini</strong><p>${today.count} transaksi tercatat; kemarin ${yesterday.count} transaksi.</p></div></div>
            <div class="insight"><span class="insight-icon">✦</span><div><strong>Catatan saldo</strong><p>Saldo dihitung dari saldo awal perusahaan ditambah dana masuk dan dikurangi pengeluaran.</p></div></div>
          </div>
        </section>
      </div>
      <div class="section-head"><h2 class="section-title">Grup perusahaan</h2><button class="btn btn-light" data-action="goGroups">Lihat semua →</button></div>
      <div class="company-grid">${state.groups.length?state.groups.slice(0,3).map(groupCard).join(""):emptyState("◫","Belum ada grup","Buat grup untuk mengelompokkan beberapa perusahaan.","Buat grup","addGroup")}</div>
      <div class="section-head"><h2 class="section-title">Perusahaan</h2><button class="btn btn-light" data-action="goCompanies">Lihat semua →</button></div>
      <div class="company-grid">${state.companies.length?state.companies.slice(0,6).map(companyCard).join(""):emptyState("▣","Belum ada perusahaan","Tambahkan perusahaan pertamamu.","Tambah perusahaan","addCompany")}</div>
      <div class="section-head"><h2 class="section-title">Transaksi terbaru</h2><button class="btn btn-light" data-action="goCompanies">Kelola perusahaan →</button></div>
      ${transactionTable(latest,true)}`;
    drawChart($("#overviewChart"),all,Number($("#overviewPeriod")?.value||filters.period));
    $("#overviewPeriod").addEventListener("change",e=>{filters.period=e.target.value;drawChart($("#overviewChart"),all,Number(e.target.value));});
  }
  function companyCard(c){
    const s=statsFor(transactionsFor([c.id]));
    return `<article class="company-card"><div class="company-top"><div class="company-logo">▣</div><div style="min-width:0"><div class="company-name">${esc(c.name)}</div><div class="company-meta">${esc(categoryName(c.categoryId))} · ${esc(groupName(c.groupId))}</div></div><button class="more-btn" title="Edit perusahaan" data-action="editCompany" data-id="${c.id}">⋯</button></div><div class="company-balance">${shortMoney(balanceFor([c.id]))}</div><div class="company-balance-label">Saldo tercatat</div><div class="mini-metrics"><div><span>Dana masuk (total)</span><strong class="positive">${shortMoney(s.income)}</strong></div><div><span>Pengeluaran (total)</span><strong class="negative">${shortMoney(s.expense)}</strong></div></div><div class="card-actions"><button class="btn btn-primary" data-action="openCompany" data-id="${c.id}">Buka dashboard →</button><button class="btn btn-light" data-action="editCompany" data-id="${c.id}">Edit</button><button class="btn btn-danger" data-action="deleteCompany" data-id="${c.id}">Hapus</button></div></article>`;
  }
  function groupCard(g){
    const members=state.companies.filter(c=>c.groupId===g.id), ids=members.map(c=>c.id), s=statsFor(transactionsFor(ids));
    return `<article class="group-card"><div class="company-top"><div class="company-logo">◫</div><div style="min-width:0"><div class="company-name">${esc(g.name)}</div><div class="company-meta">${members.length} perusahaan · Grup</div></div><button class="more-btn" data-action="editGroup" data-id="${g.id}" title="Edit grup">⋯</button></div><p class="panel-desc">${esc(g.description||"Belum ada deskripsi.")}</p><div class="company-balance">${shortMoney(balanceFor(ids))}</div><div class="company-balance-label">Total saldo grup</div><div class="mini-metrics"><div><span>Dana masuk</span><strong class="positive">${shortMoney(s.income)}</strong></div><div><span>Pengeluaran</span><strong class="negative">${shortMoney(s.expense)}</strong></div></div><div class="card-actions"><button class="btn btn-primary" data-action="openGroup" data-id="${g.id}">Lihat grup →</button><button class="btn btn-light" data-action="editGroup" data-id="${g.id}">Edit</button><button class="btn btn-danger" data-action="deleteGroup" data-id="${g.id}">Hapus</button></div></article>`;
  }
  function renderCompanies(){
    setHeader("Perusahaan","Tambah, edit, cari, dan filter perusahaan yang kamu kelola.","WORKSPACE / PERUSAHAAN");
    const list=state.companies.filter(c=>(!filters.search||`${c.name} ${c.description||""}`.toLowerCase().includes(filters.search.toLowerCase()))&&(!filters.categoryId||c.categoryId===filters.categoryId)&&(!filters.groupId||(filters.groupId==="standalone"?!c.groupId:c.groupId===filters.groupId)));
    $("#appView").innerHTML=`<div class="stats-grid">${cardStat("Semua perusahaan",state.companies.length,"▣","Seluruh data terdaftar")}${cardStat("Perusahaan mandiri",state.companies.filter(c=>!c.groupId).length,"◇","Tidak tergabung dalam grup")}${cardStat("Kategori bisnis",state.categories.length,"◈","Kategori yang tersedia")}${cardStat("Grup perusahaan",state.groups.length,"◫","Kelompok yang tersedia")}</div>
      <div class="section-head"><h2 class="section-title">Daftar perusahaan</h2><button class="btn btn-primary" data-action="addCompany">＋ Tambah perusahaan</button></div>
      <div class="toolbar"><input class="field-input" id="companySearch" placeholder="Cari nama perusahaan..." value="${esc(filters.search)}"><select class="field-select" id="categoryFilter"><option value="">Semua kategori</option>${state.categories.map(c=>`<option value="${c.id}" ${filters.categoryId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select><select class="field-select" id="groupFilter"><option value="">Semua grup</option><option value="standalone" ${filters.groupId==="standalone"?"selected":""}>Mandiri / tanpa grup</option>${state.groups.map(g=>`<option value="${g.id}" ${filters.groupId===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</select></div>
      <div class="company-grid">${list.length?list.map(companyCard).join(""):emptyState("⌕","Tidak ada hasil","Coba ubah kata pencarian atau filter yang dipilih.","Hapus filter","clearCompanyFilters")}</div>`;
    $("#companySearch").addEventListener("input",e=>{filters.search=e.target.value;const pos=e.target.selectionStart;renderCompanies();const inp=$("#companySearch");inp.focus();inp.setSelectionRange(pos,pos);});
    $("#categoryFilter").addEventListener("change",e=>{filters.categoryId=e.target.value;renderCompanies();});
    $("#groupFilter").addEventListener("change",e=>{filters.groupId=e.target.value;renderCompanies();});
  }
  function renderGroups(){
    setHeader("Grup perusahaan","Kelompokkan perusahaan dan lihat total statistik setiap grup.","WORKSPACE / GRUP");
    const total=state.groups.length, grouped=state.companies.filter(c=>c.groupId).length;
    $("#appView").innerHTML=`<div class="stats-grid">${cardStat("Total grup",total,"◫","Grup yang dibuat")}${cardStat("Perusahaan tergabung",grouped,"▣","Anggota seluruh grup")}${cardStat("Perusahaan mandiri",state.companies.filter(c=>!c.groupId).length,"◇","Tidak masuk grup")}${cardStat("Total perusahaan",state.companies.length,"▤","Termasuk seluruh anggota")}</div><div class="section-head"><h2 class="section-title">Semua grup</h2><button class="btn btn-primary" data-action="addGroup">＋ Buat grup</button></div><div class="company-grid">${state.groups.length?state.groups.map(groupCard).join(""):emptyState("◫","Belum ada grup","Buat grup lalu tambahkan perusahaan ke dalamnya.","Buat grup","addGroup")}</div>`;
  }
  function renderCategories(){
    setHeader("Kategori bisnis","Buat dan kelola kategori yang digunakan untuk memfilter perusahaan.","WORKSPACE / KATEGORI");
    $("#appView").innerHTML=`<div class="stats-grid">${cardStat("Kategori tersedia",state.categories.length,"◈","Kategori bisnis")}${cardStat("Perusahaan terdaftar",state.companies.length,"▣","Semua kategori")}${cardStat("Kategori terpakai",new Set(state.companies.map(c=>c.categoryId).filter(Boolean)).size,"✓","Kategori yang digunakan")}${cardStat("Kategori belum dipakai",state.categories.filter(c=>!state.companies.some(x=>x.categoryId===c.id)).length,"○","Bisa digunakan nanti")}</div><div class="section-head"><h2 class="section-title">Kategori bisnis</h2><button class="btn btn-primary" data-action="addCategory">＋ Tambah kategori</button></div><section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>NAMA KATEGORI</th><th>JUMLAH PERUSAHAAN</th><th>AKSI</th></tr></thead><tbody>${state.categories.length?state.categories.map(c=>`<tr><td><span class="tag">${esc(c.name)}</span></td><td>${state.companies.filter(x=>x.categoryId===c.id).length} perusahaan</td><td><div class="table-actions"><button class="small-btn" data-action="editCategory" data-id="${c.id}">Edit</button><button class="small-btn" data-action="deleteCategory" data-id="${c.id}">Hapus</button></div></td></tr>`).join(""):`<tr><td colspan="3">Belum ada kategori.</td></tr>`}</tbody></table></div><p class="panel-desc">Kategori yang sedang dipakai perusahaan tidak dapat dihapus sebelum perusahaan dipindahkan ke kategori lain.</p></section>`;
  }
  function renderCompanyDetail(){
    const c=state.companies.find(x=>x.id===currentCompanyId);if(!c){navigate("companies");return;}
    setHeader(c.name,"Analisis keuangan, pencatatan transaksi, dan perbandingan harian.","PERUSAHAAN / DETAIL");
    const tx=transactionsFor([c.id]), today=statsFor(tx,todayISO()), yesterday=statsFor(tx,offsetISO(-1)), total=statsFor(tx);
    const incCmp=compareText(today.income,yesterday.income), expCmp=compareText(today.expense,yesterday.expense,true), netCmp=compareText(today.net,yesterday.net);
    const latest=[...tx].sort((a,b)=>b.date.localeCompare(a.date));
    $("#appView").innerHTML=`<button class="back-link" data-action="backCompanies">← Kembali ke daftar perusahaan</button>
      <div class="detail-hero"><div class="company-logo">▣</div><div><h2>${esc(c.name)}</h2><p>${esc(categoryName(c.categoryId))} · ${esc(groupName(c.groupId))}${c.description?" · "+esc(c.description):""}</p></div><div class="hero-actions"><button class="btn btn-light" data-action="editCompany" data-id="${c.id}">✎ Edit perusahaan</button><button class="btn btn-primary" data-action="addTransaction" data-company="${c.id}">＋ Catat transaksi</button></div></div>
      <div class="stats-grid">${cardStat("Saldo terkini",shortMoney(balanceFor([c.id])),"◉","Saldo awal + dana bersih")}${cardStat("Dana masuk (hari ini)",shortMoney(today.income),"↗",`${today.count} transaksi hari ini`)}${cardStat("Pengeluaran (hari ini)",shortMoney(today.expense),"↘","Pengeluaran tercatat hari ini")}${cardStat("Selisih hari ini",shortMoney(today.net),"◎","Dana masuk − pengeluaran")}</div>
      <div class="comparison-grid"><div class="compare-card"><div class="compare-label">Dana masuk · vs kemarin</div><div class="compare-now">${money(today.income)}</div><div class="compare-delta ${incCmp.cls}">${incCmp.text}</div></div><div class="compare-card"><div class="compare-label">Pengeluaran · vs kemarin</div><div class="compare-now">${money(today.expense)}</div><div class="compare-delta ${expCmp.cls}">${expCmp.text}</div></div><div class="compare-card"><div class="compare-label">Selisih bersih · vs kemarin</div><div class="compare-now">${money(today.net)}</div><div class="compare-delta ${netCmp.cls}">${netCmp.text}</div></div></div>
      <div class="content-grid"><section class="panel"><div class="panel-head"><div><h2>Grafik keuangan</h2><p class="panel-desc">Arus dana selama periode terpilih.</p></div><select class="select" id="detailPeriod" style="width:115px"><option value="7">7 hari</option><option value="14">14 hari</option><option value="30">30 hari</option></select></div><div class="chart-wrap"><canvas id="detailChart"></canvas></div><div class="legend"><span><i style="background:#3f8053"></i>Dana masuk</span><span><i style="background:#e28a78"></i>Pengeluaran</span></div></section><section class="panel"><div class="panel-head"><div><h2>Ringkasan keseluruhan</h2><p class="panel-desc">Sejak pencatatan dimulai.</p></div></div><div class="insight-list"><div class="insight"><span class="insight-icon">↗</span><div><strong>Total dana masuk</strong><p>${money(total.income)}</p></div></div><div class="insight"><span class="insight-icon">↘</span><div><strong>Total pengeluaran</strong><p>${money(total.expense)}</p></div></div><div class="insight"><span class="insight-icon">▤</span><div><strong>Total transaksi</strong><p>${total.count} transaksi dicatat.</p></div></div><div class="insight"><span class="insight-icon">◉</span><div><strong>Saldo awal</strong><p>${money(c.openingBalance||0)}</p></div></div></div></section></div>
      <div class="section-head"><h2 class="section-title">Riwayat transaksi</h2><button class="btn btn-primary" data-action="addTransaction" data-company="${c.id}">＋ Tambah transaksi</button></div>
      <div class="toolbar"><input class="field-input" id="transactionSearch" placeholder="Cari keterangan atau kategori..."><select class="field-select" id="transactionTypeFilter"><option value="">Semua transaksi</option><option value="income">Dana masuk</option><option value="expense">Pengeluaran</option></select></div><div id="detailTransactions">${transactionTable(latest,false)}</div>`;
    const chart=()=>drawChart($("#detailChart"),tx,Number($("#detailPeriod").value));chart();$("#detailPeriod").addEventListener("change",chart);
    const filterTx=()=>{const q=$("#transactionSearch").value.toLowerCase(),type=$("#transactionTypeFilter").value;$("#detailTransactions").innerHTML=transactionTable(latest.filter(t=>(!type||t.type===type)&&(!q||`${t.description} ${t.category}`.toLowerCase().includes(q))),false);};$("#transactionSearch").addEventListener("input",filterTx);$("#transactionTypeFilter").addEventListener("change",filterTx);
  }
  function renderGroupDetail(){
    const g=state.groups.find(x=>x.id===currentGroupId);if(!g){navigate("groups");return;}
    const members=state.companies.filter(c=>c.groupId===g.id),ids=members.map(c=>c.id),tx=transactionsFor(ids),today=statsFor(tx,todayISO()),yesterday=statsFor(tx,offsetISO(-1)),total=statsFor(tx);
    setHeader(g.name,"Ringkasan gabungan dan analisis setiap perusahaan anggota.","GRUP / DETAIL");
    $("#appView").innerHTML=`<button class="back-link" data-action="backGroups">← Kembali ke daftar grup</button><div class="detail-hero"><div class="company-logo">◫</div><div><h2>${esc(g.name)}</h2><p>${esc(g.description||"Grup perusahaan")} · ${members.length} perusahaan anggota</p></div><div class="hero-actions"><button class="btn btn-light" data-action="editGroup" data-id="${g.id}">✎ Edit grup</button><button class="btn btn-primary" data-action="addCompanyToGroup" data-id="${g.id}">＋ Tambah anggota</button></div></div>
      <div class="stats-grid">${cardStat("Saldo seluruh grup",shortMoney(balanceFor(ids)),"◉","Gabungan saldo anggota")}${cardStat("Dana masuk hari ini",shortMoney(today.income),"↗",compareText(today.income,yesterday.income).text)}${cardStat("Pengeluaran hari ini",shortMoney(today.expense),"↘",compareText(today.expense,yesterday.expense,true).text)}${cardStat("Selisih dana hari ini",shortMoney(today.net),"◎","Masuk dikurangi keluar")}</div>
      <div class="content-grid"><section class="panel"><div class="panel-head"><div><h2>Arus keuangan grup</h2><p class="panel-desc">Total gabungan semua anggota grup.</p></div><select class="select" id="groupPeriod" style="width:115px"><option value="7">7 hari</option><option value="14">14 hari</option><option value="30">30 hari</option></select></div><div class="chart-wrap"><canvas id="groupChart"></canvas></div><div class="legend"><span><i style="background:#3f8053"></i>Dana masuk</span><span><i style="background:#e28a78"></i>Pengeluaran</span></div></section><section class="panel"><div class="panel-head"><div><h2>Ringkasan grup</h2><p class="panel-desc">Semua anggota dan transaksi grup.</p></div></div><div class="insight-list"><div class="insight"><span class="insight-icon">▣</span><div><strong>Perusahaan anggota</strong><p>${members.length} perusahaan tergabung dalam grup ini.</p></div></div><div class="insight"><span class="insight-icon">↗</span><div><strong>Total dana masuk</strong><p>${money(total.income)}</p></div></div><div class="insight"><span class="insight-icon">↘</span><div><strong>Total pengeluaran</strong><p>${money(total.expense)}</p></div></div><div class="insight"><span class="insight-icon">▤</span><div><strong>Total transaksi</strong><p>${total.count} transaksi tercatat.</p></div></div></div></section></div>
      <div class="section-head"><h2 class="section-title">Perusahaan anggota</h2><button class="btn btn-primary" data-action="addCompanyToGroup" data-id="${g.id}">＋ Tambah anggota</button></div><div class="company-grid">${members.length?members.map(companyCard).join(""):emptyState("▣","Belum ada anggota","Tambahkan perusahaan ke grup ini.","Tambah anggota","addCompanyToGroup")}</div>
      <div class="section-head"><h2 class="section-title">Semua transaksi anggota</h2></div>${transactionTable([...tx].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20),true)}`;
    const chart=()=>drawChart($("#groupChart"),tx,Number($("#groupPeriod").value));chart();$("#groupPeriod").addEventListener("change",chart);
  }
  function transactionTable(list,showCompany){
    if(!list.length)return `<div class="empty-state"><div class="empty-icon">▤</div><h3>Belum ada transaksi</h3><p>Transaksi yang ditambahkan akan tampil di sini.</p><button class="btn btn-primary" data-action="addTransaction">＋ Catat transaksi</button></div>`;
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>TANGGAL</th>${showCompany?"<th>PERUSAHAAN</th>":""}<th>TRANSAKSI</th><th>KATEGORI</th><th>NOMINAL</th><th>AKSI</th></tr></thead><tbody>${list.map(t=>`<tr><td>${dateLabel(t.date)}</td>${showCompany?`<td><span class="table-main">${esc(companyName(t.companyId))}</span></td>`:""}<td><span class="table-main">${esc(t.description||"(Tanpa keterangan)")}</span><span class="table-sub">${t.type==="income"?"Dana masuk":"Pengeluaran"}</span></td><td><span class="tag gray">${esc(t.category)}</span></td><td class="${t.type==="income"?"money-in":"money-out"}">${t.type==="income"?"+":"−"} ${money(t.amount)}</td><td><div class="table-actions"><button class="small-btn" data-action="editTransaction" data-id="${t.id}">Edit</button><button class="small-btn" data-action="deleteTransaction" data-id="${t.id}">Hapus</button></div></td></tr>`).join("")}</tbody></table></div>`;
  }
  function drawChart(canvas,transactions,days){
    if(!canvas)return;const ctx=canvas.getContext("2d"),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=Math.max(300,rect.width)*dpr;canvas.height=Math.max(180,rect.height)*dpr;ctx.scale(dpr,dpr);const w=canvas.width/dpr,h=canvas.height/dpr;ctx.clearRect(0,0,w,h);
    const data=[];for(let i=days-1;i>=0;i--){const date=offsetISO(-i),s=statsFor(transactions,date);data.push({date,label:new Date(`${date}T12:00:00`).toLocaleDateString("id-ID",{day:"2-digit",month:"short"}),income:s.income,expense:s.expense});}
    const pad={l:42,r:8,t:12,b:28},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b,max=Math.max(1,...data.flatMap(d=>[d.income,d.expense]))*1.12;
    ctx.font="10px DM Sans, sans-serif";ctx.textAlign="right";ctx.textBaseline="middle";
    for(let i=0;i<=4;i++){const y=pad.t+ch*i/4;ctx.strokeStyle="#e9eee9";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle="#89958c";ctx.fillText(shortMoney(max*(1-i/4)),pad.l-7,y);}
    const slot=cw/data.length,bw=Math.min(12,slot*.27);
    data.forEach((d,i)=>{const x=pad.l+slot*i+slot/2;const hi=d.income/max*ch,he=d.expense/max*ch;ctx.fillStyle="#3f8053";roundRect(ctx,x-bw-1,pad.t+ch-hi,bw,hi,3);ctx.fill();ctx.fillStyle="#e28a78";roundRect(ctx,x+2,pad.t+ch-he,bw,he,3);ctx.fill();if(data.length<=14||i%Math.ceil(data.length/7)===0||i===data.length-1){ctx.fillStyle="#89958c";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText(d.label,x,h-20);}});
  }
  function roundRect(ctx,x,y,w,h,r){if(h<1)return;const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}
  function field(name,label,type="text",value="",options=[],full=false,help=""){
    let control="";
    if(type==="select")control=`<select class="field-select" name="${name}" ${options.required?"required":""}>${options.items.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?"selected":""}>${esc(o.label)}</option>`).join("")}</select>`;
    else if(type==="textarea")control=`<textarea class="field-textarea" name="${name}" placeholder="${esc(options.placeholder||"")}" ${options.required?"required":""}>${esc(value)}</textarea>`;
    else control=`<input class="field-input" name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(options.placeholder||"")}" ${options.min!==undefined?`min="${options.min}"`:""} ${options.step?`step="${options.step}"`:""} ${options.required?"required":""}>`;
    return `<div class="form-field ${full?"full":""}"><label for="${name}">${label}</label>${control}${help?`<span class="field-help">${help}</span>`:""}</div>`;
  }
  function openModal(title,fieldsHtml,onSubmit,eyebrow="FORMULIR"){
    $("#modalTitle").textContent=title;$("#modalEyebrow").textContent=eyebrow;$("#modalFields").innerHTML=fieldsHtml;$("#modalBackdrop").classList.remove("hidden");modalSubmit=onSubmit;
    setTimeout(()=>$("#modalFields input, #modalFields select, #modalFields textarea")?.focus(),50);
  }
  function closeModal(){$("#modalBackdrop").classList.add("hidden");$("#modalForm").reset();modalSubmit=null;}
  function groupOptions(selected=""){return [{value:"",label:"Mandiri / tanpa grup"},...state.groups.map(g=>({value:g.id,label:g.name}))];}
  function categoryOptions(selected=""){return state.categories.map(c=>({value:c.id,label:c.name}));}
  function addCompany(groupId=""){
    const c={name:"",categoryId:state.categories[0]?.id||"",groupId,description:"",openingBalance:0};
    openModal("Tambah perusahaan",field("name","Nama perusahaan","text","",{required:true,placeholder:"Contoh: PT Aren Sejahtera"},false)+field("categoryId","Kategori bisnis","select",c.categoryId,{items:categoryOptions(),required:true})+field("groupId","Grup perusahaan","select",groupId,{items:groupOptions()})+field("openingBalance","Saldo awal (Rp)","number","0",{min:0,step:"1",required:true},"", "Masukkan saldo awal sebelum transaksi mulai dicatat.")+field("description","Deskripsi","textarea","",{placeholder:"Deskripsi singkat perusahaan"},true),
      data=>{if(!data.name.trim())return alert("Nama perusahaan wajib diisi.");const row={...c,...data,id:uid(),name:data.name.trim(),openingBalance:Math.max(0,Number(data.openingBalance)||0)};state.companies.push(row);saveState();closeModal();showToast("Perusahaan berhasil ditambahkan.");if(groupId){currentView="groupDetail";currentGroupId=groupId;currentCompanyId=null;}render();});
  }
  function editCompany(id){
    const c=state.companies.find(x=>x.id===id);if(!c)return;
    openModal("Edit perusahaan",field("name","Nama perusahaan","text",c.name,{required:true})+field("categoryId","Kategori bisnis","select",c.categoryId,{items:categoryOptions(),required:true})+field("groupId","Grup perusahaan","select",c.groupId,{items:groupOptions()})+field("openingBalance","Saldo awal (Rp)","number",c.openingBalance||0,{min:0,step:"1",required:true})+field("description","Deskripsi","textarea",c.description||"",{placeholder:"Deskripsi singkat"},true),
      data=>{if(!data.name.trim())return alert("Nama perusahaan wajib diisi.");Object.assign(c,{...data,name:data.name.trim(),openingBalance:Math.max(0,Number(data.openingBalance)||0)});saveState();closeModal();showToast("Data perusahaan diperbarui.");render();});
  }
  function addGroup(){
    openModal("Buat grup perusahaan",field("name","Nama grup","text","",{required:true,placeholder:"Contoh: Grup Aren"})+field("description","Deskripsi","textarea","",{placeholder:"Keterangan tentang grup"},true),
      data=>{if(!data.name.trim())return alert("Nama grup wajib diisi.");state.groups.push({id:uid(),name:data.name.trim(),description:data.description.trim()});saveState();closeModal();showToast("Grup berhasil dibuat.");render();});
  }
  function editGroup(id){
    const g=state.groups.find(x=>x.id===id);if(!g)return;
    openModal("Edit grup perusahaan",field("name","Nama grup","text",g.name,{required:true})+field("description","Deskripsi","textarea",g.description||"",{},true),
      data=>{if(!data.name.trim())return alert("Nama grup wajib diisi.");Object.assign(g,{name:data.name.trim(),description:data.description.trim()});saveState();closeModal();showToast("Grup diperbarui.");render();});
  }
  function addCategory(){
    openModal("Tambah kategori bisnis",field("name","Nama kategori","text","",{required:true,placeholder:"Contoh: Kesehatan"},true),
      data=>{if(!data.name.trim())return alert("Nama kategori wajib diisi.");if(state.categories.some(c=>c.name.toLowerCase()===data.name.trim().toLowerCase()))return alert("Kategori tersebut sudah ada.");state.categories.push({id:uid(),name:data.name.trim()});saveState();closeModal();showToast("Kategori ditambahkan.");render();});
  }
  function editCategory(id){
    const c=state.categories.find(x=>x.id===id);if(!c)return;
    openModal("Edit kategori",field("name","Nama kategori","text",c.name,{required:true},true),
      data=>{if(!data.name.trim())return alert("Nama kategori wajib diisi.");if(state.categories.some(x=>x.id!==id&&x.name.toLowerCase()===data.name.trim().toLowerCase()))return alert("Nama kategori sudah digunakan.");c.name=data.name.trim();saveState();closeModal();showToast("Kategori diperbarui.");render();});
  }
  function addTransaction(companyId=currentCompanyId){
    if(!state.companies.length)return alert("Tambahkan perusahaan terlebih dahulu.");
    const chosen=state.companies.some(c=>c.id===companyId)?companyId:state.companies[0].id;
    const data={companyId:chosen,date:todayISO(),type:"income",category:"",amount:"",description:""};
    openModal("Catat transaksi",field("companyId","Perusahaan","select",data.companyId,{items:state.companies.map(c=>({value:c.id,label:c.name})),required:true})+field("date","Tanggal","date",data.date,{required:true})+field("type","Jenis transaksi","select",data.type,{items:[{value:"income",label:"Dana masuk / pemasukan"},{value:"expense",label:"Pengeluaran"}],required:true})+field("category","Kategori transaksi","text","",{required:true,placeholder:"Contoh: Operasional, penjualan"},false)+field("amount","Nominal (Rp)","number","",{min:1,step:"1",required:true})+field("description","Keterangan","text","",{placeholder:"Contoh: pembayaran pelanggan"},true),
      row=>{const amount=Number(row.amount);if(!row.category.trim())return alert("Kategori transaksi wajib diisi.");if(!Number.isFinite(amount)||amount<=0)return alert("Nominal harus lebih besar dari 0.");state.transactions.push({...row,id:uid(),category:row.category.trim(),description:row.description.trim(),amount});saveState();closeModal();showToast("Transaksi berhasil dicatat.");render();});
  }
  function editTransaction(id){
    const t=state.transactions.find(x=>x.id===id);if(!t)return;
    openModal("Edit transaksi",field("companyId","Perusahaan","select",t.companyId,{items:state.companies.map(c=>({value:c.id,label:c.name})),required:true})+field("date","Tanggal","date",t.date,{required:true})+field("type","Jenis transaksi","select",t.type,{items:[{value:"income",label:"Dana masuk / pemasukan"},{value:"expense",label:"Pengeluaran"}],required:true})+field("category","Kategori transaksi","text",t.category,{required:true})+field("amount","Nominal (Rp)","number",t.amount,{min:1,step:"1",required:true})+field("description","Keterangan","text",t.description||"",{},true),
      row=>{const amount=Number(row.amount);if(!row.category.trim()||!Number.isFinite(amount)||amount<=0)return alert("Isi kategori dan nominal yang valid.");Object.assign(t,{...row,category:row.category.trim(),description:row.description.trim(),amount});saveState();closeModal();showToast("Transaksi diperbarui.");render();});
  }
  function deleteItem(type,id){
    const names={company:"perusahaan",group:"grup",category:"kategori",transaction:"transaksi"};
    if(type==="company"){
      const used=state.transactions.some(t=>t.companyId===id);
      const msg=used?"Perusahaan ini memiliki transaksi. Menghapusnya juga akan menghapus semua transaksinya. Lanjutkan?":"Yakin ingin menghapus perusahaan ini?";
      if(!confirm(msg))return;state.companies=state.companies.filter(c=>c.id!==id);state.transactions=state.transactions.filter(t=>t.companyId!==id);if(currentCompanyId===id)currentCompanyId=null;
    }else if(type==="group"){
      const memberCount=state.companies.filter(c=>c.groupId===id).length;
      if(!confirm(`Hapus grup ini? ${memberCount} perusahaan anggota akan menjadi perusahaan mandiri; data dan transaksi mereka tetap ada.`))return;
      state.groups=state.groups.filter(g=>g.id!==id);state.companies.forEach(c=>{if(c.groupId===id)c.groupId="";});if(currentGroupId===id)currentGroupId=null;
    }else if(type==="category"){
      if(state.companies.some(c=>c.categoryId===id))return alert("Kategori ini masih digunakan. Edit perusahaan terkait dan pindahkan ke kategori lain terlebih dahulu.");
      if(!confirm("Yakin ingin menghapus kategori ini?"))return;state.categories=state.categories.filter(c=>c.id!==id);
    }else if(type==="transaction"){
      if(!confirm("Hapus transaksi ini secara permanen?"))return;state.transactions=state.transactions.filter(t=>t.id!==id);
    }
    saveState();showToast(`${names[type]} berhasil dihapus.`);render();
  }
  function showToast(message){const t=$("#toast");t.textContent=message;t.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add("hidden"),2800);}
  function handleAction(btn){
    const a=btn.dataset.action,id=btn.dataset.id;
    switch(a){
      case "addCompany":addCompany();break;
      case "addCompanyToGroup":addCompany(id||currentGroupId);break;
      case "editCompany":editCompany(id);break;
      case "deleteCompany":deleteItem("company",id);break;
      case "addGroup":addGroup();break;
      case "editGroup":editGroup(id);break;
      case "deleteGroup":deleteItem("group",id);break;
      case "addCategory":addCategory();break;
      case "editCategory":editCategory(id);break;
      case "deleteCategory":deleteItem("category",id);break;
      case "addTransaction":addTransaction(btn.dataset.company||currentCompanyId);break;
      case "editTransaction":editTransaction(id);break;
      case "deleteTransaction":deleteItem("transaction",id);break;
      case "openCompany":currentCompanyId=id;currentView="companyDetail";render();break;
      case "openGroup":currentGroupId=id;currentView="groupDetail";render();break;
      case "goGroups":navigate("groups");break;
      case "goCompanies":navigate("companies");break;
      case "backCompanies":navigate("companies");break;
      case "backGroups":navigate("groups");break;
      case "clearCompanyFilters":filters.search="";filters.categoryId="";filters.groupId="";renderCompanies();break;
    }
  }
  document.addEventListener("click",e=>{
    const action=e.target.closest("[data-action]");if(action){handleAction(action);return;}
    const nav=e.target.closest(".nav-item");if(nav){navigate(nav.dataset.view);return;}
  });
  $("#quickAddBtn").addEventListener("click",()=>{if(currentView==="groups")addGroup();else if(currentView==="categories")addCategory();else addCompany();});
  $("#brandHome").addEventListener("click",e=>{e.preventDefault();navigate("overview");});
  $("#modalClose").addEventListener("click",closeModal);$("#modalCancel").addEventListener("click",closeModal);
  $("#modalBackdrop").addEventListener("click",e=>{if(e.target===$("#modalBackdrop"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  $("#modalForm").addEventListener("submit",e=>{
    e.preventDefault();if(!modalSubmit)return;const data=Object.fromEntries(new FormData(e.currentTarget).entries());modalSubmit(data);
  });
  $("#exportBtn").addEventListener("click",()=>{
    const payload={app:"PPT Aren Head",exportedAt:new Date().toISOString(),...state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`ppt-aren-head-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);showToast("File backup berhasil dibuat.");
  });
  window.addEventListener("resize",()=>{if(currentView==="overview"){const all=transactionsFor(state.companies.map(c=>c.id));drawChart($("#overviewChart"),all,Number($("#overviewPeriod")?.value||7));}else if(currentView==="companyDetail"){const c=state.companies.find(x=>x.id===currentCompanyId);if(c)drawChart($("#detailChart"),transactionsFor([c.id]),Number($("#detailPeriod")?.value||7));}else if(currentView==="groupDetail"){const g=state.groups.find(x=>x.id===currentGroupId);if(g)drawChart($("#groupChart"),transactionsFor(state.companies.filter(c=>c.groupId===g.id).map(c=>c.id)),Number($("#groupPeriod")?.value||7));}});
  render();
})();