function renderQuizStatsPanel() {
  const panel = document.getElementById("quizStatsPanel");
  let stats = JSON.parse(localStorage.getItem("quizStats") || "[]");
  if (!panel) return;

  // When there’s no history yet, show an empty state
  if (!stats.length) {
    panel.innerHTML = `<div style="color: var(--color-text-muted);">No recent quiz stats yet. Complete a quiz to see your stats here!<br> Stores last 20 attempts.</div>`;
    return;
  }

  // Build the stats table
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:7px;font-size:1.14em;">
      <span>Quiz History</span>
      <button class="quiz-clear-btn" title="Clear All" style="font-size:1.0em; background:none; border:none; color:#aaa; cursor:pointer; padding:0 7px;">Clear All</button>
    </div>
    <div class="quiz-stats-table-wrap">
      <table class="quiz-stats-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Class</th>
            <th>Quiz Time</th>
            <th>Quiz Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${stats
            .map(
              (s, i) => `
            <tr>
              <td>${formatDate(s.date)}</td>
              <td>${s.class}</td>
              <td>${s.time}</td>
              <td>${s.score}</td>
              <td>
                <button class="quiz-remove-btn" title="Remove" data-index="${i}" style="font-size:1.1em;background:none;border:none;color:#e66;cursor:pointer;">✕</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  // Formats a date based on viewport width (mobile/tablet/desktop)
  function formatDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d)) return "";

    const w = window.innerWidth;

    // mobile
    if (w <= 550) {
      return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    }

    // Small tablet
    if (w <= 849) {
      return d.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // 850–949: show date + time
    if (w >= 850 && w <= 949) {
      return (
        d.toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("en-CA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    }

    // 950–1124: date only
    if (w >= 950 && w < 1124) {
      return d.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // 1250–1650: date only
    if (w >= 1250 && w < 1650) {
      return d.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // Desktop: date + time
    return (
      d.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-CA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }

  // connect/wire “remove row” buttons
  panel.querySelectorAll(".quiz-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-index");
      let stats = JSON.parse(localStorage.getItem("quizStats") || "[]");
      stats.splice(idx, 1);
      localStorage.setItem("quizStats", JSON.stringify(stats));
      renderQuizStatsPanel();
    });
  });

  // Wire “clear all” button
  panel.querySelector(".quiz-clear-btn").addEventListener("click", async () => {
    const ok = await niceConfirm({
      title: "Clear all quiz history?",
      confirmText: "Clear",
      icon: "warning",
    });
    if (!ok) return;
    localStorage.removeItem("quizStats");
    renderQuizStatsPanel();
    niceToast("History cleared");
  });
}

// inputs + initial panels
document.addEventListener("DOMContentLoaded", () => {
  // Guard in case the count select is missing on some pages
  const qc = document.getElementById("questionCount");
  if (qc) qc.addEventListener("change", updateQuestionCount);

  // Show clock (navbar) on landing and render stats panel
  showCurrentDateTime();
  renderQuizStatsPanel();
});

// State for current run
let questionsData = [];
let selectedQuestions = [];
let numQuestions = 10; // Default question count

// Keep numQuestions synced with the UI
function updateQuestionCount() {
  const el = document.getElementById("questionCount");
  if (!el) return;
  numQuestions = parseInt(el.value);
}

// Kicks off a run using the selected quiz/exam/chapters
function startQuiz() {
  const quizDropdown = document.getElementById("quizTitleDropdown");
  if (!quizDropdown) return;

  const selectedQuizId = quizDropdown.value;
  const selectedQuiz = QUIZZES.find((q) => q.id === selectedQuizId);

  const checkedExam = document.querySelector('input[name="exam"]:checked');
  const selectedExam = checkedExam ? checkedExam.value : null;

  // Set up review meta for special exam banks
  function getBaseFilename(path) {
    return path.replace(/^.*\/|\..*$/g, "");
  }

  // Midterm bank (if defined in quiz config)
  if (selectedQuiz && selectedExam === "Midterms" && selectedQuiz.midtermBank) {
    const base = getBaseFilename(selectedQuiz.midtermBank);
    window._lastReviewMeta = {
      subject: selectedQuiz.folderName,
      chapterOrExam: base,
    };
    loadSpecialBank(selectedQuiz.midtermBank);
    return;
  }

  // Final bank (supports “Finals”/“Final”)
  if (
    selectedQuiz &&
    (selectedExam === "Finals" || selectedExam === "Final") &&
    selectedQuiz.finalBank
  ) {
    const base = getBaseFilename(selectedQuiz.finalBank);
    window._lastReviewMeta = {
      subject: selectedQuiz.folderName,
      chapterOrExam: base,
    };
    loadSpecialBank(selectedQuiz.finalBank);
    return;
  }

  // Other custom exam banks
  if (
    selectedQuiz &&
    selectedQuiz.examBanks &&
    selectedQuiz.examBanks[selectedExam]
  ) {
    const examBankFile = selectedQuiz.examBanks[selectedExam];
    const base = getBaseFilename(examBankFile);
    window._lastReviewMeta = {
      subject: selectedQuiz.folderName,
      chapterOrExam: base,
    };
    loadSpecialBank(examBankFile);
    return;
  }

  // Collect chosen chapters
  const selectedChapters = Array.from(
    document.querySelectorAll(".chapter:checked")
  ).map((checkbox) => checkbox.value);

  // Require at least one chapter
  if (selectedChapters.length === 0) {
    niceAlert("Please select at least one chapter.", "warning");
    return;
  }

  // Build answer-key metadata (use actual filenames, minus .json)
  const chapterFiles = selectedChapters.map((chapterNum) => {
    let file =
      selectedQuiz.chapterFilenames && selectedQuiz.chapterFilenames[chapterNum]
        ? selectedQuiz.chapterFilenames[chapterNum]
        : chapterNum;
    if (file.endsWith(".json")) file = file.replace(/\.json$/, "");
    return file;
  });
  window._lastReviewMeta = {
    subject: selectedQuiz.folderName,
    chapters: chapterFiles,
  };

  // Load chapter questions asynchronously and proceed when done
  loadQuestionsForChapters(selectedChapters);

  // UI updates while loading
  updateNavbarActionBtn();
  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
}

// Loads a single “special bank” JSON file (midterm/final/custom)
function loadSpecialBank(bankFile) {
  questionsData = [];

  // Flip to the quiz screen and show a loader
  document.getElementById("mainPage")?.classList.add("hidden");
  document.getElementById("quizScreen")?.classList.remove("hidden");
  const qc = document.getElementById("quizContainer");
  if (qc) qc.innerHTML = "<p>Loading questions...</p>";

  // Fetch the bank JSON
  const xhr = new XMLHttpRequest();
  xhr.open("GET", bankFile, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;

    // Success -> parse and normalize
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        questionsData = Array.isArray(data)
          ? data.map((qObj, i) => ({
              ...qObj,
              qid: qObj.qid || `special_${i}`,
            }))
          : Object.entries(data).map(([qid, qObj]) => ({ ...qObj, qid }));

        if (!questionsData.length) {
          niceAlert("No questions available in this bank.");
          goHome();
          return;
        }
        proceedWithQuiz();
      } catch {
        niceAlert("Error parsing questions data for this bank!");
        goHome();
      }
      return;
    }

    // Failure -> bounce home
    niceAlert(`Failed to load question bank. Status: ${xhr.status}`);
    goHome();
  };
  xhr.send();
}

// Detects if a question is TF / multi / single based on choices
function detectQuestionType(qObj) {
  const choiceCount = Object.keys(qObj.choices).length;
  const correctCount = Object.values(qObj.choices).filter(
    (c) => c.correct
  ).length;

  // True/False = exactly two choices with True/False labels
  if (
    choiceCount === 2 &&
    qObj.choices.A &&
    qObj.choices.B &&
    ["True", "False"].every((opt) =>
      [qObj.choices.A.choice, qObj.choices.B.choice].includes(opt)
    )
  ) {
    return "tf";
  }

  // More than one correct -> multi
  if (correctCount > 1) return "multi";

  // Otherwise single
  return "single";
}

// Loads questions for all selected chapters, then proceeds
function loadQuestionsForChapters(chapters) {
  questionsData = [];
  let loadedCount = 0;
  const failedChapters = [];

  // Flip to the quiz screen and show a loader
  document.getElementById("mainPage")?.classList.add("hidden");
  document.getElementById("quizScreen")?.classList.remove("hidden");
  const qc = document.getElementById("quizContainer");
  if (qc) qc.innerHTML = "<p>Loading questions...</p>";

  const folder = currentQuiz.folderName;

  // Fire off one XHR per chapter
  chapters.forEach((chapter) => {
    let filename;

    // Explicit mapping (per-quiz override)
    if (currentQuiz.chapterFilenames && currentQuiz.chapterFilenames[chapter]) {
      filename = currentQuiz.chapterFilenames[chapter];
    } else if (currentQuiz.chapterFilePattern) {
      // Pattern-based naming e.g. CH{num}.json
      filename = currentQuiz.chapterFilePattern.replace(
        "{num}",
        chapter.padStart(2, "0")
      );
    } else {
      // Fallback naming
      filename = `${folder}CH${chapter.padStart(2, "0")}.json`;
    }

    // Fetch the chapter JSON
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `./questiondata/chapters/${folder}/${filename}`, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      const chapterNum = chapter.replace(/^0+/, "");

      // Success -> parse and append
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          const newQuestions = Object.entries(data).map(([qid, qObj]) => ({
            ...qObj,
            qid,
          }));
          questionsData = questionsData.concat(newQuestions);
        } catch {
          failedChapters.push(chapterNum);
        }
      } else {
        failedChapters.push(chapterNum);
      }

      // When all requests finished, decide next
      loadedCount++;
      if (loadedCount === chapters.length) {
        if (!questionsData.length) {
          niceAlert(
            "No questions currently exist for the selected chapter(s)."
          );
          goHome();
          return;
        }
        if (failedChapters.length > 0) {
          niceAlert(
            "WARNING! No questions available for: Chapter(s) " +
              failedChapters.join(", ")
          );
        }
        proceedWithQuiz();
      }
    };
    xhr.send();
  });
}

// Moves from loading -> showing questions
function proceedWithQuiz() {
  // Must have something to display
  if (!questionsData.length) {
    niceAlert("No questions available for the selected chapters.");
    restartQuiz();
    return;
  }

  // attach the requested count to the available pool
  let questionsToShow = numQuestions;
  if (numQuestions > questionsData.length || numQuestions > 1000000) {
    questionsToShow = questionsData.length;
  }

  // Pick and render questions
  selectedQuestions = getRandomQuestions(questionsData, questionsToShow);
  displayQuestions();

  // Start the timer now that questions are visible
  startQuizTimer();

  // update UI
  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
}

// shuffle in place (Fisher-Yates algorithm for those of you who are fancy)
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Renders the chosen questions to the DOM
function displayQuestions() {
  const quizContainer = document.getElementById("quizContainer");
  if (!quizContainer) return;
  quizContainer.innerHTML = "";

  selectedQuestions.forEach((question, index) => {
    // Decide question type
    const qType = detectQuestionType(question);

    // Shuffle choices and keep a mapping from display label -> original key
    let choiceEntries = Object.entries(question.choices);
    choiceEntries = shuffleArray(choiceEntries);

    const choiceLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    question._shuffledChoices = {};

    // Build the choices HTML
    const choicesHtml = choiceEntries
      .map(([origKey, choiceObj], i) => {
        const dispLabel = choiceLabels[i];
        question._shuffledChoices[dispLabel] = origKey;

        const inputType = qType === "multi" ? "checkbox" : "radio";
        const answerImageHtml = choiceObj.image
          ? `<img src="${choiceObj.image}" alt="Answer Image" class="quiz-answer-img">`
          : "";
        const textHtml = choiceObj.choice ? `&nbsp;${choiceObj.choice}` : "";

        return `
      <label>
        <input type="${inputType}" name="q${index}" value="${dispLabel}">
        <strong>${dispLabel}:</strong>${textHtml}
        ${answerImageHtml}
      </label><br>
    `;
      })
      .join("");

    // Question image (if any)
    let questionImageHtml = "";
    if (question.images && Array.isArray(question.images)) {
      questionImageHtml = question.images
        .map(
          (src) =>
            `<img src="${src}" alt="Question Image" class="quiz-question-img">`
        )
        .join("");
    } else if (question.image) {
      questionImageHtml = `<img src="${question.image}" alt="Question Image" class="quiz-question-img">`;
    }

    // Compose the block
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");
    questionDiv.innerHTML = `
    <p><strong>Q${index + 1}: ${question.question}</strong></p>
    ${questionImageHtml}
    ${choicesHtml}
  `;
    quizContainer.appendChild(questionDiv);
  });
}

// Grades the quiz and moves to the results screen
function submitQuiz() {
  let score = 0;
  let totalPossible = 0;
  const review = [];

  selectedQuestions.forEach((q, i) => {
    const qType = detectQuestionType(q);

    // Multi-select gets partial credit per correct choice
    if (qType === "multi") {
      const correctKeys = Object.keys(q.choices).filter(
        (k) => q.choices[k].correct
      );
      totalPossible += correctKeys.length;

      const chosenLabels = Array.from(
        document.querySelectorAll(`input[name="q${i}"]:checked`)
      ).map((input) => input.value);
      const yourKeys = chosenLabels.map((lbl) => q._shuffledChoices[lbl]);

      let pointsThisQuestion = 0;
      correctKeys.forEach((key) => {
        if (yourKeys.includes(key)) pointsThisQuestion++;
      });
      score += pointsThisQuestion;

      review.push({
        question: q.question,
        yourKey: yourKeys,
        correctKey: correctKeys,
        choices: q.choices,
        qid: q.qid,
        _shuffledChoices: q._shuffledChoices,
        points: pointsThisQuestion,
        total: correctKeys.length,
      });
    } else {
      // Single/TF = one point max
      totalPossible += 1;
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      const chosenLabel = sel ? sel.value : null;
      const yourKey = chosenLabel ? q._shuffledChoices[chosenLabel] : null;
      const correctKey = getCorrectAnswer(q);

      const gotIt = yourKey === correctKey;
      if (gotIt) score++;

      review.push({
        question: q.question,
        yourKey,
        correctKey,
        choices: q.choices,
        qid: q.qid,
        _shuffledChoices: q._shuffledChoices,
        points: gotIt ? 1 : 0,
        total: 1,
      });
    }
  });

  // Confetti!! for perfect scores
  if (score === totalPossible) launchConfetti();

  // Flip screens
  document.getElementById("quizScreen")?.classList.add("hidden");
  document.getElementById("resultsScreen")?.classList.remove("hidden");

  // Responsive score text
  function updateScoreText() {
    const scoreText = document.getElementById("scoreText");
    if (!scoreText) return;
    if (window.innerWidth <= 769) {
      scoreText.innerHTML = `You scored<br>${score} / ${totalPossible}`;
    } else {
      scoreText.textContent = `You scored ${score} / ${totalPossible}`;
    }
  }
  updateScoreText();
  window.addEventListener("resize", updateScoreText);

  // Save attempt to history
  const now = new Date();
  const quizName =
    document.getElementById("quizTitleDropdown")?.selectedOptions[0]
      ?.textContent || "";
  const quizTime =
    typeof frozenQuizTime === "string"
      ? frozenQuizTime
      : formatTime(quizTimerSeconds);
  const stat = {
    date: now.toISOString(),
    class: quizName,
    time: quizTime,
    score: `${score} / ${totalPossible}`,
  };
  let stats = JSON.parse(localStorage.getItem("quizStats") || "[]");
  stats.unshift(stat);
  if (stats.length > 20) stats = stats.slice(0, 20);
  localStorage.setItem("quizStats", JSON.stringify(stats));

  // Keep a rich object for the review screen
  window._lastReview = review;

  // Refresh navbar btns + freeze timer display
  updateNavbarActionBtn();
  stopQuizTimer();
}

let currentExplanations = {};

// Computes an answers file path from subject + chapter/exam
function getAnswersFilePath(subject, chapterOrExam) {
  let quizConfig = (window.QUIZZES || []).find((q) => q.folderName === subject);

  // Config-mapped answers
  if (quizConfig && quizConfig.chapterAnswers) {
    if (quizConfig.chapterAnswers[chapterOrExam])
      return quizConfig.chapterAnswers[chapterOrExam];

    const numKey = Number(chapterOrExam);
    if (!isNaN(numKey) && quizConfig.chapterAnswers[numKey])
      return quizConfig.chapterAnswers[numKey];

    const lower = String(chapterOrExam).toLowerCase();
    if (quizConfig.chapterAnswers[lower])
      return quizConfig.chapterAnswers[lower];
  }

  // Fallbacks
  if (subject === "java") {
    return `./questiondata/answers/java/javaCH${String(chapterOrExam).padStart(
      2,
      "0"
    )}Answers.json`;
  } else if (subject === "web") {
    return `./questiondata/answers/web/${chapterOrExam}Answers.json`;
  } else if (subject === "web2") {
    return `./questiondata/answers/web2/${chapterOrExam}Answers.json`;
  }
  return null;
}

// Fetches explanations for one or more chapters/exams, then calls back
function loadExplanations(subject, chapterFiles, callback) {
  let explanations = {};
  let loaded = 0;

  if (!chapterFiles || !chapterFiles.length) {
    currentExplanations = {};
    callback && callback();
    return;
  }

  chapterFiles.forEach((filename) => {
    let answersPath;
    if (subject === "java") {
      answersPath = `./questiondata/answers/java/javaCH${String(
        filename
      ).padStart(2, "0")}Answers.json`;
    } else {
      answersPath = `./questiondata/answers/${subject}/${filename}Answers.json`;
    }

    fetch(answersPath)
      .then((res) => res.json())
      .then((data) => {
        explanations = { ...explanations, ...data };
      })
      .catch(() => {
        /* swallow errors so others can still load */
      })
      .finally(() => {
        loaded++;
        if (loaded === chapterFiles.length) {
          currentExplanations = explanations;
          callback && callback();
        }
      });
  });

  console.log("Loading explanations for:", subject, chapterFiles);
}

// -------- Revised startReview --------
// Uses the metadata set when the quiz was started
function startReview() {
  const meta = window._lastReviewMeta || {};
  const chapterFiles =
    meta.chapters || (meta.chapterOrExam ? [meta.chapterOrExam] : []);
  loadExplanations(meta.subject, chapterFiles, renderReviewScreen);
}

// Builds the review screen list with correct markings
function renderReviewScreen() {
  document.getElementById("resultsScreen")?.classList.add("hidden");
  document.getElementById("reviewScreen")?.classList.remove("hidden");

  const container = document.getElementById("reviewList");
  if (!container) return;

  container.scrollTop = 0;
  container.innerHTML = "";

  window._lastReview.forEach((item, idx) => {
    const qType = detectQuestionType(item);

    // Normalize to arrays
    const correctKeys =
      qType === "multi"
        ? Object.keys(item.choices).filter((k) => item.choices[k].correct)
        : [item.correctKey];
    const yourKeys =
      qType === "multi"
        ? Array.isArray(item.yourKey)
          ? item.yourKey
          : [item.yourKey]
        : [item.yourKey];

    // All-correct check (only right answers, no extras)
    const isAllCorrect =
      qType === "multi"
        ? correctKeys.every((k) => yourKeys.includes(k)) &&
          yourKeys.every((k) => correctKeys.includes(k))
        : yourKeys[0] === correctKeys[0];

    // Determine display order/labels
    let choiceDisplayOrder = [];
    if (item._shuffledChoices) {
      choiceDisplayOrder = Object.entries(item._shuffledChoices)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([displayLabel, origKey]) => ({ displayLabel, origKey }));
    } else {
      choiceDisplayOrder = Object.keys(item.choices).map((key) => ({
        displayLabel: key,
        origKey: key,
      }));
    }

    // Build choices block
    const choicesHtml = choiceDisplayOrder
      .map(({ displayLabel, origKey }) => {
        const obj = item.choices[origKey];
        const isSelected = yourKeys.includes(origKey);
        const isCorrect = correctKeys.includes(origKey);

        let mark = "";
        if (isCorrect && isSelected) mark = " ✅";
        else if (!isCorrect && isSelected) mark = " ❌";
        else if (isCorrect) mark = " (Correct)";

        const answerImageHtml = obj.image
          ? `<img src="${obj.image}" alt="Answer Image" class="quiz-answer-img">`
          : "";
        const textHtml = obj.choice ? `&nbsp;${obj.choice}` : "";

        return `
        <div class="choice ${isCorrect ? "correct" : ""} ${
          isSelected ? "selected" : ""
        }">
          <strong>${displayLabel}.</strong>${textHtml}
          ${answerImageHtml}
          ${mark}
        </div>
      `;
      })
      .join("");

    // Assemble one review item
    const reviewHtml = `
      <div class="review-item ${isAllCorrect ? "correct" : "incorrect"}">
        <p><strong>Q${idx + 1}:</strong> ${item.question}</p>
        <div class="choices-list">${choicesHtml}</div>
        <div class="review-explanation-wrap">
          <button class="explanation-btn" data-qid="${
            item.qid
          }">Show Explanation</button>
          <div class="review-explanation hidden"></div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", reviewHtml);
  });

  // Toggle explanation content on click
  container.querySelectorAll(".explanation-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const qid = this.dataset.qid;
      const explDiv = this.nextElementSibling;
      if (explDiv.classList.contains("hidden")) {
        let explanation = currentExplanations[qid];
        if (typeof explanation === "object" && explanation !== null) {
          explanation = explanation.text || JSON.stringify(explanation);
        }
        explDiv.textContent = explanation || "Explanation unavailable.";
        explDiv.classList.remove("hidden");
        this.textContent = "Hide Explanation";
        this.classList.add("active");
      } else {
        explDiv.classList.add("hidden");
        this.textContent = "Show Explanation";
        this.classList.remove("active");
      }
    });
  });

  updateNavbarActionBtn && updateNavbarActionBtn();
  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
}

