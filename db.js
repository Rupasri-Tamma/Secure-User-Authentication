// Database Simulator using LocalStorage
// Simulates user tables, session details, and audit logs.
import { hashPassword, generateSalt } from './crypto.js';

const STORAGE_KEYS = {
    USERS: 'sec_auth_users',
    LOGS: 'sec_auth_logs',
    SESSION: 'sec_auth_session'
};

// Default users to initialize
const DEFAULT_USERS = [
    { username: 'admin', role: 'admin', password: 'admin123', email: 'admin@secureapp.io', name: 'Admin Administrator' },
    { username: 'editor', role: 'editor', password: 'editor123', email: 'editor@secureapp.io', name: 'Emily Editor' },
    { username: 'user', role: 'user', password: 'user123', email: 'user@secureapp.io', name: 'John Doe' }
];

export async function initializeDB() {
    // Check if database already initialized
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        console.log("Initializing database with default users...");
        const users = [];
        for (const def of DEFAULT_USERS) {
            const salt = generateSalt();
            const hash = await hashPassword(def.password, salt);
            users.push({
                username: def.username,
                email: def.email,
                name: def.name,
                role: def.role,
                salt: salt,
                passwordHash: hash,
                createdAt: new Date().toISOString()
            });
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Add initial system logs
        addLog('SYSTEM_INIT', 'system', 'SUCCESS', 'Database initialized with seed records.');
        addLog('USER_CREATED', 'system', 'SUCCESS', 'Default admin, editor, and user accounts provisioned.');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    }
}

// User CRUD operations
export function getUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
}

export function getUserByUsername(username) {
    const users = getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function saveUser(user) {
    const users = getUsers();
    const index = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (index !== -1) {
        users[index] = { ...users[index], ...user };
    } else {
        users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function updateUserRole(username, newRole) {
    const user = getUserByUsername(username);
    if (user) {
        user.role = newRole;
        saveUser(user);
        addLog('ROLE_CHANGE', 'admin', 'SUCCESS', `Updated role of ${username} to ${newRole}`);
        return true;
    }
    return false;
}

export function deleteUser(username) {
    const users = getUsers();
    const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    if (filtered.length !== users.length) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
        addLog('USER_DELETED', 'admin', 'SUCCESS', `Deleted user ${username}`);
        return true;
    }
    return false;
}

// Audit logging system
export function getLogs() {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
}

export function addLog(action, username, status, details) {
    const logs = getLogs();
    const newLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        action, // e.g., LOGIN, LOGOUT, REGISTER, ACCESS_DENIED, SYSTEM_INIT
        username,
        status, // SUCCESS or FAILED
        details
    };
    logs.unshift(newLog); // Put latest logs first
    
    // Keep logs size reasonable (max 100 entries)
    if (logs.length > 100) {
        logs.pop();
    }
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function clearLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    addLog('LOGS_CLEARED', 'admin', 'SUCCESS', 'System audit logs cleared by administrator.');
}

// Session state operations
export function getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    
    const session = JSON.parse(raw);
    // Check if session has expired
    if (new Date(session.expiresAt) < new Date()) {
        clearSession();
        addLog('SESSION_EXPIRED', session.username, 'FAILED', 'User session expired automatically.');
        return null;
    }
    return session;
}

export function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
}
