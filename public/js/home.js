const COVER_PALETTE=[["#1a3a5c","#e8f0f7"],["#2d5a27","#eaf3e8"],["#5a1f33","#f5eaed"],["#4a2e0d","#f5ede0"],["#2a1a6b","#ece8f5"],["#0d3a3a","#e0f0f0"],["#5c3a1a","#f5ede0"],["#1a3a1a","#e8f2e8"]];
function bookCoverHtml(title,author,branch){let n=0;for(let i=0;i<(title||"").length;i++)n=31*n+title.charCodeAt(i)&65535;const[bg,fg]=COVER_PALETTE[n%COVER_PALETTE.length];const sp=bg.replace(/^#/,"");const r=Math.max(0,parseInt(sp.slice(0,2),16)-20).toString(16).padStart(2,"0");const g=Math.max(0,parseInt(sp.slice(2,4),16)-20).toString(16).padStart(2,"0");const b=Math.max(0,parseInt(sp.slice(4,6),16)-20).toString(16).padStart(2,"0");const spineColor=`#${r}${g}${b}`;return`<div class="book-3d-wrap"><div class="book-3d"><div class="book-spine" style="background:${spineColor};color:${fg};"></div><div class="book-front" style="background:${bg};color:${fg};"><span class="bcp-branch">${escapeHtml(branch||"Main Library")}</span><span class="bcp-title">${escapeHtml(title||"")}</span><span class="bcp-author">${escapeHtml(author||"")}</span></div><div class="book-pages"></div></div></div>`}

// ── Events tab switching ────────────────────────────────────────────────────
function initEventsTabs(){
  const tabs=document.querySelectorAll('[data-events-tab]');
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      tabs.forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false')});
      tab.classList.add('active');tab.setAttribute('aria-selected','true');
      const which=tab.dataset.eventsTab;
      document.getElementById('panel-upcoming').hidden=(which!=='upcoming');
      document.getElementById('panel-past').hidden=(which!=='past');
    });
  });
}

