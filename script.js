/**
 * script.js — BMI Calculator Logic
 *
 * Responsibilities:
 *  1. Unit toggle  : switch height input between cm and ft/in
 *  2. Validation   : check all fields before calculation
 *  3. BMI calc     : weight(kg) / height(m)²
 *  4. UI update    : show value, category, progress bar, recommendation
 *  5. Reset        : clear form and hide result card
 */

"use strict";

/* ── DOM references ───────────────────────────────────────── */
const form          = document.getElementById("bmiForm");
const calcBtn       = document.getElementById("calcBtn");
const resetBtn      = document.getElementById("resetBtn");
const resultCard    = document.getElementById("resultCard");

/** All gender radio buttons (name="gender") */
const genderRadios  = document.querySelectorAll('input[name="gender"]');
const ageInput      = document.getElementById("age");
const heightInput   = document.getElementById("height");
const weightInput   = document.getElementById("weight");

const bmiValueEl    = document.getElementById("bmiValue");
const bmiCategoryEl = document.getElementById("bmiCategory");
const categoryIcon  = document.getElementById("categoryIcon");
const bmiIndicator  = document.getElementById("bmiIndicator");
const recommendEl   = document.getElementById("recommendation");

const unitBtns      = document.querySelectorAll(".unit-btn");

/* ── State ────────────────────────────────────────────────── */
/** @type {"cm"|"ft"} */
let currentUnit = "cm";

/* ── BMI category definitions ────────────────────────────── */
/**
 * Each entry:
 *  - label      : category name shown in UI
 *  - min/max    : BMI range (inclusive)
 *  - colorClass : Tailwind text colour
 *  - recClass   : CSS class for recommendation box background
 *  - icon       : emoji icon
 *  - recommend  : health recommendation text
 */
const BMI_CATEGORIES = [
  {
    label:     "Underweight",
    min:       0,
    max:       18.49,
    colorClass:"text-blue-500",
    recClass:  "rec-underweight",
    icon:      "🫀",
    recommend: "BMI Anda menunjukkan berat badan kurang ideal. Tingkatkan asupan kalori dengan makanan bergizi seperti protein, lemak sehat, dan karbohidrat kompleks. Konsultasikan dengan ahli gizi dan lakukan latihan kekuatan untuk meningkatkan massa otot.",
  },
  {
    label:     "Normal",
    min:       18.5,
    max:       24.99,
    colorClass:"text-green-600",
    recClass:  "rec-normal",
    icon:      "✅",
    recommend: "Selamat! Berat badan Anda berada dalam rentang ideal. Pertahankan pola makan seimbang, olahraga rutin minimal 150 menit/minggu, dan tidur cukup 7–9 jam per malam untuk menjaga kondisi optimal.",
  },
  {
    label:     "Overweight",
    min:       25,
    max:       29.99,
    colorClass:"text-yellow-600",
    recClass:  "rec-overweight",
    icon:      "⚠️",
    recommend: "Berat badan Anda sedikit melebihi rentang ideal. Kurangi konsumsi makanan tinggi gula dan lemak jenuh, perbanyak sayur dan buah, serta tingkatkan aktivitas fisik seperti berjalan kaki, bersepeda, atau berenang minimal 30 menit/hari.",
  },
  {
    label:     "Obese",
    min:       30,
    max:       Infinity,
    colorClass:"text-red-500",
    recClass:  "rec-obese",
    icon:      "🚨",
    recommend: "BMI Anda masuk kategori obesitas. Disarankan untuk berkonsultasi dengan dokter atau ahli gizi untuk program penurunan berat badan yang aman. Batasi kalori, hindari makanan olahan, dan mulai olahraga aerobik secara bertahap.",
  },
];

/* ── Unit toggle ──────────────────────────────────────────── */
unitBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const selectedUnit = btn.dataset.unit;
    if (selectedUnit === currentUnit) return;

    // Convert current value if a number is already entered
    const currentValue = parseFloat(heightInput.value);

    if (selectedUnit === "ft" && !isNaN(currentValue)) {
      // cm → ft  (1 cm = 0.0328084 ft)
      heightInput.value = (currentValue * 0.0328084).toFixed(2);
    } else if (selectedUnit === "cm" && !isNaN(currentValue)) {
      // ft → cm  (1 ft = 30.48 cm)
      heightInput.value = (currentValue * 30.48).toFixed(1);
    }

    currentUnit = selectedUnit;

    // Update placeholder and label unit hint
    heightInput.placeholder = selectedUnit === "cm" ? "e.g. 170" : "e.g. 5.57";

    // Update active button styling
    unitBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    clearFieldError(heightInput, "heightError");
  });
});

/* ── Validation helpers ───────────────────────────────────── */

/**
 * Show error state on a field.
 * @param {HTMLElement} inputEl
 * @param {string} errorId  - id of the <p> error message element
 */
function showFieldError(inputEl, errorId) {
  inputEl.classList.add("input-error");
  document.getElementById(errorId).classList.remove("hidden");
}

/**
 * Clear error state on a field.
 * @param {HTMLElement} inputEl
 * @param {string} errorId
 */
function clearFieldError(inputEl, errorId) {
  inputEl.classList.remove("input-error");
  document.getElementById(errorId).classList.add("hidden");
}

