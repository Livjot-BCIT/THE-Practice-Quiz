// -------- boot --------
// set one splash on load using the weighted picker
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("splashText");
  if (el) el.textContent = __weightedPickSplash();
});

// -------- data --------
// global list of splashes I pull from
const splashTexts = [
  "Now with 100% more quizzes!",
  "Eat. Sleep. Quiz. Repeat.",
  "Powered by vanilla HTML, CSS & JS!",
  "Did you study today?",
  "Who needs sleep anyway?",
  "Try the impossible quiz!",
  "You're a QUIZard Harry!",
  "CTRL+S is your friend.",
  "Now with even more bugs!",
  "Did you know? Quizzes are fun!",
  "Smarter than your calculator!",
  "May cause excessive learning!",
  'Why do all of these end in a "!"?',
  "Only slightly cursed.",
  "Not tested on animals.",
  "As seen on TV! (Not really.)",
  "Insert witty comment here.",
  "No refunds!",
  "The mitochondria is the powerhouse of the cell.",
  "Ctrl+C, Ctrl+V champion!",
  "Teachers hate this one simple trick!",
  "Actually useful. Sometimes.",
  "Useful 100% of the time, 50% of the time.",
  "Posture Check!",
  "Stay hydrated!",
  "404: Funny splash not found.",
  "Can someone draw me a logo?",
  "stop(); Hammertime!",
  "Comments should be meaningful.",
  "It's probably a feature and not a bug.",
  "console.log('Hello, World!');",
  "once upon a time, in a land far, far away...",
  "never gonna give you up, never gonna let you down!",
  "make sure to save your work often!",
  "be kind to your computer, it has feelings too!",
  "zero bugs, zero features!",
  "have you tried turning it off and on again?",
  "if at first you don't succeed, call it version 1.0!",
  "Yes, this idea came from Minecraft.",
  "Quizzes so easy, even your goldfish could pass.",
  "You are now breathing manually.",
  "Asking the real questions.",
  "Batteries not included.",
  "Always bet on B.",
  "It's dangerous to go alone! Take this quiz.",
  "Warning: May cause knowledge overflow.",
  "Press any key to continue...",
  "It's quiz o'clock somewhere!",
  "Don't quiz and drive.",
  "Do you know how I hate the rain..?",
  "Sometimes when I close my eyes, I can't see.",
  "I put the 'pro' in procrastinate.",
  "An apple a day keeps anyone away if you throw it hard enough.",
  "Don't give up on your dreams! Keep sleeping.",
  "If at first you don't succeed, skydiving is not for you.",
  "I used to think I was indecisive, but now I'm not so sure.",
  "How do you remember forgetting, but not what?",
  "I wasted like an hour on these, pls appreciate.",
  "Definitely not AI generated.",
  "Yes, comic sans is a deliberate choice.",
  "I worked on this instead of the site.",
  "l33t!",
  "Tell your friends!",
  "Try out a theme!",
  "Check out the credits!",
  "NP is not in P!",
  "sqrt(-1) love you!",
  "201% hyperbole!",
  'The Safe Word is "Bananas"!',
  "What is the air-speed velocity of an unladen swallow?",
  "Tis but a scratch!",
  "Senbonzakura Kageyoshi!",
  "My name is Inigo Montoya. You killed my father. Prepare to die!",
  "My Precious..!",
  "I am the one who knocks!",
  "Send me your lecture notes!",
  "Possesses the properties of both rubber and gum!",
  "Bottom Text",
];

// -------- public helpers --------
// lets me manually set the splash text somewhere else if I need to
function setSplashText(text) {
  const el = document.getElementById("splashText");
  if (el) el.textContent = text;
}

// -------- weighting config --------
// unseen splashes get a bit more weight so you see new ones first b4 repeats ideally
const UNSEEN_WEIGHT = 2;
const SEEN_WEIGHT = 1;

// -------- seen tracking (persistent) --------
// I remember "seen" across sessions using localStorage now

// storage key
const SEEN_KEY = "seenSplashes.v1"; // bump version if I wanna reset everyone

// migrate old session-based data once (if present)
(() => {
  try {
    const old = sessionStorage.getItem("seenSplashes");
    if (old && !localStorage.getItem(SEEN_KEY)) {
      localStorage.setItem(SEEN_KEY, old);
    }
    sessionStorage.removeItem("seenSplashes");
  } catch {}
})();

// helpers
function getSeenSplashes() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
  } catch {
    return [];
  }
}
function setSeenSplashes(arr) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {}
}

// -------- weighted picker --------
// picks an index favoring splashes user hasn't seen this yet this cycle
function pickSplashText() {
  const seen = getSeenSplashes();

  // build a weighted pool of indexes -> more entries = higher chance
  const pool = [];
  splashTexts.forEach((_, idx) => {
    const weight = seen.includes(idx) ? SEEN_WEIGHT : UNSEEN_WEIGHT;
    for (let i = 0; i < weight; i++) pool.push(idx);
  });

  // if something goes weird, fall back to uniform
  const pickIdx = pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : Math.floor(Math.random() * splashTexts.length);

  // mark as seen; when all seen, reset for a fresh cycle
  if (!seen.includes(pickIdx)) {
    seen.push(pickIdx);
    setSeenSplashes(seen);
  }
  if (seen.length === splashTexts.length) {
    setSeenSplashes([]); // start over next pick
  }

  return splashTexts[pickIdx];
}

const __weightedPickSplash = pickSplashText;

// -------- legacy compatibility --------
// some old code might call these; I keep them but route to the new picker

// original global that set a random splash directly
window.pickSplashText = function () {
  const splash = document.getElementById("splashText");
  if (splash) splash.textContent = __weightedPickSplash();
};

// original helper that *returned* a random splash
function getRandomSplash() {
  return __weightedPickSplash();
}

// -------- Old Legacy Code --------

// -------- seen tracking (session) --------
// I only remember “seen” for the current session; refresh resets bias
// function getSeenSplashes() {
//   try {
//     return JSON.parse(sessionStorage.getItem("seenSplashes")) || [];
//   } catch {
//     return [];
//   }
// }
// function setSeenSplashes(arr) {
//   sessionStorage.setItem("seenSplashes", JSON.stringify(arr));
// }
