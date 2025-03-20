document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("questionCount").addEventListener("change", updateQuestionCount);
    // We'll load questions only when starting the quiz, not on page load
});

let questionsData = [];
let selectedQuestions = [];
let numQuestions = 10; // Default question count

// Function to update the number of questions to display
function updateQuestionCount() {
    numQuestions = parseInt(document.getElementById("questionCount").value);
}

// Function to start the quiz
function startQuiz() {
    // Get selected chapters
    const selectedChapters = Array.from(document.querySelectorAll(".chapter:checked"))
        .map(checkbox => checkbox.value);
    
    if (selectedChapters.length === 0) {
        alert("Please select at least one chapter.");
        return;
    }
    
    // Load questions for selected chapters then start the quiz
    loadQuestionsForChapters(selectedChapters);
}

// Function to load questions for selected chapters
function loadQuestionsForChapters(chapters) {
    questionsData = []; // Reset questions data
    let loadedCount = 0;
    
    // Show loading indicator
    document.getElementById("mainPage").classList.add("hidden");
    document.getElementById("quizScreen").classList.remove("hidden");
    document.getElementById("quizContainer").innerHTML = "<p>Loading questions...</p>";
    
    // Load questions for each selected chapter
    chapters.forEach(chapter => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `./questiondata/chapters/javaCH${chapter.padStart(2, '0')}.json`, true);
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        // Add questions from this chapter to our collection
                        questionsData = questionsData.concat(Object.values(data));
                        loadedCount++;
                        
                        // If all chapters are loaded, proceed with the quiz
                        if (loadedCount === chapters.length) {
                            if (questionsData.length === 0) {
                                alert("No questions available for the selected chapters.");
                                restartQuiz();
                                return;
                            }
                            proceedWithQuiz();
                        }
                    } catch (error) {
                        console.error(`Error parsing JSON for chapter ${chapter}:`, error);
                        loadedCount++;
                        if (loadedCount === chapters.length) {
                            proceedWithQuiz();
                        }
                    }
                } else {
                    console.error(`Failed to load chapter ${chapter}. Status: ${xhr.status}`);
                    loadedCount++;
                    if (loadedCount === chapters.length) {
                        proceedWithQuiz();
                    }
                }
            }
        };
        
        xhr.send();
    });
}

// Function to proceed with the quiz after loading questions
function proceedWithQuiz() {
    // Ensure we have questions to display
    if (questionsData.length === 0) {
        alert("No questions available for the selected chapters.");
        restartQuiz();
        return;
    }
    
    // Determine how many questions to show
    let questionsToShow = numQuestions;
    if (numQuestions > questionsData.length || numQuestions > 1000000) {
        questionsToShow = questionsData.length;
    }
    
    // Get random questions and display them
    selectedQuestions = getRandomQuestions(questionsData, questionsToShow);
    displayQuestions();
}

// Function to display questions on the quiz screen
function displayQuestions() {
    const quizContainer = document.getElementById("quizContainer");
    quizContainer.innerHTML = "";  // Clear the quiz container

    selectedQuestions.forEach((question, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question");
        questionDiv.innerHTML = `
            <p><strong>Q${index + 1}: ${question.question}</strong></p>
            ${Object.keys(question.choices).map((choiceKey) => {
                const choice = question.choices[choiceKey];
                return `
                    <label>
                        <input type="radio" name="q${index}" value="${choiceKey}">
                        ${choiceKey}: ${choice.choice}
                    </label><br>
                `;
            }).join("")}
        `;
        quizContainer.appendChild(questionDiv);
    });
}

// Function to submit the quiz
function submitQuiz() {
    let score = 0;

    selectedQuestions.forEach((question, index) => {
        const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
        if (selectedOption && selectedOption.value === getCorrectAnswer(question)) {
            score++;
        }
    });

    document.getElementById("quizScreen").classList.add("hidden");
    document.getElementById("resultsScreen").classList.remove("hidden");
    document.getElementById("scoreText").innerText = `You scored ${score} out of ${selectedQuestions.length}`;
}

// Function to restart the quiz
function restartQuiz() {
    document.getElementById("resultsScreen").classList.add("hidden");
    document.getElementById("quizScreen").classList.add("hidden");
    document.getElementById("mainPage").classList.remove("hidden");
}

// Function to get random questions
function getRandomQuestions(questions, num) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

// Helper function to get the correct answer key for a question
function getCorrectAnswer(question) {
    return Object.keys(question.choices).find(choiceKey => question.choices[choiceKey].correct);
}