async function loadHome(){
  initEventsTabs();

  // ── Stats ──────────────────────────────────────────────────────────────────
  try{
    const[e,n]=await Promise.all([
      fetch("/api/books?limit=1").then(r=>r.json()),
      fetch("/api/events").then(r=>r.json())
    ]);
    animateCount("s-books",e.total||0);
    animateCount("s-events",n.total||n.events.length);
  }catch(e){}

  // ── Latest announcements (3 most recent from admin) ───────────────────────
  try{
    const{announcements:e}=await fetch("/api/announcements?latest=true").then(r=>r.json());
    const n=document.getElementById("announcements");
    if(!e?.length){
      n.innerHTML='<div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><h3>No announcements</h3><p>Check back soon for updates.</p></div>';
    } else {
      const icons={
        general:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        event:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        service:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        holiday:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
      };
      n.innerHTML=e.map(e=>`
        <article class="announcement-card${e.emergency?" emergency":e.featured?" featured":""}">
          <div class="flex" style="gap:0.75rem;align-items:flex-start;">
            <div class="ann-category-icon" style="${e.emergency?"background:linear-gradient(135deg,var(--danger),#e05247);":e.featured?"background:linear-gradient(135deg,var(--accent),var(--accent-light));":""}">
              ${icons[e.category]||icons.general}
            </div>
            <div style="flex:1;">
              <div class="flex flex-wrap gap-sm" style="margin-bottom:0.4rem;">
                ${e.emergency?'<span class="badge danger">Important</span>':""}
                ${e.featured?'<span class="badge gold">Featured</span>':""}
                <span class="badge">${escapeHtml(e.category)}</span>
              </div>
              <h3 class="card-title">${escapeHtml(e.title)}</h3>
            </div>
          </div>
          <p class="card-desc" style="margin:0.4rem 0 0.5rem;">${escapeHtml((e.body||"").slice(0,150))}${(e.body||"").length>150?"…":""}</p>
          <p class="card-meta">${formatDate(e.created_at||e.publish_at)}</p>
        </article>`).join("");
    }
  }catch(e){}

  // ── New arrivals ───────────────────────────────────────────────────────────
  try{
    const{books:e}=await fetch("/api/books/new-arrivals").then(r=>r.json());
    const container=document.getElementById("new-arrivals");
    container.innerHTML=(e||[]).map(e=>`
      <a class="card" href="/catalog?q=${encodeURIComponent(e.title)}" data-category="${escapeHtml(e.category||'')}">
        <div class="card-img">${bookCoverHtml(e.title,e.author,e.branch)}</div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(e.title)}</h3>
          <p class="card-meta">${escapeHtml(e.author)}</p>
          <div class="card-foot">
            <span class="badge ${e.available_copies>0?"success":"danger"}">${e.available_copies>0?i18n.t("common.available"):i18n.t("common.onloan")}</span>
            <span class="badge">${escapeHtml(e.category||"")}</span>
          </div>
        </div>
      </a>`).join("");
    document.querySelectorAll("#arrivals-filter-bar .filter-pill").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const filter=btn.dataset.filter;
        document.querySelectorAll("#arrivals-filter-bar .filter-pill").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        container.querySelectorAll(".card").forEach(card=>{
          card.style.display=(filter==="all"||card.dataset.category===filter)?"":"none";
        });
      });
    });
  }catch(e){}

  // ── Upcoming events ────────────────────────────────────────────────────────
  try{
    const{events:e}=await fetch("/api/events?upcoming=true").then(r=>r.json());
    const n=document.getElementById("upcoming-events");
    if(!e?.length){
      n.innerHTML='<div class="empty-state"><div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><h3>'+i18n.t("common.noevents")+"</h3><p>"+i18n.t("common.checkback")+"</p></div>";
    } else {
      n.innerHTML=e.slice(0,6).map(e=>`
        <article class="card${e.title.toLowerCase().includes('president')||e.title.toLowerCase().includes('opening')?' featured-event':''}">
          <div class="card-img" style="aspect-ratio:16/9;position:relative;">
            <img src="${escapeHtml(e.image||"/images/event-default.svg")}" alt="${escapeHtml(e.title)}" loading="lazy" />
            ${e.title.toLowerCase().includes('president')||e.title.toLowerCase().includes('opening')?'<div style="position:absolute;top:0.6rem;left:0.6rem;"><span class="badge danger" style="font-size:0.72rem;letter-spacing:0.04em;">⭐ Presidential Event</span></div>':""}
          </div>
          <div class="card-body">
            <p class="card-meta">${formatDateTime(e.event_date)} · ${escapeHtml(e.location||"")}</p>
            <h3 class="card-title">${escapeHtml(e.title)}</h3>
            <p class="card-desc">${escapeHtml((e.description||"").slice(0,120))}…</p>
            <div class="card-foot">
              <span class="badge gold">${escapeHtml(e.category)}</span>
              <a href="/events#event-${e.id}" class="btn btn-sm btn-ghost">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
                Register
              </a>
            </div>
          </div>
        </article>`).join("");
    }
  }catch(e){}

  // ── 2025 past events highlights ────────────────────────────────────────────
  try{
    const{events:e}=await fetch("/api/events?recent=true").then(r=>r.json());
    const n=document.getElementById("past-events");
    if(!e?.length){
      n.innerHTML='<div class="empty-state" style="grid-column:1/-1;"><p>No past events to display.</p></div>';
    } else {
      n.innerHTML=e.slice(0,6).map(e=>`
        <article class="card">
          <div class="card-img" style="aspect-ratio:16/9;position:relative;">
            <img src="${escapeHtml(e.image||"/images/event-default.svg")}" alt="${escapeHtml(e.title)}" loading="lazy" />
            <div style="position:absolute;inset:0;background:rgba(6,47,58,0.35);display:flex;align-items:flex-end;padding:0.5rem 0.75rem;">
              <span class="badge" style="font-size:0.72rem;background:rgba(0,0,0,0.55);color:#fff;">Past Event</span>
            </div>
          </div>
          <div class="card-body">
            <p class="card-meta">${formatDateTime(e.event_date)} · ${escapeHtml(e.location||"")}</p>
            <h3 class="card-title">${escapeHtml(e.title)}</h3>
            <p class="card-desc">${escapeHtml((e.description||"").slice(0,110))}…</p>
            <div class="card-foot">
              <span class="badge gold">${escapeHtml(e.category)}</span>
              <a href="/events" class="btn btn-sm btn-ghost">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
                Details
              </a>
            </div>
          </div>
        </article>`).join("");
    }
  }catch(e){}
}

function animateCount(e,n){const t=document.getElementById(e);if(!t)return;const a=n/75;let s=0;const i=()=>{s=Math.min(s+a,n),t.textContent=Math.floor(s).toLocaleString(),s<n&&requestAnimationFrame(i)},o=new IntersectionObserver(e=>{e[0].isIntersecting&&(i(),o.disconnect())},{threshold:.3});o.observe(t)}

function renderBookCards(books,container){const wrapper=document.createElement("div");wrapper.className="chat-book-list";books.slice(0,5).forEach(book=>{const available=(book.available_copies||0)>0;const card=document.createElement("a");card.className="chat-book-card";card.href="/catalog?q="+encodeURIComponent(book.title);let cover;if(book.cover_image&&book.cover_image.startsWith("http")){cover=`<img src="${escapeHtml(book.cover_image)}" alt="" loading="lazy" class="chat-book-cover-img" onerror="this.style.display='none'">`}else{cover=bookCoverHtml(book.title,book.author||"",book.branch||"")}card.innerHTML=`<div class="chat-book-cover">${cover}</div><div class="chat-book-info"><div class="chat-book-title">${escapeHtml(book.title)}</div><div class="chat-book-author">${escapeHtml(book.author||"")}</div><div class="chat-book-meta"><span class="badge ${available?"success":"danger"}">${available?"Available":"On Loan"}</span>${book.category?`<span class="badge">${escapeHtml(book.category)}</span>`:""}</div></div>`;wrapper.appendChild(card)});container.appendChild(wrapper);container.scrollTop=container.scrollHeight}

const _opacForm=document.getElementById("opac-search");if(_opacForm){_opacForm.addEventListener("submit",e=>{e.preventDefault();const n=document.getElementById("search-q").value.trim();n?window.location.href="/catalog?q="+encodeURIComponent(n):document.getElementById("search-q").focus()})}if(document.body.dataset.page==="home"){loadHome();}
