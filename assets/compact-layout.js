(function () {
  "use strict";
  function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }
  function apply() {
    var skills = document.getElementById("skills");
    var portfolio = document.getElementById("portfolio");
    if (skills) text(skills.querySelector("h2"), "技能与创作");
    if (!portfolio) return;
    var header = portfolio.firstElementChild;
    text(header.querySelector("h2"), "精选项目");
    text(header.querySelector("p"), "品牌策划、平面视觉、摄影与影像创作。向下查看完整作品。");
    var cards = portfolio.children[1] && portfolio.children[1].firstElementChild;
    var summaries = [
      "围绕年轻受众需求，统筹视觉风格，完成品牌策划方案与参赛物料。",
      "提炼品牌诉求，结合 PS、CDR 与 AIGC 完成系列海报。",
      "参与脚本、镜头、拍摄与成片，聚焦亲情家风主题。获高校青年公益大赛入围奖。",
      "独立完成广播广告脚本、内容策划与节奏设计。",
      "独立完成主题策划、实景拍摄、调色与人像精修。",
      "独立完成主题插画、公众号配图及招募宣传物料。"
    ];
    if (cards) Array.prototype.forEach.call(cards.children, function (card, i) {
      var title = card.querySelector("h3");
      if (!title || !summaries[i]) return;
      var paragraphs = title.parentElement.querySelectorAll("p");
      text(paragraphs[1], summaries[i]);
    });
    Array.prototype.forEach.call(document.querySelectorAll("#about span, #portfolio span"), function (span) {
      if (span.textContent === "段真实项目实践") {
        text(span.previousElementSibling, "多类");
        text(span, "项目创作实践");
      } else if (span.textContent === "真实项目") text(span.previousElementSibling, "多类");
    });
  }
  function boot() {
    apply();
    document.documentElement.classList.remove("portfolio-preparing");
    window.dispatchEvent(new Event("resize"));
    if (location.hash === "#lunan-project" || location.hash === "#ln-shorts") {
      requestAnimationFrame(function () {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      });
    }
    var pending = false;
    var observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; apply(); });
    });
    ["skills", "portfolio"].forEach(function (id) {
      var root = document.getElementById(id);
      if (root) observer.observe(root, { childList: true, subtree: true });
    });
  }
  if (window.YXHPerformance) window.YXHPerformance.whenHydrated(function () { setTimeout(boot, 0); });
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
