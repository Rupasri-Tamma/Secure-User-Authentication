# CryptaAuth 🔒

A premium, state-of-the-art Single Page Application (SPA) demonstrating **Secure User Authentication**, industry-standard cryptographic password hashing, dynamic session life cycles, and **Role-Based Access Control (RBAC)**.

Built entirely in Vanilla HTML, CSS, and JS, the application features an interactive high-tech cyber dark glassmorphism design with a dynamic canvas particle system.

---

## ⚡ Key Features

* **🛡️ Web Cryptography Hashing**: Implements actual browser-native `SubtleCrypto` PBKDF2 (Password-Based Key Derivation Function 2) with HMAC-SHA-256 stretching (100,000 iterations) and 16-byte random salts.
* **⏳ Session Expiry Ticker & Warning**: Simulates secure JWT sessions with user-configurable lifetimes. Triggers a warning modal with a counting countdown 10 seconds before expiration, allowing the user to extend or log out.
* **🔑 Role-Based dashboards (RBAC)**: Enforces strict route-tab protection based on privileges:
  * `Admin`: Access all panels, modify user roles, delete users, inspect session tokens, and review security logs.
  * `Editor`: Access profile, cryptography lab, and editor drafting workspace.
  * `User`: Access profile settings and cryptographic lab comparison.
* **🔬 Cryptography Visual Stepper**: Displays a step-by-step visual workflow demonstrating how a password turns into a salted, stretched hash key.
* **📊 Computational Speed Comparison**: Measures plain SHA-256 speed vs PBKDF2 key stretching processing delay in real-time, educating users on brute-force defense.
* **🌌 Particles connection background**: Implements an interactive canvas backdrop where connections gently flex and react to mouse pointer movement.

---

## 📂 File Architecture

* [`index.html`](file:///C:/Users/rupa/.gemini/antigravity/scratch/secure-auth-app/index.html) - Structural framework containing SPA forms, cards, navigation panels, and warning modals.
* [`style.css`](file:///C:/Users/rupa/.gemini/antigravity/scratch/secure-auth-app/style.css) - Custom dark mode themes, css variables, glassmorphic layout definitions, and keyframe transitions.
* [`crypto.js`](file:///C:/Users/rupa/.gemini/antigravity/scratch/secure-auth-app/crypto.js) - Native browser SubtleCrypto interface for salt generation, PBKDF2 hashing, and secure token generation.
* [`db.js`](file:///C:/Users/rupa/.gemini/antigravity/scratch/secure-auth-app/db.js) - Local storage coordinator keeping track of sessions, users database, and audit logs.
* [`security-lab.js`](file:///C:/Users/rupa/.gemini/antigravity/scratch/secure-auth-app/security-lab.js) - CPU speed tests comparing SHA-256 vs PBKDF2 delay.
* [`app.js`](file:///C:/Users/rupa/.gemini/antigravity/scratch/secure-auth-app/app.js) - Core orchestrator rendering views, driving canvas updates, sliding indicators, password validations, and countdowns.

---

## 🚀 Getting Started

To run the application locally, start a lightweight web server in this directory (required for JavaScript ES Modules load security guidelines):

### Option A: Python Server (Built-in)
```bash
python -m http.server 8000
```

### Option B: Node.js (via npm)
```bash
npx http-server -p 8000
```

Once started, navigate to:
👉 **[http://localhost:8000/](http://localhost:8000/)**

---

## 🧪 Pre-seeded Accounts
The database automatically seeds the following credentials on the first load:

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | All panels, user config, audit terminal |
| **Editor** | `editor` | `editor123` | Profile, Crypto Lab, Editor workspace |
| **Regular User** | `user` | `user123` | Profile, Crypto Lab |
