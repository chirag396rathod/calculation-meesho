/**
 * FC Analytics — Information Pages Component & Content Router
 * Pages: About Us, Privacy Policy, Terms & Conditions, Cookie Policy, Disclaimer, Contact Us
 */
import { navigateTo } from './landing.js';

export const INFO_PAGES = {
  about: {
    id: 'about',
    title: 'About FC Analytics',
    badge: 'Made in India for E-Commerce Sellers',
    subtitle: 'Built by sellers and engineers, for sellers who want complete operational clarity without spreadsheet chaos.',
    meta: [
      { label: 'Built For', value: 'Meesho, Amazon, Flipkart' },
      { label: 'Security', value: 'Private & Secure' },
      { label: 'Version', value: 'v2.4' }
    ],
    render: () => `
      <h2>Our Story: Born from Real Seller Pain</h2>
      <p>FC Analytics began with a very practical problem: calculating estimated profit and loss from marketplace files was harder than it should be. Settlement sheets were cluttered with complex deductions, courier returns ate away margins invisibly, and simple questions like <em>"Which SKU is actually making me money after all return charges and raw costs?"</em> took hours of manual Excel wrangling.</p>
      
      <p>As sellers and software engineers, we built a focused tool that parses Meesho payment Excel sheets and raw shipping labels in seconds, outputting crystal-clear net margins, SKU breakdown, and 3x faster thermal dispatch. Seeing how much time it saved our own warehouse operations, we made it freely available for fellow Indian e-commerce merchants.</p>

      <h2>What We Believe</h2>
      <p>A seller should not need to become an Excel macro programmer just to understand their net profit, crop thermal labels, or verify return charges. FC Analytics brings these critical daily tasks into one clean, lightning-fast workspace.</p>

      <div class="about-features-grid">
        <div class="about-feature-item">
          <div class="about-feature-icon">📊</div>
          <h3>Clearer Numbers</h3>
          <p>Upload your settlement reports and instantly see real SKU-level net profits after deducting return charges, advertising costs, and raw materials.</p>
        </div>

        <div class="about-feature-item">
          <div class="about-feature-icon">🏷️</div>
          <h3>Faster Thermal Dispatch</h3>
          <p>Auto-separate multi-page label PDFs, crop away unwanted invoice tables below product details, and auto-group orders by courier partner (Xpress Bees, Valmo, Shadowfax, Delhivery).</p>
        </div>

        <div class="about-feature-item">
          <div class="about-feature-icon">🔒</div>
          <h3>Strict Privacy & Ownership</h3>
          <p>Your sales volume, SKU catalogs, and customer data are handled with rigorous security standards. Your business data belongs exclusively to you.</p>
        </div>

        <div class="about-feature-item">
          <div class="about-feature-icon">📁</div>
          <h3>Monthly Historical Tracking</h3>
          <p>Save monthly datasets (e.g. July 2026, August 2026) directly to compare month-over-month performance and margin trends.</p>
        </div>
      </div>

      <h2>Platform Support & Roadmap</h2>
      <ul>
        <li><strong>Meesho:</strong> Full operational suite live today — 4×4 thermal cropping, courier separation, custom messages, QR codes, profit calculator, and payment reconciliation.</li>
        <li><strong>Amazon & Flipkart:</strong> Specialized thermal label cropping, courier grouping, and SKU reconciliation tools currently in active development (Coming Soon).</li>
      </ul>

      <div style="margin-top: 32px; display: flex; gap: 14px; flex-wrap: wrap;">
        <button class="sb-btn sb-btn-primary" data-sb-route="dashboard">Launch Free Dashboard →</button>
        <button class="sb-btn sb-btn-outline" data-sb-route="label-sort">🏷️ Try Label Sorter</button>
      </div>
    `
  },

  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    badge: 'Your Privacy Is Our Priority',
    subtitle: 'Learn how FC Analytics protects your data, maintains enterprise security, and processes your business records with complete confidentiality.',
    meta: [
      { label: 'Effective Date', value: 'March 1, 2026' },
      { label: 'Version', value: '1.0' },
      { label: 'Last Updated', value: 'March 2026' }
    ],
    render: () => `
      <p>At FC Analytics, we are committed to protecting your privacy and ensuring the security of your personal and business data. This Privacy Policy explains how we handle information when you use our platform, shipping label sorter, and earnings calculators.</p>
      
      <p>By using FC Analytics, you consent to the practices described in this Privacy Policy. This policy should be read alongside our Terms and Conditions.</p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Information Processed</h3>
      <p>When you use FC Analytics to analyze payments or crop shipping labels, the following information is processed for your account and workspace:</p>
      <ul>
        <li><strong>Marketplace Reports:</strong> Excel sheets, order IDs, SKU identifiers, customer delivery states, sale prices, and settlement fees.</li>
        <li><strong>PDF Shipping Labels:</strong> Courier tracking barcodes, AWB numbers, customer addresses, and order invoices.</li>
        <li><strong>Costing Inputs:</strong> Custom SKU raw material costs, monthly overheads, and advertising spends entered by you.</li>
      </ul>

      <h3>1.2 Diagnostic & Analytics Data</h3>
      <p>To improve platform performance, identify crashes, and ensure browser compatibility, our website may collect minimal, non-identifiable technical metrics (browser type, screen resolution, operating system, and error logs).</p>

      <h2>2. Data Processing & Security Architecture</h2>
      <p>We prioritize security and privacy across all features:</p>
      <ul>
        <li><strong>Fast & Isolated Processing:</strong> PDF parsing, label cropping, and financial computations execute with isolated processes designed for optimal performance.</li>
        <li><strong>Confidential Financial Aggregations:</strong> Calculations and summaries are stored securely and remain accessible exclusively to you.</li>
        <li><strong>We do not sell, rent, or trade</strong> your business data, sales volumes, or customer lists to any third party for marketing or advertising purposes.</li>
      </ul>

      <h2>3. Data Storage & Persistence</h2>
      <p>When you use the "Save Session" feature to store monthly datasets (e.g. July 2026 Master Session), records are persisted securely for your workspace. You have full control to clear, export, or delete any session at any time with one click.</p>

      <h2>4. Cookies & Local Storage</h2>
      <p>We use minimal cookies and local storage tokens exclusively to remember your UI preferences (light/dark theme), active session selection, and temporary sorting presets.</p>

      <h2>5. Your Rights & Data Control</h2>
      <p>You have full ownership of your data at all times. You can:</p>
      <ul>
        <li>Export your aggregated reports and SKU cost tables to Excel / CSV format.</li>
        <li>Clear all stored monthly sessions and SKU groups directly from the dashboard settings.</li>
        <li>Request assistance regarding data handling by contacting our support team.</li>
      </ul>

      <h2>6. Contact & Grievance Redressal</h2>
      <p>If you have any questions or concerns regarding our privacy practices, please reach out to:</p>
      <ul>
        <li><strong>Email:</strong> privacy@fcanalytics.in</li>
        <li><strong>WhatsApp Support:</strong> +91 7069051397</li>
        <li><strong>Location:</strong> Surat, Gujarat, India</li>
      </ul>
    `
  },

  terms: {
    id: 'terms',
    title: 'Terms & Conditions',
    badge: 'Terms of Service',
    subtitle: 'Please read these terms and conditions carefully before using the FC Analytics platform and label tools.',
    meta: [
      { label: 'Effective Date', value: 'March 1, 2026' },
      { label: 'Version', value: '1.0' },
      { label: 'Jurisdiction', value: 'India' }
    ],
    render: () => `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using FC Analytics (the "Platform"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not use our services.</p>

      <h2>2. Description of Services</h2>
      <p>FC Analytics provides operational software tools for e-commerce sellers, including:</p>
      <ul>
        <li>Shipping label cropping, margin trimming, and courier grouping (Meesho, Amazon, Flipkart).</li>
        <li>Custom thermal message insertion and dynamic QR code generation.</li>
        <li>SKU profitability analysis and marketplace settlement reconciliation.</li>
        <li>Monthly session management and exportable business summaries.</li>
      </ul>

      <h2>3. User Responsibilities & Acceptable Use</h2>
      <p>You agree to use FC Analytics only for lawful business operations and in compliance with all applicable e-commerce policies. You agree not to:</p>
      <ul>
        <li>Upload malicious files, corrupted PDFs, or scripts intended to disrupt platform stability.</li>
        <li>Attempt to reverse-engineer or tamper with the local processing algorithms.</li>
        <li>Misrepresent order records or use the tools for fraudulent shipping practices.</li>
      </ul>

      <h2>4. Intellectual Property</h2>
      <p>The design, code, logos, layout, and visual styling of FC Analytics are the proprietary intellectual property of the FC Analytics team. All trademarks, marketplace brand names (Meesho, Amazon, Flipkart, Xpress Bees, Delhivery, etc.) belong to their respective registered owners and are mentioned strictly for compatibility identification purposes.</p>

      <h2>5. Limitation of Liability</h2>
      <p>FC Analytics provides calculations, return charge deductions, and label crops as operational aids based on your input files and formulas. While we maintain rigorous precision, the Platform is provided "as is" without warranty of any kind. Sellers should verify high-value tax figures with certified accountants for official GST filing.</p>

      <h2>6. Modifications to Terms</h2>
      <p>We reserve the right to revise or update these Terms at any time. Changes will be reflected with the updated date at the top of this page. Continued use of the Platform after changes constitutes agreement to the updated terms.</p>
    `
  },

  cookies: {
    id: 'cookies',
    title: 'Cookie Policy',
    badge: 'Cookie & Storage Information',
    subtitle: 'Information about how FC Analytics uses cookies and browser local storage to deliver a seamless user experience.',
    meta: [
      { label: 'Effective Date', value: 'March 1, 2026' },
      { label: 'Applies To', value: 'Web & Dashboard' }
    ],
    render: () => `
      <h2>1. What Are Cookies & Local Storage?</h2>
      <p>Cookies and browser local storage are small text files or key-value data stored on your computer or mobile device when you visit websites. They help web applications remember your choices and provide responsive performance.</p>

      <h2>2. How FC Analytics Uses Storage</h2>
      <p>We believe in minimal, purposeful storage. We use local storage strictly for:</p>
      <ul>
        <li><strong>Essential Workspace Preferences:</strong> Remembering your active session, recent order filters, and table sorting directions.</li>
        <li><strong>Theme & Appearance:</strong> Remembering your light theme or layout preferences.</li>
        <li><strong>Offline Local Database:</strong> Caching your saved monthly sessions and SKU cost inputs so you can access your business insights without needing constant internet re-uploads.</li>
      </ul>

      <h2>3. Third-Party Tracking</h2>
      <p>FC Analytics <strong>does not</strong> use invasive third-party tracking pixels or commercial ad retargeting cookies. Your browsing behavior across other websites is never tracked by us.</p>

      <h2>4. Managing Cookies in Your Browser</h2>
      <p>You can control or clear cookies and local storage through your browser settings (Chrome, Safari, Firefox, Edge). Please note that clearing local storage will remove saved offline monthly sessions on that device.</p>
    `
  },

  disclaimer: {
    id: 'disclaimer',
    title: 'Disclaimer',
    badge: 'Operational & Financial Disclosure',
    subtitle: 'Important disclosures regarding marketplace affiliations, profit calculation estimations, and tax reconciliations.',
    meta: [
      { label: 'Category', value: 'Legal Notice' },
      { label: 'Last Updated', value: 'March 2026' }
    ],
    render: () => `
      <h2>1. Independent Software Platform</h2>
      <p>FC Analytics is an independent e-commerce operational tool built for online sellers. <strong>FC Analytics is not affiliated with, endorsed by, sponsored by, or an official partner of Meesho (Fashnear Technologies Pvt. Ltd.), Amazon (Amazon Seller Services Pvt. Ltd.), or Flipkart (Flipkart Internet Pvt. Ltd.).</strong> All brand names, trade names, and logos are used strictly under fair-use for operational compatibility identification.</p>

      <h2>2. Financial & Accounting Disclaimer</h2>
      <p>All calculations, net profit estimates, RTO charge estimations, blended margins, and courier cost summaries generated by FC Analytics are computed based on the formulas and Excel files uploaded by the user. They are intended for operational clarity and managerial decision-making.</p>
      
      <div class="info-highlight-box">
        <strong>⚠️ Tax & Legal Advice:</strong> FC Analytics does not provide certified legal, financial, or tax advice. For official statutory GST filings, tax audits, and legal disputes, please consult a qualified Chartered Accountant (CA) or tax professional.
      </div>

      <h2>3. Shipping Label & Courier Partner Disclaimer</h2>
      <p>The label sorting and cropping features format PDFs based on standard courier dimensions (such as 4×4 inch thermal formats). Sellers are responsible for ensuring that generated thermal labels comply with their specific logistics partner's barcode scanning requirements before dispatching bulk inventory.</p>
    `
  },

  contact: {
    id: 'contact',
    title: 'Contact Us',
    badge: 'We Are Here to Help You',
    subtitle: 'Have a question about label cropping, profit formulas, or custom features? Chat with our team anytime.',
    meta: [
      { label: 'Support Hours', value: 'Mon - Sat, 9:30 AM - 7:00 PM IST' },
      { label: 'Response Time', value: 'Under 15 Minutes on WhatsApp' }
    ],
    render: () => `
      <div class="contact-layout">
        <!-- Contact Information -->
        <div class="contact-card-info">
          <h3>Get in Touch Directly</h3>
          <p>We work directly with Indian e-commerce sellers every single day. Reach out for prompt support, feature requests, or troubleshooting.</p>

          <div class="contact-methods-list">
            <div class="contact-method-item">
              <div class="contact-method-icon">💬</div>
              <div class="contact-method-text">
                <strong>WhatsApp Live Support</strong>
                <a href="https://api.whatsapp.com/send?phone=917069051397&text=Hi+FC+Analytics+Support" target="_blank">+91 7069051397 (Instant Chat)</a>
              </div>
            </div>

            <div class="contact-method-item">
              <div class="contact-method-icon">✉️</div>
              <div class="contact-method-text">
                <strong>Email Helpdesk</strong>
                <a href="mailto:support@fcanalytics.in">support@fcanalytics.in</a>
              </div>
            </div>

            <div class="contact-method-item">
              <div class="contact-method-icon">📍</div>
              <div class="contact-method-text">
                <strong>Operational Center</strong>
                <span>Surat, Gujarat, India</span>
              </div>
            </div>

            <div class="contact-method-item">
              <div class="contact-method-icon">⏰</div>
              <div class="contact-method-text">
                <strong>Working Hours</strong>
                <span>Monday – Saturday: 9:30 AM – 7:00 PM IST</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 24px;">
            <a href="https://api.whatsapp.com/send?phone=917069051397&text=Hi+I+need+help+with+FC+Analytics" target="_blank" class="sb-btn sb-btn-primary" style="width: 100%; text-decoration: none; justify-content: center;">
              💬 Chat on WhatsApp Now
            </a>
          </div>
        </div>

        <!-- Interactive Inquiry Form -->
        <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px;">
          <h3 style="font-family: 'Raleway', sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Send Us a Message</h3>
          <p style="color: #6B7280; font-size: 0.88rem; margin-bottom: 20px;">Fill out the details below and our team will get back to you promptly.</p>

          <form id="contactForm" class="contact-form-wrap">
            <div class="contact-form-group">
              <label>Your Name *</label>
              <input type="text" id="contactName" placeholder="e.g. Ramesh Patel" required>
            </div>

            <div class="contact-form-group">
              <label>WhatsApp / Phone Number *</label>
              <input type="tel" id="contactPhone" placeholder="e.g. +91 98765 43210" required>
            </div>

            <div class="contact-form-group">
              <label>Topic / Inquiry *</label>
              <select id="contactTopic">
                <option value="General Question">General Question</option>
                <option value="Label Sorting & Cropping">Label Sorting & Cropping Help</option>
                <option value="SKU Costing & Formulas">SKU Profit Calculator & Costing</option>
                <option value="Feature Request">Request a New Feature</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="contact-form-group">
              <label>Your Message *</label>
              <textarea id="contactMessage" rows="4" placeholder="How can we assist your seller workflow?" required></textarea>
            </div>

            <div id="contactFormStatus" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 0.86rem; font-weight: 500;"></div>

            <button type="submit" class="sb-btn sb-btn-primary" style="width: 100%; justify-content: center;">
              ✉️ Send Message
            </button>
          </form>
        </div>
      </div>
    `
  }
};

