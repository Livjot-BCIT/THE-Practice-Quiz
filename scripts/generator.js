// Array containing chapter names
const chapters = [
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
  "Chapter 4",
  "Chapter 5",
  "Chapter 6",
  "Chapter 7",
  "Chapter 8"
];

// Function to generate chapter list dynamically
function generateChapterList() {
  const chaptersList = document.getElementById("chaptersList");
  chaptersList.innerHTML = ""; // Clear any existing chapters

  chapters.forEach((chapter, index) => {
    // Create list item
    const li = document.createElement("li");

    // Create checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("chapter"); // Ensure it has this class for selection
    checkbox.id = `chapter${index + 1}`;
    checkbox.value = index + 1; // Ensure the value is set correctly

    // Create label
    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.textContent = chapter;

    // Append checkbox and label to list item
    li.appendChild(checkbox);
    li.appendChild(label);

    // Append list item to chapters list
    chaptersList.appendChild(li);
  });
}

// Call the function to generate the chapter list
generateChapterList();

// Array containing chapter names
const exams = ["Midterms", "Finals"];

// Function to generate exam list dynamically
function generateExamList() {
  const examsList = document.getElementById("examsList");
  examsList.innerHTML = ""; // Clear any existing content

  exams.forEach((exam, index) => {
    // Create list item
    const li = document.createElement("li");

    // Create radio button
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "exam"; // Ensure they are part of the same group (so only one can be selected)
    radio.id = `exam${index + 1}`;
    radio.value = exam;

    // Create label
    const label = document.createElement("label");
    label.setAttribute("for", radio.id);
    label.textContent = exam;

    // Append radio button and label to list item
    li.appendChild(radio);
    li.appendChild(label);

    // Append list item to exams list
    examsList.appendChild(li);
  });
}

// Call the function to generate the exam list
generateExamList();
