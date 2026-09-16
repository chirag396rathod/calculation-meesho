/**
 * ══════════════════════════════════════════════════════════════════════
 * SELLERBOX-INSPIRED LANDING PAGE INTERACTIVITY & CLIENT ROUTING
 * ══════════════════════════════════════════════════════════════════════
 */
import { renderInfoPage, INFO_PAGES } from './infoPages.js';
import { mountLabelSorter } from './labelSorter.js';

// Feature Showcase Tab Definitions
const FEATURE_TABS = {
  label: {
    title: "Meesho & Marketplace Shipping Label Crop & Sorter",
    desc: "Automatically crop unnecessary invoice sections, arrange labels strictly by SKU or courier partner, and stamp custom messages & scannable QR codes for 3x faster dispatch packing.",
    bullets: [
      "Dynamic cropping right below product details (Crop1 reference)",
      "Standard 4×4 thermal crop with whitespace trim",
      "Instant Courier partner grouping (Xpress Bees, Valmo, Shadowfax, Delhivery)",
      "Live scannable QR code generator for social / warranty links",
      "Zero server upload — 100% private & client-side"
    ],
    previewHtml: `
      <div style="background: white; border-radius: 14px; padding: 18px; border: 1px solid #E3E3E3; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #ECECEC; padding-bottom: 8px;">
          <span style="font-weight: 700; color: #8B1874; font-size: 0.88rem;">🏷️ Meesho Thermal Label Preview</span>
          <span style="background: #FBF0F7; color: #8B1874; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">Cropped Below Details</span>
        </div>
        <div style="background: #FAFAFA; border: 1px dashed #D1D5DB; border-radius: 10px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="font-size: 0.85rem;">COURIER: Xpress Bees</strong>
            <span style="font-size: 0.8rem; color: #6B6B6B;">SKU: KURTI-RED-XL</span>
          </div>
          <div style="height: 36px; background: #1A1A1A; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-family: monospace; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 10px;">
            ||||| 892019482910 |||||
          </div>
          <div style="display: flex; gap: 8px; align-items: center; background: white; padding: 8px; border-radius: 8px; border: 1px solid #E3E3E3;">
            <div style="width: 32px; height: 32px; background: #FBF0F7; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px;">📱</div>
            <div style="font-size: 0.78rem; line-height: 1.3;">
              <strong>Custom Message + QR:</strong><br><span style="color: #6B6B6B;">Thank you for your order! Please leave a 5-star review.</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  profit: {
    title: "Real-Time SKU Profit & Loss Engine",
    desc: "Stop relying on chaotic spreadsheets. Calculate true net profit per SKU by subtracting product manufacturing costs, actual marketplace commissions, shipping deductions, and RTO return penalties.",
    bullets: [
      "SKU-level net profit margin analysis",
      "Automatic factoring of TDS, TCS, and GST deductions",
      "Real return loss calculation (Courier RTO vs Customer Return)",
      "High-margin vs losing SKU identification alerts"
    ],
    previewHtml: `
      <div style="background: white; border-radius: 16px; padding: 18px; border: 1.5px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-weight: 700; font-size: 0.88rem;">📊 SKU Profitability Leaderboard</span>
          <span style="color: #10B981; font-weight: 700; font-size: 0.85rem;">+24.8% Net Margin</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="background: #F8FAFC; padding: 10px 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 0.84rem;">SANGANERI-BEDSHEET-DBL</div>
              <div style="font-size: 0.75rem; color: #64748B;">Orders: 420 | Payout: ₹1,42,800</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; color: #10B981; font-size: 0.92rem;">+₹48,200</div>
              <div style="font-size: 0.72rem; color: #10B981;">33.7% Profit</div>
            </div>
          </div>
          <div style="background: #FFF1F2; padding: 10px 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #FECDD3;">
            <div>
              <div style="font-weight: 700; font-size: 0.84rem;">COTTON-SHIRT-BLUE-M</div>
              <div style="font-size: 0.75rem; color: #E11D48;">High RTO (28%) | Heavy Shipping Deductions</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; color: #E11D48; font-size: 0.92rem;">-₹6,400</div>
              <div style="font-size: 0.72rem; color: #E11D48;">Losing Product</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  orders: {
    title: "Order Flow & Returns / RTO Tracking",
    desc: "Unify all dispatch orders and return reports from Meesho supplier panel. Immediately distinguish between delivered orders, customer returns, and courier RTOs.",
    bullets: [
      "Separate Customer Returns from in-transit Courier RTOs",
      "Monitor return percentage across SKUs and regions",
      "Track order delivery timelines and avoid logistics penalties",
      "Historical month-on-month trend comparisons"
    ],
    previewHtml: `
      <div style="background: white; border-radius: 16px; padding: 18px; border: 1.5px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-weight: 700; font-size: 0.88rem;">📦 Order Status Distribution</span>
          <span style="font-size: 0.78rem; font-weight: 600; color: #64748B;">Last 30 Days</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; margin-bottom: 14px;">
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 10px; border-radius: 10px;">
            <div style="font-size: 0.72rem; color: #166534; font-weight: 600;">DELIVERED</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #15803D;">78.4%</div>
          </div>
          <div style="background: #FEF3C7; border: 1px solid #FDE68A; padding: 10px; border-radius: 10px;">
            <div style="font-size: 0.72rem; color: #92400E; font-weight: 600;">COURIER RTO</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #B45309;">14.2%</div>
          </div>
          <div style="background: #FEE2E2; border: 1px solid #FECACA; padding: 10px; border-radius: 10px;">
            <div style="font-size: 0.72rem; color: #991B1B; font-weight: 600;">CUST RETURN</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #B91C1C;">7.4%</div>
          </div>
        </div>
      </div>
    `
  },
  reconciliation: {
    title: "Smart Settlement & Payout Reconciliation",
    desc: "Catch payment leakages automatically. Compare your actual bank account credits against Meesho settlement reports to detect incorrect fee deductions and missing compensation.",
    bullets: [
      "Detect missing payouts and delayed payments instantly",
      "Verify marketplace return freight charges",
      "Reconcile multiple seller accounts seamlessly in one place",
      "Export audit-ready Excel and CSV reports"
    ],
    previewHtml: `
      <div style="background: white; border-radius: 16px; padding: 18px; border: 1.5px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-weight: 700; font-size: 0.88rem;">⚖️ Settlement Reconciliation Status</span>
          <span style="background: #F0FDF4; color: #166534; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 8px;">Reconciled</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.84rem;">
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #F8FAFC; border-radius: 8px;">
            <span style="color: #64748B;">Total Expected Settlement:</span>
            <strong>₹2,48,910</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #F8FAFC; border-radius: 8px;">
            <span style="color: #64748B;">Bank Deposited Amount:</span>
            <strong style="color: #10B981;">₹2,48,910</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #F0FDF4; border-radius: 8px; border: 1px solid #BBF7D0;">
            <span style="color: #166534; font-weight: 600;">Discrepancies / Missing:</span>
            <strong style="color: #166534;">₹0.00 (100% Matched)</strong>
          </div>
        </div>
      </div>
    `
  }
};

/**
 * Initialize Landing Page interactivity
 */
export function initLandingPage() {
  initFeatureTabs();
  initFaqAccordion();
  initProfitCalculator();
  initMobileMenu();
  initLoginScreen();
  initLabelCropPage();
  setupClientRouting();
}

/**
 * Public Label Crop & Sort Page Interactivity
 */
function initLabelCropPage() {
  const scrollBtn = document.getElementById('sbScrollToMeeshoTool');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const meeshoTool = document.getElementById('meeshoTool');
      if (meeshoTool) {
        meeshoTool.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/**
 * Login Screen Google Authentication Simulation
 */
function initLoginScreen() {
  const googleBtn = document.getElementById('sbGoogleLoginBtn');
  const btnText = document.getElementById('sbGoogleBtnText');
  if (!googleBtn) return;

  googleBtn.addEventListener('click', () => {
    if (googleBtn.classList.contains('loading')) return;
    googleBtn.classList.add('loading');
    if (btnText) btnText.textContent = 'Connecting Google Account...';

    setTimeout(() => {
      // Save authenticated seller state
      const mockUser = {
        name: 'Seller Account',
        email: 'seller@fcanalytics.in',
        loggedInAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('fc_user', JSON.stringify(mockUser));
      } catch (e) {}

      // Reset button
      googleBtn.classList.remove('loading');
      if (btnText) btnText.textContent = 'Continue with Google';

      // Redirect into Dashboard workspace
      navigateTo('dashboard');
    }, 600);
  });
}

/**
 * Feature Tab Switching
 */
function initFeatureTabs() {
  const tabButtons = document.querySelectorAll('.sb-tab-btn');
  const titleEl = document.getElementById('sbShowcaseTitle');
  const descEl = document.getElementById('sbShowcaseDesc');
  const listEl = document.getElementById('sbShowcaseBullets');
  const previewEl = document.getElementById('sbShowcasePreview');

  if (!tabButtons.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.dataset.tab;
      if (!tabKey || !FEATURE_TABS[tabKey]) return;

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const data = FEATURE_TABS[tabKey];
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.desc;
      if (listEl) {
        listEl.innerHTML = data.bullets.map(b => `
          <li><span class="sb-check-icon">✓</span> ${b}</li>
        `).join('');
      }
      if (previewEl) {
        previewEl.innerHTML = data.previewHtml;
      }
    });
  });
}

