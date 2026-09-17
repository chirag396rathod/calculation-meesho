/**
 * auth.js — Client-Side Authentication State Manager
 * Handles JWT token storage, session restoration, OTP API calls (mobile or email),
 * header UI updates, and the 3-step login flow.
 *
 * OTP Delivery:
 *  - Mobile number → WhatsApp (from +91 93285 93359) then fallback SMS
 *  - Email address → Gmail (from houseofgurukrupa97@gmail.com)
 */

// ── Token Storage ──
const TOKEN_KEY = 'fc_auth_token';
const USER_KEY  = 'fc_auth_user';

export const authState = {
  token: null,
  user: null,       // { id, mobile, email, name }
  isLoaded: false
};

const authChangeListeners = [];

export function onAuthChange(callback) {
  if (typeof callback === 'function') {
    authChangeListeners.push(callback);
  }
}

function notifyAuthChange() {
  authChangeListeners.forEach(fn => {
    try { fn(authState); } catch (err) { console.error('[Auth] Change listener error:', err); }
  });
}

// ── Token Helpers ──
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
  authState.token = token;
  authState.user  = user || authState.user;
  updateAuthUI();  // always refresh header on token change
  notifyAuthChange();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  authState.token = null;
  authState.user  = null;
  updateAuthUI();
  notifyAuthChange();
}

export function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ────────────────────────────────────────────────
//  HEADER / UI UPDATE
// ────────────────────────────────────────────────

export function getUserInitials(user) {
  if (!user) return '👤';
  if (user.name && user.name.trim()) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (user.email && user.email.trim()) {
    const local = user.email.split('@')[0];
    return local.slice(0, 2).toUpperCase();
  }
  if (user.mobile && user.mobile.trim()) {
    const digits = user.mobile.replace(/\D/g, '');
    return digits.slice(-2) || '👤';
  }
  return '👤';
}

export function updateAuthUI() {
  const user  = authState.user;
  const token = authState.token || getToken();

  const getStartedBtn = document.getElementById('sbHeaderLoginBtn');
  const dashBtn       = document.getElementById('sbHeaderDashBtn');

  const sidebarUserName   = document.getElementById('sidebarUserName');
  const sidebarUserMeta   = document.getElementById('sidebarUserMeta');
  const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
  const sidebarUserBadge  = document.getElementById('sidebarUserBadge');
  const sidebarStatusDot  = document.getElementById('sidebarStatusDot');
  const sidebarLogoutBtn  = document.getElementById('sidebarLogoutBtn');

  if (token && user) {
    // ── LOGGED IN ──
    // Hide "Get Started", show "Dashboard →"
    if (getStartedBtn) {
      getStartedBtn.style.setProperty('display', 'none', 'important');
      getStartedBtn.classList.add('sb-header-btn-hidden');
      getStartedBtn.setAttribute('hidden', '');
    }
    if (dashBtn) {
      dashBtn.style.removeProperty('display');
      dashBtn.classList.remove('sb-header-btn-hidden');
      dashBtn.removeAttribute('hidden');
    }

    // Update sidebar user badge with crisp data & initials
    if (sidebarUserName) {
      sidebarUserName.textContent = user.name || 'My Account';
    }
    if (sidebarUserMeta) {
      sidebarUserMeta.textContent = user.email || user.mobile || 'Personal Workspace';
    }
    if (sidebarUserAvatar) {
      sidebarUserAvatar.textContent = getUserInitials(user);
    }
    if (sidebarStatusDot) {
      sidebarStatusDot.style.display = 'block';
    }
    if (sidebarUserBadge) {
      sidebarUserBadge.title = user.name ? `${user.name} • Manage Account` : 'Manage Account';
    }
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.style.display = 'flex';
    }

  } else {
    // ── NOT LOGGED IN ──
    // Show "Get Started", hide "Dashboard →"
    if (getStartedBtn) {
      getStartedBtn.style.removeProperty('display');
      getStartedBtn.classList.remove('sb-header-btn-hidden');
      getStartedBtn.removeAttribute('hidden');
      getStartedBtn.textContent   = 'Get Started';
      getStartedBtn.dataset.sbRoute = 'login';
      getStartedBtn.classList.remove('sb-btn-logged-in');
    }
    if (dashBtn) {
      dashBtn.style.setProperty('display', 'none', 'important');
      dashBtn.classList.add('sb-header-btn-hidden');
      dashBtn.setAttribute('hidden', '');
    }

    if (sidebarUserName)   sidebarUserName.textContent = 'Guest User';
    if (sidebarUserMeta)   sidebarUserMeta.textContent = 'Sign in to sync data';
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = '👤';
    if (sidebarStatusDot)  sidebarStatusDot.style.display = 'none';
    if (sidebarUserBadge)  sidebarUserBadge.title = 'Click to sign in';
    if (sidebarLogoutBtn)  sidebarLogoutBtn.style.display = 'none';
  }
}

