// ============================================================
// app.js — Core App: Routing, Home, Hero Slider, Movie Detail
// ============================================================

// ── Global State ──
window.loggedIn        = false;
window.currentUser     = { name: 'Guest', email: '' };
window.currentMovie    = null;
window.currentShowtime = null;
window.selectedSeats   = [];
window.couponApplied   = false;
window.payMethod       = 'card';

// Hero slider state
let heroIdx   = 0;
let heroTimer = null;

// Movies shown in hero (Jana Nayagan, Dhurandhar, Coolie, War 2)
const HERO_MOVIES = [MOVIES[0], MOVIES[4], MOVIES[1], MOVIES[5]];

// ============================================================
// PAGE NAVIGATION
// ============================================================
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  if (!window.loggedIn) { goPage('login'); return; }
  if (window.isAdmin) { goPage('admin'); adminTab('dash'); return; }
  goPage('home');
  showDash('movies');
}

// ============================================================
// HOME PAGE
// ============================================================
function renderHome() {
  renderHero();
}

// ── Hero Slider ──
function renderHero() {
  const slidesEl = document.getElementById('heroSlides');
  const dotsEl   = document.getElementById('heroDots');

  slidesEl.innerHTML = HERO_MOVIES.map((m, i) => `
    <div class="hslide ${i === 0 ? 'active' : ''}" id="hs-${i}">
      <div class="hslide-bg" style="background-image:url('${m.banner || m.poster}');background-size:cover;background-position:center"></div>
      <div class="hslide-ov"></div>
    </div>
  `).join('');

  dotsEl.innerHTML = HERO_MOVIES.map((_, i) =>
    `<div class="hdot ${i === 0 ? 'active' : ''}" onclick="setHero(${i})"></div>`
  ).join('');

  setHeroContent(0);
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHero((heroIdx + 1) % HERO_MOVIES.length), 5500);
}

function setHero(i) {
  heroIdx = i;
  document.querySelectorAll('.hslide').forEach((s, j) => s.classList.toggle('active', j === i));
  document.querySelectorAll('.hdot').forEach((d, j) => d.classList.toggle('active', j === i));
  setHeroContent(i);
}

function setHeroContent(i) {
  const m = HERO_MOVIES[i];
  document.getElementById('heroCnt').innerHTML = `
    <div class="h-badges">
      ${m.isHot ? '<span class="hbadge hb-hot">🔥 Trending</span>' : ''}
      <span class="hbadge hb-lang">${m.lang === 'tamil' ? '🎭 Tamil' : '🎬 Hindi'}</span>
      ${m.isNew ? '<span class="hbadge hb-new">★ New</span>' : ''}
    </div>
    <div class="hero-title">${m.title}</div>
    <div class="hero-sub">${m.desc.substring(0, 115)}…</div>
    <div class="hero-meta">
      <div class="hm-item">★ ${m.imdb} IMDb</div>
      <div class="hm-item"><div class="hm-dot"></div>${m.duration}</div>
      <div class="hm-item"><div class="hm-dot"></div>${m.year}</div>
      <div class="hm-item"><div class="hm-dot"></div>${m.rating}</div>
    </div>
    <div class="hero-btns">
      <button class="btn-gold" onclick="openMovie(${m.id})">🎟 Book Now</button>
      <button class="btn-ghost" onclick="openMovie(${m.id})">ℹ More Info</button>
    </div>`;
}

// ============================================================
// DASHBOARD SECTIONS
// ============================================================
function showDash(section) {
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  const mc = document.getElementById('mainCnt');
  switch (section) {
    case 'movies':   mc.innerHTML = buildMovies();   break;
    case 'upcoming': mc.innerHTML = buildUpcoming(); break;
    case 'bookings': mc.innerHTML = buildBookings(); break;
    case 'offers':   mc.innerHTML = buildOffers();   break;
    case 'profile':  mc.innerHTML = buildProfile();  break;
  }
}

function filterMovies(lang) {
  document.getElementById('mainCnt').innerHTML = buildMovies(lang);
}

