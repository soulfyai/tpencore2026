// Only the isolated preview uses this adapter; production pages never load it.
(() => {
  const desktop = matchMedia('(min-width:861px)');
  function position() {
    const widget = document.querySelector('wanan-widget');
    if (!widget) return;
    if (!desktop.matches) { widget.style.removeProperty('--wanan-inline-inset'); return; }
    const panel = document.querySelector('aside.panel');
    let inset = 80; // One 40px step left from the original right inset.
    if (panel && document.documentElement.classList.contains('drawer-open')) {
      // Use layout coordinates so CSS transitions do not leave the figure overlapping.
      const right = parseFloat(getComputedStyle(panel).right) || 0;
      inset = Math.max(inset, right + panel.offsetWidth + 16);
    }
    inset = Math.min(inset, Math.max(16, innerWidth - 416));
    widget.style.setProperty('--wanan-inline-inset', inset + 'px');
  }
  new MutationObserver(position).observe(document.documentElement, {attributes:true,attributeFilter:['class']});
  const panel = document.querySelector('aside.panel');
  if (panel) new ResizeObserver(position).observe(panel);
  desktop.addEventListener('change',position);
  addEventListener('resize',position);
  position();
})();
