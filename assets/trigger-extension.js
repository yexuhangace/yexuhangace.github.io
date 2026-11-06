(function () {
  "use strict";
  function mount() {
    var root = document.getElementById("portfolio-works");
    if (!root) return;
    var grid = root.querySelector('[data-tweak="brand"].grid');
    if (!grid) return;
    var online = Array.prototype.find.call(root.querySelectorAll('[data-tweak="brand"].grid'), function (g) {
      return Array.prototype.some.call(g.querySelectorAll(':scope > figure:not([data-trigger-work])'), function (f) { return (f.textContent + ' ' + ((f.querySelector('img') || {}).alt || '')).indexOf('线上') !== -1; });
    });
    if (online) ["04-original-system", "05-original-merch", "06-original-campaign"].forEach(function (name, i) {
      if (online.querySelector('[data-trigger-work="' + name + '"]')) return;
      var f = document.createElement('figure');
      f.className = 'ai-fig';
      f.setAttribute('data-trigger-work', name);
      f.innerHTML = '<img data-perf-src="assets/brand-extension/' + name + '.webp" alt="扳机艺术线上概念延展 ' + (i + 1) + '" loading="lazy" decoding="async"><figcaption>线上 · AI 辅助概念延展 ' + (i + 1) + '</figcaption>';
      online.appendChild(f);
    });
  }
  function boot() {
    mount();
    var root = document.getElementById("portfolio-works");
    if (root) new MutationObserver(mount).observe(root, { childList: true, subtree: true });
  }
  if (window.YXHPerformance) window.YXHPerformance.whenHydrated(boot);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