// ────────────────────────────────────────────────
//  SESSION RESTORATION
// ────────────────────────────────────────────────

export async function fetchMe() {
  const token = getToken();
  authState.isLoaded = false;

  // Try cached user first for instant UI (before network)
  const cached = localStorage.getItem(USER_KEY);
  if (token && cached) {
    try {
      authState.token = token;
      authState.user  = JSON.parse(cached);
      updateAuthUI();
    } catch (e) {}
  }

  if (!token) {
    authState.isLoaded = true;
    updateAuthUI();
    return false;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      authState.token = token;
      authState.user  = data.user;
      authState.isLoaded = true;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      updateAuthUI();
      return true;
    } else {
      // Token invalid/expired
      clearToken();
      authState.isLoaded = true;
      return false;
    }
  } catch (err) {
    console.warn('[Auth] /api/auth/me unreachable, using cached state:', err.message);
    if (cached) {
      authState.isLoaded = true;
      return true; // graceful offline
    }
    clearToken();
    authState.isLoaded = true;
    return false;
  }
}

export function logout() {
  fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() }).catch(() => {});
  clearToken();
  import('./landing.js').then(({ navigateTo }) => navigateTo('home'));
}

// ────────────────────────────────────────────────
//  OTP FLOW INIT
// ────────────────────────────────────────────────

export function initOtpFlow() {
  const loginView = document.getElementById('loginView');
  if (!loginView) return;

  const container = loginView.querySelector('.sb-login-otp-container');
  if (!container) return;

  renderStepInput(container);
  window.fcAuthInit = initOtpFlow;
}

// ────────────────────────────────────────────────
//  STEP 1: Mobile or Email Input
// ────────────────────────────────────────────────

function renderStepInput(container) {
  container.innerHTML = `
    <div class="otp-brand-prefix">
      <span class="otp-brand-icon">📊</span>
      <span class="otp-brand-label">FC Analytics</span>
    </div>

    <div class="otp-step-indicator">
      <span class="otp-step active" title="Enter your mobile or email">1</span>
      <span class="otp-step-line"></span>
      <span class="otp-step" title="Enter OTP">2</span>
      <span class="otp-step-line"></span>
      <span class="otp-step" title="Profile">3</span>
    </div>

    <h2 class="sb-login-card-title">Get Started</h2>
    <p class="sb-login-card-desc">New or returning — just enter your mobile or email</p>

    <div class="otp-input-wrap" id="otpInputWrap">
      <div class="otp-input-prefix" id="otpInputPrefix">
        <svg id="otpPrefixIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      </div>
      <input
        type="text"
        id="otpContactInput"
        class="otp-contact-input"
        placeholder="Mobile number or email"
        autocomplete="tel email"
        inputmode="numeric"
        autofocus
      >
    </div>

    <button class="sb-btn sb-btn-primary otp-action-btn" id="sendOtpBtn" type="button">
      Continue →
    </button>

    <div class="otp-error-msg" id="otpErrorMsg" style="display:none;"></div>

    <p class="otp-legal-footer">
      By continuing, you agree to our
      <a href="/terms" data-sb-route="terms">Terms</a> and
      <a href="/privacy" data-sb-route="privacy">Privacy Policy</a>.
    </p>
  `;

  const input    = container.querySelector('#otpContactInput');
  const prefix   = container.querySelector('#otpInputPrefix');
  const btn      = container.querySelector('#sendOtpBtn');
  const err      = container.querySelector('#otpErrorMsg');

  const PHONE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
  const EMAIL_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;

  // Detect email vs mobile — swap prefix icon only
  input?.addEventListener('input', () => {
    const val = input.value.trim();
    const isEmail = val.includes('@');
    input.inputMode = isEmail ? 'email' : 'numeric';
    prefix.innerHTML = isEmail ? EMAIL_SVG : PHONE_SVG;
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn?.click();
  });

  btn?.addEventListener('click', async () => {
    const raw = (input?.value || '').trim();
    if (!raw) {
      showError(err, 'Please enter your mobile number or email address.');
      return;
    }

    setLoading(btn, true, 'Sending OTP...');
    hideError(err);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: raw })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(err, data.error || 'Failed to send OTP. Please try again.');
        setLoading(btn, false, 'Send OTP →');
        return;
      }

      renderStepOtp(container, {
        input: raw,
        channel: data.channel,
        expiresIn: data.expiresIn || 600,
        message: data.message,
        otp: data.otp,
        isMock: data.isMock
      });

    } catch (e) {
      showError(err, 'Network error. Please check your connection.');
      setLoading(btn, false, 'Send OTP →');
    }
  });
}

