// Flag to control whether to draw stars
window.drawCatalystStars = true;

function isBgImageEnabled() {
  return window.visualSettings?.bgImage !== false;
}

let w, h;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const { random, sin, cos, PI } = Math;

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = "images/AstrageldonBackground.png"; 

let stars = [];

// Initialize stars
function initStars() {
  const starCount = window.innerWidth <= 769 ? 250 : 1000;
  stars = many(starCount, () => {
    const isStationary = random() < 0.2;
    return {
      x: random() * innerWidth,
      y: random() * innerHeight,
      size: random() * 2 + 1,
      brightness: random() * 0.5 + 0.5,
      brightnessSpeed: random() * 0.0005 + 0.0002,
      rotation: random() * PI * 2,
      rotationSpeed: random() * 0.002 - 0.001,
      ySpeed: isStationary ? 0 : random() * 0.2 + 0.05,
      xSpeed: isStationary ? 0 : random() * 0.1 - 0.05,
      isStationary,
    };
  });
  console.log("initStars() called", window.innerWidth, window.innerHeight);
}

// Initialize canvas size
function resizeCanvas() {
  w = canvas.width = innerWidth;
  h = canvas.height = innerHeight;
  initStars();
}

// new resizer
window.addEventListener("resize", resizeCanvas);

// Draw stars efficiently
function anim(t) {

  // Resize the canvas when the window is resized
  // if (w !== innerWidth || h !== innerHeight) {
  //   resizeCanvas();
  // }

  // Clear the canvas only if necessary
  ctx.clearRect(0, 0, w, h);

  // Draw the background image ONLY if enabled
  if (isBgImageEnabled() && backgroundImage.complete) {
    ctx.drawImage(backgroundImage, 0, 0, w, h);
  }


  // Update and draw each star
  if (window.drawCatalystStars) {
    stars.forEach((star) => {
      star.brightness = 0.5 + 0.5 * sin(t * star.brightnessSpeed);
      star.rotation += star.rotationSpeed;

      if (!star.isStationary) {
        star.y -= star.ySpeed;
        star.x += star.xSpeed;

        // Reset star position if it moves off-screen
        if (star.y + star.size < 0) {
          star.y = h + star.size;
          star.x = random() * w;
          star.ySpeed = random() * 0.2 + 0.05;
          star.xSpeed = random() * 0.1 - 0.05;
        }

        if (star.x > w + star.size) star.x = -star.size;
        if (star.x < -star.size) star.x = w + star.size;
      }

      // Draw star
      drawX(star.x, star.y, star.size, star.brightness, star.rotation);
    });
  }
  // Request next animation frame
  requestAnimationFrame(anim);
}

// Draw a single star as an X
function drawX(x, y, size, brightness, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = brightness;
  ctx.strokeStyle = "#FFFF00";

  ctx.beginPath();
  ctx.moveTo(-size, -size);
  ctx.lineTo(size, size);
  ctx.moveTo(size, -size);
  ctx.lineTo(-size, size);
  ctx.stroke();

  ctx.restore();
}

// Utility functions
function rnd(x = 1, dx = 0) {
  return random() * x + dx;
}
function many(n, f) {
  return Array.from({ length: n }, (_, i) => f(i));
}

// Initialize stars and start animation once the image is loaded
backgroundImage.onload = () => {
  // initStars();
  resizeCanvas();
  requestAnimationFrame(anim);
};
