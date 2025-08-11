document.addEventListener("DOMContentLoaded", () => {
  // -------- grab elements --------
  // Wrapper holds the custom select; will bail early if not present to avoid errors
  const wrapper = document.querySelector(".star-dropdown-wrap.custom-select");
  if (!wrapper) return;

  // The real <select> is mirrored (kept in sync so forms/events still work)
  const selectEl = wrapper.querySelector("select");

  // The pill users click to open/close the menu
  const trigger = wrapper.querySelector(".custom-select-trigger");

  // The container where I render clickable options
  const optionsDiv = wrapper.querySelector(".custom-options");

  // The text inside the trigger that reflects the current selection
  const triggerText = wrapper.querySelector(".trigger-text");

  // -------- helpers --------
  // Closes dropdown
  function closeDropdown() {
    wrapper.classList.remove("open");
  }

  // Opens dropdown
  function openDropdown() {
    wrapper.classList.add("open");
  }

  // Selects a given option <div> and syncs the real <select>
  function selectOption(optionDiv) {
    // Clear previous selection in custom list
    optionsDiv.querySelectorAll(".custom-option").forEach((o) => {
      o.classList.remove("selected");
    });

    // Mark one as selected
    optionDiv.classList.add("selected");

    // Update trigger text to reflect the pick
    triggerText.textContent = optionDiv.textContent;

    // Sync the hidden/native <select> value
    selectEl.value = optionDiv.dataset.value;

    // Fire a real change event so it runs as if user changed the <select>
    selectEl.dispatchEvent(new Event("change"));
  }

  // -------- build options from <select> --------
  // Create all custom options once
  const frag = document.createDocumentFragment();

  // Track whether a preselected option was found to set initial label
  let hadPreselected = false;

  // Walk each <option> and create a corresponding .custom-option
  Array.from(selectEl.options).forEach((opt) => {
    const div = document.createElement("div");
    div.className = "custom-option";
    div.textContent = opt.textContent;
    div.dataset.value = opt.value;

    // Disabled <option> should render but not be selectable
    if (opt.disabled) {
      div.classList.add("disabled");
    }

    // Respect a preselected <option> from the native select
    if (opt.selected && !opt.disabled) {
      div.classList.add("selected");
      triggerText.textContent = opt.textContent;
      hadPreselected = true;
    }

    frag.appendChild(div);
  });

  // Append all the generated options to the menu
  optionsDiv.appendChild(frag);

  // If nothing was preselected, default to the first non-disabled option
  if (!hadPreselected) {
    const firstEnabled = optionsDiv.querySelector(
      ".custom-option:not(.disabled)"
    );
    if (firstEnabled) {
      firstEnabled.classList.add("selected");
      triggerText.textContent = firstEnabled.textContent;
      selectEl.value = firstEnabled.dataset.value;
    }
  }

  // -------- open/close behavior --------
  // Clicking the pill toggles the dropdown visibility
  trigger.addEventListener("click", () => {
    wrapper.classList.toggle("open");
  });

  // Clicking outside the component closes the dropdown
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) closeDropdown();
  });

  // Basic keyboard UX:
  // - Escape closes
  // (Arrow navigation will prolly be added later)
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
      trigger.focus?.();
    }
  });

  // -------- option selection (event delegation) --------
  // One listener on da container is cheaper than one per option!!
  optionsDiv.addEventListener("click", (e) => {
    const target = e.target;

    // Ignore clicks that aren't option items
    if (!target.classList.contains("custom-option")) return;

    // Disabled options are visible but not interactive
    if (target.classList.contains("disabled")) return;

    // Update selection UI, then close the menu
    selectOption(target);
    closeDropdown();
  });
});
