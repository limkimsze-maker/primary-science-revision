(()=>{
'use strict';
// Compatibility shim. Sidebar concept switching is handled directly by guided-progress-sidebar.js.
// Do not intercept clicks or reload the trainer; that previously prevented the sidebar's own
// click handler from opening the selected concept.
window.PSLE_CONCEPT_SWITCH_RESCUE_DISABLED=true;
})();
