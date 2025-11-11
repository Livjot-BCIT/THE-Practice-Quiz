// -------- state --------
// Assuming QUIZZES is already loaded and available
let currentQuiz = QUIZZES[0]; // default to first quiz
let currentExam = null;

// -------- boot --------
// Wire dropdown + render defaults on load
document.addEventListener("DOMContentLoaded", () => {
  // Safely grab the quiz selector; bail if it's missing
  const dropdown = document.getElementById("quizTitleDropdown");
  if (dropdown) {
    // When the dropdown changes, swap the active quiz and rebuild UI
    dropdown.addEventListener("change", function () {
      const selectedId = this.value;
      const quiz = QUIZZES.find((q) => q.id === selectedId);
      if (quiz) {
        currentQuiz = quiz;
        generateExamList();
        loadChapters();
        updateQuestionCountVisibility?.();
      }
      // Layout nudge in case the page cares
      adjustSpacer?.();
    });
  }

  // Build initial lists for the default quiz
  generateExamList();
  loadChapters();
});

// -------- heading helper --------
// Show/hide the heading directly before a list (e.x., an <h3> before <ul>)
function toggleHeadingForList(listEl, show) {
  if (!listEl) return;
  const heading = listEl.previousElementSibling;
  if (heading && /^H\d$/i.test(heading.tagName)) {
    heading.style.display = show ? "" : "none";
  }
}

// -------- term mode UI --------
// Hide labels/exams and optionally “Start” when showing special term content
function setTermMode(on) {
  // Grab all the bits we might hide
  const examLabel = document.getElementById("examLabel");
  const chaptersLabel = document.getElementById("chaptersLabel");
  const examsList = document.getElementById("examsList");
  const quizstats = document.getElementById("quizStatsPanel");
  const questionspanel = document.getElementById("questions");
  const startBtn = document.getElementById("startQuizBtn");

  // Toggle visibility for the term layout
  if (examLabel) examLabel.style.display = on ? "none" : "";
  if (chaptersLabel) chaptersLabel.style.display = on ? "none" : "";
  if (examsList) examsList.style.display = on ? "none" : "";
  if (quizstats) quizstats.style.display = on ? "none" : "";
  if (questionspanel)
    questionspanel.style.setProperty("display", "none", "important");
  if (startBtn) startBtn.style.display = on ? "none" : "";

  // Debug snapshot so I can see what the DOM had at runtime
  console.log("setTermMode", {
    on,
    found: {
      examLabel: !!examLabel,
      chaptersLabel: !!chaptersLabel,
      examsList: !!examsList,
      quizstats: !!quizstats,
      questionspanel: !!questionspanel,
      startBtn: !!startBtn,
    },
  });
}

// -------- chapters loader --------
// Fills the chapters list from a JSON file
function loadChapters() {
  const chaptersList = document.getElementById("chaptersList");
  if (!chaptersList) return;
  chaptersList.innerHTML = "";

  // If special HTML (inline) is defined for this quiz, show it and enter term mode
  if (SPECIAL_QUIZ_CONTENT[currentQuiz.id]?.html) {
    setTermMode(true);
    chaptersList.style.display = "block";
    chaptersList.innerHTML = SPECIAL_QUIZ_CONTENT[currentQuiz.id].html;
    return;
  }

  // Otherwise go back to normal mode
  setTermMode(false);

  // Some IDs explicitly suppress chapters, shoutout felix for saving me time
  if (currentQuiz.id === "1712" || currentQuiz.id === "2714") {
    generateChapterList([]);
    return;
  }

  // Fetch chapters JSON and render
  const xhr = new XMLHttpRequest();
  xhr.open("GET", currentQuiz.chaptersFile, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        generateChapterList(data.chapters);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
  };
  xhr.send();
}

// -------- responsive columns helper --------
// Pick a column width based on how many chapters there are
function getColumnSize(chapterCount) {
  if (chapterCount <= 4) return 4;
  if (chapterCount <= 6) return 3;
  if (chapterCount <= 8) return 4;
  if (chapterCount <= 10) return 5;
  if (chapterCount <= 12) return 6;
  return 6;
}

