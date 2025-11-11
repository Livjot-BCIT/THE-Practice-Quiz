// -- Halloween bats --
(function () {
  const layer = document.getElementById("batsLayer");
  const video = document.getElementById("batsVideo");
  const canvas = document.getElementById("batsCanvas");
  if (!layer || !video || !canvas) return;

  // -- perf knobs --
  const PREFERS_REDUCED = matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const MAX_DPR = PREFERS_REDUCED ? 1.2 : 1.5; // cap devicePixelRatio
  let PROC_SCALE = PREFERS_REDUCED ? 0.65 : 0.85; // internal processing scale (0–1)
  let FRAME_SKIP = PREFERS_REDUCED ? 2 : 1; // process every Nth frame

  // -- state --
  const ctx = canvas.getContext("2d", { desynchronized: true });
  const offscreen = document.createElement("canvas");
  const octx = offscreen.getContext("2d", { willReadFrequently: true });

  const REVEAL_DELAY_MS = 4000;
  const STOP_AFTER_MS = 1000;
  let running = false,
    rafId = 0,
    tReveal = 0,
    tStop = 0,
    frameNo = 0,
    lastT = -1;

  // -- palette freeze --
  function freezeCurrentPalette(ms = REVEAL_DELAY_MS) {
    removeFreeze();
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const vars = [
      "--color-bg-main",
      "--color-bg-container",
      "--color-bg-alt",
      "--color-accent",
      "--color-accent-hover",
      "--color-accent-focus",
      "--color-accent-border",
      "--color-accent-selected",
      "--color-text",
      "--color-text-muted",
      "--color-h1",
      "--color-shape",
      "--color-shape2",
      "--color-quiz-selector",
      "--color-question-count",
      "--rect-color",
      "--color-footer-text",
      "--color-label",
    ];
    const style = document.createElement("style");
    style.id = "paletteFreeze";
    style.textContent = `:root{${vars
      .map((v) => `${v}:${cs.getPropertyValue(v).trim()};`)
      .join("")}}`;
    document.head.appendChild(style);
    tReveal = setTimeout(removeFreeze, ms);
  }
  function removeFreeze() {
    clearTimeout(tReveal);
    document.getElementById("paletteFreeze")?.remove();
  }

  // -- sizing --
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cssW = layer.clientWidth || window.innerWidth;
    const cssH = layer.clientHeight || window.innerHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  // -- keying thresholds --
  const MIN_G = 85,
    DOMINANCE = 1.4,
    SOFTNESS = 26;

  // -- main loop --
  function drawFrame(ts) {
    if (!running || document.hidden) return;
    if (FRAME_SKIP > 1 && frameNo++ % FRAME_SKIP) {
      rafId = requestAnimationFrame(drawFrame);
      return;
    }

    if (video.readyState >= 2) {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const cw = layer.clientWidth || window.innerWidth;
      const ch = layer.clientHeight || window.innerHeight;
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;

      const scale = Math.max(cw / vw, ch / vh); // cover
      const dw = Math.ceil(vw * scale);
      const dh = Math.ceil(vh * scale);
      const dx = Math.floor((cw - dw) / 2);
      const dy = Math.floor((ch - dh) / 2);

      // process at reduced internal res, then upscale once
      const ow = Math.max(1, Math.round(dw * dpr * PROC_SCALE));
      const oh = Math.max(1, Math.round(dh * dpr * PROC_SCALE));
      if (offscreen.width !== ow || offscreen.height !== oh) {
        offscreen.width = ow;
        offscreen.height = oh;
      }

      // skip recompute if video time didn't advance (saves on throttled tabs)
      if (video.currentTime !== lastT) {
        lastT = video.currentTime;
        octx.drawImage(video, 0, 0, ow, oh);

        const img = octx.getImageData(0, 0, ow, oh);
        const d = img.data;

        // micro-opts: hoist constants
        const soft = SOFTNESS;
        const dom = DOMINANCE;
        const minG = MIN_G;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i],
            g = d[i + 1],
            b = d[i + 2];
          const gDom = g - (r > b ? r : b);

          if (g >= minG && g >= r * dom && g >= b * dom) {
            d[i + 3] = 0;
            continue;
          }
          if (gDom > 0 && gDom < soft) {
            const fall = 1 - gDom / soft;
            d[i + 3] = (d[i + 3] * fall) | 0;
          }
          if (g > r && g > b) {
            const mix = (r + b) >> 1;
            d[i + 1] = Math.min(255, (0.72 * g + 0.28 * mix) | 0);
          }
        }
        octx.putImageData(img, 0, 0);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(offscreen, dx, dy, dw, dh);
    }

    rafId = requestAnimationFrame(drawFrame);
  }

  function onResize() {
    resizeCanvas();
  }

  // -- start/stop --
  window.startBatsOverlay = async function () {
    if (running) return;
    if (window.visualSettings && window.visualSettings.effects === false)
      return;

    // quick device heuristics
    const cores = navigator.hardwareConcurrency || 4;
    if (cores <= 4 && !PREFERS_REDUCED) PROC_SCALE = 0.6;

    video.playbackRate = PREFERS_REDUCED ? 1.5 : 1.5;
    const ensureSeek = () => {
      try {
        video.currentTime = 0;
      } catch {}
    };
    video.readyState >= 1
      ? ensureSeek()
      : video.addEventListener("loadedmetadata", ensureSeek, { once: true });

    freezeCurrentPalette(REVEAL_DELAY_MS);

    layer.classList.remove("hidden");
    resizeCanvas();
    window.addEventListener("resize", onResize, { passive: true });

    try {
      await video.play();
    } catch {}
    running = true;
    drawFrame();

    clearTimeout(tStop);
    tStop = setTimeout(() => {
      window.stopBatsOverlay();
    }, REVEAL_DELAY_MS + STOP_AFTER_MS);
  };

  window.stopBatsOverlay = function () {
    running = false;
    cancelAnimationFrame(rafId);
    video.pause();
    layer.classList.add("hidden");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.removeEventListener("resize", onResize);
    clearTimeout(tReveal);
    clearTimeout(tStop);
    removeFreeze();
  };

  // pause when tab hidden
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        if (running) {
          cancelAnimationFrame(rafId);
          video.pause();
        }
      } else {
        if (running) {
          video.play();
          rafId = requestAnimationFrame(drawFrame);
        }
      }
    },
    { passive: true }
  );
})();

