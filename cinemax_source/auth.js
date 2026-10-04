// ============================================================
// auth.js — Authentication: Login, Signup, Logout
// ============================================================

// ── Switch between Sign In / Sign Up tabs ──
function switchTab(t) {
  const isIn = t === 'in';
  document.getElementById('tab-in').classList.toggle('active', isIn);
  document.getElementById('tab-up').classList.toggle('active', !isIn);
  document.getElementById('formIn').style.display = isIn ? 'block' : 'none';
  document.getElementById('formUp').style.display = isIn ? 'none'  : 'block';
  document.getElementById('swTxt').innerHTML = isIn
    ? 'No account? <span onclick="switchTab(\'up\')">Sign Up</span>'
    : 'Have account? <span onclick="switchTab(\'in\')">Sign In</span>';
  document.getElementById('errBox').style.display = 'none';
}

// ── Registered users (stored in the browser's localStorage) ──
function getUsers() {
  try { return JSON.parse(localStorage.getItem('cinemax_users')) || []; }
  catch (e) { return []; }
}
function saveUsers(list) {
  try { localStorage.setItem('cinemax_users', JSON.stringify(list)); } catch (e) {}
}

// ── Sign In (account must already exist — new users sign up first) ──
function doLogin() {
  const email = document.getElementById('inEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('inPass').value;
  if (!email || !pass) { showErr('Please fill all fields.'); return; }

  // Admin account → admin dashboard
  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) { adminLoginSuccess(); return; }
  if (email === ADMIN_EMAIL) { showErr('Incorrect admin password.'); return; }

  // Demo account always works
  if (email === 'demo@cinemax.com' && pass === '1234') {
    loginSuccess('Demo', email);
    return;
  }

  const user = getUsers().find(u => u.email === email);
  if (!user) {
    showErr('No account found for this email. Please Sign Up first.');
    return;
  }
  if (user.pass !== pass) {
    showErr('Incorrect password. Please try again.');
    return;
  }
  loginSuccess(user.name, user.email);
}

// ── Sign Up (creates the account, then sends the user to Sign In) ──
function doSignup() {
  const name  = document.getElementById('upName').value.trim();
  const email = document.getElementById('upEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('upPass').value;

  if (!name || !email || !pass)                    { showErr('Please fill all fields.'); return; }
  if (!email.includes('@') || !email.includes('.')) { showErr('Enter a valid email address.'); return; }
  if (pass.length < 4)                             { showErr('Password must be at least 4 characters.'); return; }

  const users = getUsers();
  if (email === 'demo@cinemax.com' || email === ADMIN_EMAIL || users.some(u => u.email === email)) {
    showErr('This email is already registered. Please Sign In.');
    return;
  }

  users.push({ name, email, pass });
  saveUsers(users);

  // Clear sign-up form, switch to Sign In with the email pre-filled
  ['upName', 'upEmail', 'upPass'].forEach(id => document.getElementById(id).value = '');
  switchTab('in');
  document.getElementById('inEmail').value = email;
  document.getElementById('inPass').value  = '';
  document.getElementById('inPass').focus();
  showOk('Account created successfully! Please sign in to continue.');
}

// ── Social Login ──
function socialLogin(provider) {
  loginSuccess(provider + ' User', 'user@' + provider.toLowerCase() + '.com');
}

// ── Called after any successful login ──
function loginSuccess(name, email) {
  hideSigninAlert();
  window.loggedIn    = true;
  window.currentUser = { name, email };

  // Update navbar
  document.getElementById('navUser').style.display = 'flex';
  document.getElementById('navSignBtn').style.display = 'none';
  document.getElementById('navAv').textContent = name.charAt(0).toUpperCase();
  document.getElementById('navUn').textContent = name.split(' ')[0];

  // Go to home and render dashboard
  renderHome();
  goPage('home');
  showDash('movies');
}

// ── Logout ──
function logout() {
  if (!confirm('Sign out of CineMax?')) return;
  window.loggedIn = false;
  window.isAdmin  = false;
  document.querySelector('.nav-links').style.display = '';
  document.getElementById('navUser').style.display = 'none';
  document.getElementById('navSignBtn').style.display = 'flex';
  goPage('login');
}

// ── Show login error ──
function showErr(msg) {
  const el = document.getElementById('errBox');
  el.classList.remove('ok');
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Show success message ──
function showOk(msg) {
  const el = document.getElementById('errBox');
  el.classList.add('ok');
  el.textContent = '✅ ' + msg;
  el.style.display = 'block';
}


// ── Sign-in required alert (shown when a guest clicks Movies / Upcoming / My Bookings / Profile) ──
let toastTimer = null;

function navGuard(section, label) {
  if (window.loggedIn) { 
    goPage('home');
    showDash(section);
    return;
  }
  requireLogin(label);
}

function requireLogin(label) {
  goPage('login');
  switchTab('in');
  const msg = document.getElementById('signinAlertMsg');
  msg.textContent = 'Please sign in to view ' + label + '.';
  const box = document.getElementById('signinAlert');
  box.style.display = 'flex';
  // restart shake animation
  box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  showToast('🔒 Please sign in to access ' + label);
  const em = document.getElementById('inEmail');
  if (em) em.focus();
}

function hideSigninAlert() {
  document.getElementById('signinAlert').style.display = 'none';
}

function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
