// -------- Visual Settings Model --------
// Global object to store UI/visual preference state
window.visualSettings = {
  shapes: true,
  bgImage: true,
  effects: true,
  forceShapesOff: false,

  // Update all visuals based on current settings
  updateAll() {
    // Handle animated stars
    window.drawCatalystStars = this.effects;
    if (!this.effects && window.ctx && window.w && window.h) {
      window.ctx.clearRect(0, 0, window.w, window.h);
    }

    // Background shapes/images visibility
    document
      .querySelectorAll(".background-shapes, .background-images")
      .forEach((bg) => {
        bg.style.display = this.shapes && !this.forceShapesOff ? "" : "none";
      });

    // CSS background-image on ".bg" containers
    document.querySelectorAll(".bg").forEach((bgEl) => {
      bgEl.style.backgroundImage =
        this.shapes && !this.forceShapesOff ? "" : "none";
    });

    // SVG glow rectangles
    document.querySelectorAll(".pulse-rect").forEach((rect) => {
      rect.style.display = this.effects ? "" : "none";
    });

    // Overlay images (rain, background-image, background-video2)
    document
      .querySelectorAll(".background-image, .rain-img, .background-video2")
      .forEach((bgImg) => {
        bgImg.style.display = this.bgImage ? "" : "none";
      });

    // Quiz visual effects (stars, confetti, rain)
    [
      ...document.querySelectorAll(".catalyst-stars"),
      ...document.querySelectorAll(".confetti"),
      ...document.querySelectorAll(".rain-canvas, .rain-effect"),
    ].forEach((e) => {
      e.style.display = this.effects ? "" : "none";
    });

    // Update toggle button states
    document
      .getElementById("toggleShapes")
      ?.classList.toggle("active", this.shapes && !this.forceShapesOff);
    document
      .getElementById("toggleBgImage")
      ?.classList.toggle("active", this.bgImage);
    document
      .getElementById("toggleBgEffects")
      ?.classList.toggle("active", this.effects);
  },
};

// -------- Settings Save/Load --------
function saveSettings() {
  // Visual preferences
  localStorage.setItem("settings_shapes", window.visualSettings.shapes);
  localStorage.setItem("settings_bgImage", window.visualSettings.bgImage);
  localStorage.setItem("settings_effects", window.visualSettings.effects);

  // Audio preferences
  localStorage.setItem("settings_bgVolume", window.bgSlider?.value ?? 1);
  localStorage.setItem(
    "settings_bgMute",
    document.getElementById("muteBackground")?.classList.contains("active")
  );
  localStorage.setItem(
    "settings_menuVolume",
    document.getElementById("menuMusicVolume")?.value ?? 1
  );
  localStorage.setItem(
    "settings_menuMute",
    document.getElementById("muteMenu")?.classList.contains("active")
  );
}

function loadSettings() {
  // Visuals
  let shapes = localStorage.getItem("settings_shapes");
  let bgImage = localStorage.getItem("settings_bgImage");
  let effects = localStorage.getItem("settings_effects");
  window.visualSettings.shapes = shapes !== null ? shapes === "true" : true;
  window.visualSettings.bgImage = bgImage !== null ? bgImage === "true" : true;
  window.visualSettings.effects = effects !== null ? effects === "true" : true;

  // Apply settings to UI
  window.visualSettings.updateAll();

  // Audio
  let bgSlider = document.getElementById("backgroundVolume");
  let bgSound = document.getElementById("backgroundSound");
  let bgValue = document.getElementById("backgroundVolumeValue");
  let muteBgToggle = document.getElementById("muteBackground");

  let menuSlider = document.getElementById("menuMusicVolume");
  let menuValue = document.getElementById("menuMusicVolumeValue");
  let menuSound = document.getElementById("menuSound");
  let muteMenuToggle = document.getElementById("muteMenu");

  let bgVol = localStorage.getItem("settings_bgVolume");
  let bgMute = localStorage.getItem("settings_bgMute");
  let menuVol = localStorage.getItem("settings_menuVolume");
  let menuMute = localStorage.getItem("settings_menuMute");

  if (bgSlider && bgSound && bgValue) {
    if (bgVol !== null) {
      bgSlider.value = bgVol;
      bgSound.volume = bgVol;
      bgValue.textContent = Math.round(bgVol * 100) + "%";
    }
    muteBgToggle?.classList.toggle("active", bgMute === "true");
    if (bgMute === "true") {
      bgSound.volume = 0;
      bgSlider.value = 0;
      bgValue.textContent = "0%";
    }
  }

  if (menuSlider && menuSound && menuValue) {
    if (menuVol !== null) {
      menuSlider.value = menuVol;
      menuSound.volume = menuVol;
      menuValue.textContent = Math.round(menuVol * 100) + "%";
    }
    muteMenuToggle?.classList.toggle("active", menuMute === "true");
    if (menuMute === "true") {
      menuSound.volume = 0;
      menuSlider.value = 0;
      menuValue.textContent = "0%";
    }
  }
}

