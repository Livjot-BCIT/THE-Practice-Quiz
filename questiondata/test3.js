let w, h;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const { random, sin, cos, PI } = Math;

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = "AstrageldonBackground.png"; // Path to your image

function initStars() {
    return many(1000, () => { // Increased the number of stars to 1000
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
            isStationary
        };
    });
}

let stars = initStars();

function anim(t) {
    if (w !== innerWidth) w = canvas.width = innerWidth;
    if (h !== innerHeight) h = canvas.height = innerHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, w, h);

    // Draw the background image
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, w, h);
    }

    // Draw the stars
    stars.forEach(star => {
        star.brightness = 0.5 + 0.5 * sin(t * star.brightnessSpeed);
        star.rotation += star.rotationSpeed;

        if (!star.isStationary) {
            star.y -= star.ySpeed;
            star.x += star.xSpeed;

            if (star.y + star.size < 0) {
                star.y = h + star.size;
                star.x = random() * w;
                star.ySpeed = random() * 0.2 + 0.05;
                star.xSpeed = random() * 0.1 - 0.05;
            }

            if (star.x > w + star.size) star.x = -star.size;
            if (star.x < -star.size) star.x = w + star.size;
        }

        drawX(star.x, star.y, star.size, star.brightness, star.rotation);
    });

    requestAnimationFrame(anim);
}

function drawX(x, y, size, brightness, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = brightness;
    ctx.strokeStyle = "#FFF";

    ctx.beginPath();
    ctx.moveTo(-size, -size);
    ctx.lineTo(size, size);
    ctx.moveTo(size, -size);
    ctx.lineTo(-size, size);
    ctx.stroke();

    ctx.restore();
}

function rnd(x = 1, dx = 0) { return random() * x + dx; }
function many(n, f) { return Array.from({ length: n }, (_, i) => f(i)); }

// Start the animation once the image is loaded
backgroundImage.onload = () => {
    requestAnimationFrame(anim);
};