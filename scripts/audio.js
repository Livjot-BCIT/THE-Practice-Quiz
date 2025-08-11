// audioManager.js

// Audio sources
const TRACKS = {
  default: "./audio/your-music.mp3",
  catalyst: "./audio/catalyst-theme.mp3",
  rain: "./audio/Rain.mp3",
  // add more: "themeName": "./audio/..."
};

let currentTheme = "default";
let fading = false;

// Utility: Fade audio out smoothly
function fadeOutAudio(audio, duration = 1100, callback) {
  if (!audio) return;
  fading = true;
  const step = 30;
  const startVolume = audio.volume;
  let elapsed = 0;
  function fade() {
    elapsed += step;
    let newVol = Math.max(0, startVolume * (1 - elapsed / duration));
    audio.volume = newVol;
    if (newVol > 0 && fading) {
      setTimeout(fade, step);
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = window.bgSlider.value; // restore slider value
      fading = false;
      if (callback) callback();
    }
  }
  fade();
}

// Change background music for a given theme
function playThemeMusic(theme) {
  if (!window.bgSound) return;

  // If changing theme, fade out current and then swap
  if (currentTheme !== theme) {
    fadeOutAudio(window.bgSound, 1100, () => {
      if (TRACKS[theme]) {
        window.bgSound.src = TRACKS[theme];
        window.bgSound.load();
        window.bgSound.volume = window.bgSlider.value;
        window.bgSound.loop = true;
        window.bgSound.play().catch(() => {}); // catch for autoplay block
        currentTheme = theme;
      }
    });
  } else {
    // If already on theme, just play/adjust volume
    window.bgSound.volume = window.bgSlider.value;
    if (window.bgSound.paused && TRACKS[theme]) {
      window.bgSound.play().catch(() => {});
    }
  }
}

// Handle global theme changes (call this from your theme logic!)
window.audioThemeManager = function (theme) {
  // If no music for this theme, fade out
  if (!TRACKS[theme]) {
    fadeOutAudio(window.bgSound, 1100, () => {
      window.bgSound.src = "";
      currentTheme = "default";
    });
    return;
  }
  playThemeMusic(theme);
};

window.playMenuClick = function () {
  // (add your menu SFX audio logic here in the future)
};