// rerun the quiz with the same settings
function restartQuiz() {
  document.getElementById("resultsScreen")?.classList.add("hidden");
  document.getElementById("reviewScreen")?.classList.add("hidden");
  startQuiz();
  updateNavbarActionBtn();
}

// back to the main page without changing selections 4 convenience
function goHome() {
  document.getElementById("quizScreen")?.classList.add("hidden");
  document.getElementById("resultsScreen")?.classList.add("hidden");
  document.getElementById("reviewScreen")?.classList.add("hidden");
  document.getElementById("mainPage")?.classList.remove("hidden");
  updateNavbarActionBtn();
  showCurrentDateTime();
  renderQuizStatsPanel();
  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
}

// Already provided elsewhere; just wiring this to show results from review
function goToResults() {
  document.getElementById("reviewScreen")?.classList.add("hidden");
  document.getElementById("resultsScreen")?.classList.remove("hidden");
  updateNavbarActionBtn();
}

// Picks N random questions from a pool
function getRandomQuestions(questions, num) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// Returns the correct key (A/B/C/…) for single-answer questions
function getCorrectAnswer(question) {
  return Object.keys(question.choices).find(
    (choiceKey) => question.choices[choiceKey].correct
  );
}

// Confetti celebration (with respect to visual settings)
function launchConfetti() {
  if (!window.visualSettings.effects) return;
  confetti({ particleCount: 200, spread: 60, origin: { x: 0.5, y: 0.8 } });
  confetti({
    particleCount: 120,
    angle: 60,
    spread: 55,
    origin: { x: 0.2, y: 0.7 },
  });
  confetti({
    particleCount: 120,
    angle: 120,
    spread: 55,
    origin: { x: 0.8, y: 0.7 },
  });
}

