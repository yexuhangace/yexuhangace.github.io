(function () {
  "use strict";
  function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }
  function apply() {
    var skills = document.getElementById("skills");
    var portfolio = document.getElementById("portfolio");
    if (skills) {
      text(skills.querySelector("h2"), "技能与创作");
      if (!skills.querySelector(".skills-detail-toggle")) {
        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "skills-detail-toggle";
        toggle.textContent = "展开说明与课程 ＋";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", "skills-details");
        skills.firstElementChild.children[1].id = "skills-details";
        toggle.addEventListener("click", function () {
          var expanded = skills.classList.toggle("skills-expanded");
          toggle.setAttribute("aria-expanded", String(expanded));
          toggle.textContent = expanded ? "收起说明与课程 −" : "展开说明与课程 ＋";
        });
        skills.firstElementChild.appendChild(toggle);
      }
    }
    if (!portfolio) return;
    var header = portfolio.firstElementChild;
    text(header.querySelector("h2"), "精选作品");
    text(header.querySelector("p"), "品牌策划、平面视觉、摄影与影像创作。向下查看完整作品。");
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
