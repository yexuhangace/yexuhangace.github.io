/* =============================================================
   Tweak Layer · 幂等区块调整（水合安全，配合 tweak.css）
   1. 新增「AI 平面作品」区（置顶）
   2. 隐藏黄浦文旅项目
   3. 「其他平面作品」移到摄影画廊前：限高完整显示 + 双向跑马灯
   4. 品牌（扳机艺术）：仅「线上」作品两行跑马灯；「查看更多」自动并入队列
   5. 查看/展开=区域化作品弹窗：按区域标识隔离罗列（品牌/摄影各系列），
      窗口 ≤800×600 居中、开窗过渡、src 去重、平滑滚动、骨架屏加载
   6. 跑马灯防重复：单组宽度不足一行时移除克隆改静态，确保同屏无重复作品
   React 重渲染会还原其管理的节点 → MutationObserver 自动重新应用
   ============================================================= */
(function () {
  "use strict";

  var ORDER = { ai: 1, brand: 2, posters: 3, graphic: 4, photo: 5, media: 6, huangpu: 99 };
  var H3KEY = {
    ai: "AI 平面作品",
    posters: "景田",
    brand: "自拟品牌",
    graphic: "其他平面作品",
    photo: "摄影创作画廊",
    huangpu: "黄浦文旅创意设计",
    media: "影像与音频作品"
  };
  var AI_SRC1 = "u1788871160044918";
  var AI_SRC2 = "u1788871164973734";
  var suspended = false;
  var pending = null;

  /* ---------- 迷你灯箱（克隆节点/AI 图没有 React 事件） ---------- */
  var lb = null;
  function onKey(e) {
    if (e.key === "Escape") closeLb();
  }
  function closeLb() {
    document.removeEventListener("keydown", onKey);
    if (lb) {
      lb.remove();
      lb = null;
    }
  }
  function openLb(src, cap) {
    closeLb();
    lb = document.createElement("div");
    lb.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:32px;cursor:zoom-out";
    var im = document.createElement("img");
    im.src = src;
    im.style.cssText =
      "max-width:92vw;max-height:82vh;object-fit:contain;border:1px solid rgba(255,255,255,.15)";
    var cp = document.createElement("div");
    cp.textContent = cap || "";
    cp.style.cssText =
      "font:12px/1.6 ui-monospace,SFMono-Regular,monospace;color:rgba(255,255,255,.65);letter-spacing:.05em";
    lb.appendChild(im);
    lb.appendChild(cp);
    lb.addEventListener("click", closeLb);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(lb);
  }
  document.addEventListener("click", function (e) {
    var f = e.target.closest && e.target.closest(".mq-clone, .ai-fig");
    if (!f) return;
    var im = f.querySelector("img");
    if (im) {
      var cap = f.getAttribute("data-cap");
      if (!cap) {
        var fc = f.querySelector("figcaption");
        cap = fc ? fc.textContent : "";
      }
      openLb(im.currentSrc || im.src, cap);
    }
  });

  /* ---------- 统一「全部作品」罗列弹窗 ----------
     可调参数：MODAL_WHEEL_SPEED 滚轮倍速 / MODAL_SMOOTH 平滑系数（0.05~0.3，越小越柔）
     系统「减弱动态」开启时退回原生滚动，避免动效不适 */
  var MODAL_WHEEL_SPEED = 1.0;
  var MODAL_SMOOTH = 0.14;
  var modal = null;
  var prevOverflow = "";
  var modalRaf = 0;
  var modalTarget = 0;
  var modalAnimating = false;

  function onModalKey(e) {
    if (e.key === "Escape") closeModal();
  }
  function closeModal() {
    document.removeEventListener("keydown", onModalKey);
    document.body.style.overflow = prevOverflow;
    if (modalRaf) {
      cancelAnimationFrame(modalRaf);
      modalRaf = 0;
    }
    modalAnimating = false;
    if (modal) {
      modal.remove();
      modal = null;
    }
  }

  /* 收集页面全部图像作品，按区块分组；按图片 src 去重，确保每件作品只出现一次 */
  function collectAllWorks() {
    var root = document.getElementById("portfolio-works");
    if (!root) return [];
    var seen = {};
    var groups = [];
    function addGroup(title, figs) {
      var uniq = [];
      Array.prototype.forEach.call(figs, function (f) {
        if (!f || f.classList.contains("mq-clone")) return;
        if (f.hasAttribute && f.hasAttribute("data-tweak-del")) return; /* 已标记删除 */
        var im = f.querySelector("img");
        if (!im) return;
        var key = (im.getAttribute("src") || "").split("?")[0];
        if (!key || seen[key]) return;
        seen[key] = 1;
        uniq.push(f);
      });
      if (uniq.length) groups.push({ title: title, figs: uniq });
    }
    var secs = {};
    var pendingKind = null;
    Array.prototype.forEach.call(root.children, function (sec) {
      if (sec.classList.contains("tw-own")) return;
      var h3 = sec.querySelector("h3");
      var k = null;
      if (h3) {
        var t = h3.textContent || "";
        for (var key in H3KEY) {
          if (t.indexOf(H3KEY[key]) > -1) {
            k = key;
            break;
          }
        }
      } else if (pendingKind) k = pendingKind;
      pendingKind = k;
      if (k && k !== "huangpu") (secs[k] = secs[k] || []).push(sec);
    });

    (secs.ai || []).forEach(function (s) {
      /* AI 区跑马灯化：源图统一藏于 .tweak-ai-src */
      addGroup("AI 平面作品", s.querySelectorAll(".tweak-ai-src figure"));
    });
    (secs.posters || []).forEach(function (s) {
      addGroup("成套海报", s.querySelectorAll(".grid > figure"));
    });
    var brandFigs = { core: [], online: [] };
    (secs.brand || []).forEach(function (s) {
      var gs = s.classList.contains("grid")
        ? [s]
        : Array.prototype.slice.call(s.querySelectorAll(".grid"));
      gs.forEach(function (g) {
        Array.prototype.forEach.call(g.querySelectorAll(":scope > figure"), function (f) {
          if (f.classList.contains("mq-clone")) return;
          var cap = f.querySelector("figcaption");
          var alt = (f.querySelector("img") || {}).alt || "";
          var online = ((cap ? cap.textContent : "") + " " + alt).indexOf("线上") > -1;
          (online ? brandFigs.online : brandFigs.core).push(f);
        });
      });
    });
    addGroup("品牌 · IP 与周边物料", brandFigs.core);
    addGroup("品牌 · 线上应用", brandFigs.online);
    (secs.graphic || []).forEach(function (s) {
      var cols = s.classList.contains("columns-2") ? s : s.querySelector(".columns-2");
      if (!cols) return;
      addGroup(
        "其他平面作品",
        Array.prototype.filter.call(cols.querySelectorAll("div > figure"), function (f) {
          return !isAiFig(f);
        })
      );
    });
    (secs.photo || []).forEach(function (s) {
      Array.prototype.forEach.call(s.querySelectorAll(".space-y-4 > .border"), function (block) {
        var h4 = block.querySelector("h4");
        var title = h4 && h4.firstChild ? h4.firstChild.textContent : "摄影系列";
        var figs = [];
        var btn = block.querySelector(":scope > button");
        var im = btn ? btn.querySelector("img") : null;
        if (im) {
          var cf = document.createElement("figure");
          var cim = document.createElement("img");
          cim.src = im.currentSrc || im.src;
          cim.alt = title;
          var cc = document.createElement("figcaption");
          cc.textContent = title;
          cf.appendChild(cim);
          cf.appendChild(cc);
          figs.push(cf);
        }
        var grid = block.querySelector(".grid");
        if (grid) {
          Array.prototype.forEach.call(grid.querySelectorAll(":scope > figure"), function (f) {
            figs.push(f);
          });
        }
        addGroup(title, figs);
      });
    });
    return groups;
  }

  /* 区域 → 暂存 section 映射：命中时弹窗头部出现「上传作品」入口（作者模式可见） */
  var ZONE_SECTION = { ai: "ai", graphic: "graphic" };
  /* 区域化作品罗列弹窗：zone 即区域标识符
     - "brand"：品牌区域（IP 与周边物料 + 线上应用两组）
     - "ai"：AI 平面作品区域
     - "graphic"：其他平面作品区域
     - 摄影系列名（如 "产品摄影"）：仅该系列一组
     只展示目标区域作品，其他区域数据完全不进入 DOM（隔离）；
     zone 未指定时罗列全部（兼容保留） */
  function openWorksModal(zone) {
    closeModal();
    var all = collectAllWorks();
    var groups = [];
    Array.prototype.forEach.call(all, function (g) {
      if (zone === "brand") {
        if (g.title.indexOf("品牌") > -1) groups.push(g);
      } else if (zone === "ai") {
        if (g.title.indexOf("AI") > -1) groups.push(g);
      } else if (zone === "graphic") {
        if (g.title.indexOf("其他平面") > -1) groups.push(g);
      } else if (zone) {
        if (g.title === zone) groups.push(g);
      } else {
        groups.push(g);
      }
    });
    if (!groups.length) return;
    var total = 0;
    groups.forEach(function (g) {
      total += g.figs.length;
    });
    var zoneTitle = "全部作品";
    if (zone === "brand") zoneTitle = "品牌作品";
    else if (zone === "ai") zoneTitle = "AI 作品";
    else if (zone === "graphic") zoneTitle = "平面作品";
    else if (zone) zoneTitle = zone;

    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    var ov = document.createElement("div");
    ov.className = "tweak-modal";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:20px";
    var panel = document.createElement("div");
    panel.className = "tweak-panel";
    var head = document.createElement("div");
    head.className = "tweak-panel-head";
    var ttl = document.createElement("div");
    ttl.className = "tweak-panel-title";
    ttl.textContent = zoneTitle;
    var cnt = document.createElement("span");
    cnt.className = "tweak-panel-count";
    cnt.textContent = " · " + total + " 件";
    ttl.appendChild(cnt);
    var x = document.createElement("button");
    x.type = "button";
    x.className = "tweak-panel-close";
    x.textContent = "✕ 关闭";
    x.addEventListener("click", closeModal);
    head.appendChild(ttl);
    head.appendChild(x);
    var zsec = ZONE_SECTION[zone];
    if (zsec) {
      var ub = buildUploadBtn(zsec);
      ub.style.margin = "0 0 0 12px";
      head.appendChild(ub);
    }

    var body = document.createElement("div");
    body.className = "tweak-panel-body";
    var headings = {};
    var eagerLeft = 12; /* 首屏图 eager 加载，确保骨架屏立即切换；其余懒加载 */
    groups.forEach(function (g) {
      var sec = document.createElement("section");
      sec.className = "tweak-group";
      var h = document.createElement("h4");
      h.className = "tweak-group-title";
      h.textContent = g.title + " · " + g.figs.length + " 件";
      headings[g.title] = h;
      /* 单组区域：小标题与头部重复，省略以保证留白 */
      var showHead = groups.length > 1;
      var grid = document.createElement("div");
      grid.className = "tweak-modal-grid";
      g.figs.forEach(function (f) {
        var c = cloneTile(f);
        var im = c.querySelector("img");
        if (im) {
          im.setAttribute("loading", eagerLeft > 0 ? "eager" : "lazy");
          if (eagerLeft > 0) eagerLeft--;
          im.setAttribute("decoding", "async");
          var sk = document.createElement("span");
          sk.className = "tweak-skel";
          c.insertBefore(sk, c.firstChild);
          var done = function () {
            if (c.classList.contains("tw-loaded")) return;
            c.classList.add("tw-loaded");
          };
          if (im.complete && im.getAttribute("src")) done();
          else {
            im.addEventListener("load", done);
            im.addEventListener("error", done);
          }
        }
        grid.appendChild(c);
      });
      if (showHead) sec.appendChild(h);
      sec.appendChild(grid);
      body.appendChild(sec);
    });

    panel.appendChild(head);
    panel.appendChild(body);
    ov.appendChild(panel);
    ov.addEventListener("mousedown", function (e) {
      if (e.target === ov) closeModal();
    });
    document.addEventListener("keydown", onModalKey);
    document.body.appendChild(ov);
    modal = ov;

    /* 平滑滚动：滚轮插值（速度可调）；触屏/滚动条/减弱动态走原生 */
    var reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    modalTarget = body.scrollTop;
    if (!reduced) {
      body.addEventListener(
        "wheel",
        function (e) {
          e.preventDefault();
          var max = body.scrollHeight - body.clientHeight;
          if (max <= 0) return;
          var dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
          modalTarget = Math.max(0, Math.min(max, modalTarget + dy * MODAL_WHEEL_SPEED));
          if (!modalAnimating) {
            modalAnimating = true;
            modalRaf = requestAnimationFrame(function step() {
              if (!modal) {
                modalAnimating = false;
                return;
              }
              var d = modalTarget - body.scrollTop;
              if (Math.abs(d) < 1) {
                body.scrollTop = modalTarget;
                modalAnimating = false;
                modalRaf = 0;
                return;
              }
              body.scrollTop += d * MODAL_SMOOTH;
              modalRaf = requestAnimationFrame(step);
            });
          }
        },
        { passive: false }
      );
      body.addEventListener("scroll", function () {
        if (!modalAnimating) modalTarget = body.scrollTop;
      });
    }

    /* zone 名与组标题一致（摄影系列）时确保对齐；单区域弹窗内容本就从顶部开始 */
    if (zone && headings[zone]) {
      requestAnimationFrame(function () {
        if (!modal) return;
        var d =
          headings[zone].getBoundingClientRect().top -
          body.getBoundingClientRect().top;
        if (d > 0) {
          body.scrollTop = Math.max(0, body.scrollTop + d - 16);
          modalTarget = body.scrollTop;
        }
      });
    }
  }

  /* ---------- 作者模式：单选图片删除（云端作品） ----------
     悬停 resume-uploads/ 图片出现「✕ 删除」徽标，二次点击确认；
     语义与内置发布面板一致：仅把作品 id 追加进 localStorage[yxh_deleted]，
     由面板「一键发布」统一提交 GitHub（不直接调 API）；
     同时记录 src 到 yxh_tweak_del_srcs，页面立即隐藏该作品（React 重渲染后保持） */
  var DEL_ID_KEY = "yxh_deleted";
  var DEL_SRC_KEY = "yxh_tweak_del_srcs";
  var delBadge = null;
  var delBadgeSrc = "";
  var delArmedAt = 0;
  var toastEl = null;
  var toastTimer = 0;

  function readJsonArr(key) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (_) {
      return [];
    }
  }
  function writeJsonArr(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch (_) {}
  }
  function stripSrc(src) {
    return ((src || "").split("?")[0] || "").replace(/^https?:\/\/[^/]+\//, "");
  }
  function showToast(msg) {
    if (!toastEl || !toastEl.isConnected) {
      toastEl = document.createElement("div");
      toastEl.className = "tw-own tweak-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("tweak-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("tweak-show");
    }, 3200);
  }
  function applyDeletedHiding() {
    var set = {};
    readJsonArr(DEL_SRC_KEY).forEach(function (s) {
      set[s] = 1;
    });
    Array.prototype.forEach.call(
      document.querySelectorAll(
        "#portfolio-works figure img, .tweak-panel-body figure img"
      ),
      function (im) {
        var f = im.closest("figure");
        if (!f) return;
        if (set[stripSrc(im.currentSrc || im.src)]) f.setAttribute("data-tweak-del", "1");
        else if (f.getAttribute("data-tweak-del")) f.removeAttribute("data-tweak-del");
      }
    );
  }
  function hideDelBadge() {
    if (delBadge) {
      delBadge.classList.remove("tweak-show");
      delBadge.classList.remove("tweak-armed");
      delBadge.textContent = "✕ 删除";
    }
    delBadgeSrc = "";
    delArmedAt = 0;
  }
  /* 粘性确认：点一次武装、再点执行；鼠标移开徽标或按 Esc 取消（无时间窗，误触率低） */
  function disarmBadge() {
    if (!delBadge || !delArmedAt) return;
    delArmedAt = 0;
    delBadge.textContent = "✕ 删除";
    delBadge.classList.remove("tweak-armed");
  }
  function markDeleted(srcPath) {
    var stem = (srcPath.split(".").pop() ? srcPath.replace(/\.[a-z0-9]+$/i, "") : srcPath)
      .split("/")
      .pop();
    var isCloud = srcPath.indexOf("resume-uploads/") === 0 && /^u\d{14,20}$/.test(stem);
    var srcs = readJsonArr(DEL_SRC_KEY);
    if (srcs.indexOf(srcPath) === -1) {
      srcs.push(srcPath);
      writeJsonArr(DEL_SRC_KEY, srcs);
    }
    if (isCloud) {
      var ids = readJsonArr(DEL_ID_KEY);
      if (ids.indexOf(stem) === -1) {
        ids.push(stem);
        writeJsonArr(DEL_ID_KEY, ids);
      }
      showToast("已标记删除 " + stem + "（点「一键发布到线上」后生效）");
    } else {
      showToast("已隐藏该作品（本地素材仅本页生效；彻底移除需修改仓库文件）");
    }
    applyDeletedHiding();
    hideDelBadge();
  }
  function onBadgeClick(e) {
    e.stopPropagation();
    if (!delBadgeSrc) return;
    if (!delArmedAt) {
      delArmedAt = 1;
      delBadge.textContent = "确认删除？";
      delBadge.classList.add("tweak-armed");
      return;
    }
    markDeleted(delBadgeSrc);
  }
  function ensureDelBadge() {
    if (delBadge && delBadge.isConnected) return delBadge;
    delBadge = document.createElement("button");
    delBadge.type = "button";
    delBadge.className = "tw-own tweak-del-badge";
    delBadge.textContent = "✕ 删除";
    delBadge.addEventListener("click", onBadgeClick);
    delBadge.addEventListener("mouseout", disarmBadge);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") hideDelBadge();
    });
    document.body.appendChild(delBadge);
    return delBadge;
  }
  document.addEventListener("mouseover", function (e) {
    if (!document.body.classList.contains("author-mode")) return;
    if (e.target.closest && e.target.closest(".tweak-del-badge")) return;
    var im = e.target.closest
      ? e.target.closest("#portfolio-works figure img, .tweak-panel-body figure img")
      : null;
    if (!im) {
      hideDelBadge();
      return;
    }
    var s = stripSrc(im.currentSrc || im.src);
    if (!s || readJsonArr(DEL_SRC_KEY).indexOf(s) > -1) {
      hideDelBadge();
      return;
    }
    var f = im.closest("figure");
    var r = f.getBoundingClientRect();
    if (r.width < 60) return;
    var b = ensureDelBadge();
    delBadgeSrc = s;
    delArmedAt = 0;
    b.textContent = "✕ 删除";
    b.classList.remove("tweak-armed");
    b.style.top = Math.max(6, r.top + 6) + "px";
    b.style.left = Math.max(6, r.right - 82) + "px";
    b.classList.add("tweak-show");
  });

  /* ---------- 跑马灯防重复 ----------
     单组宽度不足一行（容器宽）时：加 mq-static（CSS 隐藏 mq-dup 副本并停用动画），
     改为静态整行，保证任意时刻视口内每件作品只出现一次；
     宽度足够（含图片加载后变宽）时移除 mq-static 恢复无缝循环（克隆不同屏）。
     只切换类、不增删节点：状态可随图片加载/窗口缩放随时双向切换 */
  function fitRow(row) {
    var track = row.querySelector(".mq-track");
    if (!track) return;
    var tiles = track.children;
    if (!tiles.length || tiles.length % 2 !== 0) return;
    var half = tiles.length / 2;
    var setW = 0;
    var i;
    for (i = 0; i < half; i++) setW += tiles[i].getBoundingClientRect().width + 8;
    var cw = row.clientWidth;
    if (setW > 0 && cw > 0 && setW < cw) {
      row.classList.add("mq-static");
    } else if (setW >= cw) {
      row.classList.remove("mq-static");
    }
    Array.prototype.forEach.call(track.querySelectorAll("img"), function (im) {
      if (!im.complete) im.addEventListener("load", fitAllMq, { once: true });
    });
  }
  function fitAllMq() {
    Array.prototype.forEach.call(document.querySelectorAll(".mq"), fitRow);
  }
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitAllMq, 200);
  });

  /* ---------- 工具 ---------- */
  function cloneTile(fig, tileClass) {
    var c = fig.cloneNode(true);
    c.classList.add("mq-clone");
    if (tileClass) c.classList.add(tileClass);
    if (c.hasAttribute("style")) c.removeAttribute("style");
    return c;
  }

  function buildRow(figs, dir, tileClass) {
    var row = document.createElement("div");
    row.className = "mq";
    row.setAttribute("data-dir", dir);
    var track = document.createElement("div");
    track.className = "mq-track";
    /* 克隆常驻：前半组=展示组，后半组=无缝循环副本（mq-dup），
       静态态由 CSS 隐藏副本，绝不物理删除节点（图片加载变宽后可随时恢复循环） */
    figs.concat(figs).forEach(function (f, idx) {
      var c = cloneTile(f, tileClass);
      if (idx >= figs.length) c.classList.add("mq-dup");
      track.appendChild(c);
    });
    row.appendChild(track);
    return row;
  }

  function buildGraphicBox(figs) {
    var box = document.createElement("div");
    box.id = "graphic-mq";
    box.classList.add("tw-own");
    box.setAttribute("data-n", String(figs.length));
    box.style.order = String(ORDER.graphic);
    var cut = Math.ceil(figs.length / 2);
    box.appendChild(buildRow(figs.slice(0, cut), "l", "g-tile"));
    box.appendChild(buildRow(figs.slice(cut), "r", "g-tile"));
    var b = document.createElement("button");
    b.type = "button";
    b.id = "graphic-toggle";
    b.classList.add("tw-own");
    b.style.cssText =
      "display:inline-block;margin:14px 12px 0;font:12px/1.6 ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em;color:#eca8d6;background:none;border:none;cursor:pointer;padding:4px 0";
    b.textContent = "查看平面作品 →";
    b.addEventListener("click", function () {
      openWorksModal("graphic");
    });
    box.appendChild(b);
    return box;
  }

  /* 品牌「线上」作品：单行跑马灯（8 张一组建宽后自然流动循环） */
  function buildBrandBox(figs) {
    var box = document.createElement("div");
    box.id = "brand-mq";
    box.classList.add("tw-own");
    box.setAttribute("data-n", String(figs.length));
    box.style.order = String(ORDER.brand);
    box.appendChild(buildRow(figs, "l", "g-tile"));
    return box;
  }

  /* 品牌：「查看品牌作品」→ 区域化弹窗罗列（仅品牌区域作品） */
  function buildToggle() {
    var b = document.createElement("button");
    b.type = "button";
    b.id = "brand-toggle";
    b.classList.add("tw-own");
    b.style.cssText =
      "display:inline-block;margin:14px 12px 0;order:" +
      ORDER.brand +
      ";font:12px/1.6 ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em;color:#eca8d6;background:none;border:none;cursor:pointer;padding:4px 0";
    b.textContent = "查看品牌作品 →";
    b.addEventListener("click", function () {
      openWorksModal("brand");
    });
    return b;
  }

  function isAiFig(f) {
    var im = f.querySelector("img");
    var s = im ? im.getAttribute("src") || "" : "";
    return s.indexOf(AI_SRC1) > -1 || s.indexOf(AI_SRC2) > -1;
  }

  /* ---------- AI 区 ---------- */
  function aiFig(src, cap, cls) {
    return (
      '<figure class="ai-fig' +
      (cls ? " " + cls : "") +
      ' group relative overflow-hidden border border-foreground/10" data-cap="' +
      cap +
      '"><img src="' +
      src +
      '" alt="' +
      cap +
      '" loading="lazy" decoding="async" class="w-full h-full object-cover bg-black/90 transition-transform duration-700 group-hover:scale-[1.02]"/>' +
      '<figcaption class="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"><span class="font-mono text-xs text-white/90">' +
      cap +
      "</span></figcaption></figure>"
    );
  }

  /* ---------- 云端清单 + 作者上传（AI 区与弹窗共用） ----------
     manifest 由作者面板「一键发布」生成于 resume-uploads/manifest.json；
     本地/未发布时 404 → 静默跳过（单次缓存，避免重复请求） */
  var manifestFetched = null;
  function fetchManifest() {
    if (manifestFetched) return manifestFetched;
    manifestFetched = fetch("resume-uploads/manifest.json?ts=" + Date.now())
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
    return manifestFetched;
  }
  /* AI 区双列跑马灯：奇偶分半双向滚动；仅前 6 张 eager（减少首屏卡顿），其余懒加载 */
  function appendAiRows(sec, figs) {
    Array.prototype.forEach.call(sec.querySelectorAll(":scope > .mq"), function (r) {
      r.remove();
    });
    var btns = sec.querySelector(".tweak-ai-btns");
    var cut = Math.ceil(figs.length / 2);
    var eager = 6;
    [
      buildRow(figs.slice(0, cut), "l", "a-tile"),
      buildRow(figs.slice(cut), "r", "a-tile")
    ].forEach(function (row) {
      Array.prototype.forEach.call(row.querySelectorAll("img"), function (im) {
        im.setAttribute("loading", eager > 0 ? "eager" : "lazy");
        if (eager > 0) eager--;
      });
      sec.insertBefore(row, btns || null);
    });
    sec.setAttribute("data-n", String(figs.length));
  }
  /* 云端 AI 作品合并进 .tweak-ai-src（幂等：按 src 去重），有新增才重建跑马灯 */
  function applyAiRemote() {
    return fetchManifest().then(function (m) {
      if (!m || !Array.isArray(m.items)) return;
      var news = m.items.filter(function (it) {
        return it && it.section === "ai" && it.kind !== "video" && it.src;
      });
      if (!news.length) return;
      var sec = document.querySelector('#portfolio-works > [data-tweak="ai"]');
      var srcBox = sec && sec.querySelector(".tweak-ai-src");
      if (!srcBox) return;
      var have = {};
      Array.prototype.forEach.call(srcBox.querySelectorAll("img"), function (im) {
        have[stripSrc(im.getAttribute("src") || "")] = 1;
      });
      var added = 0;
      news.forEach(function (it) {
        var p = stripSrc(it.src);
        if (have[p]) return;
        have[p] = 1;
        srcBox.insertAdjacentHTML(
          "beforeend",
          aiFig(p + "?v=" + (m.ver || 0), it.cap || "AI 作品")
        );
        added++;
      });
      if (!added) return;
      appendAiRows(sec, Array.prototype.slice.call(srcBox.querySelectorAll("figure")));
      requestAnimationFrame(fitAllMq);
    });
  }
  /* 压缩：最长边 ≤1800，JPEG 0.86（对齐作者面板发布管线，降低内存与上传体积） */
  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image();
        im.onload = function () {
          var MAX = 1800;
          var k = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
          var cv = document.createElement("canvas");
          cv.width = Math.round(im.naturalWidth * k);
          cv.height = Math.round(im.naturalHeight * k);
          cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", 0.86));
        };
        im.onerror = function () {
          reject(new Error("decode"));
        };
        im.src = rd.result;
      };
      rd.onerror = function () {
        reject(new Error("read"));
      };
      rd.readAsDataURL(file);
    });
  }
  /* 直写作者面板暂存库（与内置上传同库同 store，发布弹窗统一可见） */
  function idbAddStaging(rec) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open("yxh-resume-uploads", 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("imgs"))
          db.createObjectStore("imgs", { keyPath: "id", autoIncrement: true });
        if (!db.objectStoreNames.contains("ovr"))
          db.createObjectStore("ovr", { keyPath: "src" });
      };
      req.onerror = function () {
        reject(req.error);
      };
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction("imgs", "readwrite");
        tx.objectStore("imgs").add(rec);
        tx.oncomplete = function () {
          db.close();
          resolve();
        };
        tx.onerror = function () {
          db.close();
          reject(tx.error);
        };
      };
    });
  }
  function openAuthorUpload(section) {
    if (!document.body.classList.contains("author-mode")) return;
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.multiple = true;
    inp.style.display = "none";
    inp.addEventListener("change", function () {
      var fs = Array.prototype.slice.call(inp.files || []);
      if (!fs.length) return;
      var ok = 0;
      var fail = 0;
      var next = function (i) {
        if (i >= fs.length) {
          showToast(
            "✓ 已暂存 " + ok + " 个作品" + (fail ? "，失败 " + fail + " 个" : "") + "（点「一键发布到线上」后生效）"
          );
          return;
        }
        compressImage(fs[i])
          .then(function (data) {
            return idbAddStaging({ section: section, data: data, cap: fs[i].name, pub: 0 });
          })
          .then(function () {
            ok++;
          })
          .catch(function () {
            fail++;
          })
          .then(function () {
            next(i + 1);
          });
      };
      next(0);
    });
    document.body.appendChild(inp);
    inp.click();
    setTimeout(function () {
      if (inp.isConnected) inp.remove();
    }, 60000);
  }
  /* 上传按钮：仅作者模式可见（CSS 控制显隐），AI 区与 ai/graphic 弹窗共用 */
  function buildUploadBtn(section) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tw-own tweak-upload-btn";
    b.setAttribute("data-section", section);
    b.textContent = "＋ 上传作品";
    b.addEventListener("click", function () {
      openAuthorUpload(section);
    });
    return b;
  }

  /* AI 区：双列流动跑马灯（源图藏于 tweak-hide 容器供克隆与弹窗收集），
     tile 限高完整显示（不裁切、比例协调）、悬停暂停；
     「查看 AI 作品」弹出区域化模态 + 作者模式「上传作品」入口 */
  function buildAi() {
    var sec = document.createElement("div");
    sec.className = "mt-28 mb-12";
    sec.setAttribute("data-tweak", "ai");
    sec.style.order = "1";
    var localSrcs = [
      "assets/ai/ai_local_01.jpg",
      "assets/ai/ai_local_02.jpg",
      "assets/ai/ai_local_03.jpg",
      "assets/ai/ai_local_04.jpg",
      "assets/ai/ai_local_05.jpg",
      "assets/ai/ai_local_06.jpg",
      "assets/ai/ai_local_07.jpg",
      "assets/ai/ai_local_08.jpg",
      "assets/ai/ai_local_09.jpg",
      "assets/ai/ai_local_10.jpg",
      "assets/ai/ai_local_11.jpg",
      "assets/ai/ai_local_12.jpg",
      "assets/ai/ai_local_13.jpg",
      "assets/ai/ai_local_14.jpg",
      "assets/ai/ai_local_15.jpg",
      "assets/ai/ai_local_16.jpg",
      "assets/ai/ai_local_17.jpg"
    ];
    sec.innerHTML =
      '<div class="flex items-start justify-between gap-6 flex-wrap"><div>' +
      '<span class="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4"><span class="w-12 h-px bg-foreground/30"></span>AI GRAPHIC WORKS</span>' +
      '<h3 class="text-4xl lg:text-5xl font-display tracking-tight">AI 平面作品</h3>' +
      '<p class="text-muted-foreground mt-3 max-w-xl">AIGC 辅助创意产出 · AI 生图作品，点击可放大查看。</p>' +
      "</div></div>" +
      '<div class="tweak-ai-src tweak-hide">' +
      aiFig("resume-uploads/graphic/u1788871160044918.jpg", "AI 生图 · 作品一") +
      aiFig("resume-uploads/graphic/u1788871164973734.jpg", "AI 生图 · 作品二") +
      localSrcs
        .map(function (src, i) {
          var n = i + 1;
          return aiFig(src, "AI 本地部署 · 作品" + (n < 10 ? "0" + n : n));
        })
        .join("") +
      "</div>";
    var btns = document.createElement("div");
    btns.className = "tweak-ai-btns";
    var b = document.createElement("button");
    b.type = "button";
    b.id = "ai-toggle";
    b.classList.add("tw-own");
    b.style.cssText =
      "display:inline-block;margin:14px 12px 0;font:12px/1.6 ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em;color:#eca8d6;background:none;border:none;cursor:pointer;padding:4px 0";
    b.textContent = "查看 AI 作品 →";
    b.addEventListener("click", function () {
      openWorksModal("ai");
    });
    btns.appendChild(b);
    btns.appendChild(buildUploadBtn("ai"));
    sec.appendChild(btns);
    appendAiRows(sec, Array.prototype.slice.call(sec.querySelectorAll(".tweak-ai-src figure")));
    return sec;
  }

  /* ---------- 幂等应用 ---------- */
  function apply() {
    var root = document.getElementById("portfolio-works");
    if (!root) return;
    suspended = true;
    try {
      var secs = {};
      var pendingKind = null;

      Array.prototype.forEach.call(root.children, function (sec) {
        if (sec.classList && sec.classList.contains("tw-own")) return; /* 自建节点跳过配对 */
        var h3 = sec.querySelector("h3");
        var k = null;
        if (h3) {
          var t = h3.textContent || "";
          for (var key in H3KEY) {
            if (t.indexOf(H3KEY[key]) > -1) {
              k = key;
              break;
            }
          }
        } else if (pendingKind) {
          k = pendingKind; /* 表头的下一个兄弟 = 该区内容 */
        }
        pendingKind = k;

        if (!k) {
          if (sec.getAttribute("data-tweak") !== "misc") {
            sec.setAttribute("data-tweak", "misc");
            sec.style.order = "8";
          }
          return;
        }
        if (sec.getAttribute("data-tweak") !== k) sec.setAttribute("data-tweak", k);
        var o = String(ORDER[k]);
        if (sec.style.order !== o) sec.style.order = o;
        if (k === "huangpu" && sec.style.display !== "none") sec.style.display = "none";

        if (!secs[k]) secs[k] = { header: null, content: null };
        var slot = h3 ? "header" : "content";
        if (!secs[k][slot]) secs[k][slot] = sec;
      });

      /* 1) AI 区缺失则重建并置顶 */
      if (!secs.ai || secs.ai.header.parentNode !== root) {
        if (secs.ai && secs.ai.header.parentNode === root) secs.ai.header.remove();
        var ai = buildAi();
        root.insertBefore(ai, root.firstChild);
        secs.ai = { header: ai, content: null };
      } else if (root.firstElementChild !== secs.ai.header) {
        root.insertBefore(secs.ai.header, root.firstChild);
      }

      /* 2) 品牌（扳机艺术）：仅「线上」作品网格（说明含「线上」字样）→
         两行跑马灯 + 「查看全部作品」弹窗罗列；其余网格（三视图/表情包/周边）保持原生不动。
         原生「查看更多」按钮：自动点开让隐藏作品并入滚动队列，并隐藏按钮本身 */
      var bfigs = [];
      var bfirstGrid = null;
      Array.prototype.forEach.call(root.children, function (sec) {
        if (sec.getAttribute("data-tweak") !== "brand") return;
        var bts =
          sec.tagName === "BUTTON"
            ? [sec] /* 按钮本身是根级子元素，querySelectorAll 取不到自身 */
            : Array.prototype.slice.call(sec.querySelectorAll("button"));
        Array.prototype.forEach.call(bts, function (bt) {
          if ((bt.textContent || "").indexOf("查看更多") === -1) return;
          if (!bt.hasAttribute("data-tweak-auto")) {
            bt.setAttribute("data-tweak-auto", "1");
            bt.click(); /* 让 React 渲染隐藏作品 → 进滚动队列 */
          }
          if (bt.style.display !== "none") bt.style.display = "none";
        });
        var gs = sec.classList.contains("grid")
          ? [sec]
          : Array.prototype.slice.call(sec.querySelectorAll(".grid"));
        gs.forEach(function (g) {
          var gf = Array.prototype.filter.call(
            g.querySelectorAll(":scope > figure"),
            function (f) {
              if (f.classList.contains("mq-clone")) return false;
              var cap = f.querySelector("figcaption");
              var alt = (f.querySelector("img") || {}).alt || "";
              return ((cap ? cap.textContent : "") + " " + alt).indexOf("线上") > -1;
            }
          );
          if (gf.length) {
            if (!bfirstGrid) bfirstGrid = g;
            bfigs = bfigs.concat(gf);
          } else if (g.classList.contains("tweak-hide")) {
            g.classList.remove("tweak-hide"); /* 非线上网格：恢复原生显示 */
          }
        });
      });
      if (!bfigs.length) {
        /* 无线上网格：清理旧跑马灯，全区原生 */
        var staleMq = document.getElementById("brand-mq");
        if (staleMq) staleMq.remove();
        var staleBtn = document.getElementById("brand-toggle");
        if (staleBtn) staleBtn.remove();
      }
      if (bfigs.length && bfirstGrid) {
        var bn = String(bfigs.length);
        var brow = document.getElementById("brand-mq");
        if (!brow || brow.getAttribute("data-n") !== bn) {
          if (brow) brow.remove();
          brow = buildBrandBox(bfigs);
          bfirstGrid.insertAdjacentElement("beforebegin", brow);
        }
        var bbtn = document.getElementById("brand-toggle");
        if (!bbtn) {
          bbtn = buildToggle();
          brow.insertAdjacentElement("afterend", bbtn);
        }
        /* 线上网格常收起：罗列走弹窗，不原位展开 */
        bfigs.forEach(function (f) {
          var g = f.parentElement;
          if (g && !g.classList.contains("tweak-hide")) g.classList.add("tweak-hide");
        });
      }

      /* 3) 平面作品：隐藏原 masonry，两行双向跑马灯（限高完整显示） */
      if (secs.graphic && secs.graphic.content) {
        var gEl = secs.graphic.content;
        var cols = gEl.classList.contains("columns-2") ? gEl : gEl.querySelector(".columns-2");
        if (cols) {
          if (!cols.classList.contains("tweak-hide")) cols.classList.add("tweak-hide");
          var figs = Array.prototype.filter.call(cols.querySelectorAll("div > figure"), function (f) {
            return !isAiFig(f);
          });
          var gn = String(figs.length);
          var gbox = document.getElementById("graphic-mq");
          if (figs.length && (!gbox || gbox.getAttribute("data-n") !== gn)) {
            if (gbox) gbox.remove();
            gbox = buildGraphicBox(figs);
            cols.insertAdjacentElement("afterend", gbox);
          }
        }
      }

      /* 4) 摄影：跑马灯常驻；「展开全部」按钮拦截 → 弹窗罗列（不再原位展开） */
      if (secs.photo && secs.photo.content) {
        var blocks = secs.photo.content.querySelectorAll(".space-y-4 > .border");
        Array.prototype.forEach.call(blocks, function (block, i) {
          var grid = block.querySelector(".grid");
          if (!grid) return;
          var dir = i % 2 ? "r" : "l";
          var pfigs = Array.prototype.filter.call(grid.children, function (el) {
            return el.tagName === "FIGURE" && !el.classList.contains("mq-clone");
          });
          var pn = String(pfigs.length);
          var prow = block.querySelector(":scope > .mq");
          if (pfigs.length && (!prow || prow.getAttribute("data-n") !== pn)) {
            if (prow) prow.remove();
            prow = buildRow(pfigs, dir, "p-tile");
            prow.classList.add("tw-own");
            prow.setAttribute("data-n", pn);
            grid.insertAdjacentElement("beforebegin", prow);
          }
          if (prow && prow.classList.contains("tweak-hide")) prow.classList.remove("tweak-hide");
          var coverBtn = block.querySelector(":scope > button");
          if (coverBtn && !coverBtn.hasAttribute("data-tweak-modal")) {
            coverBtn.setAttribute("data-tweak-modal", "1");
            coverBtn.addEventListener(
              "click",
              function (ev) {
                ev.stopPropagation(); /* 拦截 React 原位展开 */
                var h4 = block.querySelector("h4");
                openWorksModal(h4 && h4.firstChild ? h4.firstChild.textContent : null);
              },
              true
            );
          }
        });
      }

      /* 5) 跑马灯防重复：布局就绪后校正（克隆过多/过少的行） */
      requestAnimationFrame(fitAllMq);

      /* 6) 作者模式：已标记删除的作品保持隐藏（React 重渲染后由 MutationObserver 重入） */
      applyDeletedHiding();

      /* 7) 线上作品清单：AI 区合并云端上传作品（清单不存在/失败时静默跳过） */
      fetchManifest().then(function () {
        applyAiRemote();
      });
    } finally {
      suspended = false;
    }
  }

  /* ---------- 守护：React 重渲染后自动恢复 ----------
     首次应用延迟到 load 之后（等水合完成），避免触发水合失配 */
  function boot() {
    /* 作者模式切换：退出时收起删除徽标 */
    new MutationObserver(function () {
      if (!document.body.classList.contains("author-mode")) hideDelBadge();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    var mo = new MutationObserver(function () {
      if (suspended || pending) return;
      pending = setTimeout(function () {
        pending = null;
        apply();
      }, 150);
    });
    var rootEl = document.getElementById("portfolio-works");
    if (rootEl) mo.observe(rootEl, { childList: true, subtree: true, attributes: true });
    apply();
  }

  if (document.readyState === "complete") {
    setTimeout(boot, 300);
  } else {
    window.addEventListener("load", function () {
      setTimeout(boot, 300);
    });
  }
})();