// ── All Movies Section ──
function buildMovies(filter = 'all') {
  const tamilMovies = MOVIES.filter(m => m.lang === 'tamil');
  const hindiMovies = MOVIES.filter(m => m.lang === 'hindi');
  const bannerMs    = MOVIES.filter(m => m.banner);
  let h = '';

  // Search bar (live filter) + results container
  h += `
    <div class="search-wrap">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="movieSearch" class="search-inp" autocomplete="off"
          placeholder="Search movies by title, actor, director, genre or language…"
          oninput="searchMovies(this.value)"/>
        <button class="search-clear" id="searchClear" onclick="clearSearch()" title="Clear">✕</button>
      </div>
    </div>
    <div id="searchResults" style="display:none"></div>
    <div id="moviesDefault">`;

  // Big Banner
  if (bannerMs.length > 0) {
    const bm = bannerMs[0];
    h += `
      <div class="sec">
        <div class="sec-head">
          <div>
            <div class="sec-ey"><div class="sec-dot" style="background:var(--gold)"></div><span style="color:var(--gold)">Featured</span></div>
            <div class="sec-title">Big Releases</div>
          </div>
        </div>
        <div class="big-banner" onclick="openMovie(${bm.id})">
          <img src="${bm.banner}" alt="${bm.title}"/>
          <div class="bb-ov"></div>
          <div class="bb-cnt">
            <div class="bb-badge">${bm.isHot ? '🔥 NOW TRENDING' : '🎬 NOW SHOWING'}</div>
            <div class="bb-title">${bm.title}</div>
            <div class="bb-meta">Dir. ${bm.director} · ★ ${bm.imdb} · ${bm.duration}</div>
            <button class="btn-gold" style="font-size:.73rem;padding:9px 18px">Book Tickets →</button>
          </div>
        </div>
      </div>`;
  }

  // Small Banners (2 side by side)
  const smBanners = MOVIES.filter(m => m.banner && m.id > 1);
  if (smBanners.length >= 2) {
    h += `<div class="sm-banners">`;
    smBanners.slice(0, 2).forEach(m => {
      h += `
        <div class="sm-banner" onclick="openMovie(${m.id})">
          <img src="${m.banner}" alt="${m.title}"/>
          <div class="sm-ov"></div>
          <div class="sm-cnt">
            <div class="sm-badge">${m.lang === 'tamil' ? 'Tamil' : 'Hindi'} · ${m.year}</div>
            <div class="sm-title">${m.title}</div>
            <div class="sm-meta">★ ${m.imdb} · ${m.duration}</div>
          </div>
        </div>`;
    });
    h += `</div>`;
  }

  // Quick Book Widget
  h += `
    <div class="qb-box">
      <div class="qb-title">⚡ Quick Book</div>
      <div class="qb-grid">
        <div>
          <label class="qb-lbl">Movie</label>
          <select class="qb-sel" id="qbMov">
            ${MOVIES.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="qb-lbl">Language</label>
          <select class="qb-sel">
            <option>Tamil</option>
            <option>Hindi</option>
            <option>English</option>
          </select>
        </div>
      </div>
      <button class="btn-qb" onclick="quickBook()">Find Shows →</button>
    </div>`;

  // Tamil Movies
  if (filter === 'all' || filter === 'tamil') {
    h += `
      <div class="sec">
        <div class="sec-head">
          <div>
            <div class="sec-ey"><div class="sec-dot" style="background:var(--tamil)"></div><span style="color:var(--tamil)">Tamil Cinema</span></div>
            <div class="sec-title">Latest Tamil Movies</div>
          </div>
          <button class="see-all">See All →</button>
        </div>
        <div class="movies-grid">${tamilMovies.map(m => movieCardHTML(m)).join('')}</div>
      </div>`;
  }

  // Hindi Movies
  if (filter === 'all' || filter === 'hindi') {
    h += `
      <div class="sec">
        <div class="sec-head">
          <div>
            <div class="sec-ey"><div class="sec-dot" style="background:var(--hindi)"></div><span style="color:var(--hindi)">Hindi Cinema</span></div>
            <div class="sec-title">Latest Hindi Movies</div>
          </div>
          <button class="see-all">See All →</button>
        </div>
        <div class="movies-grid">${hindiMovies.map(m => movieCardHTML(m)).join('')}</div>
      </div>`;
  }

  h += `</div>`; // end #moviesDefault
  return h;
}