// ────────────────────────────────────────────────
//  STEP 2: OTP Verification
// ────────────────────────────────────────────────

function renderStepOtp(container, { input, channel, expiresIn, message, otp, isMock }) {
  const isEmail   = channel === 'email';
  const channelIcon = isEmail ? '✉️' : '💬';
  const channelLabel = isEmail
    ? 'Check your email inbox (and spam folder)'
    : 'Check WhatsApp on +91 93285 93359';

  container.innerHTML = `
    <div class="otp-step-indicator">
      <span class="otp-step done">✓</span>
      <span class="otp-step-line done"></span>
      <span class="otp-step active">2</span>
      <span class="otp-step-line"></span>
      <span class="otp-step">3</span>
    </div>

    <div class="sb-login-card-icon" style="background:#0EA5E9;">
      <span style="font-size:20px;">${channelIcon}</span>
    </div>

    <h2 class="sb-login-card-title">Enter Verification Code</h2>
    <p class="sb-login-card-desc">${message || 'OTP sent successfully'}</p>
    <p class="otp-channel-label">${channelLabel}</p>

    ${otp ? `
      <div class="otp-mock-notice">
        <div class="otp-mock-title">🔑 Test / Demo Verification Code</div>
        <div class="otp-mock-code">${otp}</div>
        <div class="otp-mock-sub">Code auto-filled below for instant testing (WhatsApp gateway in test mode)</div>
      </div>
    ` : ''}

    <div class="otp-boxes" id="otpBoxes">
      ${[0,1,2,3,4,5].map(i =>
        `<input type="text" class="otp-box" id="otpBox${i}" maxlength="1" inputmode="numeric" autocomplete="one-time-code" placeholder="·">`
      ).join('')}
    </div>

    <div class="otp-timer-row">
      <span class="otp-timer" id="otpTimerRow">Resend in <strong id="timerCount">${expiresIn}</strong>s</span>
      <button class="otp-resend-btn" id="resendOtpBtn" style="display:none;" type="button">Resend OTP</button>
    </div>

    <button class="sb-btn sb-btn-primary otp-action-btn" id="verifyOtpBtn" type="button">
      Verify & Continue →
    </button>

    <div class="otp-error-msg" id="otpErrorMsg" style="display:none;"></div>
    <button class="otp-back-btn" id="otpBackBtn" type="button">← Change ${isEmail ? 'email' : 'number'}</button>
  `;

  setupOtpBoxes(container, input, expiresIn, otp);
}