// -------- DOM: Initialize + Bind Events --------
document.addEventListener("DOMContentLoaded", () => {
  const toggleShapes = document.getElementById("toggleShapes");
  const toggleBgImage = document.getElementById("toggleBgImage");
  const toggleBgEffects = document.getElementById("toggleBgEffects");

  loadSettings();

  toggleShapes?.addEventListener("click", () => {
    if (window.visualSettings.forceShapesOff) return;
    window.visualSettings.shapes = !window.visualSettings.shapes;
    window.visualSettings.updateAll();
    saveSettings();
  });

  toggleBgImage?.addEventListener("click", () => {
    window.visualSettings.bgImage = !window.visualSettings.bgImage;
    window.visualSettings.updateAll();
    saveSettings();
  });

  toggleBgEffects?.addEventListener("click", () => {
    window.visualSettings.effects = !window.visualSettings.effects;
    window.visualSettings.updateAll();
    saveSettings();
  });

  // Set toggles ON by default if untouched
  if (localStorage.getItem("settings_shapes") === null)
    toggleShapes?.classList.add("active");
  if (localStorage.getItem("settings_bgImage") === null)
    toggleBgImage?.classList.add("active");
  if (localStorage.getItem("settings_effects") === null)
    toggleBgEffects?.classList.add("active");
});

// -------- Settings Gear/Menu Toggle --------
const toggleBtn = document.getElementById("settingsToggle");
const menu = document.getElementById("settingsContent");

toggleBtn?.addEventListener("click", (e) => {
  const willOpen = !menu.classList.contains("show");
  menu.classList.toggle("show");
  e.stopPropagation();
  toggleBtn.classList.remove("spin-open", "spin-close");
  toggleBtn.classList.add(willOpen ? "spin-open" : "spin-close");
  toggleBtn.addEventListener(
    "animationend",
    () => {
      toggleBtn.classList.remove("spin-open", "spin-close");
    },
    { once: true }
  );
});

document.addEventListener("click", (e) => {
  if (
    !menu.contains(e.target) &&
    !toggleBtn.contains(e.target) &&
    menu.classList.contains("show")
  ) {
    menu.classList.remove("show");
    toggleBtn.classList.remove("spin-open", "spin-close");
    toggleBtn.classList.add("spin-close");
    toggleBtn.addEventListener(
      "animationend",
      () => {
        toggleBtn.classList.remove("spin-close");
      },
      { once: true }
    );
  }
});

// -------- Tabs Logic --------
const tabs = document.querySelectorAll(".tab-button");
const iconBtns = document.querySelectorAll(".tab-icon-btn");
const contents = document.querySelectorAll(".tab-content");

function activateTab(index) {
  tabs.forEach((b) => b.classList.remove("active"));
  iconBtns.forEach((b) => b.classList.remove("active"));
  contents.forEach((c) => c.classList.remove("active"));
  if (tabs[index]) tabs[index].classList.add("active");
  if (iconBtns[index]) iconBtns[index].classList.add("active");
  if (contents[index]) contents[index].classList.add("active");
}

tabs.forEach((btn, i) => btn.addEventListener("click", () => activateTab(i)));
iconBtns.forEach((btn, i) =>
  btn.addEventListener("click", () => activateTab(i))
);

// -------- Background and Menu Music Logic --------
const bgValue = document.getElementById("backgroundVolumeValue");
window.bgSound = document.getElementById("backgroundSound");
window.bgSlider = document.getElementById("backgroundVolume");
const muteBgToggle = document.getElementById("muteBackground");

const menuSlider = document.getElementById("menuMusicVolume");
const menuValue = document.getElementById("menuMusicVolumeValue");
const menuSound = document.getElementById("menuSound");
const muteMenuToggle = document.getElementById("muteMenu");

bgSlider?.addEventListener("input", () => {
  bgValue.textContent = Math.round(bgSlider.value * 100) + "%";
  bgSound.volume = bgSlider.value;
  muteBgToggle?.classList.toggle("active", Number(bgSlider.value) === 0);
  saveSettings();
});
muteBgToggle?.addEventListener("click", () => {
  const isMuted = muteBgToggle.classList.toggle("active");
  bgSlider.value = isMuted ? 0 : 0.25;
  bgValue.textContent = isMuted ? "0%" : "25%";
  bgSound.volume = isMuted ? 0 : 0.25;
  saveSettings();
});

menuSlider?.addEventListener("input", () => {
  menuValue.textContent = Math.round(menuSlider.value * 100) + "%";
  menuSound.volume = menuSlider.value;
  muteMenuToggle?.classList.toggle("active", Number(menuSlider.value) === 0);
  saveSettings();
});
muteMenuToggle?.addEventListener("click", () => {
  const isMuted = muteMenuToggle.classList.toggle("active");
  menuSlider.value = isMuted ? 0 : 0.5;
  menuValue.textContent = isMuted ? "0%" : "50%";
  menuSound.volume = isMuted ? 0 : 0.5;
  saveSettings();
});