// Term-mode flag so layout code can check it
let IS_TERM_MODE = false;

// Term-mode toggles a bunch of UI pieces; note this function
// also exists in generator.js, last one loaded will win.
// Just pretend one is a fail safe and not spaghetti code
function setTermMode(on) {
  IS_TERM_MODE = !!on;
  document.body.classList.toggle("term-mode", IS_TERM_MODE);

  const examLabel = document.getElementById("examLabel");
  const chaptersLabel = document.getElementById("chaptersLabel");
  const examsList = document.getElementById("examsList");
  const quizstats = document.getElementById("quizStatsPanel");
  const spacer = document.getElementById("quizEmptySpacer");
  const questionspanel = document.getElementById("questions");
  const startBtn = document.getElementById("startQuizBtn");

  if (examLabel) examLabel.style.display = on ? "none" : "";
  if (chaptersLabel) chaptersLabel.style.display = on ? "none" : "";
  if (examsList) examsList.style.display = on ? "none" : "";
  if (quizstats) quizstats.style.display = on ? "none" : "";
  if (spacer) spacer.style.display = on ? "none" : "";
  if (questionspanel) questionspanel.style.display = on ? "none" : "";
  if (startBtn) startBtn.style.display = on ? "none" : "";

  if (!on) adjustSpacer();
}

