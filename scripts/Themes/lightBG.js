document.addEventListener("DOMContentLoaded", () => {
  const lightToggle = document.querySelector('[data-theme="light"] input.theme-toggle');
  if (!lightToggle) return;

  // more of a fallback if themeChange tweaks out or smth
  lightToggle.addEventListener("change", function() {
    if (this.checked) {
      applyTheme("light");
      document.querySelector('[data-theme="catalyst"] input.theme-toggle').checked = false;
      document.querySelector('[data-theme="dark"]     input.theme-toggle').checked = false;
    } else {
      applyTheme(null);
    }
  });
});