// -------- chapters builder --------
// Builds the checkbox grid (or drops in special HTML if provided)
function generateChapterList(chapters) {
  const chaptersList = document.getElementById("chaptersList");
  if (!chaptersList) return;
  chaptersList.innerHTML = "";

  // Ensure neither column is “muted” before we start
  muteChapters(false);
  muteExams(false);

  // If special chapters HTML exists for this quiz, just render that
  if (SPECIAL_QUIZ_CONTENT[currentQuiz.id]?.chapters) {
    chaptersList.style.display = "block";
    chaptersList.innerHTML = SPECIAL_QUIZ_CONTENT[currentQuiz.id].chapters;
    return;
  }

  // Use a flex shelf for chapter columns
  chaptersList.style.display = "flex";
  chaptersList.style.gap = "28px";

  // Decide column size; mobile uses a tighter column
  const isMobile = window.innerWidth <= 549;
  const colSize = isMobile ? getColumnSize(chapters.length) : 4;

  // We build <ul> columns on the fly
  let colUl = null;

  // Walk each chapter and create checkbox + label + tooltip
  chapters.forEach((chapter, idx) => {
    if (idx % colSize === 0) {
      colUl = document.createElement("ul");
      colUl.className = "chapters-col";
      colUl.style.listStyle = "none";
      colUl.style.padding = "0";
      colUl.style.margin = "0";
      chaptersList.appendChild(colUl);
    }

    const li = document.createElement("li");
    li.style.marginBottom = "10px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("chapter");
    checkbox.id = `chapter${chapter.id}`;
    checkbox.value = chapter.id;

    const wrapper = document.createElement("span");
    wrapper.className = "custom-tooltip-wrapper";

    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.textContent = chapter.name;

    const tooltip = document.createElement("span");
    tooltip.className = "custom-tooltip-text";
    tooltip.textContent = chapter.topic || "";

    wrapper.appendChild(label);
    wrapper.appendChild(tooltip);

    li.appendChild(checkbox);
    li.appendChild(wrapper);
    colUl.appendChild(li);
  });

  // For muted quizzes, wire the cross-muting interactions
  if (MUTED_QUIZ.includes(currentQuiz.id)) addMutingLogic();
}

// -------- exams builder --------
// Builds the exams list (with “Clear Selected” slotted into the first column)
function generateExamList() {
  const examsList = document.getElementById("examsList");
  if (!examsList) return;
  examsList.innerHTML = "";

  // Reset muting before we repopulate
  muteChapters(false);
  muteExams(false);

  // If the quiz uses term-mode, hide exams entirely
  if (SPECIAL_QUIZ_CONTENT[currentQuiz.id]?.html) {
    setTermMode(true);
    examsList.innerHTML = "";
    return;
  }

  // Otherwise, normal layout
  setTermMode(false);

  // If there’s particular exam HTMLs, render that
  if (SPECIAL_QUIZ_CONTENT[currentQuiz.id]?.exams) {
    const ul = document.createElement("ul");
    ul.style.paddingLeft = "0";
    ul.style.listStyle = "none";
    ul.innerHTML = SPECIAL_QUIZ_CONTENT[currentQuiz.id].exams;
    examsList.appendChild(ul);
    return;
  }

  // Clone the array so we can splice without touching source
  const exams = currentQuiz.exams;
  const examOptions = exams.slice();
  const columns = [];

  // First column: first 2 exams + “Clear Selected” as #3 no matter what
  const firstCol = [];
  for (let i = 0; i < 2 && examOptions.length; i++)
    firstCol.push(examOptions.shift());
  firstCol.push("Clear Selected");
  columns.push(firstCol);

  // Remaining columns: chunks of 3
  while (examOptions.length) columns.push(examOptions.splice(0, 3));

  // Render each column into its own <ul>
  columns.forEach((colExams, colIdx) => {
    const ul = document.createElement("ul");
    ul.className = "exams-col";
    ul.style.listStyle = "none";
    ul.style.padding = "0";

    colExams.forEach((exam, i) => {
      const li = document.createElement("li");

      if (exam === "Clear Selected") {
        // Special radio for “Clear Selected” for inf uses
        const noneRadio = document.createElement("input");
        noneRadio.type = "radio";
        noneRadio.name = "exam";
        noneRadio.id = "examNone";
        noneRadio.value = "None";

        const noneLabel = document.createElement("label");
        noneLabel.setAttribute("for", noneRadio.id);
        noneLabel.textContent = "Clear Selected";

        // When chosen, clear all and immediately uncheck the radio
        noneRadio.addEventListener("change", function () {
          handleExamSelection("None");
          setTimeout(() => {
            this.checked = false;
            if (MUTED_QUIZ.includes(currentQuiz.id)) muteChapters(false);
          }, 0);
        });

        li.appendChild(noneRadio);
        li.appendChild(noneLabel);
      } else {
        // Normal exam radio
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "exam";
        radio.classList.add("exam");
        radio.id = `exam${colIdx}_${i}`;
        radio.value = exam;

        const label = document.createElement("label");
        label.setAttribute("for", radio.id);
        label.textContent = exam;

        radio.addEventListener("change", () => handleExamSelection(exam));

        li.appendChild(radio);
        li.appendChild(label);
      }

      ul.appendChild(li);
    });

    examsList.appendChild(ul);
  });

  // Quiz 1537 uses the muting behavior too
  if (currentQuiz.id === "1537") addMutingLogic();
}

