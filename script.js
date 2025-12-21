// Configuration: app URL (easy to change)
const DANA_APP_URL = "danacommittee://";


// DOM references
const emailForm = document.getElementById("email-form");
const emailInput = document.getElementById("email-input");
const submitBtn = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status-message");

const passwordCard = document.getElementById("password-card");
const passwordValueEl = document.getElementById("password-value");
const passwordEmailLabel = document.getElementById("password-email-label");
const togglePasswordBtn = document.getElementById("toggle-password-btn");
const eyeIcon = document.getElementById("eye-icon");
const copyPasswordBtn = document.getElementById("copy-password-btn");
const copyStatus = document.getElementById("copy-status");
const openAppBtn = document.getElementById("open-app-btn");

// State
let credentialsCache = null;
let isPasswordVisible = false;
let currentPassword = "";

/**
 * Fetch credentials from credentials.json and cache them.
 */
async function loadCredentials() {
  if (credentialsCache) {
    return credentialsCache;
  }

  const response = await fetch("credentials.json");
  if (!response.ok) {
    throw new Error("Unable to load credentials");
  }
  const data = await response.json();
  credentialsCache = Array.isArray(data) ? data : [];
  return credentialsCache;
}

/**
 * Find password by email in loaded credentials.
 * @param {string} email
 * @returns {string|null}
 */
function findPasswordByEmail(email) {
  if (!credentialsCache) return null;
  const normalized = email.trim().toLowerCase();
  const match = credentialsCache.find((entry) => {
    return typeof entry.email === "string" &&
      entry.email.trim().toLowerCase() === normalized;
  });
  return match ? String(match.password ?? "") : null;
}

/**
 * Set loading state on submit button.
 * @param {boolean} isLoading
 */
function setLoadingState(isLoading) {
  if (isLoading) {
    submitBtn.classList.add("btn-loading");
    submitBtn.disabled = true;
  } else {
    submitBtn.classList.remove("btn-loading");
    submitBtn.disabled = false;
  }
}

/**
 * Show status text under the input.
 * @param {string} message
 * @param {"error"|"info"} type
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.classList.remove("error", "info");
  if (type) {
    statusMessage.classList.add(type);
  }
}

/**
 * Reveal password card with fade-in.
 * @param {string} email
 * @param {string} password
 */
function revealPasswordCard(email, password) {
  currentPassword = password;
  isPasswordVisible = false;

  passwordValueEl.textContent = "•".repeat(Math.max(password.length, 6));
  passwordEmailLabel.textContent = email;

  togglePasswordBtn.setAttribute("aria-pressed", "false");
  togglePasswordBtn.setAttribute("aria-label", "Show password");

  copyStatus.textContent = "";
  copyStatus.classList.remove("success", "error");

  passwordCard.classList.add("visible");
  passwordCard.setAttribute("aria-hidden", "false");
}

/**
 * Toggle password visibility.
 */
function togglePasswordVisibility() {
  if (!currentPassword) return;

  isPasswordVisible = !isPasswordVisible;

  if (isPasswordVisible) {
    passwordValueEl.textContent = currentPassword;
    togglePasswordBtn.setAttribute("aria-pressed", "true");
    togglePasswordBtn.setAttribute("aria-label", "Hide password");
  } else {
    passwordValueEl.textContent = "•".repeat(Math.max(currentPassword.length, 6));
    togglePasswordBtn.setAttribute("aria-pressed", "false");
    togglePasswordBtn.setAttribute("aria-label", "Show password");
  }
}

/**
 * Copy password value to clipboard.
 */
async function copyPasswordToClipboard() {
  if (!currentPassword) return;

  copyStatus.textContent = "";
  copyStatus.classList.remove("success", "error");

  try {
    await navigator.clipboard.writeText(currentPassword);
    copyStatus.textContent = "Password copied to clipboard.";
    copyStatus.classList.add("success");
  } catch (err) {
    copyStatus.textContent = "Unable to copy. Please copy manually.";
    copyStatus.classList.add("error");
  }
}

/**
 * Handle email form submit.
 * @param {SubmitEvent} event
 */
async function handleEmailSubmit(event) {
  event.preventDefault();

  const email = emailInput.value.trim();
  if (!email) {
    showStatus("Please enter your registered email.", "error");
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showStatus("Please enter a valid email address.", "error");
    return;
  }

  showStatus("Fetching your password…", "info");
  setLoadingState(true);

  try {
    await loadCredentials();
    const password = findPasswordByEmail(email);

    if (!password) {
      showStatus("Email not found.", "error");
      passwordCard.classList.remove("visible");
      passwordCard.setAttribute("aria-hidden", "true");
      currentPassword = "";
      return;
    }

    showStatus("", "info");
    revealPasswordCard(email, password);
  } catch (error) {
    console.error(error);
    showStatus("Something went wrong. Please try again.", "error");
  } finally {
    setLoadingState(false);
  }
}

/**
 * Handle Open App button click.
 */
function handleOpenApp() {
  window.location.href = DANA_APP_URL;
}

/**
 * Initialize event listeners.
 */
function init() {
  emailForm.addEventListener("submit", handleEmailSubmit);
  togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
  copyPasswordBtn.addEventListener("click", copyPasswordToClipboard);
  openAppBtn.addEventListener("click", handleOpenApp);
}

document.addEventListener("DOMContentLoaded", init);
