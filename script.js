// ========================================
// Configuration
// ========================================

const DANA_APP_URL = "danacommittee://";

// ========================================
// DOM References
// ========================================

// Navigation
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Email Form
const emailForm = document.getElementById('email-form');
const emailInput = document.getElementById('email-input');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');

// Password Card
const passwordCard = document.getElementById('password-card');
const passwordValueEl = document.getElementById('password-value');
const passwordEmailLabel = document.getElementById('password-email-label');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const eyeIcon = document.getElementById('eye-icon');
const copyPasswordBtn = document.getElementById('copy-password-btn');
const copyStatus = document.getElementById('copy-status');
const openAppBtn = document.getElementById('open-app-btn');

// ========================================
// State
// ========================================

let credentialsCache = null;
let isPasswordVisible = false;
let currentPassword = '';
let lastScrollY = window.scrollY;

// ========================================
// Navigation Functions
// ========================================

function toggleMobileMenu() {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
}

function handleNavClick(e) {
    if (e.target.classList.contains('nav-link')) {
        closeMobileMenu();
        
        // Update active state
        navLinks.forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
        
        // Smooth scroll to section
        const targetId = e.target.getAttribute('href');
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    }
}

function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Hide/show navbar on scroll
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
    }
    
    lastScrollY = currentScrollY;
    
    // Update active nav link based on scroll position
    updateActiveNavLink();
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 150;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ========================================
// Credentials Functions
// ========================================

async function loadCredentials() {
    if (credentialsCache) {
        return credentialsCache;
    }
    
    try {
        const response = await fetch('credentials.json');
        if (!response.ok) {
            throw new Error('Unable to load credentials');
        }
        
        const data = await response.json();
        credentialsCache = Array.isArray(data) ? data : [];
        return credentialsCache;
    } catch (error) {
        throw new Error('Unable to load credentials');
    }
}

function findPasswordByEmail(email) {
    if (!credentialsCache) return null;
    
    const normalized = email.trim().toLowerCase();
    const match = credentialsCache.find((entry) => {
        return typeof entry.email === 'string' &&
               entry.email.trim().toLowerCase() === normalized;
    });
    
    return match ? String(match.password ?? '') : null;
}

// ========================================
// UI State Functions
// ========================================

function setLoadingState(isLoading) {
    if (isLoading) {
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('error', 'info');
    if (type) {
        statusMessage.classList.add(type);
    }
}

function revealPasswordCard(email, password) {
    currentPassword = password;
    isPasswordVisible = false;
    
    passwordValueEl.textContent = '•'.repeat(Math.max(password.length, 6));
    passwordEmailLabel.textContent = email;
    
    togglePasswordBtn.setAttribute('aria-pressed', 'false');
    togglePasswordBtn.setAttribute('aria-label', 'Show password');
    
    copyStatus.textContent = '';
    copyStatus.classList.remove('success', 'error');
    
    passwordCard.classList.add('visible');
    passwordCard.setAttribute('aria-hidden', 'false');
    
    // Scroll to password card
    setTimeout(() => {
        passwordCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function togglePasswordVisibility() {
    if (!currentPassword) return;
    
    isPasswordVisible = !isPasswordVisible;
    
    if (isPasswordVisible) {
        passwordValueEl.textContent = currentPassword;
        togglePasswordBtn.setAttribute('aria-pressed', 'true');
        togglePasswordBtn.setAttribute('aria-label', 'Hide password');
    } else {
        passwordValueEl.textContent = '•'.repeat(Math.max(currentPassword.length, 6));
        togglePasswordBtn.setAttribute('aria-pressed', 'false');
        togglePasswordBtn.setAttribute('aria-label', 'Show password');
    }
}

async function copyPasswordToClipboard() {
    if (!currentPassword) return;
    
    copyStatus.textContent = '';
    copyStatus.classList.remove('success', 'error');
    
    try {
        await navigator.clipboard.writeText(currentPassword);
        copyStatus.textContent = 'Password copied to clipboard.';
        copyStatus.classList.add('success');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
            copyStatus.textContent = '';
            copyStatus.classList.remove('success');
        }, 3000);
    } catch (err) {
        copyStatus.textContent = 'Unable to copy. Please copy manually.';
        copyStatus.classList.add('error');
    }
}

// ========================================
// Form Handlers
// ========================================

async function handleEmailSubmit(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showStatus('Please enter your registered email.', 'error');
        return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showStatus('Please enter a valid email address.', 'error');
        return;
    }
    
    showStatus('Fetching your password…', 'info');
    setLoadingState(true);
    
    try {
        await loadCredentials();
        const password = findPasswordByEmail(email);
        
        if (!password) {
            showStatus('Email not found. Please check and try again.', 'error');
            passwordCard.classList.remove('visible');
            passwordCard.setAttribute('aria-hidden', 'true');
            currentPassword = '';
            return;
        }
        
        showStatus('', 'info');
        revealPasswordCard(email, password);
    } catch (error) {
        console.error(error);
        showStatus('Something went wrong. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

function handleOpenApp() {
    window.location.href = DANA_APP_URL;
}

// ========================================
// Initialization
// ========================================

function init() {
    // Navigation events
    navToggle.addEventListener('click', toggleMobileMenu);
    navMenu.addEventListener('click', handleNavClick);
    
    // Scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Form events
    emailForm.addEventListener('submit', handleEmailSubmit);
    
    // Password card events
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    copyPasswordBtn.addEventListener('click', copyPasswordToClipboard);
    openAppBtn.addEventListener('click', handleOpenApp);
    
    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    });
    
    // Set initial active nav link
    updateActiveNavLink();
}

// ========================================
// Start Application
// ========================================

document.addEventListener('DOMContentLoaded', init);