/**
 * Validate all form fields.
 * @returns {{ valid: boolean, heightCm: number, weightKg: number }}
 */
function validateForm() {
  let valid = true;

  // Gender — find the checked radio button
  const checkedGender = document.querySelector('input[name="gender"]:checked');
  const genderErrorEl = document.getElementById("genderError");
  if (!checkedGender) {
    genderErrorEl.classList.remove("hidden");
    valid = false;
  } else {
    genderErrorEl.classList.add("hidden");
  }

  // Age (5–120)
  const age = parseInt(ageInput.value, 10);
  if (isNaN(age) || age < 5 || age > 120) {
    showFieldError(ageInput, "ageError");
    valid = false;
  } else {
    clearFieldError(ageInput, "ageError");
  }

  // Height
  const heightRaw = parseFloat(heightInput.value);
  let heightCm    = 0;
  const minHeight = currentUnit === "cm" ? 50 : 1.64;   // ~50cm or 1.64ft
  const maxHeight = currentUnit === "cm" ? 280 : 9.18;  // ~280cm or 9.18ft

  if (isNaN(heightRaw) || heightRaw < minHeight || heightRaw > maxHeight) {
    showFieldError(heightInput, "heightError");
    valid = false;
  } else {
    clearFieldError(heightInput, "heightError");
    heightCm = currentUnit === "cm" ? heightRaw : heightRaw * 30.48;
  }

  // Weight (kg, 1–500)
  const weightKg = parseFloat(weightInput.value);
  if (isNaN(weightKg) || weightKg < 1 || weightKg > 500) {
    showFieldError(weightInput, "weightError");
    valid = false;
  } else {
    clearFieldError(weightInput, "weightError");
  }

  return { valid, heightCm, weightKg };
}

/* ── BMI calculation ──────────────────────────────────────── */

/**
 * Calculate BMI.
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number} BMI rounded to 1 decimal
 */
function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get the BMI category object for a given BMI value.
 * @param {number} bmi
 * @returns {object}
 */
function getCategory(bmi) {
  return BMI_CATEGORIES.find((cat) => bmi >= cat.min && bmi <= cat.max);
}

/* ── Progress bar position ────────────────────────────────── */

/**
 * Map a BMI value to a percentage position on the visual scale.
 * Scale spans approximately BMI 10–45 for a useful display range.
 * @param {number} bmi
 * @returns {number} percentage 0–100
 */
function bmiToPercent(bmi) {
  const scaleMin = 10;
  const scaleMax = 45;
  const clamped  = Math.min(Math.max(bmi, scaleMin), scaleMax);
  return ((clamped - scaleMin) / (scaleMax - scaleMin)) * 100;
}

/* ── UI update ────────────────────────────────────────────── */

/**
 * Render the result card with calculated BMI data.
 * @param {number} bmi
 */
function renderResult(bmi) {
  const category = getCategory(bmi);

  // BMI number
  bmiValueEl.textContent = bmi.toFixed(1);
  bmiValueEl.className   = `text-5xl font-bold mt-1 ${category.colorClass}`;

  // Category label
  bmiCategoryEl.textContent = category.label;
  bmiCategoryEl.className   = `text-sm font-semibold mt-1 ${category.colorClass}`;

  // Icon box
  categoryIcon.textContent  = category.icon;
  categoryIcon.className    = "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-gray-50";

  // Progress bar indicator position
  const pct = bmiToPercent(bmi);
  bmiIndicator.style.left = `${pct}%`;

  // Recommendation
  recommendEl.className   = `rounded-2xl p-4 text-sm leading-relaxed ${category.recClass}`;
  recommendEl.textContent = category.recommend;

  // Show result card with animation
  resultCard.classList.remove("hidden");
  resultCard.classList.add("result-visible");

  // Smooth scroll to result
  resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ── Event: Form submit ───────────────────────────────────── */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const { valid, heightCm, weightKg } = validateForm();
  if (!valid) return;

  const bmi = calculateBMI(weightKg, heightCm);
  renderResult(bmi);
});

/* ── Event: Reset ─────────────────────────────────────────── */
resetBtn.addEventListener("click", () => {
  // Reset form fields
  form.reset();

  // Reset unit back to cm
  currentUnit = "cm";
  unitBtns.forEach((b) => {
    b.classList.remove("active");
    if (b.dataset.unit === "cm") b.classList.add("active");
  });
  heightInput.placeholder = "e.g. 170";

  // Clear any lingering error states
  [ageInput, heightInput, weightInput].forEach((el) => {
    el.classList.remove("input-error");
  });
  document.getElementById("genderError").classList.add("hidden");
  ["genderError", "ageError", "heightError", "weightError"].forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });

  // Hide result card
  resultCard.classList.add("hidden");
  resultCard.classList.remove("result-visible");

  // Scroll back to top of form
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ── Live validation: clear errors on valid input ─────────── */
// Hide gender error as soon as a radio button is selected
genderRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    document.getElementById("genderError").classList.add("hidden");
  });
});
ageInput.addEventListener("input",    () => clearFieldError(ageInput,    "ageError"));
heightInput.addEventListener("input", () => clearFieldError(heightInput, "heightError"));
weightInput.addEventListener("input", () => clearFieldError(weightInput, "weightError"));
