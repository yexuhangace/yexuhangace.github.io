/* Loading-only overlay: original files and React bundles remain unchanged. */
(function () {
  "use strict";
  var index = window.YXH_MEDIA_INDEX || { images: {}, hero: {} };
  var images = index.images;
  var reverse = {};
  Object.keys(images).forEach(function (path) {
    images[path].variants.forEach(function (v) { reverse[v.src] = path; });
  });
  function pathOf(src) {
    try {
      var u = new URL(src, document.baseURI);
      if (u.origin !== location.origin && !/^(yexuhangace\.github\.io|yexuhang-portfolio\.pages\.dev)$/.test(u.hostname)) return "";
      return u.pathname.replace(/^\/+/, "");
    } catch (_) { return ""; }
  }
  function original(im) {
    var raw = im.getAttribute("src") || im.getAttribute("data-perf-src") || "";
    var key = pathOf(raw);
    return reverse[key] || raw;
  }
  function canonical(src) { var key = pathOf(src); return reverse[key] || key || src; }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var im = entry.target;
      var src = im.getAttribute("data-perf-src");
      if (src) {
        setPreview(im, src);
        im.src = src;
        im.removeAttribute("data-perf-src");
      }
      io.unobserve(im);
    });
  }, { rootMargin: "500px 250px" }) : null;
  function setPreview(im, src) {
    var rec = images[pathOf(src)];
    if (!rec) {
      if (im.hasAttribute("data-perf-preview")) {
        im.removeAttribute("srcset"); im.removeAttribute("sizes");
        im.removeAttribute("data-perf-preview");
      }
      return;
    }
    var srcset = rec.variants.map(function (v) { return v.src + " " + v.width + "w"; }).join(", ");
    if (im.getAttribute("srcset") !== srcset) im.setAttribute("srcset", srcset);
    var sizes = im.closest("#about") ? "100vw" : "(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 420px";
    if (im.getAttribute("sizes") !== sizes) im.setAttribute("sizes", sizes);
    if (!im.hasAttribute("width")) im.setAttribute("width", rec.width);
    if (!im.hasAttribute("height")) im.setAttribute("height", rec.height);
    if (im.getAttribute("data-perf-preview") !== "1") im.setAttribute("data-perf-preview", "1");
  }
  function prepare(im) {
    if (im.closest(".yxh-full-image, [role=dialog], [class~=fixed]")) return;
    if (im.decoding !== "async") im.decoding = "async";
    var src = original(im), rec = images[pathOf(src)];
    if (im.hasAttribute("data-perf-src")) {
      if (rec) {
        if (im.getAttribute("width") !== String(rec.width)) im.setAttribute("width", rec.width);
        if (im.getAttribute("height") !== String(rec.height)) im.setAttribute("height", rec.height);
      }
      if (im.loading !== "lazy") im.loading = "lazy";
      if (io) io.observe(im);
      else { setPreview(im, src); im.src = src; im.removeAttribute("data-perf-src"); }
    } else { setPreview(im, src); }
  }
  var ready = false, callbacks = [];
  function whenHydrated(fn) { if (ready) fn(); else callbacks.push(fn); }
  function detectHydration() {
    var root = document.getElementById("portfolio-works");
    // This retained static export uses React 19; wait for its DOM binding before editing.
    if (root && Object.keys(root).some(function (key) { return key.indexOf("__reactFiber$") === 0; })) {
      ready = true;
      callbacks.splice(0).forEach(function (fn) { fn(); });
    } else { requestAnimationFrame(detectHydration); }
  }
  window.YXHPerformance = { prepare: prepare, original: original, canonical: canonical, whenHydrated: whenHydrated };

  // Gate only decorative hero playback. Work videos and explicit author previews are untouched.
  var nativePlay = HTMLMediaElement.prototype.play;
  var desktopDelayDone = false, desktopDelay = null;
  function staticHero() {
    var connection = navigator.connection;
    return matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)").matches ||
      !!(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")));
  }
  function isHero(video) { return video.tagName === "VIDEO" && !!video.closest("#about"); }
  function knownHero(video) {
    var raw = video.getAttribute("src") || "";
    if (pathOf(raw) === "assets/previews/hero-loop.mp4") return true;
    if (pathOf(raw) !== index.hero.src) return false;
    var version = new URL(raw, document.baseURI).searchParams.get("v");
    return !version || version === String(index.hero.ver);
  }
  function playDecorative(video) {
    if (!video.isConnected || staticHero() || document.hidden) return;
    if (knownHero(video) && pathOf(video.getAttribute("src")) !== "assets/previews/hero-loop.mp4") {
      video.src = "assets/previews/hero-loop.mp4";
    }
    nativePlay.call(video).catch(function () {});
  }
  HTMLMediaElement.prototype.play = function () {
    if (!isHero(this) || document.body.classList.contains("author-mode")) return nativePlay.apply(this, arguments);
    var video = this;
    if (staticHero()) { video.pause(); return Promise.resolve(); }
    if (!desktopDelayDone) {
      if (!desktopDelay) desktopDelay = setTimeout(function () {
        desktopDelayDone = true;
        if ("requestIdleCallback" in window) requestIdleCallback(function () { playDecorative(video); }, { timeout: 1500 });
        else playDecorative(video);
      }, 1800);
      return Promise.resolve();
    }
    playDecorative(video);
    return Promise.resolve();
  };
  function updateHero() {
    var video = document.querySelector("#about video");
    if (!video) return;
    if (knownHero(video) && video.getAttribute("poster") !== index.hero.poster) video.poster = index.hero.poster;
    if (staticHero() && !document.body.classList.contains("author-mode")) {
      video.pause();
      // The poster stays visible even while the retained component has opacity-0.
      if (video.style.opacity !== "0.7") video.style.opacity = "0.7";
    } else if (video.style.opacity) video.style.opacity = "";
  }
  whenHydrated(function () {
    var queued = false;
    function scan() {
      queued = false;
      document.querySelectorAll("main img, .tweak-modal img").forEach(prepare);
      updateHero();
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === "attributes" && m.target.tagName === "IMG") prepare(m.target);
        if (m.type === "childList") Array.prototype.forEach.call(m.addedNodes, function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === "IMG") prepare(node);
          node.querySelectorAll("img").forEach(prepare);
        });
      });
      if (mutations.some(function (m) {
        return m.type === "childList" || m.attributeName !== "class" || m.target === document.body || isHero(m.target);
      })) queue();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "data-perf-src", "class"] });
    document.addEventListener("visibilitychange", function () {
      var video = document.querySelector("#about video");
      if (!video) return;
      if (document.hidden) video.pause();
      else if (desktopDelayDone) playDecorative(video);
    });
    window.addEventListener("resize", function () {
      updateHero();
      var video = document.querySelector("#about video");
      if (video && desktopDelayDone) playDecorative(video);
    }, { passive: true });
    scan();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", detectHydration, { once: true });
  else detectHydration();
})();
