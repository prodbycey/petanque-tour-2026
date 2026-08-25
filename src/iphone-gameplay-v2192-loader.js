/* Pétanque Tour 2026 V2.19.2 — stability loader */
(function(){
  'use strict';
  function install(frame){
    try{
      const doc=frame.contentDocument;
      if(!doc||doc.documentElement?.dataset?.ptV2192==='1')return;
      if(doc.querySelector('script[data-pt-v2192]'))return;
      const script=doc.createElement('script');
      script.dataset.ptV2192='1';
      script.src='./src/iphone-gameplay-v2192.js?v=2192';
      doc.body.appendChild(script);
    }catch(e){console.warn('PT V2.19.2 loader',e)}
  }
  function bind(){
    const frame=document.getElementById('matchFrame');
    if(!frame||frame.dataset.v2192Bound)return;
    frame.dataset.v2192Bound='1';
    frame.addEventListener('load',()=>install(frame),true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