// Per-class spacer presets
const QUIZ_DISPLAY_SETTINGS = {
  1712: { spacer: true, spacerHeight: 170, hideQuestions: true },
  2714: { spacer: true, spacerHeight: 210, hideQuestions: true },
};

// Recomputes the spacer visibility/height for the current quiz
function adjustSpacer() {
  if (IS_TERM_MODE || document.body.classList.contains("term-mode")) {
    const spacer = document.getElementById("quizEmptySpacer");
    const questions = document.getElementById("questions");
    if (spacer) spacer.style.display = "none";
    if (questions) questions.style.display = "none";
    return;
  }

  const quizDropdown = document.getElementById("quizTitleDropdown");
  const spacer = document.getElementById("quizEmptySpacer");
  const questions = document.getElementById("questions");
  if (!quizDropdown || !spacer || !questions) return;

  const selectedQuizId = quizDropdown.value;
  const settings = QUIZ_DISPLAY_SETTINGS[selectedQuizId];

  if (settings && settings.spacer) {
    spacer.style.display = "";
    spacer.style.height = (settings.spacerHeight || 180) + "px";
    questions.style.display = settings.hideQuestions ? "none" : "";
  } else {
    spacer.style.display = "none";
    questions.style.display = "";
  }
}

// Shows/hides the question count selector depending on quiz rules
function updateQuestionCountVisibility() {
  const wrapper = document.getElementById("select-wrap");
  if (!wrapper) return;
  if (currentQuiz.showQuestionCount === false) {
    wrapper.style.display = "none";
  } else {
    wrapper.style.display = "";
  }
}

