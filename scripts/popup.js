// popup.js — first-visit tips + “unskippable” follow-up

// -------- quick config (edit me) --------
const POPUP_CONFIG = {
  // behavior
  CLOSE_THRESHOLD_MS: 8000, // if closed b4, show 2nd popup
  LOCK_SECONDS: 30, // 2nd popup delay
  MAGIC_WORD: "READ",
  DEBUG_ALWAYS_SHOW: false, // always show first popup

  // size & layout
  MAX_WIDTH_PX: 900,
  MIN_HEIGHT_PX: 520,
  RADIUS_PX: 22,
  BORDER_WIDTH_PX: 3,
  PADDING: "30px 28px 22px",

  // type & button
  BASE_FONT_REM: 1.12,
  LINE_HEIGHT: 1.65,
  TITLE_FONT_REM: 1.5,
  OK_LABEL: "Okay, got it!",

  // colors
  COLOR_TEXT: "var(--color-text, #f8f8ff)",
  COLOR_TEXT_MUTED: "var(--color-text-muted, #bfbfd6)",
  COLOR_BTN: "var(--btn, #6F55B6)",
  COLOR_BORDER: "var(--color-border, rgba(255,255,255,0.08))",
  OVERLAY_BG: "rgba(0,0,0,.55)",
  COLOR_BG: "linear-gradient(145deg, #1b1b2f, #1e1e2e 40%, #171721 90%)",

  // rgb border wave
  RGB_COLORS: [
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ],
  RGB_SPEED_S: 5, // lower = faster wave
  RGB_INTENSITY: 1.0, // 0.6 (soft) → 1.0 (strong)
};

