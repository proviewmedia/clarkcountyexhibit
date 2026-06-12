/* Deter casual image saving — right-click, drag, and iOS long-press.
   Delegated on document so it also covers gallery photos injected at runtime.
   Note: this is a deterrent only. Images shown in a browser are always
   retrievable via DevTools / the Network tab / direct asset URLs. */
(function () {
  function isImg(t) {
    return t && (t.tagName === 'IMG' || (t.classList && t.classList.contains('ph-img')));
  }
  document.addEventListener('contextmenu', function (e) {
    if (isImg(e.target)) e.preventDefault();
  });
  document.addEventListener('dragstart', function (e) {
    if (isImg(e.target)) e.preventDefault();
  });
})();