// -- Shiny config --
const ENABLE_SHINY = true;
const SHINY_CHANCE = 0.005; // 0.5% chance

// -- Accessory config --
const ACCESSORY_WEIGHTS = {
  bow: 1.0,
  hat: 1.0,
  bandage: 0.9,
  patch: 0.8,
  monocle: 0.9,
  stache: 0.9,
};

// -- Accessory incompatibilities --
const ACCESSORY_BLOCKS = {
  hat: new Set(["bow"]),
  bow: new Set(["hat", "stache"]),
  monocle: new Set(["patch", "bandage"]),
  patch: new Set(["monocle", "hat", "bow"]),
  bandage: new Set(["monocle", "patch"]),
};

// -- Choose accessories & defaults/fallback --
function chooseAccessories(max = 3, basePickProb = 0.2) {
  const pool = Object.keys(ACCESSORY_WEIGHTS);
  const items = pool
    .map((k) => ({
      k,
      score: Math.random() ** (1 / (ACCESSORY_WEIGHTS[k] || 1)),
    }))
    .sort((a, b) => b.score - a.score);

  const chosen = [];
  let p = basePickProb; // chance for each item

  for (const { k } of items) {
    if (chosen.length >= max) break;
    if (
      chosen.some(
        (c) => ACCESSORY_BLOCKS[c]?.has(k) || ACCESSORY_BLOCKS[k]?.has(c)
      )
    )
      continue;
    if (Math.random() < p) {
      chosen.push(k);
      p *= 0.6; // decay for each additional accessory
    }
  }
  return chosen;
}

// -- Accessory layering --
const ACC_LAYER = {
  hat: "headTop",
  bow: "headTop",
  bandage: "faceTop",
  patch: "faceTop",
  monocle: "faceTop",
  stache: "mouthTop",
};
const DRAW_ORDER = {
  headTop: ["bow", "hat"],
  faceTop: ["bandage", "patch", "monocle"],
  mouthTop: ["stache"],
};
function sortByOrder(arr, orderList) {
  const rank = (k) => {
    const i = orderList.indexOf(k);
    return i === -1 ? 999 : i;
  };
  return [...arr].sort((a, b) => rank(a) - rank(b));
}

// -- container helpers --
function rectToVWVH(rect, vw, vh) {
  return {
    leftVW: (rect.left / vw) * 100,
    rightVW: (rect.right / vw) * 100,
    topVH: (rect.top / vh) * 100,
    bottomVH: (rect.bottom / vh) * 100,
    centerVW: ((rect.left + rect.right) / 2 / vw) * 100,
  };
}
function faceTowardContainer(xVW, avoidInfo) {
  if (!avoidInfo) return null; // caller will randomize
  return xVW < avoidInfo.centerVW ? "right" : "left";
}

