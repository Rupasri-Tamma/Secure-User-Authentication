// Main Application Controller (SPA, Auth, Particles, Security Lab & Session Warnings)
import * as db from './db.js';
import { hashPassword, generateSalt, generateSessionToken } from './crypto.js';
import { runHashComparison } from './security-lab.js';

// State Tracker
let currentState = {
    currentUser: null,
    currentSession: null,
    sessionInterval: null,
    activeTab: 'tab-profile',
    warningModalShown: false
};

// UI Selectors
const DOM = {
    // Views
    viewLogin: document.getElementById('view-login'),
    viewSignup: document.getElementById('view-signup'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewAccessDenied: document.getElementById('view-access-denied'),
    
    // Forms
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    
    // Inputs
    loginUser: document.getElementById('login-username'),
    loginPass: document.getElementById('login-password'),
    regName: document.getElementById('reg-name'),
    regEmail: document.getElementById('reg-email'),
    regUser: document.getElementById('reg-username'),
    regPass: document.getElementById('reg-password'),
    regRole: document.getElementById('reg-role'),
    
    // Header Nav
    navBtnLogin: document.getElementById('nav-btn-login'),
    navBtnRegister: document.getElementById('nav-btn-register'),
    navProfileSection: document.getElementById('nav-profile-section'),
    navAvatarBox: document.getElementById('nav-avatar-box'),
    navDisplayUsername: document.getElementById('nav-display-username'),
    navDisplayRole: document.getElementById('nav-display-role'),
    navBtnLogout: document.getElementById('nav-btn-logout'),
    logoHome: document.getElementById('btn-logo-home'),
    
    // Dashboard Tabs
    sidebarLinks: document.querySelectorAll('.sidebar-link'),
    tabViews: document.querySelectorAll('.tab-view'),
    sidebarIndicator: document.getElementById('sidebar-indicator'),
    sideLinkEditor: document.getElementById('side-link-editor'),
    sideLinkAdmin: document.getElementById('side-link-admin'),
    sideLinkSessions: document.getElementById('side-link-sessions'),
    
    // Profile Fields
    profileRoleBadge: document.getElementById('profile-role-badge'),
    profileName: document.getElementById('profile-val-name'),
    profileEmail: document.getElementById('profile-val-email'),
    profileUsername: document.getElementById('profile-val-username'),
    profileRole: document.getElementById('profile-val-role'),
    profileHash: document.getElementById('profile-val-hash'),
    profileSalt: document.getElementById('profile-val-salt'),
    
    // Cryptography Lab
    labPwdInput: document.getElementById('lab-pwd-input'),
    labSaltInput: document.getElementById('lab-salt-input'),
    labIterInput: document.getElementById('lab-iterations-input'),
    btnRegenSalt: document.getElementById('btn-regen-salt'),
    labShaTime: document.getElementById('lab-sha-time'),
    labShaHash: document.getElementById('lab-sha-hash'),
    labShaBar: document.getElementById('lab-sha-bar'),
    labPbkTime: document.getElementById('lab-pbk-time'),
    labPbkHash: document.getElementById('lab-pbk-hash'),
    labPbkBar: document.getElementById('lab-pbk-bar'),
    labRatioText: document.getElementById('lab-ratio-text'),
    
    // Cryptography Lab Stepper
    stepPlainVal: document.getElementById('step-val-plain'),
    stepSaltVal: document.getElementById('step-val-salt'),
    stepStretchVal: document.getElementById('step-val-stretch'),
    stepHashVal: document.getElementById('step-val-hash'),
    stepPlainCard: document.getElementById('step-plaintext'),
    stepSaltCard: document.getElementById('step-salt'),
    stepStretchCard: document.getElementById('step-stretch'),
    stepHashCard: document.getElementById('step-hash'),
    
    // Editor panel
    btnSaveDraft: document.getElementById('btn-save-draft'),
    
    // Admin panel
    adminUserCards: document.getElementById('admin-user-cards'),
    adminSearchUsers: document.getElementById('admin-search-users'),
    adminLogsTerminal: document.getElementById('admin-logs-terminal'),
    btnClearLogs: document.getElementById('btn-clear-logs'),
    
    // Session Control
    sessTimeoutVal: document.getElementById('sess-timeout-val'),
    btnRefreshSession: document.getElementById('btn-refresh-session'),
    btnSimulateExpire: document.getElementById('btn-simulate-expire'),
    sessionToken: document.getElementById('session-val-token'),
    sessionUser: document.getElementById('session-val-user'),
    sessionExpires: document.getElementById('session-val-expires'),
    sessionRemaining: document.getElementById('session-val-remaining'),
    
    // Warning Modal Overlay
    sessionWarningModal: document.getElementById('session-warning-modal'),
    modalWarningSeconds: document.getElementById('modal-warning-seconds'),
    btnModalExtend: document.getElementById('btn-modal-extend'),
    btnModalLogout: document.getElementById('btn-modal-logout'),
    
    // Access Denied Back button
    btnDeniedBack: document.getElementById('btn-denied-back'),
    
    // Password strength elements
    regPwdContainer: document.getElementById('reg-pwd-strength-container'),
    regPwdFill: document.getElementById('reg-pwd-strength-fill'),
    regPwdText: document.getElementById('reg-pwd-strength-text'),
    ruleLen: document.getElementById('rule-len'),
    ruleNum: document.getElementById('rule-num'),
    ruleSpec: document.getElementById('rule-spec'),
    
    // Background Particles Canvas
    canvas: document.getElementById('bg-canvas'),
    
    // Toasts
    toastContainer: document.getElementById('toast-container')
};

// Canvas Particle System
let particlesArray = [];
let mouse = { x: null, y: null, radius: 100 };

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update(ctx, width, height) {
        if (this.x > width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > height || this.y < 0) {
            this.directionY = -this.directionY;
        }
        
        // Mouse interaction (push away)
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < mouse.radius) {
            if (mouse.x < this.x && this.x < width - this.size * 10) {
                this.x += 3;
            }
            if (mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 3;
            }
            if (mouse.y < this.y && this.y < height - this.size * 10) {
                this.y += 3;
            }
            if (mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 3;
            }
        }
        
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw(ctx);
    }
}

