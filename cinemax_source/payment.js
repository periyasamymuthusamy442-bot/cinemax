// ============================================================
// payment.js — Payment Page, Coupon, Processing & Confirmation
// ============================================================

// ── Navigate to payment page ──
function goPayment() {
  if (window.selectedSeats.length === 0) return;

  // Reset coupon state
  window.couponApplied = false;
  window.payMethod     = 'card';

  const { std, vip, sc, vc, fee, total } = calcTot();
  const m = window.currentMovie;
  const s = window.currentShowtime;

  // Fill top bar
  document.getElementById('payTitle').textContent = m.title;
  document.getElementById('payMeta').textContent  = `${s.time} · ${s.hall}`;

  // Fill order summary
  const img = document.getElementById('psImg');
  img.src           = m.poster;
  img.style.display = 'block';

  document.getElementById('psTitle').textContent = m.title;
  document.getElementById('psShow').textContent  = `${s.time} · ${s.hall} · ${s.format}`;
  document.getElementById('psSeats').textContent = window.selectedSeats.map(s => s.id).sort().join(' · ');
  document.getElementById('psLblS').textContent  = `Standard (x${std.length})`;
  document.getElementById('psValS').textContent  = `₹${sc}`;
  document.getElementById('psLblV').textContent  = `VIP (x${vip.length})`;
  document.getElementById('psValV').textContent  = `₹${vc}`;
  document.getElementById('discRow').style.display = 'none';
  document.getElementById('psFinalTot').textContent = `₹${total}`;
  document.getElementById('oSave').textContent = (sc + vc + fee) >= 300 ? 'Save ₹50!' : '';

  // Reset UI
  document.getElementById('couponInp').value    = '';
  document.getElementById('couponMsg').style.display = 'none';
  selPayMethod('card', document.getElementById('pm-card'));

  goPage('payment');
}

// ── Select a payment method ──
function selPayMethod(method, el) {
  window.payMethod = method;
  document.querySelectorAll('.pmethod').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
  ['card','upi','netbank','wallet'].forEach(m => {
    document.getElementById('form-' + m).style.display = 'none';
  });
  document.getElementById('form-' + method).style.display = 'block';
}

// ── UPI app selector ──
function selUpi(el) {
  document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

// ── Bank selector ──
function selBank(el) {
  document.querySelectorAll('.bank-item').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

// ── Wallet selector ──
function selWallet(el) {
  document.querySelectorAll('.wallet-item').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

// ── Apply coupon code ──
function applyCoupon() {
  const code = document.getElementById('couponInp').value.trim().toUpperCase();
  const msg  = document.getElementById('couponMsg');
  msg.className    = 'coupon-msg';
  msg.style.display = 'none';

  if (code === 'CINE50') {
    window.couponApplied = true;
    msg.textContent  = '✅ CINE50 applied! You saved ₹50';
    msg.className    = 'coupon-msg ok';
    msg.style.display = 'flex';
    document.getElementById('discRow').style.display = 'flex';
    const { total } = calcTot();
    document.getElementById('psFinalTot').textContent = `₹${total}`;
    document.getElementById('oSave').textContent = '✅ Saved ₹50!';

  } else if (code === 'IMAX20') {
    window.couponApplied = true;
    msg.textContent  = '✅ IMAX20 applied! 20% off on IMAX tickets';
    msg.className    = 'coupon-msg ok';
    msg.style.display = 'flex';

  } else if (code === '') {
    msg.textContent  = '❌ Please enter a promo code.';
    msg.className    = 'coupon-msg fail';
    msg.style.display = 'flex';

  } else {
    msg.textContent  = '❌ Invalid code. Try: CINE50 or IMAX20';
    msg.className    = 'coupon-msg fail';
    msg.style.display = 'flex';
  }
}

// ── Card number formatter (adds spaces every 4 digits) ──
function fmtCard(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 16);
  el.value = v.replace(/(.{4})/g, '$1 ').trim();
}

// ── Expiry date formatter (MM / YY) ──
function fmtExp(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 4);
  if (v.length > 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
  el.value = v;
}

// ── Validate form and start payment processing ──
function processPayment() {
  // Validate based on selected method
  if (window.payMethod === 'card') {
    const num  = document.getElementById('cardNum').value.replace(/\s/g, '');
    const name = document.getElementById('cardName').value.trim();
    const exp  = document.getElementById('cardExp').value.trim();
    const cvv  = document.getElementById('cardCvv').value.trim();

    if (num.length < 16)  { alert('Please enter a valid 16-digit card number.'); return; }
    if (!name)            { alert('Please enter cardholder name.'); return; }
    if (exp.length < 7)   { alert('Please enter valid expiry date (MM / YY).'); return; }
    if (cvv.length < 3)   { alert('Please enter valid CVV.'); return; }

  } else if (window.payMethod === 'upi') {
    const id = document.getElementById('upiId').value.trim();
    if (!id || !id.includes('@')) { alert('Please enter a valid UPI ID (e.g. name@upi).'); return; }
  }

  // Show processing overlay and animate steps
  const overlay = document.getElementById('procOv');
  overlay.classList.add('show');

  const stepIds = ['ps1','ps2','ps3','ps4'];
  stepIds.forEach(id => {
    document.getElementById(id).classList.remove('cur', 'done');
  });

  let i = 0;
  const interval = setInterval(() => {
    if (i > 0) document.getElementById(stepIds[i - 1]).classList.add('done');
    if (i < stepIds.length) {
      document.getElementById(stepIds[i]).classList.add('cur');
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        overlay.classList.remove('show');
        stepIds.forEach(id => {
          document.getElementById(id).classList.remove('cur', 'done');
        });
        showConfirm();
      }, 500);
    }
  }, 800);
}

// ── Show confirmation page ──
function showConfirm() {
  const { total } = calcTot();
  const m = window.currentMovie;
  const s = window.currentShowtime;

  const code = 'CM' + s.id.toUpperCase() + Date.now().toString(36).toUpperCase().slice(-6);
  const d    = new Date();

  const methodLabels = {
    card:    'Credit / Debit Card',
    upi:     'UPI',
    netbank: 'Net Banking',
    wallet:  'Wallet',
  };

  document.getElementById('cfMov').textContent    = m.title;
  document.getElementById('cfDate').textContent   = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('cfTime').textContent   = s.time;
  document.getElementById('cfHall').textContent   = s.hall;
  document.getElementById('cfFmt').textContent    = s.format;
  document.getElementById('cfSeats').textContent  = window.selectedSeats.map(s => s.id).sort().join(' · ');
  document.getElementById('cfTot').textContent    = `₹${total}`;
  document.getElementById('cfMethod').textContent = methodLabels[window.payMethod] || 'Online Payment';
  document.getElementById('cfCode').textContent   = code;

  // Save booking so My Bookings and the Admin Dashboard can use it
  recordBooking({
    id: code,
    user: window.currentUser.name,
    email: window.currentUser.email,
    movie: m.title,
    hall: s.hall,
    time: s.time,
    seats: window.selectedSeats.map(x => x.id).sort().join(' · '),
    seatCount: window.selectedSeats.length,
    amount: total,
    method: methodLabels[window.payMethod] || 'Online Payment',
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  });

  goPage('confirm');
}
