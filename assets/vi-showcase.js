(function(){
  'use strict';
  var posterGroups = [{"key":"light","title":"光色实验","description":"光的层次、色彩与空间","items":[{"name":"afterglow-blue","caption":"蓝调余晖","width":1024,"height":1536},{"name":"afterglow-red","caption":"绯红余晖","width":1024,"height":1536},{"name":"afterglow-orange","caption":"橙色回廊","width":1024,"height":1536},{"name":"afterglow-green","caption":"青绿弧光","width":1024,"height":1536},{"name":"afterglow-warm","caption":"暖光褶皱","width":1024,"height":1536},{"name":"refract","caption":"REFRACT · 折光","width":1024,"height":1536}]},{"key":"flow","title":"FLOW 图形","description":"以线条、曲面与几何组织流动","items":[{"name":"flow-orbit","caption":"FLOW · 环流","width":1024,"height":1536},{"name":"flow-wave","caption":"FLOW · 波纹","width":1024,"height":1536},{"name":"flow-ribbon","caption":"FLOW · 曲面","width":1024,"height":1536},{"name":"flow-fold","caption":"FLOW · 旋折","width":1024,"height":1536}]},{"key":"object","title":"产品海报","description":"产品形态与大字排版的组合","items":[{"name":"focus","caption":"FOCUS · 相机","width":941,"height":1672},{"name":"sound","caption":"SOUND · 耳机","width":940,"height":1674},{"name":"move","caption":"MOVE · 运动鞋","width":940,"height":1674},{"name":"brew","caption":"BREW · 咖啡机","width":941,"height":1672}]}];
  function mountPosters(root){
    if(document.getElementById('poster-studies'))return;
    var section=document.createElement('section');
    section.id='poster-studies';section.className='poster-studies tw-own';section.style.order='3';
    section.setAttribute('aria-labelledby','poster-studies-title');
    section.innerHTML='<header class="poster-heading"><div><small>POSTER STUDIES / 14 WORKS</small><h3 id="poster-studies-title">海报视觉实验</h3><p>光色、图形与产品 · AI 辅助视觉探索</p></div><span class="poster-index" aria-hidden="true">01—14</span></header><div class="poster-categories" aria-label="海报作品分类"></div><div class="poster-grid"></div>';
    var categories=section.querySelector('.poster-categories'), grid=section.querySelector('.poster-grid');
    categories.innerHTML=posterGroups.map(function(group){return '<span>'+group.title+' <small>'+String(group.items.length).padStart(2,'0')+'</small></span>'}).join('');
    grid.innerHTML=posterGroups.map(function(group){
      return group.items.map(function(item){
        var src='assets/poster-series/'+item.name;
        return '<figure class="ai-fig" data-group="'+group.key+'" data-full="'+src+'.webp" data-cap="'+item.caption+'"><button type="button" class="poster-open" aria-label="放大查看'+item.caption+'"><img data-perf-src="'+src+'-560.webp" width="'+item.width+'" height="'+item.height+'" loading="lazy" decoding="async" alt="'+item.caption+'"></button><figcaption><small>'+group.title+'</small><span>'+item.caption+'</span></figcaption></figure>';
      }).join('');
    }).join('');
    grid.id='poster-series-grid';
    var brand=root.querySelector('[data-tweak="brand"].grid');
    if(brand)brand.insertAdjacentElement('afterend',section);else root.appendChild(section);
  }
  function mount(){
    var root=document.getElementById('portfolio-works');if(!root)return;
    mountPosters(root);
    var brand=root.querySelector('[data-tweak="brand"].grid');
    if(brand&&!document.getElementById('trigger-vi-showcase')){
      var card=document.createElement('section');card.id='trigger-vi-showcase';card.className='vi-showcase tw-own';card.style.order='2';
      card.innerHTML='<a class="vi-cover" href="trigger-vi.html" aria-label="打开扳机艺术完整手册"><img src="assets/trigger-vi/cover-robot.webp" width="1720" height="920" loading="lazy" decoding="async" alt="扳机艺术品牌主视觉"></a><div class="vi-info"><div><small>TRIGGER / VISUAL IDENTITY · 36 PAGES</small><h4>扳机艺术 · 品牌视觉识别系统</h4><p>从角色与主视觉，到书册、印刷物料和品牌应用。</p></div><a class="vi-button" href="trigger-vi.html">浏览完整手册 <span aria-hidden="true">↗</span></a></div>';
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
