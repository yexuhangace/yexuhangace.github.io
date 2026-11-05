(function () {
  "use strict";

  function player(src, label, vertical, title, number, duration) {
    return '<div class="ln-player' + (vertical ? ' ln-portrait' : '') + '">' +
      '<video preload="none" playsinline aria-hidden="true" aria-label="' + label + '" data-video-src="' + src + '"></video>' +
      '<button class="ln-play ln-title-cover" type="button" aria-label="播放' + label + '">' +
      '<span class="ln-cover-top"><span>鲁南制药</span><span>' + (vertical ? 'SHORT FILM' : 'BRAND MICROFILM') + '</span></span>' +
      '<span class="ln-cover-center"><span class="ln-cover-number">' + number + '</span><span class="ln-cover-title">' + title + '</span><span class="ln-cover-sub">' + (vertical ? '启达力荆防颗粒' : '有些关心，一直都在。') + '</span></span>' +
      '<span class="ln-cover-bottom"><span class="ln-cover-action"><span class="ln-cover-play" aria-hidden="true">▶</span>点击播放</span><span>' + duration + '</span></span></button></div>';
  }

  function mount() {
    var root = document.getElementById("portfolio-works");
    if (!root || document.getElementById("lunan-project")) return;
    var media = root.querySelector(':scope > .grid[data-tweak="media"]');
    if (!media) return;
    var section = document.createElement("section");
    section.id = "lunan-project";
    section.className = "tw-own ln-project";
    section.setAttribute("aria-labelledby", "ln-heading");
    var lengths = ["00:20", "00:17", "00:17", "00:21"];
    var titles = ["空调房<br>里的日常", "风起<br>的时候", "夜归<br>之后", "忙完<br>这一刻"];
    var shorts = lengths.map(function (length, i) {
      var n = String(i + 1).padStart(2, "0");
      return '<article class="ln-short">' + player('assets/lunan/short-' + n + '.mp4', '鲁南制药竖屏短片' + n, true, titles[i], n, length) +
        '<div class="ln-short-caption"><div><span class="ln-index">' + n + '</span><h5>竖屏短片 ' + n + '</h5></div><span class="ln-time">' + length + '</span></div></article>';
    }).join("");
    section.innerHTML = '<header class="ln-header"><div><p class="ln-eyebrow">LUNAN PHARMA / BRAND FILM & SHORTS</p><h4 id="ln-heading">鲁南制药<span>品牌影像与短视频</span></h4></div><p class="ln-count">01 主片 <span aria-hidden="true">/</span> 04 短片</p></header>' +
      '<div class="ln-feature"><div class="ln-main">' + player('assets/lunan/main-film.mp4?v=a38c949e77bb', '鲁南制药项目主片', false, '你总说<br><em>没事。</em>', '关于牵挂的一部微电影', '05:38') + '<div class="ln-main-caption"><h4>项目主片</h4><span class="ln-time">05:38 / 横屏</span></div></div>' +
      '<aside class="ln-note"><span class="ln-note-index">FEATURED PROJECT</span><h4>从完整叙事，<br>到日常的一瞬。</h4><p>以一部主片展开故事，以四条竖屏短片呈现启达力荆防颗粒的生活场景。</p><dl><div><dt>项目</dt><dd>鲁南制药品牌视频创作</dd></div><div><dt>参与工作</dt><dd>创意策划 · 脚本 · 视频制作</dd></div><div><dt>作品形式</dt><dd>横屏主片 / 竖屏短视频</dd></div></dl><a href="#ln-shorts" class="ln-jump">观看短片系列 <span aria-hidden="true">↘</span></a></aside></div>' +
      '<div class="ln-series-head" id="ln-shorts"><h4>短片系列</h4><p>启达力荆防颗粒 · 竖屏创作</p></div><div class="ln-shorts">' + shorts + '</div>';
    media.appendChild(section);
    section.addEventListener("click", function (event) {
      var button = event.target.closest(".ln-play");
      if (!button) return;
      var video = button.parentElement.querySelector("video");
      video.removeAttribute("aria-hidden");
      if (!video.getAttribute("src")) video.src = video.getAttribute("data-video-src");
      video.controls = true;
      button.hidden = true;
      video.play().catch(function () { button.hidden = false; });
    });
    section.querySelectorAll("video").forEach(function (video) {
      video.addEventListener("play", function () {
        section.querySelectorAll("video").forEach(function (other) { if (other !== video) other.pause(); });
      });
    });
  }

  function boot() {
    mount();
    var root = document.getElementById("portfolio-works");
    if (root) new MutationObserver(mount).observe(root, { childList: true, subtree: true });
    if (location.hash === "#lunan-project") requestAnimationFrame(function () {
      var section = document.getElementById("lunan-project");
      if (section) section.scrollIntoView();
    });
  }
  if (window.YXHPerformance) window.YXHPerformance.whenHydrated(function () { setTimeout(boot, 0); });
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