function initParticles() {
    particlesArray = [];
    let numberOfParticles = (DOM.canvas.width * DOM.canvas.height) / 11000;
    numberOfParticles = Math.min(numberOfParticles, 120); // capped for performance
    
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 0.5;
        let x = (Math.random() * ((DOM.canvas.width - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((DOM.canvas.height - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 0.4) - 0.2;
        let directionY = (Math.random() * 0.4) - 0.2;
        let colors = ['rgba(99, 102, 241, 0.2)', 'rgba(168, 85, 247, 0.15)', 'rgba(59, 130, 246, 0.15)'];
        let color = colors[Math.floor(Math.random() * colors.length)];
        
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

function connectParticles(ctx) {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 110) {
                opacityValue = 1 - (distance/110);
                ctx.strokeStyle = `rgba(99, 102, 241, ${opacityValue * 0.08})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    const ctx = DOM.canvas.getContext('2d');
    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update(ctx, DOM.canvas.width, DOM.canvas.height);
    }
    connectParticles(ctx);
    requestAnimationFrame(animateParticles);
}

function setupCanvas() {
    DOM.canvas.width = window.innerWidth;
    DOM.canvas.height = window.innerHeight;
    initParticles();
    
    window.addEventListener('resize', () => {
        DOM.canvas.width = window.innerWidth;
        DOM.canvas.height = window.innerHeight;
        initParticles();
    });
    
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });
    
    window.addEventListener('mouseout', () => {
        mouse.x = undefined;
        mouse.y = undefined;
    });
    
    animateParticles();
}

// Toast notification trigger
function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'circle-check';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Route Guard / Tab authorization mapping
const ROLE_PERMISSIONS = {
    'user': ['tab-profile', 'tab-security-lab'],
    'editor': ['tab-profile', 'tab-security-lab', 'tab-editor'],
    'admin': ['tab-profile', 'tab-security-lab', 'tab-editor', 'tab-admin', 'tab-sessions']
};

function hasAccess(role, tabId) {
    return ROLE_PERMISSIONS[role] && ROLE_PERMISSIONS[role].includes(tabId);
}

// Initialize SPA App
async function initApp() {
    console.log("Starting Application Setup...");
    
    // Register actions immediately to block standard page reloads
    if (DOM.formLogin) DOM.formLogin.addEventListener('submit', handleLogin);
    if (DOM.formRegister) DOM.formRegister.addEventListener('submit', handleRegister);
    
    if (DOM.navBtnLogin) DOM.navBtnLogin.addEventListener('click', () => switchView('login'));
    if (DOM.navBtnRegister) DOM.navBtnRegister.addEventListener('click', () => switchView('register'));
    if (DOM.linkGotoRegister) DOM.linkGotoRegister.addEventListener('click', () => switchView('register'));
    if (DOM.linkGotoLogin) DOM.linkGotoLogin.addEventListener('click', () => switchView('login'));
    if (DOM.logoHome) DOM.logoHome.addEventListener('click', goHome);
    if (DOM.navBtnLogout) DOM.navBtnLogout.addEventListener('click', handleLogout);
    if (DOM.btnDeniedBack) DOM.btnDeniedBack.addEventListener('click', goHome);
    
    // Setup Password visibility togglers
    document.querySelectorAll('.input-toggle-pwd').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling.previousElementSibling;
            const icon = btn.querySelector('i, svg');
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.setAttribute('data-lucide', 'eye-off');
                } else {
                    input.type = 'password';
                    icon.setAttribute('data-lucide', 'eye');
                }
                if (window.lucide) window.lucide.createIcons();
            }
        });
    });

    try {
        // 1. Init Database Simulator
        await db.initializeDB();
        
        // 2. Setup interactive Canvas background particles
        setupCanvas();
        
        // 3. Live Password strength checking (Register Form)
        if (DOM.regPass) DOM.regPass.addEventListener('input', checkLivePasswordStrength);
        
        // 4. Sidebar Menu Tab Navigation
        DOM.sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // 5. Security Lab Actions
        if (DOM.labPwdInput) DOM.labPwdInput.addEventListener('input', runLabComparison);
        if (DOM.labIterInput) DOM.labIterInput.addEventListener('change', runLabComparison);
        if (DOM.btnRegenSalt) {
            DOM.btnRegenSalt.addEventListener('click', () => {
                DOM.labSaltInput.value = generateSalt();
                runLabComparison();
                showToast("Dynamic salt regenerated for Cryptography simulation", "info");
            });
        }
        if (DOM.labSaltInput) DOM.labSaltInput.value = generateSalt(); // Init lab salt
        
        // 6. Admin panel search and actions
        if (DOM.adminSearchUsers) DOM.adminSearchUsers.addEventListener('input', renderUserCards);
        if (DOM.btnClearLogs) {
            DOM.btnClearLogs.addEventListener('click', () => {
                db.clearLogs();
                renderAdminLogs();
                showToast("System security audit logs cleared.", "success");
            });
        }
        
        // 7. Session Management Panel Action triggers
        if (DOM.btnRefreshSession) DOM.btnRefreshSession.addEventListener('click', handleRefreshSession);
        if (DOM.btnSimulateExpire) {
            DOM.btnSimulateExpire.addEventListener('click', () => {
                db.clearSession();
                checkActiveSession();
                showToast("Session token force expired. Access revoked.", "warning");
            });
        }
        if (DOM.sessTimeoutVal) {
            DOM.sessTimeoutVal.addEventListener('change', () => {
                handleRefreshSession();
                showToast("Session lifetime limits updated.", "info");
            });
        }
        
        // 8. Modal actions
        if (DOM.btnModalExtend) {
            DOM.btnModalExtend.addEventListener('click', () => {
                handleRefreshSession();
                DOM.sessionWarningModal.classList.add('hidden');
                currentState.warningModalShown = false;
            });
        }
        if (DOM.btnModalLogout) {
            DOM.btnModalLogout.addEventListener('click', () => {
                DOM.sessionWarningModal.classList.add('hidden');
                currentState.warningModalShown = false;
                handleLogout();
            });
        }
        
        // 9. Editor actions
        if (DOM.btnSaveDraft) {
            DOM.btnSaveDraft.addEventListener('click', () => {
                showToast("Draft content saved successfully (Simulated auto-save).", "success");
                db.addLog('CONTENT_DRAFT_SAVE', currentState.currentUser.username, 'SUCCESS', 'Saved draft in Editor Workspace.');
            });
        }
        
        // 10. Check current session status
        checkActiveSession();
        
        // Initial active pill alignment
        alignSidebarHighlight();
        
        // Load icons
        if (window.lucide) window.lucide.createIcons();
        
        // Run Security Lab once to initialize the chart metrics
        runLabComparison();
    } catch (error) {
        console.error("App Initialization Failed:", error);
        // If unsecure context, show a helpful alert
        if (!window.crypto.subtle) {
            alert("Security Notice: Web Cryptography API requires a secure context (HTTPS or localhost). Please ensure you are accessing the page securely.");
        } else {
            showToast("Application initialization encountered a runtime warning.", "warning");
        }
    }
}

// UI State / Screens switching
function switchView(viewName) {
    DOM.viewLogin.classList.add('hidden');
    DOM.viewSignup.classList.add('hidden');
    DOM.viewDashboard.classList.add('hidden');
    DOM.viewAccessDenied.classList.add('hidden');
    
    DOM.navBtnLogin.classList.remove('active');
    DOM.navBtnRegister.classList.remove('active');
    
    if (viewName === 'login') {
        DOM.viewLogin.classList.remove('hidden');
        DOM.navBtnLogin.classList.add('active');
    } else if (viewName === 'register') {
        DOM.viewSignup.classList.remove('hidden');
        DOM.navBtnRegister.classList.add('active');
    } else if (viewName === 'dashboard') {
        DOM.viewDashboard.classList.remove('hidden');
        configureSidebarVisibility();
        switchTab(currentState.activeTab);
    } else if (viewName === 'denied') {
        DOM.viewAccessDenied.classList.remove('hidden');
    }
    if (window.lucide) window.lucide.createIcons();
}

function goHome() {
    if (currentState.currentUser) {
        switchView('dashboard');
    } else {
        switchView('register');
    }
}

// Tab rendering checks within dashboard grid
function switchTab(tabId) {
    if (!currentState.currentUser) {
        switchView('login');
        return;
    }
    
    // Guard tab access based on role
    if (!hasAccess(currentState.currentUser.role, tabId)) {
        db.addLog('UNAUTHORIZED_ACCESS_ATTEMPT', currentState.currentUser.username, 'FAILED', `Blocked access to ${tabId}. Role: ${currentState.currentUser.role}`);
        switchView('denied');
        return;
    }
    
    currentState.activeTab = tabId;
    
    DOM.sidebarLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    DOM.tabViews.forEach(view => {
        if (view.id === tabId) {
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    });
    
    // Animate sliding active tab capsule
    alignSidebarHighlight();
    
    // Specific tab loads
    if (tabId === 'tab-profile') {
        renderProfileTab();
    } else if (tabId === 'tab-admin') {
        renderAdminDashboard();
    } else if (tabId === 'tab-sessions') {
        updateSessionControlUI();
    }
}

// Sidebar active background capsule alignment
function alignSidebarHighlight() {
    const activeLink = document.querySelector('.sidebar-link.active');
    if (activeLink && DOM.sidebarIndicator) {
        const offsetTop = activeLink.offsetTop;
        const height = activeLink.offsetHeight;
        DOM.sidebarIndicator.style.transform = `translateY(${offsetTop}px)`;
        DOM.sidebarIndicator.style.height = `${height}px`;
        DOM.sidebarIndicator.style.opacity = '1';
    } else if (DOM.sidebarIndicator) {
        DOM.sidebarIndicator.style.opacity = '0';
    }
}

// Configure navigation options based on User clearance
function configureSidebarVisibility() {
    const role = currentState.currentUser.role;
    
    // Editors and Admin can see editor panel
    if (hasAccess(role, 'tab-editor')) {
        DOM.sideLinkEditor.classList.remove('hidden');
    } else {
        DOM.sideLinkEditor.classList.add('hidden');
    }
    
    // Only Admin can see admin panel
    if (hasAccess(role, 'tab-admin')) {
        DOM.sideLinkAdmin.classList.remove('hidden');
    } else {
        DOM.sideLinkAdmin.classList.add('hidden');
    }

    // Only Admin can see Session control panel
    if (hasAccess(role, 'tab-sessions')) {
        DOM.sideLinkSessions.classList.remove('hidden');
    } else {
        DOM.sideLinkSessions.classList.add('hidden');
    }
    
    // Recalculate indicators after layout redraw
    setTimeout(alignSidebarHighlight, 10);
}

// Live Password validation gauge (Register)
function checkLivePasswordStrength() {
    const password = DOM.regPass.value;
    
    if (!password) {
        DOM.regPwdContainer.style.display = 'none';
        return;
    }
    
    DOM.regPwdContainer.style.display = 'block';
    
    // Validations rules check
    const rules = {
        len: password.length >= 8,
        num: /[0-9]/.test(password),
        spec: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Toggle check/x indicators on rule items
    updateRuleState(DOM.ruleLen, rules.len);
    updateRuleState(DOM.ruleNum, rules.num);
    updateRuleState(DOM.ruleSpec, rules.spec);
    
    // Score calculation
    let score = 0;
    if (password.length > 0) score += 1; // Typed something
    if (rules.len) score += 1;
    if (rules.num) score += 1;
    if (rules.spec) score += 1;
    if (password.length >= 12 && rules.num && rules.spec) score += 1; // Extra strong
    
    // Render progress meter
    let pct = (score / 5) * 100;
    DOM.regPwdFill.style.width = `${pct}%`;
    
    // Dynamic HSL colors for gradient interpolations
    if (score <= 2) {
        DOM.regPwdFill.style.background = 'var(--accent-rose)';
        DOM.regPwdText.innerText = 'Weak Password';
        DOM.regPwdText.style.color = 'var(--accent-rose)';
    } else if (score <= 4) {
        DOM.regPwdFill.style.background = 'var(--accent-amber)';
        DOM.regPwdText.innerText = 'Medium Strength';
        DOM.regPwdText.style.color = 'var(--accent-amber)';
    } else {
        DOM.regPwdFill.style.background = 'var(--accent-emerald)';
        DOM.regPwdText.innerText = 'Strong Password';
        DOM.regPwdText.style.color = 'var(--accent-emerald)';
    }
}

function updateRuleState(ruleElement, isValid) {
    if (!ruleElement) return;
    const icon = ruleElement.querySelector('i, svg');
    if (icon) {
        if (isValid) {
            ruleElement.className = 'valid';
            icon.setAttribute('data-lucide', 'check-circle');
        } else {
            ruleElement.className = '';
            icon.setAttribute('data-lucide', 'x-circle');
        }
    }
    lucide.createIcons();
}

// Form Handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = DOM.loginUser.value.trim();
    const password = DOM.loginPass.value;
    
    if (!username || !password) {
        showToast("Please enter username and password.", "error");
        return;
    }
    
    const user = db.getUserByUsername(username);
    if (!user) {
        db.addLog('LOGIN', username, 'FAILED', 'Authentication failed. Username not found.');
        showToast("Invalid credentials. Access Denied.", "error");
        return;
    }
    
    try {
        const hash = await hashPassword(password, user.salt);
        if (hash === user.passwordHash) {
            // Login Successful
            const token = await generateSessionToken();
            const lifespanSeconds = parseInt(DOM.sessTimeoutVal.value) || 300;
            const expiresAt = new Date(Date.now() + lifespanSeconds * 1000).toISOString();
            
            const session = {
                token,
                username: user.username,
                expiresAt
            };
            
            db.saveSession(session);
            db.addLog('LOGIN', user.username, 'SUCCESS', 'User successfully authenticated.');
            
            currentState.currentUser = user;
            currentState.currentSession = session;
            currentState.warningModalShown = false;
            
            setupSessionCountdown();
            updateHeaderNavUI();
            
            // Default to profile tab
            currentState.activeTab = 'tab-profile';
            switchView('dashboard');
            
            showToast(`Welcome back, ${user.name}!`, "success");
            
            // Clear inputs
            DOM.loginUser.value = '';
            DOM.loginPass.value = '';
        } else {
            db.addLog('LOGIN', user.username, 'FAILED', 'Authentication failed. Incorrect password hash match.');
            showToast("Invalid credentials. Access Denied.", "error");
        }
    } catch (e) {
        showToast("An error occurred during cryptographic processing.", "error");
        console.error(e);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = DOM.regName.value.trim();
    const email = DOM.regEmail.value.trim();
    const username = DOM.regUser.value.trim();
    const password = DOM.regPass.value;
    const role = DOM.regRole.value;
    
    if (!name || !email || !username || !password) {
        showToast("All fields are required.", "error");
        return;
    }
    
    // Basic validations
    if (username.length < 3) {
        showToast("Username must be at least 3 characters.", "error");
        return;
    }
    if (password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
    }
    if (!validateEmail(email)) {
        showToast("Please supply a valid email address.", "error");
        return;
    }
    
    // Check duplication
    if (db.getUserByUsername(username)) {
        showToast("Username is already taken.", "error");
        return;
    }
    
    try {
        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        
        const newUser = {
            username,
            name,
            email,
            role,
            salt,
            passwordHash,
            createdAt: new Date().toISOString()
        };
        
        db.saveUser(newUser);
        db.addLog('USER_CREATED', username, 'SUCCESS', `Registered a new user with ${role} access.`);
        showToast("Registration successful! You may now sign in.", "success");
        
        // Clear registration form and switch to login
        DOM.regName.value = '';
        DOM.regEmail.value = '';
        DOM.regUser.value = '';
        DOM.regPass.value = '';
        DOM.regRole.value = 'user';
        DOM.regPwdContainer.style.display = 'none';
        
        switchView('login');
    } catch (err) {
        showToast("Cryptography registration sequence aborted.", "error");
        console.error(err);
    }
}

function handleLogout() {
    if (currentState.currentUser) {
        db.addLog('LOGOUT', currentState.currentUser.username, 'SUCCESS', 'User logged out manually.');
        db.clearSession();
        checkActiveSession();
        DOM.sessionWarningModal.classList.add('hidden');
        currentState.warningModalShown = false;
        showToast("Logged out successfully.", "info");
    }
}

// Session Validation state checking
function checkActiveSession() {
    const session = db.getSession();
    if (session) {
        const user = db.getUserByUsername(session.username);
        if (user) {
            currentState.currentUser = user;
            currentState.currentSession = session;
            setupSessionCountdown();
            updateHeaderNavUI();
            
            // Keep on dashboard if currently there
            if (DOM.viewDashboard.classList.contains('hidden')) {
                switchView('dashboard');
            } else {
                configureSidebarVisibility();
                switchTab(currentState.activeTab);
            }
            return;
        }
    }
    
    // No valid session, reset variables
    if (currentState.sessionInterval) {
        clearInterval(currentState.sessionInterval);
    }
    currentState.currentUser = null;
    currentState.currentSession = null;
    
    updateHeaderNavUI();
    switchView('login');
}

// Active session duration ticker with overlay expiration warning
function setupSessionCountdown() {
    if (currentState.sessionInterval) {
        clearInterval(currentState.sessionInterval);
    }
    
    currentState.sessionInterval = setInterval(() => {
        const session = db.getSession(); // Implicitly clears if expired
        if (!session) {
            clearInterval(currentState.sessionInterval);
            DOM.sessionWarningModal.classList.add('hidden');
            currentState.warningModalShown = false;
            checkActiveSession();
            showToast("Your session has timed out. Please sign in again.", "warning");
        } else {
            currentState.currentSession = session;
            const secondsRemaining = Math.max(0, Math.floor((new Date(session.expiresAt) - new Date()) / 1000));
            
            // Trigger 10-second warning modal (Only show if logged in and warning hasn't been closed)
            if (secondsRemaining <= 10 && secondsRemaining > 0 && !currentState.warningModalShown) {
                DOM.modalWarningSeconds.innerText = secondsRemaining;
                DOM.sessionWarningModal.classList.remove('hidden');
                lucide.createIcons();
            } else if (secondsRemaining > 10) {
                // If session was extended elsewhere, hide warning
                DOM.sessionWarningModal.classList.add('hidden');
                currentState.warningModalShown = false;
            }
            
            updateSessionTimerDisplay();
        }
    }, 1000);
}

function handleRefreshSession() {
    const session = db.getSession();
    if (session) {
        const lifespanSeconds = parseInt(DOM.sessTimeoutVal.value) || 300;
        session.expiresAt = new Date(Date.now() + lifespanSeconds * 1000).toISOString();
        db.saveSession(session);
        db.addLog('SESSION_REFRESH', session.username, 'SUCCESS', `Session lifetime extended by ${lifespanSeconds} seconds.`);
        setupSessionCountdown();
        updateSessionControlUI();
        showToast("Session security token refreshed successfully.", "success");
    }
}

// UI Updating Functions
function updateHeaderNavUI() {
    if (currentState.currentUser) {
        DOM.navBtnLogin.classList.add('hidden');
        DOM.navBtnRegister.classList.add('hidden');
        DOM.navProfileSection.classList.remove('hidden');
        
        DOM.navAvatarBox.innerText = currentState.currentUser.name.charAt(0).toUpperCase();
        DOM.navDisplayUsername.innerText = currentState.currentUser.name;
        
        DOM.navDisplayRole.innerText = currentState.currentUser.role;
        DOM.navDisplayRole.className = `nav-role badge-role ${currentState.currentUser.role}`;
    } else {
        DOM.navBtnLogin.classList.remove('hidden');
        DOM.navBtnRegister.classList.remove('hidden');
        DOM.navProfileSection.classList.add('hidden');
    }
}

function renderProfileTab() {
    const u = currentState.currentUser;
    if (u) {
        DOM.profileRoleBadge.innerText = u.role;
        DOM.profileRoleBadge.className = `badge-role ${u.role}`;
        
        DOM.profileName.innerText = u.name;
        DOM.profileEmail.innerText = u.email;
        DOM.profileUsername.innerText = u.username;
        DOM.profileRole.innerText = u.role.toUpperCase();
        DOM.profileHash.innerText = u.passwordHash;
        DOM.profileSalt.innerText = u.salt;
    }
}

function updateSessionTimerDisplay() {
    if (currentState.currentSession) {
        const secondsRemaining = Math.max(0, Math.floor((new Date(currentState.currentSession.expiresAt) - new Date()) / 1000));
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (DOM.sessionRemaining) {
            DOM.sessionRemaining.innerText = timeString;
        }
    }
}

function updateSessionControlUI() {
    const s = currentState.currentSession;
    if (s && currentState.currentUser && currentState.currentUser.role === 'admin') {
        DOM.sessionToken.innerText = s.token;
        DOM.sessionUser.innerText = s.username;
        DOM.sessionExpires.innerText = new Date(s.expiresAt).toLocaleTimeString();
        updateSessionTimerDisplay();
    }
}

// Security Lab Calculations and Stepper updates
async function runLabComparison() {
    const password = DOM.labPwdInput.value;
    const salt = DOM.labSaltInput.value;
    const iterations = parseInt(DOM.labIterInput.value);
    
    if (!password) {
        DOM.labShaTime.innerText = '0.00 ms';
        DOM.labShaHash.innerText = 'Type a password...';
        DOM.labShaBar.style.width = '0%';
        DOM.labPbkTime.innerText = '0.00 ms';
        DOM.labPbkHash.innerText = 'Type a password...';
        DOM.labPbkBar.style.width = '0%';
        DOM.labRatioText.innerHTML = 'Type a password above to simulate cryptographic analysis.';
        
        DOM.stepPlainVal.innerText = 'Input Password';
        DOM.stepSaltVal.innerText = 'Salt String';
        DOM.stepStretchVal.innerText = 'PBKDF2 iterations';
        DOM.stepHashVal.innerText = 'Hashed Key';
        
        setStepperState(1);
        return;
    }
    
    try {
        const results = await runHashComparison(password, salt, iterations);
        
        DOM.labShaTime.innerText = `${results.sha256TimeMs} ms`;
        DOM.labShaHash.innerText = results.sha256Hash;
        
        DOM.labPbkTime.innerText = `${results.pbkdf2TimeMs} ms`;
        DOM.labPbkHash.innerText = results.pbkdf2Hash;
        
        // Bar visual scale (Relative scaling to make PBKDF2 clearly look heavy)
        const shaPct = 1; 
        const pbkPct = Math.min(100, Math.max(10, (results.pbkdf2TimeMs / 100) * 100));
        
        DOM.labShaBar.style.width = `${shaPct}%`;
        DOM.labPbkBar.style.width = `${pbkPct}%`;
        
        // Ratio description
        if (parseFloat(results.pbkdf2TimeMs) > 0 && parseFloat(results.sha256TimeMs) > 0) {
            const ratio = (parseFloat(results.pbkdf2TimeMs) / parseFloat(results.sha256TimeMs)).toFixed(0);
            DOM.labRatioText.innerHTML = `PBKDF2 is <b>${Number(ratio).toLocaleString()}x slower</b> than simple SHA-256. This slow-down makes standard GPU/ASIC brute forcing <b>cryptographically unfeasible</b> for attackers.`;
        }
        
        // Stepper Visual content updates
        DOM.stepPlainVal.innerText = password.length > 12 ? password.slice(0, 10) + '...' : password;
        DOM.stepSaltVal.innerText = salt.slice(0, 8) + '...';
        DOM.stepStretchVal.innerText = `${iterations.toLocaleString()} loops`;
        DOM.stepHashVal.innerText = results.pbkdf2Hash.slice(0, 10) + '...';
        
        setStepperState(4); // Fully processed
    } catch (e) {
        console.error("Simulation run failed:", e);
    }
}

function setStepperState(activeStep) {
    const cards = [DOM.stepPlainCard, DOM.stepSaltCard, DOM.stepStretchCard, DOM.stepHashCard];
    cards.forEach((card, index) => {
        if (card) {
            if (index < activeStep) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        }
    });
}

// Admin Tab User Cards rendering (UX overhaul)
function renderAdminDashboard() {
    renderUserCards();
    renderAdminLogs();
}

function renderUserCards() {
    const users = db.getUsers();
    const query = DOM.adminSearchUsers.value.trim().toLowerCase();
    DOM.adminUserCards.innerHTML = '';
    
    // Filter users dynamically
    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
    );
    
    if (filteredUsers.length === 0) {
        DOM.adminUserCards.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">No matching user records found.</div>`;
        return;
    }
    
    filteredUsers.forEach(u => {
        const card = document.createElement('div');
        card.className = 'user-card';
        
        const formattedDate = new Date(u.createdAt).toLocaleDateString();
        const isSelf = u.username.toLowerCase() === currentState.currentUser.username.toLowerCase();
        
        card.innerHTML = `
            <div class="user-card-header">
                <div class="user-card-avatar">${u.name.charAt(0).toUpperCase()}</div>
                <div class="user-card-meta">
                    <div class="user-card-name">${u.name} ${isSelf ? '<span style="color: var(--text-muted); font-size: 0.75rem;">(You)</span>' : ''}</div>
                    <div class="user-card-email">${u.email}</div>
                </div>
            </div>
            
            <div class="user-card-details">
                <span class="user-card-label">Username:</span>
                <span class="user-card-value">${u.username}</span>

                <span class="user-card-label">Registered:</span>
                <span class="user-card-value">${formattedDate}</span>

                <span class="user-card-label">Salt:</span>
                <span class="user-card-value" style="font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${u.salt}</span>
            </div>
            
            <div class="user-card-actions">
                <!-- Dropdown -->
                <div class="select-container" style="max-width: 140px; width: 100%;">
                    <select class="select-field admin-role-select" style="padding: 0.4rem 1.8rem 0.4rem 0.6rem; font-size: 0.8rem;" data-username="${u.username}" ${isSelf ? 'disabled' : ''}>
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Editor</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                
                <!-- Action Delete -->
                <button class="btn-icon delete admin-delete-user" data-username="${u.username}" ${isSelf ? 'disabled' : ''} title="Delete User">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        DOM.adminUserCards.appendChild(card);
    });
    
    // Re-bind actions
    document.querySelectorAll('.admin-role-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const user = e.target.getAttribute('data-username');
            const newRole = e.target.value;
            db.updateUserRole(user, newRole);
            showToast(`Modified role of user "${user}" to "${newRole}".`, "success");
            renderAdminLogs();
        });
    });
    
    document.querySelectorAll('.admin-delete-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.target.closest('button');
            const user = btnEl.getAttribute('data-username');
            if (confirm(`Are you absolutely sure you want to delete user "${user}"? This action is irreversible.`)) {
                db.deleteUser(user);
                showToast(`User account "${user}" deleted successfully.`, "success");
                renderAdminDashboard(); // Re-render table and logs
            }
        });
    });
    
    lucide.createIcons();
}

function renderAdminLogs() {
    const logs = db.getLogs();
    DOM.adminLogsTerminal.innerHTML = '';
    
    if (logs.length === 0) {
        DOM.adminLogsTerminal.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No system logs recorded.</div>`;
        return;
    }
    
    logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        const statusClass = log.status.toLowerCase();
        
        entry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-action">${log.action}</span>
            <span class="log-user">${log.username}</span>
            <span class="log-status ${statusClass}">${log.status}</span>
            <span class="log-details">${log.details}</span>
        `;
        
        DOM.adminLogsTerminal.appendChild(entry);
    });
}

// Email check helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Window Load init hook
window.addEventListener('DOMContentLoaded', initApp);
