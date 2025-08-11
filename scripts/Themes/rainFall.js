// rainFall.js
;(function () {
  const canvas      = document.getElementById("rainCanvas");
  canvas.classList.add("rain-canvas");
  const ctx         = canvas.getContext("2d");
  const containerEl = document.getElementById("mainPage");

  // Rain/drop parameters
  const DROPLET_CHANCE    = 0.005;  // chance per frame to start rolling
  const SPAWN_OFFSET      = 0;      // not used (drops start at y=0)
  // Freeze‐in‐place behavior for droplets:
  const FREEZE_CHANCE     = 0.6;    // 80% freeze on creation
  const MIN_FREEZE_FRAMES = 30;     // min freeze duration
  const MAX_FREEZE_FRAMES = 180;     // max freeze duration

  // Background image setup
  const bgImg = new Image();
  let bgReady = false;
  bgImg.onload  = () => { bgReady = true; console.log("rainFall.js: Background loaded"); };
  bgImg.onerror = () => { console.error("rainFall.js: Failed to load background:", bgImg.src); };
  bgImg.src     = "images/RainBackground.png";

  let rw = 0, rh = 0;
  let drops = [];
  let animating = false;
  let containerLeft = 0, containerRight = window.innerWidth;

  function makeDrop() {
    return {
      x: Math.random() * rw,
      y: 0,
      len: 18 + Math.random() * 24,
      xs: -0.6 + Math.random() * 1.2,
      ys: 3.6 + Math.random() * 4.8,
      state: "streak",  // 'streak' -> 'roll'
      r: 0,             // radius for rolling droplet
      vx: 0, vy: 0,     // horizontal & vertical roll speeds
      trail: [],        // positions for fading trail
      frozen: false,    // whether this droplet is currently frozen
      freezeTimer: 0    // frames left to stay frozen
    };
  }

  // less drops on mobile more on pc
  function initRain() {
    const count = window.innerWidth < 800 ? 36 : 160;
    drops = Array.from({ length: count }, makeDrop);
  }

  function resizeCanvas() {
    rw = canvas.width  = window.innerWidth;
    rh = canvas.height = window.innerHeight;
    initRain();
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      containerLeft  = rect.left;
      containerRight = rect.right;
    } else {
      containerLeft  = 0;
      containerRight = rw;
    }
  }

  function drawBackground() {
    if (bgReady) {
      ctx.drawImage(bgImg, 0, 0, rw, rh);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, "#3A4555");
      g.addColorStop(1, "#1F2937");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, rw, rh);
    }
    // noise overlay
    const imgData = ctx.createImageData(rw, rh);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 200 + Math.random() * 55;
      imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = v;
      imgData.data[i+3] = 15;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function draw() {
    drawBackground();

    // streak style
    ctx.strokeStyle = "rgba(165,200,245,0.3)";
    ctx.lineWidth   = 1.5;
    ctx.lineCap     = "round";

    for (let d of drops) {
      if (d.state === "streak" && animating) {
        // draw streak
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.xs * 3, d.y + d.len);
        ctx.stroke();

        // move streak
        d.x += d.xs;
        d.y += d.ys;

        // maybe become a rolling droplet
        if (
          d.x >= containerLeft &&
          d.x <= containerRight &&
          Math.random() < DROPLET_CHANCE
        ) {
          d.state = "roll";
          d.r     = 2 + Math.random() * 2;
          d.vx    = d.xs * (0.8 + Math.random() * 0.8);
          d.vy    = d.ys * (0.3 + Math.random() * 0.7);
          d.trail = [];
          // decide on freezing
          d.frozen = Math.random() < FREEZE_CHANCE;
          if (d.frozen) {
            d.freezeTimer =
              MIN_FREEZE_FRAMES +
              Math.floor(Math.random() * (MAX_FREEZE_FRAMES - MIN_FREEZE_FRAMES));
          }
        }
      }
      else if (d.state === "roll" && animating) {
        // drop-out‐of‐bounds reset
        if (d.x < containerLeft || d.x > containerRight) {
          Object.assign(d, makeDrop());
          continue;
        }
        // if freezing, count down and skip movement
        if (d.frozen) {
          d.freezeTimer--;
          if (d.freezeTimer <= 0) {
            d.frozen = false;
          }
        }
        if (!d.frozen) {
          // rolling physics
          d.vy += 0.05;
          d.x  += d.vx + Math.sin(d.y / 15) * 0.5;
          d.y  += d.vy;
        }
        // record & draw trail
        d.trail.unshift({ x: d.x, y: d.y });
        if (d.trail.length > 20) d.trail.pop();
        d.trail.forEach((p, i) => {
          const alpha = 0.3 * (1 - i / d.trail.length);
          const rx    = d.r * (1 - (i / d.trail.length) * 0.6);
          const ry    = rx * 0.6;
          ctx.fillStyle = `rgba(165,200,245,${alpha})`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rx, ry, 0, 0, 2 * Math.PI);
          ctx.fill();
        });
        // draw droplet
        ctx.fillStyle = "rgba(165,200,245,0.8)";
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r, d.r * 0.7, Math.PI / 12, 0, 2 * Math.PI);
        ctx.fill();
      }

      // recycle off‑screen
      if (d.y > rh + d.len || d.x < -d.len || d.x > rw + d.len) {
        Object.assign(d, makeDrop());
      }
    }

    requestAnimationFrame(draw);
  }

  // theme controls
  window.enableRainBG  = () => { animating = true;  };
  window.disableRainBG = () => { animating = false; };

  // startup
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  draw();
})();