/**
 * Render an Information Page by key ('about', 'privacy', 'terms', 'cookies', 'disclaimer', 'contact')
 */
export function renderInfoPage(pageKey = 'about') {
  const page = INFO_PAGES[pageKey] || INFO_PAGES.about;
  const container = document.getElementById('infoPageView');
  if (!container) return;

  const tabsHtml = Object.keys(INFO_PAGES).map(k => {
    const p = INFO_PAGES[k];
    const isActive = k === pageKey ? 'active' : '';
    const icons = {
      about: 'ℹ️',
      privacy: '🔒',
      terms: '📜',
      cookies: '🍪',
      disclaimer: '⚖️',
      contact: '💬'
    };
    return `<button class="info-tab-btn ${isActive}" data-info-tab="${k}">${icons[k] || '📄'} ${p.title}</button>`;
  }).join('');

  const metaHtml = page.meta.map(m => `
    <div class="info-meta-chip">
      <strong>${m.label}:</strong>
      <span>${m.value}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <!-- Top Hero -->
    <div class="info-hero-banner">
      <div class="info-hero-container">
        <div class="info-pill-badge">
          <span>✨</span>
          <span>${page.badge}</span>
        </div>
        <h1 class="info-hero-title">${page.title}</h1>
        <p class="info-hero-subtitle">${page.subtitle}</p>
        <div class="info-meta-chips">${metaHtml}</div>
      </div>
    </div>

    <!-- Sticky Nav Bar -->
    <div class="info-nav-bar">
      <div class="info-nav-inner">
        <div class="info-nav-tabs">
          ${tabsHtml}
        </div>
      </div>
    </div>

    <!-- Article Content -->
    <div class="info-body-container">
      <article class="info-article-card">
        ${page.render()}
      </article>
    </div>
  `;

  // Bind tab switching
  container.querySelectorAll('[data-info-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabKey = btn.dataset.infoTab;
      window.location.hash = `#${tabKey}`;
      renderInfoPage(tabKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Bind contact form if present
  const form = container.querySelector('#contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value || '';
      const phone = document.getElementById('contactPhone')?.value || '';
      const topic = document.getElementById('contactTopic')?.value || '';
      const message = document.getElementById('contactMessage')?.value || '';

      const statusEl = document.getElementById('contactFormStatus');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = '#ECFDF5';
        statusEl.style.color = '#065F46';
        statusEl.style.border = '1px solid #A7F3D0';
        statusEl.innerHTML = `✅ Thank you, ${name}! Your inquiry has been received. Opening WhatsApp to connect directly with our support team...`;
      }

      // Open WhatsApp pre-filled
      const waMsg = encodeURIComponent(`Hello FC Analytics Team,\n\nName: ${name}\nPhone: ${phone}\nTopic: ${topic}\nMessage: ${message}`);
      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?phone=917069051397&text=${waMsg}`, '_blank');
      }, 800);
    });
  }
}