function setupOtpBoxes(container, inputVal, expiresIn, devOtp) {
  const boxes     = Array.from(container.querySelectorAll('.otp-box'));
  const verifyBtn = container.querySelector('#verifyOtpBtn');
  const err       = container.querySelector('#otpErrorMsg');
  const timerEl   = container.querySelector('#timerCount');
  const timerRow  = container.querySelector('#otpTimerRow');
  const resendBtn = container.querySelector('#resendOtpBtn');
  const backBtn   = container.querySelector('#otpBackBtn');

  // Auto-fill OTP if provided in test/mock mode
  if (devOtp) {
    const chars = String(devOtp).trim().split('');
    boxes.forEach((box, i) => {
      box.value = chars[i] || '';
    });
    setTimeout(() => {
      verifyBtn?.focus();
    }, 150);
  } else {
    boxes[0]?.focus();
  }

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      if (box.value && i < 5) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
      if (e.key === 'Enter') verifyBtn?.click();
    });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      paste.split('').forEach((ch, idx) => { if (boxes[idx]) boxes[idx].value = ch; });
      const next = Math.min(paste.length, 5);
      boxes[next]?.focus();
    });
  });

  // Countdown timer
  let secondsLeft = expiresIn || 600;
  const tick = setInterval(() => {
    secondsLeft -= 1;
    if (timerEl) timerEl.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(tick);
      if (timerRow) timerRow.style.display = 'none';
      if (resendBtn) resendBtn.style.display = 'inline-block';
    }
  }, 1000);

  resendBtn?.addEventListener('click', async () => {
    setLoading(resendBtn, true, 'Sending...');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputVal })
      });
      const data = await res.json();
      if (data.success) {
        renderStepOtp(container, {
          input: inputVal,
          channel: data.channel,
          expiresIn: data.expiresIn || 600,
          message: data.message,
          otp: data.otp,
          isMock: data.isMock
        });
      } else {
        showError(err, data.error || 'Could not resend OTP.');
        setLoading(resendBtn, false, 'Resend OTP');
      }
    } catch (e) {
      showError(err, 'Network error.');
      setLoading(resendBtn, false, 'Resend OTP');
    }
  });

  backBtn?.addEventListener('click', () => {
    clearInterval(tick);
    renderStepInput(container);
  });

  verifyBtn?.addEventListener('click', async () => {
    const otp = boxes.map(b => b.value).join('');
    if (otp.length !== 6) {
      showError(err, 'Please enter all 6 digits of the OTP.');
      return;
    }

    clearInterval(tick);
    setLoading(verifyBtn, true, 'Verifying...');
    hideError(err);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputVal, otp })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(err, data.error || 'Incorrect OTP. Please try again.');
        setLoading(verifyBtn, false, 'Verify & Continue →');
        container.querySelector('#otpBoxes')?.classList.add('otp-shake');
        setTimeout(() => container.querySelector('#otpBoxes')?.classList.remove('otp-shake'), 600);
        return;
      }

      // Store JWT + user
      setToken(data.token, data.user);

      if (data.isNewUser) {
        renderStepProfile(container, { token: data.token, user: data.user });
      } else {
        // Go straight to dashboard
        import('./landing.js').then(({ navigateTo }) => navigateTo('dashboard'));
      }

    } catch (e) {
      showError(err, 'Network error. Please try again.');
      setLoading(verifyBtn, false, 'Verify & Continue →');
    }
  });
}

// ────────────────────────────────────────────────
//  STEP 3: Profile Setup
// ────────────────────────────────────────────────

function renderStepProfile(container, { token, user }) {
  const prefillName  = user?.name  || '';
  const prefillEmail = user?.email || '';

  container.innerHTML = `
    <div class="otp-step-indicator">
      <span class="otp-step done">✓</span>
      <span class="otp-step-line done"></span>
      <span class="otp-step done">✓</span>
      <span class="otp-step-line done"></span>
      <span class="otp-step active">3</span>
    </div>

    <div class="sb-login-card-icon" style="background:#6366F1;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>

    <h2 class="sb-login-card-title">Set up your profile</h2>
    <p class="sb-login-card-desc">Personalise your dashboard (you can update this later)</p>

    <div class="otp-profile-fields">
      <div class="otp-field-group">
        <input type="text" class="otp-profile-input" id="profileName"
          placeholder="Business / Shop name"
          autocomplete="organization"
          value="${prefillName}">
        <p class="otp-field-hint">Helps us address you in reports</p>
      </div>
      ${!prefillEmail ? `
      <div class="otp-field-group">
        <input type="email" class="otp-profile-input" id="profileEmail"
          placeholder="Email address"
          autocomplete="email">
        <p class="otp-field-hint">For backup &amp; future notifications</p>
      </div>` : ''}
    </div>

    <button class="sb-btn sb-btn-primary otp-action-btn" id="saveProfileBtn" type="button">
      Go to Dashboard →
    </button>

    <div class="otp-error-msg" id="otpErrorMsg" style="display:none;"></div>
    <button class="otp-skip-btn" id="skipProfileBtn" type="button">Skip for now</button>
  `;

  const saveBtn = container.querySelector('#saveProfileBtn');
  const skipBtn = container.querySelector('#skipProfileBtn');
  const err     = container.querySelector('#otpErrorMsg');

  const goToDashboard = () =>
    import('./landing.js').then(({ navigateTo }) => navigateTo('dashboard'));

  skipBtn?.addEventListener('click', goToDashboard);

  saveBtn?.addEventListener('click', async () => {
    const name  = (container.querySelector('#profileName')?.value  || '').trim();
    const email = (container.querySelector('#profileEmail')?.value || prefillEmail || '').trim();

    setLoading(saveBtn, true, 'Saving...');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (data.user) {
        setToken(token, data.user);
      }
    } catch (e) {
      // Profile save failure is non-blocking
      console.warn('[Auth] Profile save failed:', e.message);
    }

    goToDashboard();
  });
}