(function () {
  const layer = document.getElementById("halloweenShapes");
  if (!layer) return;

  // -- Helpers --
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const chance = (p) => Math.random() < p;

  // -- Face parts --
  function eyeLeft(type, color) {
    switch (type) {
      case "oval":
        return `<ellipse cx="26" cy="28" rx="3.2" ry="2.3" fill="${color}" transform="rotate(-6 26 28)"/>`;
      case "angry":
        return `<ellipse cx="26" cy="29" rx="3" ry="2.2" fill="${color}" transform="rotate(-8 26 29)"/><path d="M21 25 l9 -3" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>`;
      default:
        return `<circle cx="26" cy="28" r="3" fill="${color}"/>`;
    }
  }
  function eyeRight(type, color) {
    switch (type) {
      case "oval":
        return `<ellipse cx="38" cy="28" rx="3.2" ry="2.3" fill="${color}" transform="rotate(6 38 28)"/>`;
      case "angry":
        return `<ellipse cx="38" cy="29" rx="3" ry="2.2" fill="${color}" transform="rotate(8 38 29)"/><path d="M43 25 l-9 -3" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>`;
      default:
        return `<circle cx="38" cy="28" r="3" fill="${color}"/>`;
    }
  }
  function eyesSVG(
    type,
    color = "#000",
    { hideLeft = false, hideRight = false } = {}
  ) {
    return (
      (hideLeft ? "" : eyeLeft(type, color)) +
      (hideRight ? "" : eyeRight(type, color))
    );
  }

  // -- Tongue edit toggles --
  let TONGUE_EDIT_MODE = false; // set true to preview tongue on all ghosts

  // Keep the mouth geometry fixed (black capsule)
  const MOUTH_GEOM = { w: 26, h: 14, sag: 5.2 };

  // Tongue-only style knobs (independent of mouth geom)
  const TONGUE_STYLE_DEFAULT = {
    wFactor: 0.5,
    hFactor: 3.0,
    split: false,
    xNudge: 0,
    yNudge: -10,
  };
  const TONGUE_STYLE_EDIT = {
    wFactor: 0.5,
    hFactor: 3.0,
    split: false,
    xNudge: 0,
    yNudge: -10,
  };

  // -- Mouths --
  function mouthSVG(type, color = "#000", opts = {}) {
    function buildBooMouth({
      cx = 32,
      cy = 38,
      w = 20,
      h = 12,
      sag = 4,
      tilt = 0,
      teeth = true,
      tongue = false,
      tongueWFactor = 1.25,
      tongueHFactor = 1.1,
      tongueSplit = true,
      tongueXOffset = 0,
      tongueYOffset = 0,
    } = {}) {
      const left = cx - w / 2,
        right = cx + w / 2;
      const top = cy - h * 0.55,
        bottom = cy + h * 0.55;
      const cTop = top + sag;

      const d = [
        `M ${left} ${top}`,
        `Q ${cx} ${cTop} ${right} ${top}`,
        `Q ${cx} ${bottom} ${left} ${top}`,
      ].join(" ");

      const gum = top,
        bigDrop = h * 0.9,
        smallDrop = h * 0.65;
      const f1x = left + w * 0.18,
        f2x = right - w * 0.18;
      const s1x = left + w * 0.46,
        s2x = right - w * 0.46;

      const teethSVG = !teeth
        ? ""
        : `
        <polygon points="${f1x},${gum} ${f1x + 1.8},${gum + bigDrop} ${
            f1x + 3.6
          },${gum}" fill="#fff"/>
        <polygon points="${f2x - 3.6},${gum} ${f2x - 1.8},${
            gum + bigDrop
          } ${f2x},${gum}" fill="#fff"/>
        <polygon points="${s1x},${gum} ${s1x + 1.2},${gum + smallDrop} ${
            s1x + 2.4
          },${gum}" fill="#fff"/>
        <polygon points="${s2x - 2.4},${gum} ${s2x - 1.2},${
            gum + smallDrop
          } ${s2x},${gum}" fill="#fff"/>`;

      const tongueSVG = !tongue
        ? ""
        : (() => {
            const tw = w * tongueWFactor,
              th = h * tongueHFactor;
            const tx = cx - tw / 2 + tongueXOffset;
            const ty = cy + h * 0.05 + tongueYOffset;
            return `
          <path d="M ${tx} ${ty} q ${tw * 0.5} ${th} ${tw} 0 q ${-tw * 0.06} ${
              th * 0.18
            } ${-tw * 0.5} ${th * 0.18} q ${-tw * 0.44} 0 ${-tw * 0.5} ${
              -th * 0.18
            } z" fill="#e24141"/>
          ${
            tongueSplit
              ? `<path d="M ${cx} ${ty + th * 0.55} v ${
                  th * 0.28
                }" stroke="#c02f2f" stroke-width="1" stroke-linecap="round"/>`
              : ``
          }
        `;
          })();

      return `
        <g class="boo-mouth" data-cx="${cx}" data-cy="${cy}" data-w="${w}" data-h="${h}" data-sag="${sag}" data-tilt="${tilt}">
          <g transform="rotate(${tilt}, ${cx}, ${cy})">
            <path d="${d}" fill="${color}"/>
            ${tongueSVG}
            ${teethSVG}
          </g>
        </g>`;
    }

    switch (type) {
      case "none":
        return "";
      case "frown":
        return `<path d="M26 38 q6 -6 12 0" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
      case "open":
        return `<ellipse cx="32" cy="38" rx="4.4" ry="5.4" fill="${color}"/>`;
      case "booFangs":
        return buildBooMouth({ teeth: true, tongue: false, ...opts });
      case "booTongue":
        return buildBooMouth({ teeth: true, tongue: true, sag: 4.5, ...opts });
      case "booTongueNoTeeth":
        return buildBooMouth({ teeth: false, tongue: true, sag: 4.8, ...opts });
      case "booDerp":
        return buildBooMouth({
          teeth: false,
          tongue: false,
          w: 22,
          h: 10,
          sag: 2.2,
          ...opts,
        });
      default:
        return `<path d="M26 38 q6 6 12 0" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    }
  }

  function forceTongueOn(svgEl) {
    svgEl.classList.add("show-tongue");
  }

  // -- Accessories --
  function accessorySVG(kind, direction = "left", uid = "") {
    const isRight = direction === "right";
    switch (kind) {
      case "bow": {
        const tx = isRight ? 22 : 42;
        const rot = isRight ? -40 : 40;
        return `<g transform="translate(${tx} 15) rotate(${rot})">
          <circle r="4.2" fill="#ff5aa8" stroke="#c63a7e" stroke-width="1.2"/>
          <path d="M-3 0 C -12 -7 -14 -1 -12 5 C -9 8 -4 3 -3 0 Z" fill="#ff7bbb" stroke="#c63a7e" stroke-width="1"/>
          <path d="M 3 0 C  12 -7  14 -1  12 5 C  9 8  4 3  3 0 Z" fill="#ff7bbb" stroke="#c63a7e" stroke-width="1"/>
        </g>`;
      }
      case "hat":
        return `<g transform="translate(32 15)">
          <rect x="-11" y="-3" width="22" height="5" rx="2" fill="#444" stroke="#9a9a9a" stroke-width="1"/>
          <rect x="-9"  y="-13" width="18" height="11" rx="2" fill="#3a3a3a" stroke="#9a9a9a" stroke-width="1"/>
          <path d="M-9 -13 H 9" stroke="#9a9a9a" stroke-width="1"/>
          <rect x="-9"  y="-9"  width="18" height="3.2" rx="1.6" fill="#ff7a00"/>
        </g>`;
      case "bandage":
        {
          const S = 0.5; // size
          return `
        <g transform="rotate(-18 32 20)">
          <g transform="translate(32 20) scale(${S}) translate(-32 -20)">
            <rect x="21" y="19" width="22" height="5" rx="2.2"
                  fill="#f2d3be" stroke="#cfae9b" stroke-width="1.05"/>
            <rect x="29"  y="18" width="8"  height="7" rx="2" fill="#e6c1a8"/>
            <circle cx="23"  cy="21.2" r="0.7" fill="#caa892"/>
            <circle cx="25.5" cy="21.2" r="0.7" fill="#caa892"/>
            <circle cx="38.5" cy="21.2" r="0.7" fill="#caa892"/>
            <circle cx="41"  cy="21.2" r="0.7" fill="#caa892"/>
          </g>
        </g>`;
        }
        // Extend the far end of the strap along its direction by `extend` pixels.
        function strapPathExtended(isRight, extend = 4) {
          // Base endpoints (same as your originals)
          const x1 = isRight ? 46 : 18; // near end
          const y1 = 30;
          const x2 = isRight ? 28 : 46; // far end (the one we extend)
          const y2 = 18;

          // Direction from near -> far
          const dx = x2 - x1,
            dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len,
            uy = dy / len;

          // Extend far end by `extend`
          const xe2 = x2 + ux * extend;
          const ye2 = y2 + uy * extend;

          return `M ${x1} ${y1} L ${xe2} ${ye2}`;
        }
      case "patch": {
        const cx = isRight ? 38 : 26;
        const cy = 28;

        const strap = strapPathExtended(isRight, 4); // tweak 4 -> more/less extension
        const clipAttr = uid ? ` clip-path="url(#faceClip-${uid})"` : "";

        return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="6" fill="#111"/>
        <path d="${strap}" stroke="#111" stroke-width="3.2" stroke-linecap="round"${clipAttr}/>
      </g>`;
      }
      case "monocle": {
        const cx = isRight ? 38 : 26,
          cy = 28;
        const sx = isRight ? cx + 6 : cx - 6,
          sy = cy + 6;
        const chain = isRight
          ? `M ${sx} ${sy} q 4 6 0 10 q -3 4 0 8`
          : `M ${sx} ${sy} q -4 6 0 10 q 3 4 0 8`;
        return `<g>
          <circle cx="${cx}" cy="${cy}" r="6.5" fill="none" stroke="#e2c77e" stroke-width="2"/>
          <path d="${chain}" stroke="#e2c77e" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>`;
      }
      case "stache": {
        const dx = isRight ? 2.5 : -2.5,
          y = 34;
        return `<g transform="translate(${32 + dx} ${y})">
          <path d="M-15 2 C -11 -6 -4 -3 0 0 C -4 4 -11 7 -17 4" fill="#2b2b2b"/>
          <path d="M 15 2 C  11 -6  4 -3 0 0 C  4 4  11 7  17 4" fill="#2b2b2b"/>
        </g>`;
      }
      default:
        return "";
    }
  }

  // -- Body/arms --
  function booBodySVG(direction = "left", uid = "") {
    const mirror = direction === "right" ? "scale(-1,1) translate(-64,0)" : "";
    const FIN_Y = 12,
      L_X = 61,
      R_X = 3,
      OUT_L_A = -30,
      OUT_R_A = 30,
      LEN = 18,
      SPREAD = 10,
      STROKE = 1;

    // tiny pad so arm strokes near the edge aren't visibly clipped
    const ARM_CLIP_R = 18.1;

    return `
    <g transform="${mirror}">
      <defs>
        <clipPath id="armClip-${uid}" clipPathUnits="userSpaceOnUse">
          <circle cx="32" cy="32" r="${ARM_CLIP_R}"/>
        </clipPath>
      </defs>

      <path d="M49 32 q 7 -4  7  0 q -2  6 -7  8 q 2 -5  0 -8 Z" fill="#fff"/>

      <g class="boo-arms boo-arms--out"
         stroke="#111" stroke-width="${STROKE}" stroke-linecap="round"
         fill="#fff" style="vector-effect:non-scaling-stroke">
        <g transform="rotate(${OUT_L_A} ${L_X} ${FIN_Y})">
          <path d="M ${L_X} ${FIN_Y} Q ${L_X - LEN * 0.5} ${
      FIN_Y - SPREAD * 0.8
    } ${L_X - LEN} ${FIN_Y - SPREAD * 0.2}" />
          <path d="M ${L_X} ${FIN_Y} Q ${L_X - LEN * 0.5} ${
      FIN_Y + SPREAD * 0.2
    } ${L_X - LEN} ${FIN_Y + SPREAD * 0.9}" />
        </g>
        <g transform="rotate(${OUT_R_A} ${R_X} ${FIN_Y})">
          <path d="M ${R_X} ${FIN_Y} Q ${R_X + LEN * 0.5} ${
      FIN_Y - SPREAD * 0.8
    } ${R_X + LEN} ${FIN_Y - SPREAD * 0.2}" />
          <path d="M ${R_X} ${FIN_Y} Q ${R_X + LEN * 0.5} ${
      FIN_Y + SPREAD * 0.2
    } ${R_X + LEN} ${FIN_Y + SPREAD * 0.9}" />
        </g>
      </g>

      <circle cx="32" cy="32" r="18" fill="#fff"/>

      <g class="boo-arms boo-arms--in"
         clip-path="url(#armClip-${uid})"
         stroke="#111" stroke-width="${STROKE}" stroke-linecap="round"
         fill="none" style="vector-effect:non-scaling-stroke">
        <g transform="rotate(12 22 44)">
          <path d="M14 41 Q 20 38 26 44" />
          <path d="M14 49 Q 21 44 26 44" />
        </g>
        <g transform="rotate(-12 42 44)">
          <path d="M50 41 Q 44 38 38 44" />
          <path d="M50 49 Q 43 44 38 44" />
        </g>
      </g>
    </g>`;
  }

  // -- Full ghost SVG --
  function generateGhostSVG(opts) {
    const {
      eyeType,
      eyeColor,
      hideLeftEye,
      hideRightEye,
      mouthType,
      mouthColor,
      blush,
      direction = "left",
      faceShift = 0,
      faceTilt = 0,
      mouthOpts = {},
      accessories = [],
    } = opts;

    const buckets = { headTop: [], faceTop: [], mouthTop: [] };
    for (const a of accessories) buckets[ACC_LAYER[a] || "faceTop"].push(a);
    const headTop = sortByOrder(buckets.headTop, DRAW_ORDER.headTop);
    const faceTop = sortByOrder(buckets.faceTop, DRAW_ORDER.faceTop);
    const mouthTop = sortByOrder(buckets.mouthTop, DRAW_ORDER.mouthTop);

    const uid = Math.random().toString(36).slice(2, 8);
    const FACE_CLIP_R = 19;

    const tiltForDir = direction === "right" ? 6 : -6;
    const tongueStyle = TONGUE_EDIT_MODE
      ? TONGUE_STYLE_EDIT
      : TONGUE_STYLE_DEFAULT;
    const mouthGeom = MOUTH_GEOM;

    const faceEyesHTML = `
    <g class="face-eyesAcc">
      ${eyesSVG(eyeType, eyeColor, {
        hideLeft: !!hideLeftEye,
        hideRight: !!hideRightEye,
      })}
      ${
        blush
          ? `<ellipse cx="22" cy="34" rx="3.2" ry="1.6" fill="rgba(255,96,128,.28)"/><ellipse cx="42" cy="34" rx="3.2" ry="1.6" fill="rgba(255,96,128,.28)"/>`
          : ``
      }
    </g>`;

    const mouthNormalHTML = `
    <g class="mouth-normal">
      ${mouthSVG(mouthType, mouthColor, mouthOpts)}
      ${mouthTop.map((a) => accessorySVG(a, direction, uid)).join("")}
    </g>`;

    const mouthTongueHTML = `
    <g class="mouth-tongue">
      ${mouthSVG("booTongue", "#000", {
        cx: 32,
        cy: 38,
        w: mouthGeom.w,
        h: mouthGeom.h,
        sag: mouthGeom.sag,
        tilt: tiltForDir,
        tongueWFactor: tongueStyle.wFactor,
        tongueHFactor: tongueStyle.hFactor,
        tongueSplit: tongueStyle.split,
        tongueXOffset: tongueStyle.xNudge,
        tongueYOffset: tongueStyle.yNudge,
      })}
    </g>`;

    return `
    <svg class="ghost-main" data-dir="${direction}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id="faceClip-${uid}" clipPathUnits="userSpaceOnUse">
          <circle cx="32" cy="32" r="${FACE_CLIP_R}"/>
        </clipPath>
      </defs>

      ${booBodySVG(direction, uid)}

      <g class="boo-face" transform="translate(${faceShift},0) rotate(${faceTilt}, 32, 32)">
        ${faceEyesHTML}
        ${mouthNormalHTML}
        ${mouthTongueHTML}
        ${faceTop.map((a) => accessorySVG(a, direction, uid)).join("")}
      </g>

      ${headTop.map((a) => accessorySVG(a, direction, uid)).join("")}
    </svg>`;
  }

  // -- Placement avoidance --
  const AVOID_SELECTORS =
    '[data-avoid],[data-avoid-ghosts],[role="main"],main,' +
    "#mainPage,#quizPage,#questionPage,#resultsPage," +
    "#quizContainer,#resultsContainer,.quiz-main,.results-main,.container";

  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (
      cs.display === "none" ||
      cs.visibility === "hidden" ||
      cs.opacity === "0"
    )
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function findAvoidRects() {
    return Array.from(document.querySelectorAll(AVOID_SELECTORS))
      .filter(isVisible)
      .map((el) => el.getBoundingClientRect());
  }

  function getPrimaryAvoidRect(rects) {
    if (!rects || !rects.length) return null;
    return rects.reduce((a, b) =>
      a.width * a.height >= b.width * b.height ? a : b
    );
  }

  function rectToVWVH(rect, vw, vh) {
    return {
      leftVW: (rect.left / vw) * 100,
      rightVW: (rect.right / vw) * 100,
      topVH: (rect.top / vh) * 100,
      bottomVH: (rect.bottom / vh) * 100,
      centerVW: ((rect.left + rect.right) / 2 / vw) * 100,
    };
  }

  // true if (x,y) is OUTSIDE all avoid rects (ft small pad)
  function outsideAll(x, y, rects, pad = 0) {
    if (!rects || !rects.length) return true;
    for (const r of rects) {
      if (
        x >= r.left - pad &&
        x <= r.right + pad &&
        y >= r.top - pad &&
        y <= r.bottom + pad
      ) {
        return false;
      }
    }
    return true;
  }

  // -- build one ghost at a position, optional facing direction --
  function buildGhostAt(xVW, yVH, forcedDirection = null) {
    // pick up to 3 accessories & accessory chance
    const accessories = chooseAccessories(3, 0.15);

    const direction =
      forcedDirection || (Math.random() < 0.65 ? "left" : "right");
    const faceShift = direction === "left" ? -4 : 4;
    const faceTilt = direction === "left" ? -5 : 5;

    let eyeType = pick(["round", "round", "oval", "angry"]);
    let eyeColor = "#000";
    let mouthType = pick(["booFangs", "booFangs", "smile", "open", "frown"]);
    let blush = chance(0.12);

    let hideLeftEye = false,
      hideRightEye = false;

    if (accessories.includes("patch")) {
      if (direction === "left") hideLeftEye = true;
      else hideRightEye = true;
      eyeColor = "#000";
      if (eyeType === "angry" && chance(0.6)) eyeType = pick(["round", "oval"]);
      blush = false;
    }
    if (accessories.includes("monocle") && eyeType === "angry") {
      eyeType = pick(["round", "oval"]);
    }
    if (accessories.includes("stache")) {
      mouthType = "none";
    }

    const isShiny = ENABLE_SHINY && Math.random() < SHINY_CHANCE;

    const el = document.createElement("div");
    el.className = "h-shape";
    el.innerHTML = generateGhostSVG({
      eyeType,
      eyeColor,
      hideLeftEye,
      hideRightEye,
      mouthType,
      mouthColor: "#000",
      accessories,
      blush,
      direction,
      faceShift,
      faceTilt,
    });

    const svg = el.querySelector("svg.ghost-main");
    if (isShiny && svg) svg.classList.add("is-shiny");

    // motion/variety styling
    const size = rand(50, 90);
    const amp = rand(10, 22);
    const dur = rand(16, 24);
    const alpha = (0.22 + Math.random() * 0.16).toFixed(2);
    const blur = "0px";
    const r0 = rand(-6, -2).toFixed(1) + "deg";
    const r1 = rand(2, 6).toFixed(1) + "deg";
    const breathe = rand(4.5, 6.5).toFixed(2) + "s";
    const delay = rand(0, 10).toFixed(2) + "s";

    el.style.setProperty("--x", xVW.toFixed(2));
    el.style.setProperty("--y", yVH.toFixed(2));
    el.style.setProperty("--size", size + "px");
    el.style.setProperty("--amp", amp + "px");
    el.style.setProperty("--dur", dur + "s");
    el.style.setProperty("--alpha", alpha);
    el.style.setProperty("--blur", blur);
    el.style.setProperty("--r0", r0);
    el.style.setProperty("--r1", r1);
    el.style.setProperty("--breathe", breathe);
    el.style.animationDelay = delay;

    return el;
  }

  // -- spawn a batch, staying outside container and facing toward it --
  function spawn(count = 12) {
    layer.innerHTML = "";

    const vw = window.innerWidth,
      vh = window.innerHeight;
    const avoidRects = findAvoidRects();
    const primary = getPrimaryAvoidRect(avoidRects);
    const avoidInfo = primary ? rectToVWVH(primary, vw, vh) : null;

    // side ranges based on the primary container
    const M = 2;
    const leftRange = avoidInfo
      ? [6, Math.max(6, avoidInfo.leftVW - M)]
      : [6, 48];
    const rightRange = avoidInfo
      ? [Math.min(94, avoidInfo.rightVW + M), 94]
      : [52, 94];

    let leftCount = 0,
      rightCount = 0;
    for (let i = 0; i < count; i++) {
      const centerVW = avoidInfo ? avoidInfo.centerVW : 50;
      const preferLeft = leftCount <= rightCount;
      const range = preferLeft ? leftRange : rightRange;

      let xVW,
        yVH,
        attempts = 0;
      do {
        const useWide = range[1] - range[0] < 2;
        xVW = useWide
          ? Math.random() * (94 - 6) + 6
          : Math.random() * (range[1] - range[0]) + range[0];
        yVH = Math.random() * (92 - 8) + 8;
        attempts++;
        if (attempts > 80) break;
      } while (!outsideAll((xVW / 100) * vw, (yVH / 100) * vh, avoidRects, 0));

      const dir = avoidInfo
        ? xVW < avoidInfo.centerVW
          ? "right"
          : "left"
        : Math.random() < 0.65
        ? "left"
        : "right";

      layer.appendChild(buildGhostAt(xVW, yVH, dir));
      if (xVW < centerVW) leftCount++;
      else rightCount++;
    }
  }

  // -- respawn a single ghost, same rules as spawn --
  function spawnOne() {
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const avoidRects = findAvoidRects();
    const primary = getPrimaryAvoidRect(avoidRects);
    const avoidInfo = primary ? rectToVWVH(primary, vw, vh) : null;
    const centerVW = avoidInfo ? avoidInfo.centerVW : 50;

    // balance
    let leftCount = 0,
      rightCount = 0;
    Array.from(layer.children).forEach((el) => {
      const x = parseFloat(getComputedStyle(el).getPropertyValue("--x")) || 50;
      if (x < centerVW) leftCount++;
      else rightCount++;
    });

    const M = 2;
    const leftRange = avoidInfo
      ? [6, Math.max(6, avoidInfo.leftVW - M)]
      : [6, 48];
    const rightRange = avoidInfo
      ? [Math.min(94, avoidInfo.rightVW + M), 94]
      : [52, 94];

    const preferLeft = leftCount <= rightCount;
    const range = preferLeft ? leftRange : rightRange;

    let xVW,
      yVH,
      attempts = 0;
    do {
      const useWide = range[1] - range[0] < 2;
      xVW = useWide
        ? Math.random() * (94 - 6) + 6
        : Math.random() * (range[1] - range[0]) + range[0];
      yVH = Math.random() * (92 - 8) + 8;
      attempts++;
      if (attempts > 100) break;
    } while (!outsideAll((xVW / 100) * vw, (yVH / 100) * vh, avoidRects, 0));

    const dir = avoidInfo
      ? xVW < avoidInfo.centerVW
        ? "right"
        : "left"
      : Math.random() < 0.65
      ? "left"
      : "right";

    layer.appendChild(buildGhostAt(xVW, yVH, dir));
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stopCycle();
      else if (document.body.classList.contains("theme-halloween"))
        startCycle();
    },
    { passive: true }
  );

  // -- Despawn cycle config --
  const DESPAWN_INTERVAL_MS = 1000;
  let DESPAWN_RATE = 0.01;
  const DESPAWN_MAX_PER_TICK = 1;

  let cycleTimerId = null;

  function startCycle() {
    stopCycle();
    cycleTimerId = setInterval(() => {
      const nodes = Array.from(layer.children).filter((el) => !el._despawning);
      let fired = 0;
      for (const el of nodes) {
        if (Math.random() < DESPAWN_RATE) {
          startDespawn(el);
          if (++fired >= DESPAWN_MAX_PER_TICK) break;
        }
      }
    }, DESPAWN_INTERVAL_MS);
  }
  function stopCycle() {
    if (cycleTimerId) {
      clearInterval(cycleTimerId);
      cycleTimerId = null;
    }
  }

  // -- Despawn animation --
  function startDespawn(el) {
    if (el._despawning) return;
    el._despawning = true;

    el.classList.add("is-frozen");

    const svg = el.querySelector("svg");
    if (!svg) return;
    forceTongueOn(svg);
    svg.classList.add("is-despawning", "fade-out");

    const echo = svg.cloneNode(true);
    echo.classList.remove("fade-out");
    echo.classList.add("ghost-echo", "is-despawning");
    el.appendChild(echo);

    setTimeout(() => {
      if (layer.contains(el)) el.remove();
      spawnOne();
    }, 1000);
  }

  // -- Public API: enable/disable --
  function enable() {
    layer.style.display = "";
    const COUNT = window.innerWidth < 1249 ? 0 : 20;
    spawn(COUNT);
    window.addEventListener("resize", onResize, { passive: true });
    window.enableHalloweenWebs();
    window.visualSettings.forceShapesOff = false;
    startCycle();
  }
  function disable() {
    window.removeEventListener("resize", onResize);
    layer.innerHTML = "";
    layer.style.display = "none";
    window.disableHalloweenWebs();
    stopCycle();
  }
  function onResize() {
    clearTimeout(onResize._t);
    onResize._t = setTimeout(() => {
      if (document.body.classList.contains("theme-halloween")) {
        const COUNT = window.innerWidth < 1249 ? 10 : 20;
        spawn(COUNT);
      }
    }, 150);
  }

  window.enableHalloweenShapes = enable;
  window.disableHalloweenShapes = disable;
})();