(() => {
  // -------- keys for localStorage --------
  const STORAGE_KEYS = {
    firstShown: "popup.firstShown.v4",
    secondShown: "popup.secondShown.v4",
  };

  // -------- inject styles once --------
  function injectStylesOnce() {
    if (document.getElementById("pp-style")) return;

    const css = `
:root { --ppb: ${POPUP_CONFIG.BORDER_WIDTH_PX}px; }

@keyframes pp-pop {
  0% { transform: translateY(12px) scale(.96); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

/* animatable angle for the ring */
@property --ring-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

/* rotate only the gradient, not the element */
@keyframes ring-rotate { to { --ring-angle: 360deg; } }

.pp-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  background: ${POPUP_CONFIG.OVERLAY_BG};
  backdrop-filter: blur(2px);
}

/* animated RGB ring */
.pp-frame::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: ${POPUP_CONFIG.RADIUS_PX}px;
  padding: var(--ppb);
  background: conic-gradient(from var(--ring-angle), ${POPUP_CONFIG.RGB_COLORS.join(
    ", "
  )});
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: ring-rotate ${POPUP_CONFIG.RGB_SPEED_S}s linear infinite;
  will-change: --ring-angle;
  pointer-events: none;
  z-index: 0;
}

/* frame that holds the ring (padding = ring width) */
.pp-frame {
  position: relative;
  box-sizing: border-box;
  width: min(${POPUP_CONFIG.MAX_WIDTH_PX}px, calc(100vw - 8px));
  min-height: calc(${POPUP_CONFIG.MIN_HEIGHT_PX}px + 2*var(--ppb));
  border-radius: ${POPUP_CONFIG.RADIUS_PX}px;
  padding: var(--ppb);
  margin: 0 auto;
  overflow: visible;
}

/* soft glow outside the ring */
.pp-frame::after {
  content: "";
  position: absolute; inset: -1px;
  border-radius: ${POPUP_CONFIG.RADIUS_PX + 10}px;
  padding: var(--ppb);
  background: conic-gradient(from var(--ring-angle), ${POPUP_CONFIG.RGB_COLORS.join(
    ", "
  )});
  animation: ring-rotate ${POPUP_CONFIG.RGB_SPEED_S}s linear infinite;
  will-change: --ring-angle, filter;
  filter: blur(8px) opacity(${POPUP_CONFIG.RGB_INTENSITY});
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 0;
}

/* inner content box */
.pp-box {
  position: relative;
  z-index: 1;
  min-height: ${POPUP_CONFIG.MIN_HEIGHT_PX}px;
  max-height: 70vh;
  border-radius: calc(${POPUP_CONFIG.RADIUS_PX}px - var(--ppb));
  background: ${POPUP_CONFIG.COLOR_BG};
  color: ${POPUP_CONFIG.COLOR_TEXT};
  box-shadow: 0 18px 60px rgba(0,0,0,.40);
  display: flex; flex-direction: column;
  padding: ${POPUP_CONFIG.PADDING};
  font-size: ${POPUP_CONFIG.BASE_FONT_REM}rem;
  line-height: ${POPUP_CONFIG.LINE_HEIGHT};
  overflow-y: auto;
}

@media (max-width: 949px) {
  .pp-box { font-size: 0.9em; }
}

.pp-title {
  margin: 0 0 14px; font-weight: 800; font-size: ${
    POPUP_CONFIG.TITLE_FONT_REM
  }rem; letter-spacing: .2px;
  display: flex; align-items: center; gap: 10px;
}
.pp-badge {
  font-size: .95rem; padding: 4px 10px; border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  border: 1px solid ${POPUP_CONFIG.COLOR_BORDER};
}

.pp-content { margin-top: 6px; }
.pp-content ul { margin: 12px 0 0; padding-left: 24px; }

.pp-footer { display:flex; gap:12px; justify-content:flex-end; margin-top: auto; }

/* primary button */
.pp-btn {
  appearance:none; border:none; cursor:pointer; user-select:none;
  padding: 12px 16px; border-radius: 14px; font-weight: bold; font-size: 1.05rem;
  transition: transform .12s ease, box-shadow .12s ease, background-position .4s ease;
  background: linear-gradient(90deg, ${POPUP_CONFIG.COLOR_BTN}, #9b7bf0, ${
      POPUP_CONFIG.COLOR_BTN
    });
  background-size: 200% 100%;
  color: white; box-shadow: 0 6px 20px rgba(0,0,0,.28);
}
.pp-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(0,0,0,.34); background-position: 100% 0; }
.pp-btn:active { transform: translateY(0); box-shadow: 0 4px 14px rgba(0,0,0,.24); }

/* countdown button: grey while disabled, white when enabled */
.pp-waitbtn {
  min-width: 88px; display: inline-flex; justify-content: center; align-items: center;
  color: rgba(255,255,255,.45);
}
.pp-waitbtn[aria-disabled="false"] { color: #fff; }

/* end-of-countdown pulse */
@keyframes pp-pulse {
  0% { transform: scale(1); box-shadow: 0 6px 20px rgba(0,0,0,.28); }
  50% { transform: scale(1.03); box-shadow: 0 10px 26px rgba(0,0,0,.34); }
  100% { transform: scale(1); box-shadow: 0 6px 20px rgba(0,0,0,.28); }
}
.pp-waitbtn.pp-pulsing { animation: pp-pulse .9s ease-in-out infinite; }

.pp-muted { color: ${POPUP_CONFIG.COLOR_TEXT_MUTED}; }

/* magic word should look like normal text, but still be clickable */
.pp-magic { all: unset; cursor: pointer; }
.pp-magic:hover { text-decoration: underline; text-underline-offset: 2px; }
`;

    const style = document.createElement("style");
    style.id = "pp-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // -------- modal builder --------
  function createPopup({ html, closable = true }) {
    injectStylesOnce();

    const overlay = document.createElement("div");
    overlay.className = "pp-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const frame = document.createElement("div");
    frame.className = "pp-frame";

    const box = document.createElement("div");
    box.className = "pp-box";

    const contentWrap = document.createElement("div");
    contentWrap.innerHTML = html;

    const footer = document.createElement("div");
    footer.className = "pp-footer";

    if (closable) {
      const ok = document.createElement("button");
      ok.className = "pp-btn";
      ok.type = "button";
      ok.textContent = POPUP_CONFIG.OK_LABEL;
      ok.addEventListener("click", () => {
        teardown();
        box.onClose && box.onClose();
      });
      footer.appendChild(ok);
    }

    box.appendChild(contentWrap);
    box.appendChild(footer);
    frame.appendChild(box);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);

    const escBlocker = (e) => {
      if (!closable && e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", escBlocker, true);

    function teardown() {
      overlay.remove();
      window.removeEventListener("keydown", escBlocker, true);
    }

    return { overlay, frame, box, contentWrap, footer, teardown };
  }

  // -------- first popup content --------
  function firstHTML() {
    return `
      <h2 class="pp-title"><span>Quick Tips</span><span class="pp-badge">Welcome!</span></h2>
      <div class="pp-content">
        <ul>
          <li>Check out <strong>Settings</strong> for tips and customization.</li>
          <li>Use the <strong>Index</strong> for the class list.</li>
          <li><strong>Display</strong> controls visuals, and <strong>Volume</strong> is for audio.</li>
          <li>The site keeps track of your score, up to the previous 20 attempts.</li>
          <li>After you finish a quiz, visit <strong>Review</strong> to see explanations for every answer.</li>
          <li>Click "read" to skip the next pop up if it appears for whatever reason.</li>
          <li>Toggle themes in the footer for a new look.</li>
          <li><em>Dev Notes</em> has site updates, and don't forget the credits!</li>
          <li>Have suggestions or found a bug? DM <strong>@KingEnd</strong>!</li>
          <li>Have fun and happy quizzing!</li>
        </ul>
      </div>
    `;
  }

  // -------- second popup content (locked until it isn't) --------
  function secondHTML(secondsLeft, magicWord) {
    return `
      <h2 class="pp-title"><span>Well Well Well...</span><span class="pp-badge">💀</span></h2>
      <div class="pp-content">
        <p>So... You've ended up here because you couldn't be bothered to fully
          <button class="pp-magic" type="button" data-magic="${magicWord}">${magicWord}</button>,
          like, 7 bullet points? Well if it isn't the CONSEQUENCE of YOUR actions. Now we're going to sit here and wait.
          And in case you get bored, here's the bullet points again for you to review :&gt;
        </p>
        <ul>
          <li>Check out <strong>Settings</strong> for tips and customization.</li>
          <li>Use the <strong>Index</strong> for the class list.</li>
          <li><strong>Display</strong> controls visuals, and <strong>Volume</strong> is for audio.</li>
          <li>The site keeps track of your score, up to the previous 20 attempts.</li>
          <li>After you finish a quiz, visit <strong>Review</strong> to see explanations for every answer.</li>
          <li>Click "read" to skip the next pop up if it appears for whatever reason.</li>
          <li>Notice how I warned you too in the previous point? smh</li>
          <li>Toggle themes in the footer for a new look.</li>
          <li><em>Dev Notes</em> has site updates, and don't forget the credits!</li>
          <li>Have suggestions, found a bug, or want to complain about this 2nd pop up? DM <strong>@KingEnd</strong>!</li>
          <li>Have fun and happy quizzing!</li>
        </ul>
      </div>
      <div class="pp-footer">
        <button class="pp-btn pp-waitbtn" type="button" disabled aria-disabled="true" aria-label="Close when countdown ends">
          ${secondsLeft}
        </button>
      </div>
    `;
  }

  // -------- show first + decide if second should appear --------
  function showFirst() {
    const start = Date.now();
    const { box } = createPopup({ html: firstHTML(), closable: true });

    box.onClose = () => {
      const openMs = Date.now() - start;
      localStorage.setItem(STORAGE_KEYS.firstShown, "1");
      if (openMs < POPUP_CONFIG.CLOSE_THRESHOLD_MS) showSecond();
    };
  }

  // -------- show second (locked) --------
  function showSecond() {
    if (localStorage.getItem(STORAGE_KEYS.secondShown)) return;

    let remaining = POPUP_CONFIG.LOCK_SECONDS;
    const { overlay, contentWrap } = createPopup({
      html: secondHTML(remaining, POPUP_CONFIG.MAGIC_WORD),
      closable: false,
    });

    // early close via magic word
    contentWrap
      .querySelector(".pp-magic")
      ?.addEventListener("click", () => closeSecond());

    // countdown-only button
    const waitBtn = contentWrap.querySelector(".pp-waitbtn");
    waitBtn.textContent = `(${remaining})`;
    waitBtn.disabled = true;
    waitBtn.setAttribute("aria-disabled", "true");

    const timer = setInterval(() => {
      remaining--;

      if (remaining > 0) {
        waitBtn.textContent = `(${remaining})`;
        if (remaining <= 3) waitBtn.classList.add("pp-pulsing");
      } else {
        clearInterval(timer);
        waitBtn.classList.remove("pp-pulsing");
        waitBtn.textContent = "30-seconds is a lot";
        waitBtn.disabled = false;
        waitBtn.setAttribute("aria-disabled", "false");
        waitBtn.addEventListener("click", closeSecond, { once: true });
      }
    }, 1000);

    function closeSecond() {
      clearInterval(timer);
      overlay.remove();
      localStorage.setItem(STORAGE_KEYS.secondShown, "1");
    }
  }

  // -------- boot on first visit (or always if debug) --------
  document.addEventListener("DOMContentLoaded", () => {
    const firstSeen = localStorage.getItem(STORAGE_KEYS.firstShown);
    if (POPUP_CONFIG.DEBUG_ALWAYS_SHOW || !firstSeen) showFirst();
  });

  // -------- tiny test helpers --------
  window.__popupTest = {
    reset() {
      localStorage.removeItem(STORAGE_KEYS.firstShown);
      localStorage.removeItem(STORAGE_KEYS.secondShown);
    },
    showFirst,
    showSecond,
  };
})();
