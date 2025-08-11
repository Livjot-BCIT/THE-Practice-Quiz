// wire up toggles 
// Find each theme tile/label in the footer and hook up its checkbox
document.querySelectorAll(".theme-toggle-label").forEach((label) => {
  const input = label.querySelector("input.theme-toggle"); // checkbox
  const theme = label.dataset.theme; // e.g. "catalyst", "dark", etc.

  // When a checkbox changes, toggle the theme
  input.addEventListener("change", () => {
    if (input.checked) {
      window.applyTheme(theme); 

      // Make them act like radio buttons: uncheck the rest
      document.querySelectorAll("input.theme-toggle").forEach((i) => {
        if (i !== input) i.checked = false;
      });

      // Remember the choice
      localStorage.setItem("quizTheme", theme || "");
    } else {
      // No theme = remove theme classes
      window.applyTheme(null);
      localStorage.setItem("quizTheme", "");
    }
  });

  // Keep other UI bits in sync after this tile mounts
  window.visualSettings.updateAll();
});

// icon swap for light theme 
// Quick helper: swap assets when light theme is on so icons don't vanish
function setLightThemeIcons(isLightTheme) {
  document.querySelectorAll(".settings-icon").forEach((img) => {
    const baseName = img.getAttribute("data-icon"); // like "volume", "display"
    if (isLightTheme) {
      img.src = `./images/${baseName}2.png`; // light variant
    } else {
      img.src = `./images/${baseName}.png`; // default
    }
  });

  document.querySelectorAll(".footer-github-icon").forEach((img) => {
    const baseName = img.getAttribute("data-icon");
    if (isLightTheme) {
      img.src = `./images/${baseName}.svg`; // dark-on-light
    } else {
      img.src = `./images/${baseName}-white.svg`; // light-on-dark
    }
  });
}

// main theme switch 
// Adds/removes body classes, shows bubbles, toggles rain, etc.
window.applyTheme = function (themeName) {
  // remove all theme classes first
  document.body.classList.remove(
    "theme-catalyst",
    "theme-dark",
    "theme-light",
    "theme-rain"
  );

  // If we got a theme, tack on its class
  if (themeName) document.body.classList.add("theme-" + themeName);

  // When we're NOT on Catalyst, reset all the special background stuff
  if (themeName !== "catalyst") {
    window.visualSettings.forceShapesOff = false; // shapes allowed again
    document.getElementById("footerBackgroundToggle").checked = false;
    document.querySelector(".catalyst-stars")?.remove(); // nuke stars if they exists
    document.getElementById("mainPage")?.classList.remove("translucent-bg");
    document.querySelector(".content-wrapper")?.classList.remove("video-bg");
  }

  // Catalyst: show the little tip bubble for 15s
  if (themeName === "catalyst") {
    const bubble = document.getElementById("catalystSpeechBubble");
    bubble.classList.remove("hidden");
    setTimeout(() => {
      bubble.classList.add("hidden");
    }, 15000); // 15-sec
  } else {
    // Not Catalyst: make sure its bubble is hidden
    document.getElementById("catalystSpeechBubble").classList.add("hidden");
  }

  // Rain: turn on the canvas rain + show its bubble; otherwise shut it off
  if (themeName === "rain") {
    window.enableRainBG();
    const bubble = document.getElementById("rainSpeechBubble");
    bubble.classList.remove("hidden");
    setTimeout(() => {
      bubble.classList.add("hidden");
    }, 15000);
  } else {
    window.disableRainBG();
    document.getElementById("rainSpeechBubble").classList.add("hidden");
  }

  // Click-to-dismiss for the bubbles (simple and friendly)
  document
    .getElementById("catalystSpeechBubble")
    .addEventListener("click", function () {
      this.classList.add("hidden");
    });

  document
    .getElementById("rainSpeechBubble")
    .addEventListener("click", function () {
      this.classList.add("hidden");
    });

  // Update any visual toggles + run theme audio stuff
  window.visualSettings.updateAll();
  window.audioThemeManager(themeName);

  // Swap icon set if we’re on light
  setLightThemeIcons(themeName === "light");
};
