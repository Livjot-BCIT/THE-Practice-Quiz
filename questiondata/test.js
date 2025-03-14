let allQuestions = {
    midterm: {
        1: [{ q: "What is 2 + 2?", a: "4", options: ["3", "4", "5"] }],
        2: [{ q: "What is 5 x 5?", a: "25", options: ["20", "25", "30"] }],
        3: [{ q: "What is the square root of 9?", a: "3", options: ["2", "3", "4"] }]
    },
    final: {
        1: [{ q: "What is 10 / 2?", a: "5", options: ["4", "5", "6"] }],
        2: [{ q: "What is 3 x 3?", a: "9", options: ["6", "9", "12"] }],
        3: [{ q: "What is 12 - 7?", a: "5", options: ["4", "5", "6"] }]
    }
};

let selectedQuestions = [];

function startQuiz() {
    let examType = document.querySelector('input[name="exam"]:checked');
    let selectedChapters = [...document.querySelectorAll(".chapter:checked")].map(cb => cb.value);
    let questionCount = parseInt(document.getElementById("questionCount").value);

    if (selectedChapters.length === 0) {
        alert("Please select at least one chapter.");
        return;
    }

    let allSelectedQuestions = [];
    selectedChapters.forEach(chap => {
        allSelectedQuestions = allSelectedQuestions.concat(allQuestions[examType][chap] || []);
    });

    selectedQuestions = allSelectedQuestions.sort(() => 0.5 - Math.random()).slice(0, questionCount);

    document.getElementById("mainPage").classList.add("hidden");
    document.getElementById("quizScreen").classList.remove("hidden");
    renderQuiz();
}

function renderQuiz() {
    let quizContainer = document.getElementById("quizContainer");
    quizContainer.innerHTML = "";
    selectedQuestions.forEach((q, index) => {
        let questionDiv = document.createElement("div");
        questionDiv.className = "quiz-question";
        questionDiv.innerHTML = `
            <p><strong>${index + 1}. ${q.q}</strong></p>
            ${q.options.map(option => `
                <label>
                    <input type="radio" name="q${index}" value="${option}"> ${option}
                </label><br>
            `).join("")}
        `;
        quizContainer.appendChild(questionDiv);
    });
}

function submitQuiz() {
    let score = 0;
    selectedQuestions.forEach((q, index) => {
        let selectedAnswer = document.querySelector(`input[name="q${index}"]:checked`);
        if (selectedAnswer && selectedAnswer.value === q.a) {
            score++;
        }
    });

    document.getElementById("quizScreen").classList.add("hidden");
    document.getElementById("resultsScreen").classList.remove("hidden");
    document.getElementById("scoreText").innerText = `Your Score: ${score} / ${selectedQuestions.length}`;
}

function restartQuiz() {
    document.getElementById("resultsScreen").classList.add("hidden");
    document.getElementById("mainPage").classList.remove("hidden");
}