// ── Movie Search ──
function searchMovies(q) {
  q = q.trim().toLowerCase();
  const res  = document.getElementById('searchResults');
  const def  = document.getElementById('moviesDefault');
  const clr  = document.getElementById('searchClear');
  if (!res) return;

  if (!q) { clearSearch(true); return; }

  clr.style.display = 'block';
  def.style.display = 'none';
  res.style.display = 'block';

  const matches = MOVIES.filter(m => {
    const hay = [
      m.title, m.director, m.lang, m.year,
      (m.genre || []).join(' '),
      (m.cast  || []).join(' ')
    ].join(' ').toLowerCase();
    return q.split(/\s+/).every(word => hay.includes(word));
  });

  res.innerHTML = matches.length
    ? `<div class="sec">
         <div class="sec-head"><div>
           <div class="sec-ey"><div class="sec-dot" style="background:var(--gold)"></div><span style="color:var(--gold)">Search Results</span></div>
           <div class="sec-title">${matches.length} movie${matches.length > 1 ? 's' : ''} found</div>
         </div></div>
         <div class="movies-grid">${matches.map(m => movieCardHTML(m)).join('')}</div>
       </div>`
    : `<div class="no-results">
         <div style="font-size:2.4rem">🎞️</div>
         <div class="nr-title">No movies found</div>
         <div class="nr-sub">Nothing matches “${q.replace(/[<>&"]/g, '')}”. Try a different title, actor or language.</div>
       </div>`;
}

function clearSearch(keepFocus) {
  const inp = document.getElementById('movieSearch');
  if (inp && !keepFocus) { inp.value = ''; inp.focus(); }
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('moviesDefault').style.display = 'block';
  document.getElementById('searchClear').style.display = 'none';
}

function movieCardHTML(m) {
  return `
    <div class="mcard" onclick="openMovie(${m.id})">
      <div class="mc-poster">
        <img src="${m.poster}" alt="${m.title}" onerror="this.style.background='${m.bg}';this.src=''"/>
        <div class="mc-badges">
          <span class="mcb ${m.lang === 'tamil' ? 'mcb-t' : 'mcb-h'}">${m.lang === 'tamil' ? 'Tamil' : 'Hindi'}</span>
          ${m.isNew ? '<span class="mcb mcb-n">New</span>' : ''}
          ${m.isHot ? '<span class="mcb mcb-hot">🔥 Hot</span>' : ''}
          <span class="mcb mcb-r">★ ${m.imdb}</span>
        </div>
      </div>
      <div class="mc-body">
        <div class="mc-title">${m.title}</div>
        <div class="mc-meta">
          <span>${m.duration}</span><div class="mc-sep"></div>
          <span>${m.rating}</span><div class="mc-sep"></div>
          <span>${m.year}</span>
        </div>
        <button class="btn-mbook">Book Tickets →</button>
      </div>
    </div>`;
}

function quickBook() {
  const id = parseInt(document.getElementById('qbMov').value);
  openMovie(id);
}

