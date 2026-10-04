// ============================================================
// admin.js — Admin Dashboard (revenue, bookings, users, add movie)
// Data is kept in the browser's localStorage.
// ============================================================

// ── Admin credentials (demo only — front-end only, not secure) ──
const ADMIN_EMAIL = 'admin@cinemax.com';
const ADMIN_PASS  = 'admin123';

// ── Storage helpers ──
function loadJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}
function getBookings() { return loadJSON('cinemax_bookings'); }

// Called from payment.js after a successful payment
function recordBooking(b) {
  const list = getBookings();
  list.push(b);
  saveJSON('cinemax_bookings', list);
}

// ── Custom movies added by admin: load them into MOVIES on startup ──
function loadCustomMovies() {
  loadJSON('cinemax_movies').forEach(m => {
    if (!MOVIES.some(x => x.id === m.id)) MOVIES.push(m);
  });
}
loadCustomMovies();

// ── Helpers ──
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');

// ── Admin login / logout ──
function adminLoginSuccess() {
  hideSigninAlert();
  window.loggedIn    = true;
  window.isAdmin     = true;
  window.currentUser = { name: 'Admin', email: ADMIN_EMAIL };

  document.querySelector('.nav-links').style.display = 'none';
  document.getElementById('navUser').style.display   = 'flex';
  document.getElementById('navSignBtn').style.display = 'none';
  document.getElementById('navAv').textContent = 'A';
  document.getElementById('navUn').textContent = 'Admin';

  goPage('admin');
  adminTab('dash');
}