/**
 * FAQ Accordion Toggling
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.sb-faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.sb-faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close others
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/**
 * Live Interactive Meesho Profit Margin Calculator Widget
 */
function initProfitCalculator() {
  const priceInput = document.getElementById('calcSalePrice');
  const costInput = document.getElementById('calcProductCost');
  const shippingInput = document.getElementById('calcShippingCost');
  const commissionInput = document.getElementById('calcCommissionRate');
  const returnRateInput = document.getElementById('calcReturnRate');

  if (!priceInput) return;

  function calculate() {
    const salePrice = parseFloat(priceInput.value) || 0;
    const productCost = parseFloat(costInput.value) || 0;
    const shippingCost = parseFloat(shippingInput.value) || 0;
    const commissionPercent = parseFloat(commissionInput.value) || 0;
    const returnRatePercent = parseFloat(returnRateInput.value) || 0;

    // Platform Fee (Commission + GST on commission 18%)
    const commissionVal = salePrice * (commissionPercent / 100);
    const gstOnCommission = commissionVal * 0.18;
    const totalPlatformDeductions = commissionVal + gstOnCommission;

    // Shipping + 18% GST on shipping
    const shippingTotal = shippingCost * 1.18;

    // Net Payout per delivered order
    const netPayoutDelivered = salePrice - totalPlatformDeductions - shippingTotal;
    const profitOnDelivered = netPayoutDelivered - productCost;

    // Return Loss per RTO order (Usually shipping fee charged both ways or return penalty)
    const returnLossPerUnit = shippingCost * 1.5; // Average return logistics cost

    // Blended Unit Profit taking return rate into account
    const returnFraction = returnRatePercent / 100;
    const deliveredFraction = 1 - returnFraction;
    const blendedNetProfit = (profitOnDelivered * deliveredFraction) - (returnLossPerUnit * returnFraction);
    const netMarginPercent = salePrice > 0 ? (blendedNetProfit / salePrice) * 100 : 0;

    // Update DOM
    const elPlatformFee = document.getElementById('calcResPlatformFee');
    const elShippingFee = document.getElementById('calcResShippingFee');
    const elPayoutDelivered = document.getElementById('calcResPayoutDelivered');
    const elProfitDelivered = document.getElementById('calcResProfitDelivered');
    const elBlendedProfit = document.getElementById('calcResBlendedProfit');
    const elMarginPercent = document.getElementById('calcResMarginPercent');

    if (elPlatformFee) elPlatformFee.textContent = `₹${totalPlatformDeductions.toFixed(1)}`;
    if (elShippingFee) elShippingFee.textContent = `₹${shippingTotal.toFixed(1)}`;
    if (elPayoutDelivered) elPayoutDelivered.textContent = `₹${netPayoutDelivered.toFixed(1)}`;
    if (elProfitDelivered) elProfitDelivered.textContent = `₹${profitOnDelivered.toFixed(1)}`;
    
    if (elBlendedProfit) {
      elBlendedProfit.textContent = `₹${blendedNetProfit.toFixed(1)}`;
      elBlendedProfit.style.color = blendedNetProfit >= 0 ? '#10B981' : '#EF4444';
    }
    if (elMarginPercent) {
      elMarginPercent.textContent = `${netMarginPercent.toFixed(1)}%`;
      elMarginPercent.style.color = netMarginPercent >= 0 ? '#10B981' : '#EF4444';
    }
  }

  [priceInput, costInput, shippingInput, commissionInput, returnRateInput].forEach(inp => {
    inp?.addEventListener('input', calculate);
  });

  calculate();
}

