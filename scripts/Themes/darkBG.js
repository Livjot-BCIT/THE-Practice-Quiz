document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.querySelector('[data-theme="dark"] input.theme-toggle');
  if (!darkToggle) return;

  darkToggle.addEventListener("change", function() {
    if (this.checked) {
      // turn on dark theme
      applyTheme("dark");
      // switch off the others
      document.querySelector('[data-theme="catalyst"] input.theme-toggle').checked = false;
      document.querySelector('[data-theme="light"]    input.theme-toggle').checked = false;
    } else {
      // back to default
      applyTheme(null);
    }
  });
});