// Hides the settings gear on quiz/results/review screens for mobile widths
function updateSettingsToggleVisibility() {
  const screensToHide = ["quizScreen", "resultsScreen", "reviewScreen"];
  const settingsToggle = document.getElementById("settingsToggle");
  if (!settingsToggle) return;

  const shouldHide = screensToHide.some((id) => {
    const el = document.getElementById(id);
    return el && el.style.display !== "none" && el.offsetParent !== null;
    // ^ visible-ish heuristic --- Thanks copilot! (I have no clue what this means but I'm sure someone else will.)
  });

  if (window.innerWidth <= 1250 && shouldHide) {
    settingsToggle.style.display = "none";
  } else {
    settingsToggle.style.display = "";
  }
}

// Splash text is hidden on quiz/results/review screen
function updateSplashTextVisibility() {
  const screensToHide = ["quizScreen", "resultsScreen", "reviewScreen"];
  const splash = document.getElementById("splashText");
  if (!splash) return;

  const shouldHide = screensToHide.some((id) => {
    const el = document.getElementById(id);
    return el && el.style.display !== "none" && el.offsetParent !== null;
  });

  splash.style.display = shouldHide ? "none" : "";
}

// Switches between major screens and updates UI
function showScreen(idToShow) {
  ["quizScreen", "resultsScreen", "reviewScreen", "mainScreen"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    }
  );
  const showEl = document.getElementById(idToShow);
  if (showEl) showEl.style.display = "";

  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
}

// Keep visibility logic in sync after load + on resize
document.addEventListener("DOMContentLoaded", () => {
  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
});
window.addEventListener("resize", () => {
  updateSettingsToggleVisibility();
  updateSplashTextVisibility();
});
