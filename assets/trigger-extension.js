(function () {
  "use strict";
  var works = [
    ["01-visual-system", "视觉识别系统", "三色规范 / 字标应用 / IP 表情 / 视觉语言", 1122, 1402],
    ["02-merchandise", "周边物料设计", "服饰 / 手提袋 / 包装展开 / 挂绳与贴纸", 1536, 1024],
    ["03-posters", "海报与传播应用", "系列海报 / 社媒画面 / 活动票券", 1536, 1024]
  ];
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
    works.forEach(function (work, i) {
      if (grid.querySelector('[data-trigger-work="' + work[0] + '"]')) return;
      var figure = document.createElement("figure");
      figure.className = "ai-fig tr-cover col-span-2" + (i === 0 ? " row-span-2" : "");
      figure.setAttribute("data-trigger-work", work[0]);
      figure.innerHTML = '<button type="button" aria-label="查看扳机艺术' + work[1] + '完整图"><img data-perf-src="assets/brand-extension/' + work[0] + '.webp" alt="扳机艺术 · ' + work[1] + ' · AI 辅助概念延展" width="' + work[3] + '" height="' + work[4] + '" loading="lazy" decoding="async"><span class="tr-open" aria-hidden="true">查看完整图 ↗</span></button><figcaption>' + work[1] + '<span>AI 辅助概念延展 · ' + work[2] + '</span></figcaption>';
      grid.appendChild(figure);
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
