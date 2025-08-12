function syncMetaThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]')
    || (() => { const m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); return m; })();

  // pick whichever var maps best to the browser UI color
  const root = getComputedStyle(document.documentElement);
  const c =
    root.getPropertyValue('--theme-bg').trim() ||
    root.getPropertyValue('--color-bg-main').trim() ||
    root.getPropertyValue('--color-accent').trim() ||
    '#1b214e';

  meta.setAttribute('content', c);
}

// run once on load…
document.addEventListener('DOMContentLoaded', syncMetaThemeColor);
// again whenever theme changes:
const prevApplyTheme = window.applyTheme;
window.applyTheme = function(themeName) {
  prevApplyTheme?.(themeName);
  syncMetaThemeColor();
};
