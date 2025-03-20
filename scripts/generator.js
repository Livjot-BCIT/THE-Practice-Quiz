document.addEventListener("DOMContentLoaded", () => {
  loadChapters();
  generateExamList();
});

// Function to load chapters from `javaChapters.json`
function loadChapters() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "./questiondata/javaChapters.json", true);

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

// Function to generate chapter list dynamically
function generateChapterList(chapters) {
  const chaptersList = document.getElementById("chaptersList");
  chaptersList.innerHTML = ""; // Clear any existing chapters

  chapters.forEach(chapter => {
      const li = document.createElement("li");

      // Create checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("chapter");
      checkbox.id = `chapter${chapter.id}`;
      checkbox.value = chapter.id;

      // Create label
      const label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.textContent = chapter.name;

      // Append checkbox and label
      li.appendChild(checkbox);
      li.appendChild(label);
      chaptersList.appendChild(li);
  });
}

// Function to generate exam list dynamically (using radio buttons)
function generateExamList() {
  const examsList = document.getElementById("examsList");
  examsList.innerHTML = ""; // Clear any existing content

  const exams = ["Midterms", "Finals"];
  exams.forEach((exam, index) => {
      const li = document.createElement("li");

      // Create radio button
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "exam"; // Ensure only one is selectable
      radio.classList.add("exam");
      radio.id = `exam${index + 1}`;
      radio.value = exam;

      // Create label
      const label = document.createElement("label");
      label.setAttribute("for", radio.id);
      label.textContent = exam;

      // Handle chapter selection when radio is clicked
      radio.addEventListener("change", () => handleExamSelection(exam));

      // Append radio button and label to list item
      li.appendChild(radio);
      li.appendChild(label);
      examsList.appendChild(li);
  });

  // Create "None" option to unselect midterms/finals
  const noneLi = document.createElement("li");
  const noneRadio = document.createElement("input");
  noneRadio.type = "radio";
  noneRadio.name = "exam";
  noneRadio.id = "examNone";
  noneRadio.value = "None";
  
  const noneLabel = document.createElement("label");
  noneLabel.setAttribute("for", noneRadio.id);
  noneLabel.textContent = "Clear";

  noneRadio.addEventListener("change", () => handleExamSelection("None"));

  noneLi.appendChild(noneRadio);
  noneLi.appendChild(noneLabel);
  examsList.appendChild(noneLi);
}

// Function to handle exam selection logic
function handleExamSelection(exam) {
  const chapterCheckboxes = document.querySelectorAll(".chapter");

  // Uncheck all chapters first
  chapterCheckboxes.forEach(checkbox => checkbox.checked = false);

  if (exam === "Midterms") {
      chapterCheckboxes.forEach((checkbox, index) => {
          if (index < 6) { // First 6 chapters for Midterms
              checkbox.checked = true;
          }
      });
  } else if (exam === "Finals") {
      chapterCheckboxes.forEach(checkbox => {
          checkbox.checked = true; // All chapters for Finals
      });
  }
}