// ── Upcoming Section ──
function buildUpcoming() {
  return `
    <div class="sec">
      <div class="sec-head">
        <div>
          <div class="sec-ey"><div class="sec-dot" style="background:var(--blue)"></div><span style="color:var(--blue)">Coming Soon</span></div>
          <div class="sec-title">Upcoming Releases</div>
        </div>
      </div>
      <div class="up-list">
        ${UPCOMING.map(u => `
          <div class="up-item">
            <div class="up-poster" style="background:${u.bg}">🎬</div>
            <div style="flex:1">
              <div class="up-title">${u.title}</div>
              <div class="up-meta">Dir. ${u.director} · ${u.cast}</div>
            </div>
            <div class="up-date">${u.date}</div>
            <button class="btn-notify" onclick="this.textContent='🔔 Set!';this.style.color='var(--green)'">🔔 Notify</button>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── My Bookings Section ──
function buildBookings() {
  const mine = getBookings()
    .filter(b => b.email === window.currentUser.email)
    .reverse()
    .map(b => {
      const mv = MOVIES.find(x => x.title === b.movie);
      return { movie: b.movie, time: `${b.date} · ${b.time}`, hall: b.hall, seats: b.seats,
               status: 'conf', poster: mv ? mv.poster : '', paid: inr(b.amount), method: b.method };
    });
  const allBookings = [...mine, ...MY_BOOKINGS];
  return `
    <div class="sec">
      <div class="sec-head">
        <div>
          <div class="sec-ey"><div class="sec-dot" style="background:var(--gold)"></div><span style="color:var(--gold)">Account</span></div>
          <div class="sec-title">My Bookings</div>
        </div>
      </div>
      <div class="bk-list">
        ${allBookings.map(b => `
          <div class="bk-item">
            <div class="bk-poster"><img src="${b.poster}" alt="${b.movie}" onerror="this.style.background='#1a1a35';this.src=''"/></div>
            <div class="bk-info">
              <div class="bk-title">${b.movie}</div>
              <div class="bk-meta">${b.time} · ${b.hall}</div>
              <div class="bk-seats">Seats: ${b.seats} · Paid: ${b.paid} via ${b.method}</div>
            </div>
            <div class="bk-status ${b.status === 'conf' ? 'st-conf' : 'st-past'}">
              ${b.status === 'conf' ? '✓ Confirmed' : 'Past'}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── Offers Section ──
function buildOffers() {
  return `
    <div class="sec">
      <div class="sec-head">
        <div>
          <div class="sec-ey"><div class="sec-dot" style="background:var(--gold)"></div><span style="color:var(--gold)">Deals</span></div>
          <div class="sec-title">Special Offers</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:13px">
        <div style="background:linear-gradient(135deg,rgba(245,197,24,.08),rgba(245,197,24,.02));border:1px solid rgba(245,197,24,.2);border-radius:10px;padding:22px">
          <div style="font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gold);margin-bottom:8px">🎟 Promo Code</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.45rem;margin-bottom:6px">₹50 OFF — Use CINE50</div>
          <div style="font-size:.76rem;color:var(--muted)">On orders above ₹300. Valid all week.</div>
        </div>
        <div style="background:linear-gradient(135deg,rgba(76,201,240,.08),rgba(76,201,240,.02));border:1px solid rgba(76,201,240,.2);border-radius:10px;padding:22px">
          <div style="font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);margin-bottom:8px">🎉 Weekend Deal</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.45rem;margin-bottom:6px">20% OFF IMAX — IMAX20</div>
          <div style="font-size:.76rem;color:var(--muted)">Saturday & Sunday only. Limited seats.</div>
        </div>
      </div>
    </div>`;
}

// ── Profile Section ──
function buildProfile() {
  const n = window.currentUser.name;
  const e = window.currentUser.email;
  return `
    <div class="prof-card">
      <div class="prof-top">
        <div class="prof-av">${n.charAt(0).toUpperCase()}</div>
        <div>
          <div class="prof-name">${n}</div>
          <div class="prof-email">${e}</div>
          <div class="prof-badge">⭐ CineMax Gold Member</div>
        </div>
      </div>
      <div class="prof-stats">
        <div class="pstat"><div class="pstat-num">2</div><div class="pstat-lbl">Bookings</div></div>
        <div class="pstat"><div class="pstat-num">6</div><div class="pstat-lbl">Watched</div></div>
        <div class="pstat"><div class="pstat-num">₹1,240</div><div class="pstat-lbl">Spent</div></div>
      </div>
      <div class="prof-form">
        <div><label class="pf-lbl">Full Name</label><input class="pf-inp" value="${n}"/></div>
        <div><label class="pf-lbl">Email</label><input class="pf-inp" value="${e}"/></div>
        <div><label class="pf-lbl">Phone</label><input class="pf-inp" placeholder="+91 00000 00000"/></div>
        <div><label class="pf-lbl">City</label><input class="pf-inp" placeholder="Chennai"/></div>
      </div>
      <button
        onclick="alert('Profile saved successfully!')"
        style="margin-top:15px;background:var(--gold);color:#000;font-family:Poppins,sans-serif;font-size:.76rem;font-weight:700;padding:10px 22px;border:none;border-radius:7px;cursor:pointer">
        Save Changes
      </button>
    </div>`;
}

// ============================================================
// MOVIE DETAIL PAGE
// ============================================================
function openMovie(id) {
  if (!window.loggedIn) { goPage('login'); return; }
  const m = MOVIES.find(mv => mv.id === id);
  if (!m) return;

  window.currentMovie    = m;
  window.currentShowtime = null;
  window.selectedSeats   = [];

  // Background & poster
  document.getElementById('detBg').style.background = m.bg;
  const img = document.getElementById('detImg');
  img.src           = m.poster;
  img.style.display = 'block';
  document.getElementById('detFb').style.background = m.bg;
  document.getElementById('detFb').style.display    = 'none';

  // Genre pills
  document.getElementById('detGenres').innerHTML = m.genre
    .map(g => `<span class="gpill gp-${g.replace(/[/ ]/g, '-')}">${g}</span>`)
    .join('');

  // Title, tagline, ratings
  document.getElementById('detTitle').textContent   = m.title;
  document.getElementById('detTagline').textContent = m.tagline;
  document.getElementById('detRats').innerHTML = `
    <div class="drat"><span style="color:var(--gold);font-size:1.05rem">★</span><div><div class="drat-val">${m.imdb}</div><div class="drat-src">IMDb</div></div></div>
    <div class="drat"><span style="font-size:1.05rem">🍅</span><div><div class="drat-val">${m.rt}</div><div class="drat-src">RT</div></div></div>`;

  // Meta row
  document.getElementById('detMeta').innerHTML = [
    ['Director', m.director],
    ['Duration', m.duration],
    ['Rating',   m.rating],
    ['Year',     m.year],
    ['Language', m.lang[0].toUpperCase() + m.lang.slice(1)],
  ].map(([l, v]) => `<div class="dmi"><div class="dml">${l}</div><div class="dmv">${v}</div></div>`).join('');

  // Description & cast
  document.getElementById('detDesc').textContent = m.desc;
  document.getElementById('detCast').innerHTML   = m.cast
    .map(c => `<span class="cast-chip">${c}</span>`)
    .join('');

  renderDtTabs();
  renderSTs();
  goPage('detail');
}

// ── Date tabs ──
function renderDtTabs() {
  const dates = ['Today', 'Tomorrow', 'Wed 19', 'Thu 20', 'Fri 21'];
  document.getElementById('dtTabs').innerHTML = dates.map((d, i) => `
    <div class="dtab ${i === 0 ? 'active' : ''}" onclick="selDt(this)">
      <div class="dt-day">${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.split(' ')[0]}</div>
      <div class="dt-num">${d}</div>
    </div>`).join('');
}

function selDt(el) {
  document.querySelectorAll('.dtab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderSTs();
}

// ── Showtimes grid ──
function renderSTs() {
  document.getElementById('stGrid').innerHTML = window.currentMovie.showtimes.map(s => `
    <div class="stcard" id="st-${s.id}" onclick="selST('${s.id}')">
      <div>
        <div class="st-hall">${s.hall}</div>
        <div class="st-time">${s.time}</div>
        <div class="st-fmt">${s.format}</div>
        <span class="st-exp">${s.format.includes('IMAX') ? 'IMAX' : s.format.includes('Dolby') ? 'Dolby' : '4K'}</span>
      </div>
      <div style="text-align:right">
        <div class="st-price">₹${s.price}</div>
        <div class="st-avail ${s.avail === 0 ? 'av-full' : s.avail < 15 ? 'av-low' : 'av-ok'}">
          ${s.avail === 0 ? '✗ Full' : s.avail < 15 ? `⚠ ${s.avail} left` : `✓ ${s.avail}`}
        </div>
      </div>
    </div>`).join('');
}

function selST(sid) {
  document.querySelectorAll('.stcard').forEach(c => c.classList.remove('active'));
  const el = document.getElementById('st-' + sid);
  if (el) el.classList.add('active');
  window.currentShowtime = window.currentMovie.showtimes.find(s => s.id === sid);
  window.selectedSeats   = [];
  setTimeout(() => openSeats(), 300);
}

function scrollToST() {
  document.getElementById('stSec').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// INIT — Start on login page
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  goPage('login');
});
