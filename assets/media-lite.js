(function () {
  "use strict";
  var variants = {"assets/video/video_yili.mp4":"assets/stream/yili-web.mp4","resume-uploads/replaced/r20260909121439.mp4":"assets/stream/answer-web.mp4","assets/video/video_xiaochaihu.mp4":"assets/stream/xiaochaihu-web.mp4","assets/lunan/short-01.mp4":"assets/stream/lunan-short-01-web.mp4","assets/lunan/short-02.mp4":"assets/stream/lunan-short-02-web.mp4","assets/lunan/short-03.mp4":"assets/stream/lunan-short-03-web.mp4","assets/lunan/short-04.mp4":"assets/stream/lunan-short-04-web.mp4","assets/lunan/main-film.mp4":"assets/lunan/main-film.mp4"};
  var originals = {};
  Object.keys(variants).forEach(function (key) { originals[variants[key]] = key; });
  function pathOf(src) {
    try { var u = new URL(src, document.baseURI); return (u.origin === location.origin || /^(yexuhangace[.]github[.]io|yexuhang-portfolio[.]pages[.]dev)$/.test(u.hostname)) ? u.pathname.replace(/^\/+/, "") : ""; }
    catch (_) { return ""; }
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var v = entry.target;
      if (!(navigator.connection && navigator.connection.saveData)) {
        v.preload = "metadata";
        if (!v.getAttribute("src")) v.src = v.getAttribute("data-video-src");
      }
      io.unobserve(v);
    });
  }, { rootMargin: "200px" }) : null;
  function prepare(v) {
    if (!v.closest("#portfolio-works") || document.body.classList.contains("author-mode")) return;
    var raw = v.getAttribute("src") || v.getAttribute("data-video-src") || "";
    var key = pathOf(raw), original = variants[key] ? key : originals[key];
    if (!original) return;
    var webPath = variants[original];
    var web = "https://yexuhang-portfolio.pages.dev/" + webPath;
    if (v.hasAttribute("data-video-src") && v.getAttribute("data-video-src") !== web) v.setAttribute("data-video-src", web);
    if (v.getAttribute("src") && pathOf(v.getAttribute("src")) !== webPath) v.src = web;
    if (webPath !== original && !v.__qualityLink) {
      var a = document.createElement("a"); a.href = "https://yexuhang-portfolio.pages.dev/" + original; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "原画质 ↗"; a.className = "perf-original-video";
      a.style.cssText = "display:inline-block;margin:6px 12px 8px;font-size:12px;color:#b8cbd0;text-decoration:underline;text-underline-offset:3px";
      (v.closest(".ln-player") || v).insertAdjacentElement("afterend", a); v.__qualityLink = a;
    }
    if (v.__liteObserved) return;
    v.__liteObserved = true; if (io) io.observe(v);
  }
  function boot() {
    document.querySelectorAll("#portfolio-works video").forEach(prepare);
    var root = document.getElementById("portfolio-works"); if (!root) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === "attributes") { prepare(m.target); return; }
        Array.prototype.forEach.call(m.addedNodes, function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === "VIDEO") prepare(node);
          node.querySelectorAll("video").forEach(prepare);
        });
      });
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "data-video-src"] });
    document.addEventListener("play", function (event) {
      if (!event.target.matches || !event.target.matches("#portfolio-works video")) return;
      document.querySelectorAll("video").forEach(function (v) { if (v !== event.target && !v.paused) v.pause(); });
    }, true);
  }
  if (window.YXHPerformance) window.YXHPerformance.whenHydrated(boot);
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
