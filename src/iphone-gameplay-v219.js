/* Pétanque Tour 2026 — V2.19 iframe patch shim.
   Prevents a missing-file 404 and keeps the validated match-core intact. */
(function(){
  'use strict';
  try{ document.documentElement.dataset.ptV219='1'; }catch(e){}
})();
