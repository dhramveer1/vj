// assets/script.js - robust drawer open/close with forced reflow, focus-trap, pointer sync
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  try {
    const hamburgerBtn = $('#hamburgerBtn');
    const drawer = $('#mobileDrawer');
    const overlay = $('#drawerOverlay');
    const drawerCloseBtn = $('#drawerCloseBtn');
    const fab = document.querySelector('.fab-whatsapp');

    function log(...args){ if(window && window.console) console.log('[site]', ...args); }
    function warn(...args){ if(window && window.console) console.warn('[site]', ...args); }
    function reflow(el){ try { return el && el.offsetWidth; } catch(e) { return 0; } }

    function getFocusable(container){
      if(!container) return [];
      try {
        return Array.from(container.querySelectorAll('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])'))
          .filter(el => el.offsetParent !== null);
      } catch (e) {
        warn('getFocusable error', e);
        return [];
      }
    }

    // Tab trap
    function trapTabKey(e){
      if(!drawer || !drawer.classList.contains('open')) return;
      if(e.key === 'Escape'){ e.preventDefault(); closeDrawer(); return; }
      if(e.key !== 'Tab') return;

      const focusables = getFocusable(drawer);
      if(!focusables.length){ e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if(e.shiftKey){
        if(document.activeElement === first || document.activeElement === drawer){ e.preventDefault(); last.focus(); }
      } else {
        if(document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    }

    function openDrawer(){
      try {
        if(!drawer || !overlay){ warn('open aborted - missing elements'); return; }

        try { drawer.removeAttribute('hidden'); overlay.removeAttribute('hidden'); } catch(e){}

        overlay.setAttribute('aria-hidden','false');
        drawer.setAttribute('aria-hidden','false');

        reflow(overlay); reflow(drawer);
        overlay.classList.add('open');
        requestAnimationFrame(() => { drawer.classList.add('open'); });

        if(hamburgerBtn){ hamburgerBtn.classList.add('open'); hamburgerBtn.setAttribute('aria-expanded','true'); }
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        if(fab) fab.style.zIndex = 1700;

        setTimeout(() => {
          try {
            const foc = getFocusable(drawer);
            if(foc.length) foc[0].focus();
            else if(drawerCloseBtn) drawerCloseBtn.focus();
            log('drawer opened');
          } catch (e) { warn('focus failed after open', e); }
        }, 140);

        document.addEventListener('keydown', trapTabKey);
      } catch (err) {
        warn('openDrawer error', err);
      }
    }

    function closeDrawer(){
      try {
        if(!drawer || !overlay){ warn('close aborted - missing elements'); return; }

        overlay.classList.remove('open');
        drawer.classList.remove('open');

        overlay.setAttribute('aria-hidden','true');
        drawer.setAttribute('aria-hidden','true');

        if(hamburgerBtn){ hamburgerBtn.classList.remove('open'); hamburgerBtn.setAttribute('aria-expanded','false'); hamburgerBtn.focus(); }

        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';

        document.removeEventListener('keydown', trapTabKey);

        setTimeout(() => {
          try {
            overlay.style.pointerEvents = 'none';
            try { drawer.setAttribute('hidden',''); overlay.setAttribute('hidden',''); } catch(e){}
            log('drawer fully closed');
          } catch (e) { warn('post-close cleanup error', e); }
        }, 360);
      } catch (err) {
        warn('closeDrawer error', err);
      }
    }

    function initOverlayPointerSync(){
      if(!overlay) return;
      try {
        const mo = new MutationObserver(() => {
          if(overlay.classList.contains('open')) overlay.style.pointerEvents = 'auto';
          else setTimeout(()=>{ if(!overlay.classList.contains('open')) overlay.style.pointerEvents = 'none'; }, 260);
        });
        mo.observe(overlay, { attributes: true, attributeFilter: ['class'] });
      } catch(e){ /* ignore */ }
    }

    // init
    (function init(){
      try {
        if(overlay && !overlay.classList.contains('open')) overlay.style.pointerEvents = 'none';

        if(hamburgerBtn){
          hamburgerBtn.addEventListener('click', () => {
            const isOpen = hamburgerBtn.classList.contains('open');
            if(isOpen) closeDrawer(); else openDrawer();
          });
        } else {
          log('hamburgerBtn missing');
        }

        if(overlay) overlay.addEventListener('click', closeDrawer);
        if(drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);

        document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') closeDrawer(); });

        if(fab) fab.style.zIndex = 1700;

        // AOS init if available (safe)
        try {
          if(window.AOS && typeof window.AOS.init === 'function'){
            window.AOS.init({ duration: 700, easing: 'ease-out-cubic' });
            log('AOS initialized');
          }
        } catch(e) { /* ignore AOS init errors */ }

        // safety unhide small pass
        setTimeout(() => {
          try {
            ['main', '.hero', '.hero-content', '.profile-card', '.section', '.container'].forEach(sel => {
              $$(sel).forEach(el => {
                if(!el) return;
                try {
                  const s = el.style || {};
                  if(s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0'){
                    s.display = ''; s.visibility = ''; s.opacity = '';
                    log('safetyUnhide applied', sel);
                  }
                } catch (e) {}
              });
            });
          } catch(e){}
        }, 300);

        initOverlayPointerSync();
        log('listeners attached');
      } catch(e){
        warn('init error', e);
      }
    })();
  } catch (topErr) {
    console.error('[site] fatal init error', topErr);
  }
})();