// ────────────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────────────

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(el) {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled  = loading;
  btn.textContent = text;
  btn.style.opacity = loading ? '0.72' : '1';
}

// ────────────────────────────────────────────────
//  PROFILE MODAL MANAGEMENT
// ────────────────────────────────────────────────

export function openProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;

  const user = authState.user;
  if (!user) return;

  const avatarEl   = document.getElementById('modalProfileAvatar');
  const headingEl  = document.getElementById('modalProfileHeading');
  const tagEl      = document.getElementById('modalProfileTag');
  const nameInput  = document.getElementById('modalProfileNameInput');
  const emailInput = document.getElementById('modalProfileEmailInput');
  const mobileInput= document.getElementById('modalProfileMobileInput');
  const userIdEl   = document.getElementById('modalProfileUserId');
  const statusMsg  = document.getElementById('modalProfileStatusMsg');

  if (avatarEl)   avatarEl.textContent = getUserInitials(user);
  if (headingEl)  headingEl.textContent = user.name || 'My Account';
  if (tagEl)      tagEl.textContent = (user.email || user.mobile) ? 'Active Account' : 'Personal Workspace';
  if (nameInput)  nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (mobileInput)mobileInput.value = user.mobile || '(No mobile number)';
  if (userIdEl)   userIdEl.textContent = user.id || '-';

  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.textContent = '';
  }

  modal.classList.add('active');
}

export function closeProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (modal) modal.classList.remove('active');
}

export function setupProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;

  const closeBtn = document.getElementById('userProfileModalClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProfileModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProfileModal();
  });

  const form = document.getElementById('userProfileForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn   = document.getElementById('modalProfileSaveBtn');
      const statusMsg = document.getElementById('modalProfileStatusMsg');
      const nameInput = document.getElementById('modalProfileNameInput');
      const emailInput= document.getElementById('modalProfileEmailInput');

      const name  = (nameInput?.value || '').trim();
      const email = (emailInput?.value || '').trim();

      if (saveBtn) setLoading(saveBtn, true, 'Saving...');

      try {
        const res = await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ name, email }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (data.user) {
            authState.user = data.user;
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          updateAuthUI();

          const avatarEl  = document.getElementById('modalProfileAvatar');
          const headingEl = document.getElementById('modalProfileHeading');
          if (avatarEl && data.user)  avatarEl.textContent  = getUserInitials(data.user);
          if (headingEl && data.user) headingEl.textContent = data.user.name || 'My Account';

          if (statusMsg) {
            statusMsg.className = 'profile-modal-status success';
            statusMsg.textContent = '✓ Profile updated successfully!';
            statusMsg.style.display = 'block';
          }

          setTimeout(() => {
            closeProfileModal();
          }, 900);
        } else {
          if (statusMsg) {
            statusMsg.className = 'profile-modal-status error';
            statusMsg.textContent = data.error || 'Failed to update profile.';
            statusMsg.style.display = 'block';
          }
        }
      } catch (err) {
        if (statusMsg) {
          statusMsg.className = 'profile-modal-status error';
          statusMsg.textContent = 'Network error: ' + err.message;
          statusMsg.style.display = 'block';
        }
      } finally {
        if (saveBtn) setLoading(saveBtn, false, '💾 Save Changes');
      }
    });
  }
}