/**
 * Mobile Drawer Menu
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('sbMobileMenuToggle');
  const navDrawer = document.getElementById('sbMobileDrawer');
  if (!toggleBtn || !navDrawer) return;

  toggleBtn.addEventListener('click', () => {
    navDrawer.classList.toggle('open');
  });

  const links = navDrawer.querySelectorAll('a, button');
  links.forEach(l => {
    l.addEventListener('click', () => {
      navDrawer.classList.remove('open');
    });
  });
}

/**
 * Universal Client Routing between Landing Page, Info Pages, Login Screen, & App Dashboard
 */
export function navigateTo(route) {
  const publicSite = document.getElementById('publicSite');
  const landingView = document.getElementById('landingView');
  const appLayout = document.getElementById('appLayout');
  const infoPageView = document.getElementById('infoPageView');
  const loginView = document.getElementById('loginView');
  const labelCropView = document.getElementById('labelCropView');
  const labelCropMeeshoView = document.getElementById('labelCropMeeshoView');
  const footer = document.querySelector('.sb-footer');

  if (!landingView || !appLayout) return;

  // Normalize info page routes
  const infoMap = {
    'about': 'about',
    'about-us': 'about',
    'privacy': 'privacy',
    'privacy-policy': 'privacy',
    'terms': 'terms',
    'terms-and-conditions': 'terms',
    'terms-conditions': 'terms',
    'cookies': 'cookies',
    'cookie-policy': 'cookies',
    'disclaimer': 'disclaimer',
    'contact': 'contact',
    'contact-us': 'contact'
  };

  if (route === 'dashboard' || route === 'app') {
    if (publicSite) publicSite.style.display = 'none';
    landingView.style.display = 'none';
    if (infoPageView) infoPageView.style.display = 'none';
    if (loginView) loginView.style.display = 'none';
    if (labelCropView) labelCropView.style.display = 'none';
    if (labelCropMeeshoView) labelCropMeeshoView.style.display = 'none';
    appLayout.style.display = 'flex';
    window.location.hash = 'dashboard';
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (route === 'label-sort-crop/meesho' || route === 'label-sort-crop-meesho' || route === 'labels/meesho' || route === 'label-sort' || route === 'labels') {
    // Dedicated Meesho Label Crop & Sort Page (sellerbox.in/label-sort-crop/meesho — No Login Required)
    mountLabelSorter('public');
    if (publicSite) publicSite.style.display = 'block';
    landingView.style.display = 'none';
    if (infoPageView) infoPageView.style.display = 'none';
    if (loginView) loginView.style.display = 'none';
    if (labelCropView) labelCropView.style.display = 'none';
    if (labelCropMeeshoView) labelCropMeeshoView.style.display = 'block';
    if (footer) footer.style.display = 'block';
    appLayout.style.display = 'none';
    window.location.hash = 'label-sort-crop/meesho';
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (route === 'label-sort-crop') {
    // Marketplace Selection Directory (sellerbox.in/label-sort-crop)
    if (publicSite) publicSite.style.display = 'block';
    landingView.style.display = 'none';
    if (infoPageView) infoPageView.style.display = 'none';
    if (loginView) loginView.style.display = 'none';
    if (labelCropView) labelCropView.style.display = 'block';
    if (labelCropMeeshoView) labelCropMeeshoView.style.display = 'none';
    if (footer) footer.style.display = 'block';
    appLayout.style.display = 'none';
    window.location.hash = 'label-sort-crop';
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (route === 'login' || route === 'signin') {
    // Dedicated Login / Authentication Screen (SellerBox Style)
    if (publicSite) publicSite.style.display = 'block';
    landingView.style.display = 'none';
    if (infoPageView) infoPageView.style.display = 'none';
    if (labelCropView) labelCropView.style.display = 'none';
    if (labelCropMeeshoView) labelCropMeeshoView.style.display = 'none';
    if (loginView) loginView.style.display = 'flex';
    if (footer) footer.style.display = 'none';
    appLayout.style.display = 'none';
    window.location.hash = 'login';
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (infoMap[route]) {
    // Dedicated Information Pages View
    const pageKey = infoMap[route];
    if (publicSite) publicSite.style.display = 'block';
    landingView.style.display = 'none';
    if (loginView) loginView.style.display = 'none';
    if (labelCropView) labelCropView.style.display = 'none';
    if (labelCropMeeshoView) labelCropMeeshoView.style.display = 'none';
    if (footer) footer.style.display = 'block';
    appLayout.style.display = 'none';
    if (infoPageView) {
      infoPageView.style.display = 'block';
      renderInfoPage(pageKey);
    }
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Landing page view
    if (publicSite) publicSite.style.display = 'block';
    if (infoPageView) infoPageView.style.display = 'none';
    if (loginView) loginView.style.display = 'none';
    if (labelCropView) labelCropView.style.display = 'none';
    if (labelCropMeeshoView) labelCropMeeshoView.style.display = 'none';
    if (footer) footer.style.display = 'block';
    landingView.style.display = 'block';
    appLayout.style.display = 'none';

    // Reset hash cleanly
    if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#home') {
      try {
        history.pushState(null, '', window.location.pathname + window.location.search);
      } catch (err) {
        window.location.hash = '';
      }
    }

    if (route && route !== 'home') {
      const targetEl = document.getElementById(route);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function setupClientRouting() {
  // Delegate clicks on any router triggers
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-sb-route]');
    if (target) {
      e.preventDefault();
      const route = target.getAttribute('data-sb-route');
      navigateTo(route);
    }
  });

  // Logo click → navigate to website home
  const sidebarLogo = document.getElementById('sidebarLogoHome');
  if (sidebarLogo) {
    sidebarLogo.addEventListener('click', (e) => {
      // Don't trigger if the mobile-close button inside was clicked
      if (e.target.closest('.mobile-sidebar-close')) return;
      navigateTo('home');
    });
    // Keyboard accessibility (Enter / Space)
    sidebarLogo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo('home');
      }
    });
  }

  // Handle browser back/forward and initial hash
  window.addEventListener('hashchange', handleHash);
  handleHash();
}

function handleHash() {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash === 'dashboard') {
    navigateTo('dashboard');
  } else if (hash === 'label-sort-crop/meesho' || hash === 'label-sort-crop-meesho' || hash === 'labels/meesho') {
    navigateTo('label-sort-crop/meesho');
  } else if (hash === 'label-sort-crop') {
    navigateTo('label-sort-crop');
  } else if (hash === 'label-sort' || hash === 'labels') {
    navigateTo('label-sort-crop/meesho');
  } else if (hash === 'login' || hash === 'signin') {
    navigateTo('login');
  } else if (hash === 'faq' || hash === 'calculator' || hash === 'features' || hash === 'steps') {
    navigateTo(hash);
  } else if (
    hash === 'about' || hash === 'about-us' ||
    hash === 'privacy' || hash === 'privacy-policy' ||
    hash === 'terms' || hash === 'terms-and-conditions' ||
    hash === 'cookies' || hash === 'cookie-policy' ||
    hash === 'disclaimer' ||
    hash === 'contact' || hash === 'contact-us'
  ) {
    navigateTo(hash);
  } else if (hash === 'home' || !hash) {
    navigateTo('home');
  }
}
