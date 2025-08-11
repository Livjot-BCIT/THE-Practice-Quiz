// -------- GRAB DOM NODES --------
const devNotesModal = document.getElementById("devNotesModal");
const devNotesBtn = document.getElementById("devNotesBtn");
const closeDevModal = document.getElementById("closeDevModal");

const copyrightBtn = document.getElementById("copyrightBtn");
const creditsModal = document.getElementById("creditsModal");
const closeCreditsModal = document.getElementById("closeCreditsModal");

// small helper -> only bind if the element exists
const on = (el, type, handler) => el && el.addEventListener(type, handler);

// -------- DEV NOTES MODAL --------
// open -> show modal + mute splash
on(devNotesBtn, "click", () => {
  if (!devNotesModal) return;
  devNotesModal.style.display = "block";
  muteSplashText(true);
});

// close -> hide modal + unmute splash
on(closeDevModal, "click", () => {
  if (!devNotesModal) return;
  devNotesModal.style.display = "none";
  muteSplashText(false);
});

// click outside -> close
on(devNotesModal, "click", (e) => {
  if (e.target === devNotesModal) {
    devNotesModal.style.display = "none";
    muteSplashText(false);
  }
});

// -------- CREDITS MODAL --------
// open -> show modal + mute splash
on(copyrightBtn, "click", () => {
  if (!creditsModal) return;
  creditsModal.style.display = "block";
  muteSplashText(true);
});

// close (X) -> hide modal + unmute splash
on(closeCreditsModal, "click", () => {
  if (!creditsModal) return;
  creditsModal.style.display = "none";
  muteSplashText(false);
});

// click outside -> close
on(creditsModal, "click", (e) => {
  if (e.target === creditsModal) {
    creditsModal.style.display = "none";
    muteSplashText(false);
  }
});

// -------- HELPER --------
// toggles the splash text vibe when a modal is up
function muteSplashText(enable) {
  const splash = document.getElementById("splashText");
  if (!splash) return;
  if (enable) splash.classList.add("muted");
  else splash.classList.remove("muted");
}

// -------- LEGACY / UNUSED CODE --------
// old inline-handler version (kept for reference)
//
// document.getElementById("devNotesBtn").onclick = function () {
//   document.getElementById("devNotesModal").style.display = "block";
//   muteSplashText(true);
// };
// document.querySelector(".close-modal").onclick = function () {
//   document.getElementById("devNotesModal").style.display = "none";
//   muteSplashText(false);
// };
// window.onclick = function (event) {
//   const modal = document.getElementById("devNotesModal");
//   if (event.target === modal) modal.style.display = "none";
//   muteSplashText(false);
// };
