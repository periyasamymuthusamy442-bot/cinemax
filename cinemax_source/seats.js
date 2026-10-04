// ============================================================
// seats.js — Seat Grid Building, Selection & Booking Panel
// ============================================================

const ROWS    = ['A','B','C','D','E','F','G','H','I','J'];
const VIP_ROWS = ['I','J'];   // Bottom rows are VIP Recliners
const COLS    = 14;            // Seats per row
const MAX_SEATS = 8;           // Max seats per booking
const CONV_FEE  = 30;          // Convenience fee (₹)

// Cache of pre-booked seats — stays stable per showtime
const bookedCache = {};

// ── Generate random pre-booked seats for a showtime ──
function getBooked(showtimeId) {
  if (!bookedCache[showtimeId]) {
    const booked = new Set();
    const count  = Math.floor(Math.random() * 20) + 5;
    for (let i = 0; i < count; i++) {
      const row = ROWS[Math.floor(Math.random() * ROWS.length)];
      const col = Math.floor(Math.random() * COLS) + 1;
      booked.add(row + col);
    }
    bookedCache[showtimeId] = booked;
  }
  return bookedCache[showtimeId];
}

// ── Open seat page for current movie + showtime ──
function openSeats() {
  const m = window.currentMovie;
  const s = window.currentShowtime;

  document.getElementById('sTitle').textContent = m.title;
  document.getElementById('sMeta').textContent  = `${s.time} · ${s.hall} · ${s.format}`;

  const img = document.getElementById('bpImg');
  img.src           = m.poster;
  img.style.display = 'block';
  document.getElementById('bpFb').style.background = m.bg;
  document.getElementById('bpFb').style.display    = 'none';

  document.getElementById('bpTitle').textContent = m.title;
  document.getElementById('bpShow').textContent  = `${s.time} — ${s.format}`;

  buildSeatGrid();
  updateBP();
  goPage('seats');
}

// ── Build the interactive seat grid ──
function buildSeatGrid() {
  const cont   = document.getElementById('seatGrid');
  const booked = getBooked(window.currentShowtime.id);
  cont.innerHTML = '';

  ROWS.forEach(row => {
    // VIP divider before row I
    if (row === 'I') {
      const div = document.createElement('div');
      div.className   = 'vip-div';
      div.textContent = '★  VIP RECLINERS  ★';
      cont.appendChild(div);
    }

    const rowEl = document.createElement('div');
    rowEl.className = 'srow';

    // Left row label
    const lbL = document.createElement('div');
    lbL.className   = 'rl';
    lbL.textContent = row;
    rowEl.appendChild(lbL);

    for (let c = 1; c <= COLS; c++) {
      // Aisle gap after column 7
      if (c === 8) {
        const aisle = document.createElement('div');
        aisle.className = 'saisle';
        rowEl.appendChild(aisle);
      }

      const seatId = row + c;
      const isVip  = VIP_ROWS.includes(row);
      const isBkd  = booked.has(seatId);

      const seat = document.createElement('div');
      seat.className  = 'seat ' + (isBkd ? 'bkd' : isVip ? 'vav' : 'av');
      seat.dataset.id  = seatId;
      seat.title       = `Seat ${seatId}${isVip ? ' (VIP Recliner)' : ''}`;

      if (!isBkd) {
        seat.addEventListener('click', () => toggleSeat(seat, seatId, isVip));
      }
      rowEl.appendChild(seat);
    }

    // Right row label
    const lbR = document.createElement('div');
    lbR.className   = 'rl';
    lbR.textContent = row;
    rowEl.appendChild(lbR);

    cont.appendChild(rowEl);
  });
}

// ── Toggle a seat selected / deselected ──
function toggleSeat(el, seatId, isVip) {
  const seats = window.selectedSeats;
  const idx   = seats.findIndex(s => s.id === seatId);

  if (idx > -1) {
    // Deselect
    seats.splice(idx, 1);
    el.className = 'seat ' + (isVip ? 'vav' : 'av');
  } else {
    // Select — enforce max
    if (seats.length >= MAX_SEATS) {
      alert(`Maximum ${MAX_SEATS} seats per booking.`);
      return;
    }
    seats.push({ id: seatId, isVip });
    el.className = 'seat ' + (isVip ? 'vsel' : 'sel');
  }
  updateBP();
}

// ── Calculate total price ──
function calcTot() {
  const seats   = window.selectedSeats;
  const m       = window.currentMovie;
  const std     = seats.filter(s => !s.isVip);
  const vip     = seats.filter(s =>  s.isVip);
  const sc      = std.length * m.stdPrice;
  const vc      = vip.length * m.vipPrice;
  const fee     = seats.length > 0 ? CONV_FEE : 0;
  const disc    = (window.couponApplied && (sc + vc + fee) >= 300) ? 50 : 0;
  const total   = sc + vc + fee - disc;
  return { std, vip, sc, vc, fee, disc, total };
}

// ── Refresh the booking summary panel ──
function updateBP() {
  const { std, vip, sc, vc, total } = calcTot();
  const seats = window.selectedSeats;

  document.getElementById('bpLblS').textContent = `Standard (x${std.length})`;
  document.getElementById('bpValS').textContent = `₹${sc}`;
  document.getElementById('bpLblV').textContent = `VIP (x${vip.length})`;
  document.getElementById('bpValV').textContent = `₹${vc}`;
  document.getElementById('bpTot').textContent  = `₹${total}`;

  const disp = document.getElementById('bpSeats');
  if (seats.length === 0) {
    disp.innerHTML = '<span class="bp-no">No seats selected</span>';
  } else {
    disp.textContent = seats.map(s => s.id).sort().join(' · ');
  }

  const btn = document.getElementById('coBtn');
  if (seats.length > 0) {
    btn.disabled     = false;
    btn.textContent  = `Proceed to Payment — ₹${total}`;
  } else {
    btn.disabled     = true;
    btn.textContent  = 'Select seats to continue';
  }
}
