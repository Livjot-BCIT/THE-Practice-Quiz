// Find each theme tile/label in the footer and hook up its checkbox
document.querySelectorAll(".theme-toggle-label").forEach((label) => {
  const input = label.querySelector("input.theme-toggle"); 
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

  window.visualSettings.updateAll();
});

// icon swap for light theme 
function setLightThemeIcons(isLightTheme) {
  document.querySelectorAll(".settings-icon").forEach((img) => {
    const baseName = img.getAttribute("data-icon"); 
    if (isLightTheme) {
      img.src = `./images/${baseName}2.png`; 
    } else {
      img.src = `./images/${baseName}.png`; 
    }
  });

  document.querySelectorAll(".footer-github-icon").forEach((img) => {
    const baseName = img.getAttribute("data-icon");
    if (isLightTheme) {
      img.src = `./images/${baseName}.svg`; 
    } else {
      img.src = `./images/${baseName}-white.svg`;
    }
  });
}

// -- switch only the theme classes --
function switchThemeClasses(nextTheme) {
  document.body.classList.remove(
    "theme-catalyst",
    "theme-dark",
    "theme-light",
    "theme-rain",
    "theme-halloween"
  );
  if (nextTheme) document.body.classList.add("theme-" + nextTheme);
}

window.applyTheme = function (themeName) {
  // if we had a scheduled halloween flip pending, cancel it
  if (window._halloweenFlipTimer) {
    clearTimeout(window._halloweenFlipTimer);
    window._halloweenFlipTimer = null;
  }

  // -- Halloween --
  if (themeName === "halloween") {
    // Leave current theme colors up for a bit, but run transition visuals now
    window.startBatsOverlay && window.startBatsOverlay({ startAt: 0.0, playbackRate: 1.5 });

    const DELAY_MS = 1500;
    window._halloweenFlipTimer = setTimeout(() => {
      switchThemeClasses("halloween");
      window.enableHalloweenShapes && window.enableHalloweenShapes();
      window.visualSettings.updateAll();
      window.audioThemeManager("halloween");
      setLightThemeIcons(false); 

      window._halloweenFlipTimer = null;
    }, DELAY_MS);

    return;
  }

  // -- Non-Specialty themes  --
  // Make sure halloween visuals are off when leaving it
  window.disableHalloweenShapes?.();
  window.stopBatsOverlay?.();

  switchThemeClasses(themeName);

  // When we're NOT on Catalyst, reset all the special background stuff
  if (themeName !== "catalyst") {
    window.visualSettings.forceShapesOff = false; 
    const footerToggle = document.getElementById("footerBackgroundToggle");
    if (footerToggle) footerToggle.checked = false;
    document.querySelector(".catalyst-stars")?.remove(); 
    document.getElementById("mainPage")?.classList.remove("translucent-bg");
    document.querySelector(".content-wrapper")?.classList.remove("video-bg");
  }

  // Catalyst: show the little tip bubble for 15s
  if (themeName === "catalyst") {
    const bubble = document.getElementById("catalystSpeechBubble");
    bubble?.classList.remove("hidden");
    setTimeout(() => {
      bubble?.classList.add("hidden");
    }, 15000); 
  } else {
    // Not Catalyst: make sure its bubble is hidden
    document.getElementById("catalystSpeechBubble")?.classList.add("hidden");
  }

  // Rain: enable rain bg + show bubble for 15s
  if (themeName === "rain") {
    window.enableRainBG?.();
    const bubble = document.getElementById("rainSpeechBubble");
    bubble?.classList.remove("hidden");
    setTimeout(() => {
      bubble?.classList.add("hidden");
    }, 15000);
  } else {
    window.disableRainBG?.();
    document.getElementById("rainSpeechBubble")?.classList.add("hidden");
  }

  // Click-to-dismiss for the bubbles
  document
    .getElementById("catalystSpeechBubble")
    ?.addEventListener("click", function () {
      this.classList.add("hidden");
    });

  document
    .getElementById("rainSpeechBubble")
    ?.addEventListener("click", function () {
      this.classList.add("hidden");
    });

  // Update any visual toggles + run theme audio stuff
  window.visualSettings.updateAll();
  window.audioThemeManager(themeName);

  setLightThemeIcons(themeName === "light");
};