// -------- exam selection → chapter selection bridge --------
// Selects chapters based on the chosen exam for the *current* quiz
function handleExamSelection(exam) {
  const chapterCheckboxes = document.querySelectorAll(".chapter");

  // Always start by clearing any existing picks
  chapterCheckboxes.forEach((checkbox) => (checkbox.checked = false));

  // Midterms: take the first N chapters (if defined on the quiz)
  if (exam === "Midterms" && currentQuiz.midtermCount) {
    chapterCheckboxes.forEach((checkbox, index) => {
      if (index < currentQuiz.midtermCount) checkbox.checked = true;
    });
    return;
  }

  // Finals/Final: take up to the quiz’s finalCount (fallback: select all)
  if (exam === "Finals" || exam === "Final") {
    const cap = Number.isFinite(currentQuiz.finalCount)
      ? currentQuiz.finalCount
      : chapterCheckboxes.length;
    chapterCheckboxes.forEach((checkbox, index) => {
      if (index < cap) checkbox.checked = true;
    });
  }
}

// -------- mute helpers --------
// Adds/removes a .muted class to the chapters container
function muteChapters(mute) {
  const chaptersList = document.getElementById("chaptersList");
  if (!chaptersList) return;
  chaptersList.classList.toggle("muted", !!mute);
}

// Adds/removes a .muted class to the exams container
function muteExams(mute) {
  const examsList = document.getElementById("examsList");
  if (!examsList) return;
  examsList.classList.toggle("muted", !!mute);
}

// -------- per-quiz muting rules --------
// These quizzes should mute one panel when the other is used
const MUTED_QUIZ = ["1537", "2537"];

// -------- muting wiring --------
// Wires event listeners so chapters <-> exams mute each other when needed
function addMutingLogic() {
  // Only run this behavior if the current quiz is in the list
  if (!MUTED_QUIZ.includes(currentQuiz.id)) {
    muteChapters(false);
    muteExams(false);
    return;
  }

  // When any exam is selected, mute the chapters column
  document.querySelectorAll(".exam").forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.checked) muteChapters(true);
    });
  });

  // When any chapter is checked, mute the exams column
  document.querySelectorAll(".chapter").forEach((chk) => {
    chk.addEventListener("change", function () {
      if (this.checked) muteExams(true);
    });
  });

  // If no exam is selected anymore, unmute chapters
  document.querySelectorAll(".exam").forEach((radio) => {
    radio.addEventListener("change", function () {
      if (!this.checked) muteChapters(false);
    });
  });

  // If no chapter is checked anymore, unmute exams
  document.querySelectorAll(".chapter").forEach((chk) => {
    chk.addEventListener("change", function () {
      const anyChecked = Array.from(document.querySelectorAll(".chapter")).some(
        (c) => c.checked
      );
      if (!anyChecked) muteExams(false);
    });
  });
}

