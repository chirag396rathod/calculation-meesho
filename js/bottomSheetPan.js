/**
 * Bottom Sheet Touch & Pan-to-Dismiss Gesture System
 * Provides native iOS/Android style swipe-down drag physics for modals on mobile viewports.
 */

export function initBottomSheetPan() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => attachPanToModal(modal));

  // Also monitor DOM for any newly added modals or class changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('modal-overlay')) {
          const innerModal = target.querySelector('.modal');
          if (innerModal) {
            // When opening, reset any lingering drag transforms
            if (target.classList.contains('active')) {
              innerModal.style.transform = '';
              innerModal.style.transition = '';
              target.style.backgroundColor = '';
            }
          }
        }
      }
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    observer.observe(overlay, { attributes: true });
  });
}

function attachPanToModal(modal) {
  if (modal._hasBottomSheetPan) return;
  modal._hasBottomSheetPan = true;

  const overlay = modal.closest('.modal-overlay');
  if (!overlay) return;

  let startY = 0;
  let currentY = 0;
  let startX = 0;
  let startTime = 0;
  let isDragging = false;
  let startScrollTop = 0;
  let sheetHeight = 0;
  let canDrag = false;

  modal.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 768) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    startY = touch.clientY;
    currentY = touch.clientY;
    startX = touch.clientX;
    startTime = Date.now();
    startScrollTop = modal.scrollTop;
    sheetHeight = modal.getBoundingClientRect().height || 400;
    isDragging = false;
    canDrag = false;

    // Allow drag if user touches drag handle, modal header, or if scrolled to top
    const target = e.target;
    const isHandle = target.closest('.bottom-sheet-handle') || target.classList.contains('bottom-sheet-handle');
    const isHeader = target.closest('.modal-header');

    if (isHandle || isHeader || startScrollTop <= 0) {
      canDrag = true;
    }
  }, { passive: true });

  modal.addEventListener('touchmove', (e) => {
    if (!canDrag || window.innerWidth > 768) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    currentY = touch.clientY;
    const deltaY = currentY - startY;
    const deltaX = touch.clientX - startX;

    // If moving mostly horizontally, ignore
    if (!isDragging && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      canDrag = false;
      return;
    }

    // If content is scrolled down and user is scrolling up, let native scroll happen
    if (modal.scrollTop > 2 && deltaY < 0) {
      return;
    }

    // If dragging downward and scrolled at top
    if (deltaY > 0 && modal.scrollTop <= 0) {
      isDragging = true;
      if (e.cancelable) e.preventDefault();

      modal.style.transition = 'none';
      modal.style.transform = `translateY(${deltaY}px)`;

      // Smoothly reduce overlay opacity as sheet is pulled down
      const progress = Math.min(deltaY / sheetHeight, 0.85);
      const bgAlpha = Math.max(0.08, 0.65 * (1 - progress));
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${bgAlpha})`;
    } else if (deltaY < 0 && isDragging) {
      // Elastic resistance if pulled upward
      const dampedY = deltaY * 0.18;
      modal.style.transform = `translateY(${dampedY}px)`;
    }
  }, { passive: false });

  const endDrag = (e) => {
    if (!isDragging || window.innerWidth > 768) {
      canDrag = false;
      isDragging = false;
      return;
    }

    const deltaY = currentY - startY;
    const elapsed = Math.max(Date.now() - startTime, 1);
    const velocityY = deltaY / elapsed; // px per ms

    const threshold = Math.min(sheetHeight * 0.28, 100);
    const shouldDismiss = deltaY > threshold || (velocityY > 0.45 && deltaY > 35);

    if (shouldDismiss) {
      // Smooth dismiss animation down
      modal.style.transition = 'transform 0.25s cubic-bezier(0.32, 1, 0.23, 1)';
      modal.style.transform = 'translateY(100%)';
      overlay.style.transition = 'opacity 0.25s ease, background-color 0.25s ease';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';

      setTimeout(() => {
        overlay.classList.remove('active');
        modal.style.transform = '';
        modal.style.transition = '';
        overlay.style.backgroundColor = '';
        overlay.style.transition = '';
      }, 250);
    } else {
      // Snap back smoothly
      modal.style.transition = 'transform 0.22s cubic-bezier(0.32, 1, 0.23, 1)';
      modal.style.transform = 'translateY(0)';
      overlay.style.transition = 'background-color 0.22s ease';
      overlay.style.backgroundColor = '';

      setTimeout(() => {
        modal.style.transform = '';
        modal.style.transition = '';
        overlay.style.transition = '';
      }, 220);
    }

    isDragging = false;
    canDrag = false;
  };

  modal.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      currentY = e.changedTouches[0].clientY;
    }
    endDrag(e);
  }, { passive: true });

  modal.addEventListener('touchcancel', endDrag, { passive: true });
}
