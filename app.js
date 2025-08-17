// ===== Intro: show on fresh load/reload, skip only on Back/Forward (robust) =====
document.addEventListener('DOMContentLoaded', function () {
  var intro = document.getElementById('intro-screen');
  var enterBtn = document.getElementById('enter-btn');
  var appContent = document.getElementById('app-content');

  function showIntro() {
    if (!intro) return;
    document.body.classList.add('lock-scroll', 'intro-active');
    if (enterBtn) {
      enterBtn.addEventListener('click', function () {
        intro.classList.add('hide');
        document.body.classList.remove('lock-scroll', 'intro-active');
        setTimeout(function () {
          if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
          if (appContent) appContent.classList.remove('hidden');
        }, 820);
      }, { once: true });
    }
  }

  function skipIntro() {
    if (intro && intro.parentNode) try { intro.parentNode.removeChild(intro); } catch (e) {}
    document.body.classList.remove('lock-scroll', 'intro-active');
    if (appContent) appContent.classList.remove('hidden');
  }

  var isBackForward = false;
  try {
    if (performance && performance.getEntriesByType) {
      var navs = performance.getEntriesByType('navigation');
      if (navs && navs[0] && navs[0].type === 'back_forward') isBackForward = true;
    } else if (performance && performance.navigation) {
      isBackForward = (performance.navigation.type === 2); // legacy API
    }
  } catch (_) {}

  if (isBackForward) {
    skipIntro();
  } else {
    showIntro();
  }

  window.addEventListener('pageshow', function (e) {
    if (e && e.persisted) skipIntro();
  });
});