// -------- term placeholders --------
// Images/messages to show for “term mode” placeholders
const TERM_IMAGES = [
  { src: "images/chapters/term/404-0.png", alt: "Excadrill" },
  { src: "images/chapters/term/404-1.png", alt: "Driving in my car" },
  { src: "images/chapters/term/404-2.png", alt: "007" },
  { src: "images/chapters/term/404-3.png", alt: "Kiwism" },
  { src: "images/chapters/term/404-4.png", alt: "X and Y's Betrayal" },
  { src: "images/chapters/term/404-5.png", alt: "I be coolin bra" },
  { src: "images/chapters/term/404-6.png", alt: "Good Ole TCP" },
  { src: "images/chapters/term/404-7.png", alt: "Candy bars." },
  { src: "images/chapters/term/404-8.png", alt: "I'm simply at a loss" },
  { src: "images/chapters/term/404-9.png", alt: "Rats" },
  { src: "images/chapters/term/404-10.png", alt: "Insert brain damage here" }
];

const TERM_MESSAGES = [
  "Come back soon.",
  "Under construction, fresh content on the way.",
  "Cooking up something tasty for this term.",
  "This space is intentionally left blank (for now).",
  "Soon™.",
  "Enjoying the Images?",
  "404",
];

// -------- tiny array helper --------
// Returns one random item from an array
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -------- special per-quiz HTML --------
// Use this to override chapters/exams with custom markup
const SPECIAL_QUIZ_CONTENT = {
  1712: {
    chapters: `
      <li>
        <span style="color:#FFD600;font-weight:700;">Chapters Locked!<br>
        <em style="color:#bbb;">To unlock these chapters, <br> please send at least 17 cookies or $12 to me.</em><br>
        </span>
      </li>
    `,
    exams: `
      <li>
        <a href="https://quiz.comp1712.ca/" target="_blank" style="font-weight: bold; color: var(--color-accent-focus);">
          Felix's 1712 Practice Site! (Carried my 1712)
        </a>
      </li>
      <li>
        <a href="https://docs.google.com/document/d/1MOVpEVdHEbigwvpJk2h_6VJ49L0uOAlseSyCwteGMNc/edit?tab=t.0#heading=h.68uhzrit5yis" target="_blank" style="font-weight: bold; color: var(--color-accent-focus);">
          Old Testament
        </a>
      </li>
      <li>
        <a href="https://docs.google.com/document/d/1te3-P5Rm_u4fdDsJFVOWigXhoSgLdk8tMQN2CvaR7pk/edit?tab=t.0#heading=h.68uhzrit5yis" target="_blank" style="font-weight: bold; color: var(--color-accent-focus);">
          New Testament
        </a>
      </li>
    `,
  },
  2714: {
    chapters: `
      <li>
        <span style="color:#FFD600;font-weight:700;">Chapters Still Locked!<br>
        <em style="color:#bbb;">To unlock these chapters... <br> please take the final for me and get at least 98%</em><br>
        </span>
      </li>
    `,
    exams: `
      <li>
        <a href="https://sequel.comp1712.ca/" target="_blank" style="font-weight: bold; color: var(--color-accent-focus);">
          Felix's 2714 Practice Site!
        </a>
      </li>
    `,
  },
  term: {
    html: (() => {
      const img = pickRandom(TERM_IMAGES);
      const msg = pickRandom(TERM_MESSAGES);
      return `
        <div style="display:flex;justify-content:center;">
        <div style="max-width:720px;width:92%;background:#1e1e1e;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;text-align:center;">
          <!-- ratio box so object-fit works -->
          <div style="position:relative; width:100%; aspect-ratio: 16 / 9; max-height: 420px;">
            <img id="termHero"
                 src="${img.src}" alt="${img.alt}"
                 style="position:absolute; inset:0; width:100%; height:100%;"> // display:block; object-fit:contain; object-position:center;
          </div>
          <div style="padding:14px 16px 18px;">
            <div style="font-weight:800;font-size:1.15rem;margin:0 0 6px;">Nothing here yet!</div>
            <div style="opacity:.9;font-size:.98rem;">${msg}</div>
          </div>
        </div>
      </div>
      <script>
        (function(){
          const img = document.getElementById('termHero');
          if (!img) return;
          function applyHeroFit(){
            // Use contain on all devices to always see the whole image
            img.style.objectFit = 'contain';
            img.style.objectPosition = '50% 50%'; // center horizontally & vertically
            img.style.backgroundColor = '#1e1e1e'; // fills letterbox space
          }
          applyHeroFit();
          window.addEventListener('resize', applyHeroFit, { passive: true });
        })();
      </script>
    `;
    })(),
  },
  // add more quiz IDs here as needed
};