// -- corner webs (simple, static svg) --
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const RMAX = 98; // keep strokes inside the 100x100 box

  function makeSVG() {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 100 100");
    return s;
  }
  function gStroke() {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "stroke");
    return g;
  }

  // -- top-right (corner at 100,0) --
  // keep geometry inside the 100×100 viewBox by this many px
  const WEB_PAD = 8; // tweak 6–12 to taste

  function makeWebTR(rings = 7, spokes = 10) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");

    const Cx = 100,
      Cy = 0; // top-right corner
    const R = 100 - WEB_PAD; // max radius that stays inside box
    const R_ARM = R - 0.5; // spoke length (slightly shorter than R)

    const wrap = document.createElementNS(NS, "g");
    svg.appendChild(wrap);

    // Optional soft fade at edges (set USE_FADE to true to enable)
    const USE_FADE = true;
    if (USE_FADE) {
      const uid = Math.random().toString(36).slice(2, 7);
      const defs = document.createElementNS(NS, "defs");

      const grad = document.createElementNS(NS, "radialGradient");
      grad.setAttribute("id", `fadeTR-${uid}`);
      grad.setAttribute("gradientUnits", "userSpaceOnUse");
      grad.setAttribute("cx", Cx);
      grad.setAttribute("cy", Cy);
      grad.setAttribute("r", 100);
      grad.innerHTML = `
      <stop offset="0%"   stop-color="white"/>
      <stop offset="${(R / 100) * 100}%" stop-color="white"/>
      <stop offset="100%" stop-color="black"/>
    `;
      defs.appendChild(grad);

      const mask = document.createElementNS(NS, "mask");
      mask.setAttribute("id", `maskTR-${uid}`);
      mask.innerHTML = `<rect x="0" y="0" width="100" height="100" fill="url(#fadeTR-${uid})"/>`;
      defs.appendChild(mask);

      svg.appendChild(defs);
      wrap.setAttribute("mask", `url(#maskTR-${uid})`);
    }

    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "stroke");
    wrap.appendChild(g);

    const JITTER = 0.06; // ±6% radius variance per segment
    const SAG_PX = 6; // curve bows toward the corner
    const angles = Array.from(
      { length: spokes + 1 },
      (_, i) => (i / spokes) * (Math.PI / 2)
    );
    const clamp = (v, hi) => (v > hi ? hi : v);

    // segmented rings (all segments clamped ≤ R)
    for (let i = 1; i <= rings; i++) {
      const rBase = (i / rings) * R;

      for (let s = 0; s < spokes; s++) {
        const t0 = angles[s],
          t1 = angles[s + 1];
        const r0 = clamp(
          rBase * (1 + (Math.random() * 2 - 1) * JITTER),
          R - 0.8
        );
        const r1 = clamp(
          rBase * (1 + (Math.random() * 2 - 1) * JITTER),
          R - 0.8
        );

        const x0 = Cx - r0 * Math.cos(t0),
          y0 = Cy + r0 * Math.sin(t0);
        const x1 = Cx - r1 * Math.cos(t1),
          y1 = Cy + r1 * Math.sin(t1);

        const mx = (x0 + x1) * 0.5,
          my = (y0 + y1) * 0.5;
        const vx = Cx - mx,
          vy = Cy - my;
        const vlen = Math.hypot(vx, vy) || 1;
        const cx = mx + (vx / vlen) * SAG_PX;
        const cy = my + (vy / vlen) * SAG_PX;

        const p = document.createElementNS(NS, "path");
        p.setAttribute(
          "d",
          `M ${x0.toFixed(2)} ${y0.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(
            2
          )} ${x1.toFixed(2)} ${y1.toFixed(2)}`
        );
        g.appendChild(p);
      }
    }

    // spokes (stay inside box by using R_ARM)
    for (let s = 1; s < spokes; s++) {
      const t = (s / spokes) * (Math.PI / 2);
      const x = Cx - R_ARM * Math.cos(t);
      const y = Cy + R_ARM * Math.sin(t);
      const ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", Cx);
      ln.setAttribute("y1", Cy);
      ln.setAttribute("x2", x.toFixed(2));
      ln.setAttribute("y2", y.toFixed(2));
      g.appendChild(ln);
    }
    return svg;
  }

  function makeWebBL(rings = 7, spokes = 10) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");

    const Cx = 0,
      Cy = 100; // bottom-left corner
    const R = 100 - WEB_PAD;
    const R_ARM = R - 0.5;

    const wrap = document.createElementNS(NS, "g");
    svg.appendChild(wrap);

    // Optional soft fade (mirror of TR)
    const USE_FADE = false;
    if (USE_FADE) {
      const uid = Math.random().toString(36).slice(2, 7);
      const defs = document.createElementNS(NS, "defs");

      const grad = document.createElementNS(NS, "radialGradient");
      grad.setAttribute("id", `fadeBL-${uid}`);
      grad.setAttribute("gradientUnits", "userSpaceOnUse");
      grad.setAttribute("cx", Cx);
      grad.setAttribute("cy", Cy);
      grad.setAttribute("r", 100);
      grad.innerHTML = `
      <stop offset="0%"   stop-color="white"/>
      <stop offset="${(R / 100) * 100}%" stop-color="white"/>
      <stop offset="100%" stop-color="black"/>
    `;
      defs.appendChild(grad);

      const mask = document.createElementNS(NS, "mask");
      mask.setAttribute("id", `maskBL-${uid}`);
      mask.innerHTML = `<rect x="0" y="0" width="100" height="100" fill="url(#fadeBL-${uid})"/>`;
      defs.appendChild(mask);

      svg.appendChild(defs);
      wrap.setAttribute("mask", `url(#maskBL-${uid})`);
    }

    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "stroke");
    wrap.appendChild(g);

    const JITTER = 0.06;
    const SAG_PX = 6;
    const angles = Array.from(
      { length: spokes + 1 },
      (_, i) => (i / spokes) * (Math.PI / 2)
    );
    const clamp = (v, hi) => (v > hi ? hi : v);

    for (let i = 1; i <= rings; i++) {
      const rBase = (i / rings) * R;

      for (let s = 0; s < spokes; s++) {
        const t0 = angles[s],
          t1 = angles[s + 1];
        const r0 = clamp(
          rBase * (1 + (Math.random() * 2 - 1) * JITTER),
          R - 0.8
        );
        const r1 = clamp(
          rBase * (1 + (Math.random() * 2 - 1) * JITTER),
          R - 0.8
        );

        const x0 = Cx + r0 * Math.cos(t0),
          y0 = Cy - r0 * Math.sin(t0);
        const x1 = Cx + r1 * Math.cos(t1),
          y1 = Cy - r1 * Math.sin(t1);

        const mx = (x0 + x1) * 0.5,
          my = (y0 + y1) * 0.5;
        const vx = Cx - mx,
          vy = Cy - my;
        const vlen = Math.hypot(vx, vy) || 1;
        const cx = mx + (vx / vlen) * SAG_PX;
        const cy = my + (vy / vlen) * SAG_PX;

        const p = document.createElementNS(NS, "path");
        p.setAttribute(
          "d",
          `M ${x0.toFixed(2)} ${y0.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(
            2
          )} ${x1.toFixed(2)} ${y1.toFixed(2)}`
        );
        g.appendChild(p);
      }
    }

    for (let s = 1; s < spokes; s++) {
      const t = (s / spokes) * (Math.PI / 2);
      const x = Cx + R_ARM * Math.cos(t);
      const y = Cy - R_ARM * Math.sin(t);
      const ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", Cx);
      ln.setAttribute("y1", Cy);
      ln.setAttribute("x2", x.toFixed(2));
      ln.setAttribute("y2", y.toFixed(2));
      g.appendChild(ln);
    }
    return svg;
  }

  function add(layer, cls, svg) {
    const box = document.createElement("div");
    box.className = `h-web ${cls}`;
    box.appendChild(svg);
    layer.appendChild(box);
  }

  window.enableHalloweenWebs = function ({ rings = 7, spokes = 10 } = {}) {
    let layer = document.getElementById("hWebsLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "hWebsLayer";
      layer.className = "h-webs-layer";
      document.body.appendChild(layer);
    } else {
      layer.innerHTML = "";
    }
    add(layer, "h-web--tr", makeWebTR(rings, spokes));
    add(layer, "h-web--bl", makeWebBL(rings, spokes));
  };

  window.disableHalloweenWebs = function () {
    document.getElementById("hWebsLayer")?.remove();
  };
})();
