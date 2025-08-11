// -------- helpers --------
// Small util so don't gotta repeat visibility checks everywhere
function isVisible(id) {
  const el = document.getElementById(id);
  return !!(el && !el.classList.contains("hidden"));
}

// -------- navbar action (primary button) --------
// Decides what the main navbar button should do depending on which screen is shown
function navbarAction() {
  // Quiz screen -> submit answers
  if (isVisible("quizScreen")) {
    submitQuiz();
    return;
  }
  // Results screen -> restart same quiz
  if (isVisible("resultsScreen")) {
    restartQuiz();
    return;
  }
  // Main page -> start a new quiz
  if (isVisible("mainPage")) {
    startQuiz();
    return;
  }
  // Review screen -> go back to results
  if (isVisible("reviewScreen")) {
    goToResults();
  }
}

// -------- navbar button label/icon --------
// Updates tooltip + icon based on current screen
function updateNavbarActionBtn() {
  const btn = document.getElementById("navbarActionBtn");
  if (!btn) return; // fail-safe if markup changed

  let icon = "./images/Start.png";
  let title = "Start Quiz";

  // Quiz screen -> submit
  if (isVisible("quizScreen")) {
    title = "Submit Quiz";
    icon = "./images/Submit.png";
  }
  // Results screen -> restart
  else if (isVisible("resultsScreen")) {
    title = "Restart Quiz";
    icon = "./images/Restart.png";
  }
  // Main page -> start (defaults already set)
  else if (isVisible("mainPage")) {
    title = "Start Quiz";
    icon = "./images/Start.png";
  }
  // Review screen -> results
  else if (isVisible("reviewScreen")) {
    title = "Results";
    icon = "./images/Start.png";
  }

  // Apply title + icon safely
  btn.title = title;
  const img = btn.querySelector("img");
  if (img) img.src = icon;
}

// -------- timer utils --------
// Timer state kept here so I can pause/resume and show frozen time
let quizTimer = null;
let quizTimerSeconds = 0;
let showingQuizTimer = false;
let frozenQuizTime = null; // stored as formatted string for results/review

// Month abbreviations for the clock
function getMonthName(num) {
  return [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][num];
}

// Formats seconds as M:SS (e.x., 1:05)
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// -------- navbar center: clock (idle state) --------
// Shows current date/time (24h) in America/Vancouver when a quiz isn't running
function showCurrentDateTime() {
  showingQuizTimer = false;
  if (quizTimer) clearInterval(quizTimer);

  const center = document.getElementById("navbarCenter");
  if (!center) return;

  function updateDate() {
    // If a quiz timer is visible, do not overwrite it
    if (showingQuizTimer) return;

    const now = new Date();
    const month = getMonthName(now.getMonth());
    const dateString =
      `${month} ${now.getDate()}, ${now.getFullYear()} | ` +
      now.toLocaleTimeString("en-CA", {
        hour12: false,
        timeZone: "America/Vancouver",
      });

    center.textContent = dateString;
  }

  updateDate();
  quizTimer = setInterval(updateDate, 1000);
}

// -------- navbar center: quiz timer (running) --------
// Starts a 1-second ticking timer in the navbar center
function startQuizTimer() {
  showingQuizTimer = true;
  quizTimerSeconds = 0;
  frozenQuizTime = null;

  if (quizTimer) clearInterval(quizTimer);

  const center = document.getElementById("navbarCenter");
  if (!center) return;

  center.textContent = formatTime(quizTimerSeconds);

  quizTimer = setInterval(() => {
    quizTimerSeconds++;
    center.textContent = formatTime(quizTimerSeconds);
  }, 1000);
}

// -------- freeze timer (on submit) --------
// Freezes and shows the last timer value so Results/Review can display it
function stopQuizTimer() {
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = null;

  frozenQuizTime = formatTime(quizTimerSeconds);

  const center = document.getElementById("navbarCenter");
  if (!center) return;

  center.textContent = frozenQuizTime;
}

// -------- show frozen time (results/review) --------
// Writes the frozen time back into the navbar (or 0:00 if none)
function showFrozenQuizTime() {
  if (quizTimer) clearInterval(quizTimer);

  const center = document.getElementById("navbarCenter");
  if (!center) return;

  center.textContent = frozenQuizTime || "0:00";
}
