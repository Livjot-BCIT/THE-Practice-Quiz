function changeBackground() {
    document.body.classList.add("full-bg"); // Adds background effect
}

function toggleBackground() {
    // Toggle the class for background video visibility
    document.querySelector(".content-wrapper").classList.toggle("video-bg");
    document.getElementById("toggleSlider").classList.toggle("active");
  }

  