(function(){
  'use strict';
  function mount(){
    var root=document.getElementById('portfolio-works');if(!root)return;
    var brand=root.querySelector('[data-tweak="brand"].grid');
    if(brand&&!document.getElementById('trigger-vi-showcase')){
      var card=document.createElement('a');card.id='trigger-vi-showcase';card.href='trigger-vi.html';card.className='vi-showcase tw-own';card.style.order='2';
      card.innerHTML='<img src="assets/trigger-vi/cover.webp" width="1100" height="588" loading="lazy" decoding="async" alt="扳机艺术黏土风品牌主视觉"><div><small>TRIGGER / VISUAL IDENTITY · 36 PAGES</small><h4>扳机艺术<br>黏土视觉识别系统</h4><p>从角色与主视觉，到书册、印刷物料和品牌应用。</p><strong>浏览完整手册 ↗</strong></div>';
      brand.insertAdjacentElement('beforebegin',card);
    }
    root.querySelectorAll('video').forEach(function(v){
      var src=v.getAttribute('src')||v.dataset.workSrc||'';
      if(!/video_(yili|xiaochaihu)\.mp4/.test(src)||v.dataset.workReady)return;
      v.dataset.workReady='1';v.dataset.workSrc=src;v.preload='none';v.removeAttribute('src');v.poster='assets/trigger-vi/'+(src.indexOf('yili')>-1?'yili':'xiaochaihu')+'-poster.webp';
      var b=document.createElement('button');b.className='work-video-start';b.type='button';b.setAttribute('aria-label','播放'+(src.indexOf('yili')>-1?'伊利':'小柴胡'));b.innerHTML='<span>▶ 点击播放</span>';
      b.onclick=function(){v.src=v.dataset.workSrc;b.hidden=true;v.play().catch(function(){b.hidden=false})};v.parentElement.appendChild(b);
    });
  }
  function boot(){mount();var r=document.getElementById('portfolio-works');if(r)new MutationObserver(mount).observe(r,{childList:true,subtree:true})}
  if(window.YXHPerformance)window.YXHPerformance.whenHydrated(boot);else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