// ── Tabs ──
function adminTab(tab) {
  document.querySelectorAll('.ad-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  const body = document.getElementById('adminBody');
  body.innerHTML = { dash: adDash, bookings: adBookings, users: adUsers, movie: adMovie }[tab]();
  window.scrollTo({ top: 0 });
}

// ── Data summary ──
function adStats() {
  const bookings = getBookings();
  const users    = loadJSON('cinemax_users');
  return {
    bookings, users,
    revenue: bookings.reduce((s, b) => s + b.amount, 0),
    tickets: bookings.reduce((s, b) => s + b.seatCount, 0),
  };
}

// ── Dashboard tab ──
function adDash() {
  const { bookings, users, revenue, tickets } = adStats();

  const byMovie = {};
  bookings.forEach(b => byMovie[b.movie] = (byMovie[b.movie] || 0) + b.amount);
  const rows = Object.entries(byMovie).sort((a, b) => b[1] - a[1]);
  const max  = rows.length ? rows[0][1] : 1;

  return `
    <div class="ad-cards">
      <div class="ad-card"><div class="ad-ico">💰</div><div class="ad-num">${inr(revenue)}</div><div class="ad-lbl">Total Revenue</div></div>
      <div class="ad-card"><div class="ad-ico">🎟️</div><div class="ad-num">${bookings.length}</div><div class="ad-lbl">Total Bookings</div></div>
      <div class="ad-card"><div class="ad-ico">💺</div><div class="ad-num">${tickets}</div><div class="ad-lbl">Tickets Sold</div></div>
      <div class="ad-card"><div class="ad-ico">👥</div><div class="ad-num">${users.length}</div><div class="ad-lbl">Registered Users</div></div>
      <div class="ad-card"><div class="ad-ico">🎬</div><div class="ad-num">${MOVIES.length}</div><div class="ad-lbl">Movies</div></div>
    </div>

    <div class="ad-grid2">
      <div class="ad-box">
        <div class="ad-box-t">Revenue by Movie</div>
        ${rows.length ? rows.map(([m, v]) => `
          <div class="ad-bar-row">
            <div class="ad-bar-lbl">${esc(m)}</div>
            <div class="ad-bar"><div style="width:${Math.max(4, v / max * 100)}%"></div></div>
            <div class="ad-bar-val">${inr(v)}</div>
          </div>`).join('') : '<div class="ad-empty">No revenue yet. Bookings will appear here.</div>'}
      </div>
      <div class="ad-box">
        <div class="ad-box-t">Recent Bookings</div>
        ${bookings.length ? bookings.slice(-5).reverse().map(b => `
          <div class="ad-recent">
            <div><b>${esc(b.movie)}</b><span>${esc(b.user)} · ${esc(b.seats)}</span></div>
            <div class="ad-amt">${inr(b.amount)}</div>
          </div>`).join('') : '<div class="ad-empty">No bookings yet.</div>'}
      </div>
    </div>`;
}

// ── Bookings tab ──
function adBookings() {
  const list = getBookings().slice().reverse();
  return `
    <div class="ad-box">
      <div class="ad-box-t">All Bookings (${list.length})</div>
      ${list.length ? `<div class="ad-table-wrap"><table class="ad-table">
        <tr><th>Booking ID</th><th>User</th><th>Movie</th><th>Show</th><th>Seats</th><th>Method</th><th>Date</th><th>Amount</th></tr>
        ${list.map(b => `<tr>
          <td>${esc(b.id)}</td><td>${esc(b.user)}<br><small>${esc(b.email)}</small></td>
          <td>${esc(b.movie)}</td><td>${esc(b.hall)}<br><small>${esc(b.time)}</small></td>
          <td>${esc(b.seats)}</td><td>${esc(b.method)}</td><td>${esc(b.date)}</td>
          <td class="ad-amt">${inr(b.amount)}</td></tr>`).join('')}
      </table></div>` : '<div class="ad-empty">No bookings yet.</div>'}
    </div>`;
}

// ── Users tab ──
function adUsers() {
  const { bookings, users } = adStats();
  return `
    <div class="ad-box">
      <div class="ad-box-t">Registered Users (${users.length})</div>
      ${users.length ? `<div class="ad-table-wrap"><table class="ad-table">
        <tr><th>#</th><th>User Name</th><th>Email</th><th>Bookings</th><th>Total Spent</th></tr>
        ${users.map((u, i) => {
          const mine = bookings.filter(b => b.email === u.email);
          return `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td>
            <td>${mine.length}</td><td class="ad-amt">${inr(mine.reduce((s, b) => s + b.amount, 0))}</td></tr>`;
        }).join('')}
      </table></div>` : '<div class="ad-empty">No users have signed up yet.</div>'}
    </div>`;
}

// ── Add Movie tab ──
function adMovie() {
  return `
    <div class="ad-box">
      <div class="ad-box-t">➕ Add New Movie</div>
      <div id="amMsg" class="ad-msg"></div>
      <div class="am-grid">
        <div><label class="pf-lbl">Title *</label><input class="pf-inp" id="am-title" placeholder="MOVIE NAME"/></div>
        <div><label class="pf-lbl">Language *</label>
          <select class="pf-inp" id="am-lang"><option value="tamil">Tamil</option><option value="hindi">Hindi</option></select></div>
        <div><label class="pf-lbl">Release Year *</label><input class="pf-inp" id="am-year" type="number" value="2026"/></div>
        <div><label class="pf-lbl">Duration *</label><input class="pf-inp" id="am-dur" placeholder="2h 30m"/></div>
        <div><label class="pf-lbl">Certificate</label>
          <select class="pf-inp" id="am-rating"><option>U</option><option selected>U/A</option><option>A</option></select></div>
        <div><label class="pf-lbl">IMDb Rating</label><input class="pf-inp" id="am-imdb" placeholder="8.0"/></div>
        <div><label class="pf-lbl">Director *</label><input class="pf-inp" id="am-dir" placeholder="Director name"/></div>
        <div><label class="pf-lbl">Genres (comma separated)</label><input class="pf-inp" id="am-genre" placeholder="Action, Thriller"/></div>
        <div class="am-full"><label class="pf-lbl">Cast (comma separated)</label><input class="pf-inp" id="am-cast" placeholder="Actor 1, Actor 2"/></div>
        <div class="am-full"><label class="pf-lbl">Tagline</label><input class="pf-inp" id="am-tag" placeholder="Optional"/></div>
        <div class="am-full"><label class="pf-lbl">Description *</label><textarea class="pf-inp" id="am-desc" rows="3"></textarea></div>
        <div><label class="pf-lbl">Standard Seat Price (₹) *</label><input class="pf-inp" id="am-std" type="number" value="250"/></div>
        <div><label class="pf-lbl">VIP Seat Price (₹) *</label><input class="pf-inp" id="am-vip" type="number" value="450"/></div>
        <div><label class="pf-lbl">Poster Image (upload)</label><input class="pf-inp" id="am-file" type="file" accept="image/*"/></div>
        <div><label class="pf-lbl">…or Poster URL</label><input class="pf-inp" id="am-url" placeholder="https://…"/></div>
        <div class="am-full"><label class="pf-lbl">Showtimes — one per line: Hall | Time | Format</label>
          <textarea class="pf-inp" id="am-shows" rows="4">CineMax Screen 1 | 11:00 AM | Standard 4K
CineMax Screen 2 | 3:30 PM | Dolby Atmos
CineMax Screen 1 | 7:30 PM | Standard 4K</textarea></div>
      </div>
      <button class="ad-btn" onclick="addMovie()">Add Movie</button>
    </div>

    <div class="ad-box" style="margin-top:18px">
      <div class="ad-box-t">All Movies (${MOVIES.length})</div>
      <div class="ad-table-wrap"><table class="ad-table">
        <tr><th>Poster</th><th>Title</th><th>Language</th><th>Year</th><th>Price</th><th></th></tr>
        ${MOVIES.map(m => `<tr>
          <td><img class="ad-thumb" src="${m.poster}" alt=""/></td>
          <td>${esc(m.title)}</td><td>${esc(m.lang)}</td><td>${esc(m.year)}</td>
          <td>${inr(m.stdPrice)} / ${inr(m.vipPrice)}</td>
          <td>${m.custom ? `<button class="ad-del" onclick="deleteMovie(${m.id})">Delete</button>` : '<small>built-in</small>'}</td>
        </tr>`).join('')}
      </table></div>
    </div>`;
}

// ── Resize an uploaded image so it fits in localStorage ──
function readPoster(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const w = Math.min(420, img.width);
        const h = Math.round(img.height * w / img.width);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function amMsg(text, ok) {
  const el = document.getElementById('amMsg');
  el.textContent = text;
  el.className = 'ad-msg show ' + (ok ? 'ok' : 'err');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Add movie ──
async function addMovie() {
  const v = id => document.getElementById(id).value.trim();
  const title = v('am-title').toUpperCase(), dur = v('am-dur'), dir = v('am-dir'), desc = v('am-desc');
  const std = parseInt(v('am-std')), vip = parseInt(v('am-vip')), year = parseInt(v('am-year'));

  if (!title || !dur || !dir || !desc || !year) { amMsg('Please fill all required (*) fields.', false); return; }
  if (!(std > 0) || !(vip > 0))                 { amMsg('Enter valid seat prices.', false); return; }
  if (MOVIES.some(m => m.title === title))      { amMsg('A movie with this title already exists.', false); return; }

  // Poster: uploaded file > URL > generated placeholder
  let poster = v('am-url');
  const file = document.getElementById('am-file').files[0];
  try { if (file) poster = await readPoster(file); }
  catch (e) { amMsg('Could not read the poster image.', false); return; }
  if (!poster) poster = placeholderPoster(title);

  const lang = v('am-lang');
  const id   = Math.max(100, ...MOVIES.map(m => m.id)) + 1;
  const list = s => s.split(',').map(x => x.trim()).filter(Boolean);

  const showtimes = v('am-shows').split('\n').map((line, i) => {
    const [hall, time, format] = line.split('|').map(x => x.trim());
    return hall && time ? { id: `c${id}_${i}`, hall, time, format: format || 'Standard 4K', price: std, avail: 80 } : null;
  }).filter(Boolean);
  if (!showtimes.length) { amMsg('Add at least one showtime (Hall | Time | Format).', false); return; }

  const movie = {
    id, custom: true, lang, title,
    tagline: v('am-tag') ? `"${v('am-tag')}"` : '',
    year, duration: dur, rating: v('am-rating'), imdb: v('am-imdb') || 'N/A', rt: 'N/A',
    genre: [lang === 'tamil' ? 'Tamil' : 'Hindi', ...list(v('am-genre'))],
    director: dir, cast: list(v('am-cast')), desc,
    poster, banner: null,
    bg: 'linear-gradient(135deg,#0a0a1f,#1c1c40,#0a0a1f)',
    stdPrice: std, vipPrice: vip, isNew: true, isHot: false, showtimes,
  };

  const saved = loadJSON('cinemax_movies');
  saved.push(movie);
  if (!saveJSON('cinemax_movies', saved)) {
    amMsg('Storage is full — try a smaller poster image or a URL.', false);
    return;
  }
  MOVIES.push(movie);
  adminTab('movie');
  amMsg(`"${title}" added! It now appears in the Movies section.`, true);
}

function deleteMovie(id) {
  const m = MOVIES.find(x => x.id === id);
  if (!m || !confirm(`Delete "${m.title}"?`)) return;
  MOVIES.splice(MOVIES.indexOf(m), 1);
  saveJSON('cinemax_movies', loadJSON('cinemax_movies').filter(x => x.id !== id));
  adminTab('movie');
}

// Simple SVG poster when no image is given
function placeholderPoster(title) {
  const t = esc(title.slice(0, 22));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1050"/><stop offset="1" stop-color="#0a0a1f"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/><text x="200" y="290" font-size="34" font-family="Arial" font-weight="bold" fill="#f5c518" text-anchor="middle">${t}</text><text x="200" y="330" font-size="60" text-anchor="middle">🎬</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
