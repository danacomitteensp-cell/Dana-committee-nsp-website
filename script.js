// script.js

// DOM references
const emailForm = document.getElementById('email-form');
const emailInput = document.getElementById('email-input');
const findBtn = document.getElementById('find-btn');
const formMessage = document.getElementById('form-message');

const passwordSection = document.getElementById('password-section');
const passwordInput = document.getElementById('password-input');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const copyPasswordBtn = document.getElementById('copy-password-btn');
const copyStatus = document.getElementById('copy-status');

// Simple cache for loaded credentials
let credentialsCache = null;
let isFetching = false;

/**
 * Set loading state on the Find Password button.
 * @param {boolean} isLoading
 */
function setButtonLoading(isLoading) {
  if (!findBtn) return;
  if (isLoading) {
    findBtn.classList.add('is-loading');
  } else {
    findBtn.classList.remove('is-loading');
  }
}

/**
 * Display a message under the email field.
 * @param {"error"|"info"} type
 * @param {string} message
 */
function showFormMessage(type, message) {
  if (!formMessage) return;
  formMessage.textContent = message;
  formMessage.classList.remove('error', 'info');
  formMessage.classList.add(type);
}

/**
 * Show the password section with fade-in animation.
 * @param {string} password
 */
function showPassword(password) {
  passwordInput.value = password || '';
  passwordSection.classList.remove('hidden');
  // Trigger reflow so adding .visible will animate
  void passwordSection.offsetWidth;
  passwordSection.classList.add('visible');
}

/**
 * Hide the password section.
 */
function hidePassword() {
  passwordSection.classList.remove('visible');
}

/**
 * Fetch credentials JSON file.
 * Uses in-memory cache to avoid repeated fetch calls.
 * @returns {Promise<Array<{email:string,password:string}>>}
 */
async function loadCredentials() {
  if (credentialsCache) {
    return credentialsCache;
  }
  if (isFetching) {
    // Wait briefly if another request is in progress
    await new Promise(resolve => setTimeout(resolve, 150));
    if (credentialsCache) return credentialsCache;
  }

  isFetching = true;
  try {
    const response = await fetch('credentials.json', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Unable to load credentials.');
    }

    const data = await response.json();
    // Expecting an array of objects, but be defensive
    credentialsCache = Array.isArray(data) ? data : [];
    return credentialsCache;
  } finally {
    isFetching = false;
  }
}

/**
 * Find password by email from loaded credentials.
 * @param {Array<{email:string,password:string}>} credentials
 * @param {string} email
 * @returns {string|null}
 */
function findPasswordByEmail(credentials, email) {
  if (!Array.isArray(credentials)) return null;
  const normalizedEmail = email.trim().toLowerCase();

  const match = credentials.find(entry => {
    if (!entry || typeof entry.email !== 'string') return false;
    return entry.email.trim().toLowerCase() === normalizedEmail;
  });

  if (!match || typeof match.password !== 'string') {
    return null;
  }
  return match.password;
}

/**
 * Handle email form submit.
 * @param {SubmitEvent} event
 */
async function handleEmailSubmit(event) {
  event.preventDefault();
  copyStatus.textContent = '';
  copyStatus.classList.remove('success', 'error');

  const emailValue = emailInput.value.trim();

  if (!emailValue) {
    showFormMessage('error', 'Please enter your registered email.');
    hidePassword();
    return;
  }

  // Optional basic email pattern check
  const basicEmailPattern = /\S+@\S+\.\S+/;
  if (!basicEmailPattern.test(emailValue)) {
    showFormMessage('error', 'Please enter a valid email address.');
    hidePassword();
    return;
  }

  showFormMessage('info', 'Looking up your password…');
  setButtonLoading(true);
  hidePassword();

  try {
    const credentials = await loadCredentials();
    const password = findPasswordByEmail(credentials, emailValue);

    if (!password) {
      showFormMessage('error', 'Email not found.');
      return;
    }

    showFormMessage('info', 'Password found. Displayed securely below.');
    showPassword(password);
  } catch (err) {
    showFormMessage('error', 'Something went wrong. Please try again.');
  } finally {
    setButtonLoading(false);
  }
}

/**
 * Toggle password visibility.
 */
function togglePasswordVisibility() {
  const isCurrentlyPassword = passwordInput.type === 'password';
  passwordInput.type = isCurrentlyPassword ? 'text' : 'password';

  if (isCurrentlyPassword) {
    togglePasswordBtn.classList.add('is-visible');
    togglePasswordBtn.setAttribute('aria-label', 'Hide password');
    togglePasswordBtn.setAttribute('aria-pressed', 'true');
  } else {
    togglePasswordBtn.classList.remove('is-visible');
    togglePasswordBtn.setAttribute('aria-label', 'Show password');
    togglePasswordBtn.setAttribute('aria-pressed', 'false');
  }
}

/**
 * Copy password to clipboard.
 */
async function copyPasswordToClipboard() {
  const value = passwordInput.value || '';

  if (!value) {
    copyStatus.textContent = 'Nothing to copy.';
    copyStatus.classList.remove('success');
    copyStatus.classList.add('error');
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      // Fallback for older browsers
      passwordInput.select();
      document.execCommand('copy');
      passwordInput.setSelectionRange(0, 0);
    }
    copyStatus.textContent = 'Password copied to clipboard.';
    copyStatus.classList.remove('error');
    copyStatus.classList.add('success');
  } catch (err) {
    copyStatus.textContent = 'Unable to copy. Please copy manually.';
    copyStatus.classList.remove('success');
    copyStatus.classList.add('error');
  }
}

/**
 * Initialize event listeners.
 */
function init() {
  emailForm.addEventListener('submit', handleEmailSubmit);
  togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  copyPasswordBtn.addEventListener('click', copyPasswordToClipboard);
}

document.addEventListener('DOMContentLoaded', init);
