// BG shapes
document.addEventListener("DOMContentLoaded", function () {
  const rainToggle = document.getElementById("rainBackgroundToggle");
  const backgroundShapes = document.querySelector(".background-shapes");

  rainToggle.addEventListener("change", function() {

    if (backgroundShapes) {
      backgroundShapes.style.display = this.checked ? "none" : "";
    }
  });
});

// BG image (the 4 phat circles)
document.addEventListener("DOMContentLoaded", function () {
  const rainToggle = document.getElementById("rainBackgroundToggle");
  if (!rainToggle) return;

  rainToggle.addEventListener("change", function() {
    const checked = this.checked;
    // When rain is ON; force shapes off
    window.visualSettings.forceShapesOff = checked;
    // Remove rain if turning off
    if (!checked) {
      window.visualSettings.forceShapesOff = false;
    }
    window.visualSettings.updateAll();
  });
});
