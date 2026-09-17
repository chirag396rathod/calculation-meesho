/**
 * ══════════════════════════════════════════════════════════════════════
 * MOTION-PRIMITIVES RUNTIME SUITE FOR FC ANALYTICS
 * Powered by official 'motion' (Framer Motion core engine)
 * - Scroll Reading Progress Bar (motion/scroll)
 * - In-View Stagger Animations (motion/inView & motion/stagger)
 * - Animated Number Count-Up (motion/animate)
 * - Interactive Spotlight Glow
 * - 3D Perspective Tilt with Motion Spring Reset
 * - Magnetic Buttons Proximity
 * - Dynamic Morphing Text Loop
 * ══════════════════════════════════════════════════════════════════════
 */

import { animate, scroll, inView, stagger } from 'motion';

export function initMotionPrimitives() {
  if (window.__fcMotionInitialized) return;
  window.__fcMotionInitialized = true;

  try {
    initScrollProgress();
    initInViewStagger();
    initAnimatedNumbers();
    initSpotlight();
    initTilt();
    initMagneticButtons();
    initTextLoop();
    initButtonMotion();
  } catch (err) {
    console.warn('[MotionPrimitives] Initialization error:', err);
  }
}

/**
 * 1. Scroll Progress Bar (/docs/scroll-progress)
 * Uses Framer Motion's scroll driver
 */
function initScrollProgress() {
  const progressBar = document.getElementById('scrollProgressBar');
  if (!progressBar) return;

  scroll((progress) => {
    progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
  });
}

/**
 * 2. In-View Stagger Entrance (/docs/in-view, /docs/animated-group)
 * Uses Framer Motion inView and stagger
 */
function initInViewStagger() {
  const groups = document.querySelectorAll('.motion-in-view-group');
  if (groups.length === 0) return;

  inView('.motion-in-view-group', (element) => {
    const children = element.querySelectorAll('.motion-stagger-item');
    if (children.length > 0) {
      animate(
        children,
        {
          opacity: [0.5, 1],
          transform: ['translateY(18px)', 'translateY(0px)']
        },
        {
          duration: 0.55,
          delay: stagger(0.07),
          easing: [0.16, 1, 0.3, 1]
        }
      );
    }
  }, { amount: 0.05 });
}

/**
 * 3. Animated Number Count-Up (/docs/animated-number, /docs/sliding-number)
 * Uses Framer Motion animate and inView
 */
function initAnimatedNumbers() {
  const countElements = document.querySelectorAll('[data-motion-count]');
  if (countElements.length === 0) return;

  inView('[data-motion-count]', (element) => {
    const targetVal = parseFloat(element.getAttribute('data-motion-count') || '0');
    const prefix = element.getAttribute('data-motion-prefix') || '';
    const suffix = element.getAttribute('data-motion-suffix') || '';
    const decimals = parseInt(element.getAttribute('data-motion-decimals') || '0', 10);
    const duration = parseFloat(element.getAttribute('data-motion-duration') || '1.6');

    animate(0, targetVal, {
      duration,
      easing: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        const formatted = latest.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
        element.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
  }, { amount: 0.2 });
}

/**
 * 4. Spotlight Glow Effect (/docs/spotlight, /docs/glow-effect)
 */
function initSpotlight() {
  const elements = document.querySelectorAll('[data-motion-spotlight]');
  elements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--mouse-x', '-999px');
      el.style.setProperty('--mouse-y', '-999px');
    });
  });
}

/**
 * 5. 3D Perspective Tilt (/docs/tilt)
 */
function initTilt() {
  const tiltElements = document.querySelectorAll('[data-motion-tilt]');

  tiltElements.forEach(el => {
    const maxTilt = parseFloat(el.getAttribute('data-tilt-max') || '7');

    el.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;

      const rotateX = -(deltaY * maxTilt).toFixed(2);
      const rotateY = (deltaX * maxTilt).toFixed(2);

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      // Spring back smoothly via Framer Motion animate
      animate(
        el,
        { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' },
        { duration: 0.45, easing: [0.25, 1, 0.5, 1] }
      );
    });
  });
}

/**
 * 6. Magnetic Button Pull (/docs/magnetic)
 */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('[data-motion-magnetic]');
  buttons.forEach(btn => {
    const pullStrength = 0.25;

    btn.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) * pullStrength;
      const y = (e.clientY - (rect.top + rect.height / 2)) * pullStrength;

      btn.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      animate(
        btn,
        { transform: 'translate3d(0px, 0px, 0px)' },
        { duration: 0.4, easing: [0.25, 1, 0.5, 1] }
      );
    });
  });
}

/**
 * 7. Dynamic Text Loop (/docs/text-loop, /docs/text-roll)
 */
function initTextLoop() {
  const track = document.querySelector('.motion-text-loop-track');
  if (!track) return;

  const items = track.querySelectorAll('.motion-text-loop-item');
  if (items.length <= 1) return;

  let currentIndex = 0;
  const total = items.length;

  items[0].classList.add('active');

  setInterval(() => {
    items[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % total;

    animate(
      track,
      { transform: `translateY(-${currentIndex * 1.25}em)` },
      { duration: 0.65, easing: [0.16, 1, 0.3, 1] }
    );

    items[currentIndex].classList.add('active');
  }, 3200);
}

/**
 * 8. Dashboard Button Ripple & Tactile Motion (/docs/button-motion)
 */
function initButtonMotion() {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest(
      '.btn, .welcome-action-btn, .sidebar-logout-btn, .session-card .btn, .nav-item, .sb-btn'
    );
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    
    const size = Math.max(rect.width, rect.height) * 1.2;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }, { passive: true });
}

