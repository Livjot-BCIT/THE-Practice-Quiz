// DOM loaded
document.addEventListener("DOMContentLoaded", function () {
  const footer = document.getElementById("quizFooter");
  const catalystToggle = document.getElementById("footerBackgroundToggle");
  const quizContainer = document.getElementById("mainPage");
  const contentWrapper = document.querySelector(".content-wrapper");
  const backgroundShapes = document.querySelector(".background-shapes");

  catalystToggle.addEventListener("change", function() {
    // Toggle the footer background transparency (with smooth transition)
    footer.classList.toggle("catalyst-footer", this.checked);

    // Toggle translucent black container, background video, and shapes
    quizContainer.classList.toggle("translucent-bg", this.checked);
    contentWrapper.classList.toggle("video-bg", this.checked);

    if (backgroundShapes) {
      backgroundShapes.style.display = this.checked ? "none" : "";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const catalystToggle = document.getElementById("footerBackgroundToggle");
  if (!catalystToggle) return;

  catalystToggle.addEventListener("change", function() {
    const checked = this.checked;
    // When catalyst is ON: force shapes off
    window.visualSettings.forceShapesOff = checked;
    // Remove stars, effects, etc if turning off
    if (!checked) {
      document.querySelector(".catalyst-stars")?.remove();
      document.getElementById("mainPage")?.classList.remove("translucent-bg");
      document.querySelector(".content-wrapper")?.classList.remove("video-bg");
      window.visualSettings.forceShapesOff = false;
    }
    // Always update UI
    window.visualSettings.updateAll();
  });
});
