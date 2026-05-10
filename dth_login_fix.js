(function(){
  'use strict';

  /* ── 1. Robust _adjustScrollArea ── */
  function _robustAdjust(){
    var sa  = document.getElementById('page-scroll-area');
    var hdr = document.getElementById('main-header');
    if(!sa) return;
    var hH = hdr ? hdr.getBoundingClientRect().height : 0;
    if(hH < 60) hH = hdr ? hdr.offsetHeight : 120;
    if(hH < 60) hH = 120;
    sa.style.top = hH + 'px';
    sa.style.position = 'absolute';
    sa.style.left = '0';
    sa.style.right = '0';
    sa.style.bottom = '0';
    sa.style.overflowY = 'scroll';
    sa.style.webkitOverflowScrolling = 'touch';
  }

  /* Override the built-in _adjustScrollArea */
  var _origAdj = window._adjustScrollArea;
  window._adjustScrollArea = function(){
    if(_origAdj) _origAdj();
    _robustAdjust();
  };

  /* ── 2. After-login fixer ── */
  var _fixRan = false;
  function _fixAfterLogin(){
    _fixRan = true;
    var delays = [0, 80, 200, 400, 800, 1400, 2200];
    delays.forEach(function(d){
      setTimeout(function(){
        try{
          _robustAdjust();
          /* Ensure at least one page is active */
          var pages = document.querySelectorAll('#page-scroll-area .page');
          var anyActive = false;
          pages.forEach(function(p){ if(p.classList.contains('active')) anyActive = true; });
          if(!anyActive){
            var home = document.getElementById('page-home');
            if(home) home.classList.add('active');
          }
          /* Re-render */
          if(window._renderAllNow) window._renderAllNow();
          if(window.updateRateDisplay) window.updateRateDisplay();
          if(window.refreshWalletSelect) window.refreshWalletSelect();
          if(window.renderCashPending) window.renderCashPending();
        }catch(e){}
      }, d);
    });
  }

  /* ── 3. Watch #app visibility via MutationObserver ── */
  function _watchApp(){
    var ap = document.getElementById('app');
    if(!ap){ setTimeout(_watchApp, 200); return; }

    /* Already visible on page load (session restore) */
    if(ap.style.display === 'block'){ _fixAfterLogin(); }

    var obs = new MutationObserver(function(){
      if(ap.style.display === 'block'){
        _fixRan = false;
        _fixAfterLogin();
      }
    });
    obs.observe(ap, { attributes: true, attributeFilter: ['style'] });
  }

  /* ── 4. Nav button click → re-adjust ── */
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('nav button');
    if(btn) setTimeout(_robustAdjust, 60);
  }, true);

  /* ── 5. Window resize → re-adjust ── */
  window.addEventListener('resize', _robustAdjust, { passive: true });

  /* ── 6. Boot ── */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _watchApp);
  } else {
    _watchApp();
  }

  console.log('✅ DTH Login Fix v2 active');
})();