/* Pétanque Tour 2026 V2.19 — same-origin match patch loader */
(function(){
  'use strict';

  function install(frame){
    try{
      const doc=frame.contentDocument;
      if(!doc||doc.documentElement?.dataset?.ptV219==='1')return;
      if(doc.querySelector('script[data-pt-v219]'))return;

      const script=doc.createElement('script');
      script.dataset.ptV219='1';
      script.src='./src/iphone-gameplay-v2191.js?v=2191';
      doc.body.appendChild(script);
    }catch(e){console.warn('PT V2.19 loader',e)}
  }

  function bind(){
    const frame=document.getElementById('matchFrame');
    if(!frame||frame.dataset.v219Bound)return;
    frame.dataset.v219Bound='1';
    frame.addEventListener('load',()=>install(frame),true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();

  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
